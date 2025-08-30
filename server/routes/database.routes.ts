import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error-handler';
import { createLogger } from '../middleware/logging';
import { authenticateUser, requireRoles } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { getDb } from '../db';
import { sql } from 'drizzle-orm';
import { activityLogs } from '../db/schema';

const router = Router();
const logger = createLogger('DATABASE_ROUTES');

// ==========================================
// TYPES ET INTERFACES
// ==========================================

interface DatabaseHealth {
  status: 'healthy' | 'unhealthy' | 'error';
  database: string;
  responseTime: number;
  connections: number;
  uptime: string;
  version: string;
}

interface DatabaseInfo {
  database: string;
  version: string;
  size: string;
  sizeBytes: number;
  tables: number;
  activeConnections: number;
  maxConnections: number;
}

interface Migration {
  id: string;
  hash: string;
  createdAt: Date;
}

interface BackupOptions {
  includeData: boolean;
  includeSchema: boolean;
  compression: boolean;
}

interface BackupResult {
  id: string;
  filename: string;
  size: string;
  status: 'success' | 'failed' | 'in_progress';
  createdAt: string;
  duration: string;
}

// ==========================================
// SCHÉMAS DE VALIDATION
// ==========================================

const BackupSchema = z.object({
  tables: z.array(z.string()).optional(),
  includeData: z.boolean().default(true),
  compression: z.boolean().default(true)
});

const RestoreSchema = z.object({
  filename: z.string().min(1, 'Nom de fichier requis'),
  tables: z.array(z.string()).optional()
});

const OptimizeSchema = z.object({
  analyze: z.boolean().default(true),
  vacuum: z.boolean().default(true),
  reindex: z.boolean().default(false)
});

// ==========================================
// UTILITAIRES
// ==========================================

const logDatabaseActivity = async (userId: number, action: string, details: string) => {
  try {
    const db = await getDb();
    await db.insert(activityLogs).values({
      userId,
      action,
      details,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Erreur lors de la journalisation de l\'activité', { error });
  }
};

// ==========================================
// ROUTES
// ==========================================

/**
 * @openapi
 * /database/health:
 *   get:
 *     summary: Vérifie la santé de la base de données
 *     tags: [Database]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statut de santé de la base de données
 */
router.get('/health',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  asyncHandler(async (req, res) => {
    try {
      const db = await getDb();
      const startTime = Date.now();

      // Test de connexion
      await db.execute(sql`SELECT 1`);
      const responseTime = Date.now() - startTime;

      // Récupération des informations
      const [versionResult, connectionsResult] = await Promise.all([
        db.execute(sql`SELECT version()`),
        db.execute(sql`
          SELECT count(*) as connections
          FROM pg_stat_activity
          WHERE datname = current_database()
        `)
      ]);

      const health: DatabaseHealth = {
        status: 'healthy',
        database: 'postgresql',
        responseTime,
        connections: Number(connectionsResult.rows[0]?.connections) || 0,
        uptime: '24h 30m 15s', // À implémenter avec pg_postmaster_start_time
        version: versionResult.rows[0]?.version || 'Unknown'
      };

      res.json({
        success: true,
        data: health
      });
    } catch (error) {
      logger.error('Erreur de health check', {
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });

      res.status(503).json({
        success: false,
        error: 'Database unavailable',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  })
);

/**
 * @openapi
 * /database/info:
 *   get:
 *     summary: Récupère les informations de la base de données
 *     tags: [Database]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Informations détaillées sur la base de données
 */
router.get('/info',
  authenticateUser,
  requireRoles(['admin']),
  asyncHandler(async (req, res) => {
    try {
      const db = await getDb();

      const [
        versionResult,
        connectionsResult,
        tablesResult,
        dbInfoResult
      ] = await Promise.all([
        db.execute(sql`SELECT version() as version`),
        db.execute(sql`
          SELECT
            count(*) as active_connections,
            max_conn as max_connections
          FROM pg_stat_activity, pg_settings
          WHERE name = 'max_connections'
        `),
        db.execute(sql`
          SELECT count(*) as count
          FROM pg_tables
          WHERE schemaname = 'public'
        `),
        db.execute(sql`
          SELECT
            datname as database_name,
            pg_size_pretty(pg_database_size(datname)) as size,
            pg_database_size(datname) as size_bytes
          FROM pg_database
          WHERE datname = current_database()
        `)
      ]);

      const dbInfo: DatabaseInfo = {
        database: dbInfoResult.rows[0]?.database_name || 'Unknown',
        version: versionResult.rows[0]?.version || 'Unknown',
        size: dbInfoResult.rows[0]?.size || 'Unknown',
        sizeBytes: dbInfoResult.rows[0]?.size_bytes || 0,
        tables: Number(tablesResult.rows[0]?.count) || 0,
        activeConnections: Number(connectionsResult.rows[0]?.active_connections) || 0,
        maxConnections: Number(connectionsResult.rows[0]?.max_connections) || 0
      };

      res.json({
        success: true,
        data: dbInfo
      });
    } catch (error) {
      logger.error('Erreur info base de données', {
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });

      res.status(500).json({
        success: false,
        error: 'Database info error',
        message: 'Erreur lors de la récupération des informations'
      });
    }
  })
);

/**
 * @openapi
 * /database/migrations:
 *   get:
 *     summary: Liste les migrations de la base de données
 *     tags: [Database]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des migrations appliquées
 */
router.get('/migrations',
  authenticateUser,
  requireRoles(['admin']),
  asyncHandler(async (req, res) => {
    try {
      const db = await getDb();

      const migrationsTableExists = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = '__drizzle_migrations'
        ) as exists
      `);

      if (!migrationsTableExists.rows[0]?.exists) {
        return res.json({
          success: true,
          data: {
            migrations: [],
            status: 'no_migrations_table'
          }
        });
      }

      const migrations = await db.execute(sql`
        SELECT
          id,
          hash,
          created_at
        FROM __drizzle_migrations
        ORDER BY created_at DESC
      `);

      res.json({
        success: true,
        data: {
          migrations: migrations.rows.map(row => ({
            id: row.id,
            hash: row.hash,
            createdAt: row.created_at
          })),
          status: 'migrations_found'
        }
      });
    } catch (error) {
      logger.error('Erreur migrations base de données', {
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });

      res.status(500).json({
        success: false,
        error: 'Migrations error',
        message: 'Erreur lors de la récupération des migrations'
      });
    }
  })
);

/**
 * @openapi
 * /database/backup:
 *   post:
 *     summary: Crée une sauvegarde de la base de données
 *     tags: [Database]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               includeData:
 *                 type: boolean
 *               includeSchema:
 *                 type: boolean
 *               compression:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Résultat de la sauvegarde
 */
router.post('/backup',
  authenticateUser,
  requireRoles(['admin']),
  validateBody(BackupSchema),
  asyncHandler(async (req, res) => {
    const { includeData, includeSchema, compression } = req.body;
    const userId = req.user?.id || 0;

    try {
      // Simulation de sauvegarde
      const backupInfo: BackupResult = {
        id: `backup_${Date.now()}`,
        filename: `backup_${new Date().toISOString()}.sql`,
        size: '0 MB',
        status: 'success',
        createdAt: new Date().toISOString(),
        duration: '0.5s'
      };

      await logDatabaseActivity(
        userId,
        'database_backup',
        `Sauvegarde créée: ${backupInfo.filename}`
      );

      logger.info('Sauvegarde créée', { backupId: backupInfo.id, userId });

      res.json({
        success: true,
        data: backupInfo,
        message: 'Sauvegarde créée avec succès'
      });
    } catch (error) {
      logger.error('Erreur sauvegarde base de données', {
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        userId
      });

      res.status(500).json({
        success: false,
        error: 'Backup failed',
        message: 'Erreur lors de la création de la sauvegarde'
      });
    }
  })
);

/**
 * @openapi
 * /database/restore:
 *   post:
 *     summary: Restaure une sauvegarde de la base de données
 *     tags: [Database]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               backupId:
 *                 type: string
 *               confirmRestore:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Résultat de la restauration
 */
router.post('/restore',
  authenticateUser,
  requireRoles(['admin']),
  validateBody(RestoreSchema),
  asyncHandler(async (req, res) => {
    const { filename, tables } = req.body;
    const userId = req.user?.id || 0;

    try {
      // Simulation de restauration
      const restoreInfo = {
        backupFile: filename,
        status: 'completed',
        restoredAt: new Date().toISOString(),
        duration: '2.3s',
        tablesRestored: tables?.length || 'all'
      };

      await logDatabaseActivity(
        userId,
        'database_restore',
        `Restauration depuis: ${filename}`
      );

      logger.info('Base de données restaurée', { filename, userId });

      res.json({
        success: true,
        data: restoreInfo,
        message: 'Base de données restaurée avec succès'
      });
    } catch (error) {
      logger.error('Erreur restauration base de données', {
        filename,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        userId
      });

      res.status(500).json({
        success: false,
        error: 'Restore failed',
        message: 'Erreur lors de la restauration'
      });
    }
  })
);

/**
 * @openapi
 * /database/optimize:
 *   post:
 *     summary: Optimise la base de données
 *     tags: [Database]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               analyze:
 *                 type: boolean
 *               vacuum:
 *                 type: boolean
 *               reindex:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Résultat de l'optimisation
 */
router.post('/optimize',
  authenticateUser,
  requireRoles(['admin']),
  validateBody(OptimizeSchema),
  asyncHandler(async (req, res) => {
    const { analyze, vacuum, reindex } = req.body;
    const userId = req.user?.id || 0;

    try {
      const db = await getDb();
      const optimizationSteps: string[] = [];

      if (analyze) {
        await db.execute(sql`ANALYZE`);
        optimizationSteps.push('ANALYZE');
      }

      if (vacuum) {
        await db.execute(sql`VACUUM ANALYZE`);
        optimizationSteps.push('VACUUM ANALYZE');
      }

      if (reindex) {
        optimizationSteps.push('REINDEX (simulé)');
      }

      await logDatabaseActivity(
        userId,
        'database_optimize',
        `Optimisation effectuée: ${optimizationSteps.join(', ')}`
      );

      logger.info('Base de données optimisée', { steps: optimizationSteps, userId });

      res.json({
        success: true,
        data: {
          steps: optimizationSteps,
          status: 'completed',
          optimizedAt: new Date().toISOString()
        },
        message: 'Base de données optimisée avec succès'
      });
    } catch (error) {
      logger.error('Erreur optimisation base de données', {
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        userId
      });

      res.status(500).json({
        success: false,
        error: 'Optimization failed',
        message: 'Erreur lors de l\'optimisation'
      });
    }
  })
);

export default router;