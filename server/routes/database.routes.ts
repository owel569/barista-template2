
import { Router } from 'express';
import { getDb, checkDatabaseHealth } from '../db';
import { authenticateToken, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { sql } from 'drizzle-orm';

const router = Router();

// Route de santé de la base de données
router.get('/health', asyncHandler(async (req, res) => {
  try {
    const health = await checkDatabaseHealth();
    
    if (health.healthy) {
      res.json({
        status: 'healthy',
        database: 'postgresql',
        ...health
      });
    } else {
      res.status(503).json({
        status: 'unhealthy',
        database: 'postgresql',
        ...health
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'postgresql',
      error: error.message
    });
  }
}));

// Route d'informations sur la base de données
router.get('/info', authenticateToken, requireRole('directeur'), asyncHandler(async (req, res) => {
  try {
    const db = await getDb();
    
    // Obtenir les informations sur les tables
    const tablesResult = await db.execute(sql`
      SELECT 
        schemaname,
        tablename,
        tableowner
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);
    
    // Obtenir les informations sur la base de données
    const dbInfoResult = await db.execute(sql`
      SELECT 
        current_database() as database_name,
        current_user as current_user,
        version() as version;
    `);
    
    res.json({
      database: 'postgresql',
      info: dbInfoResult.rows[0],
      tables: tablesResult.rows,
      status: 'connected'
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des informations:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des informations de la base de données',
      error: error.message
    });
  }
}));

// Route pour vérifier les migrations
router.get('/migrations', authenticateToken, requireRole('directeur'), asyncHandler(async (req, res) => {
  try {
    const db = await getDb();
    
    // Vérifier si les tables existent
    const tablesCheck = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    const expectedTables = [
      'users', 'menu_categories', 'menu_items', 'tables', 
      'customers', 'employees', 'reservations', 'orders', 
      'order_items', 'work_shifts', 'activity_logs', 'permissions'
    ];
    
    const existingTables = tablesCheck.rows.map(row => row.table_name);
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));
    
    res.json({
      database: 'postgresql',
      expectedTables,
      existingTables,
      missingTables,
      migrationNeeded: missingTables.length > 0
    });
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des migrations:', error);
    res.status(500).json({
      message: 'Erreur lors de la vérification des migrations',
      error: error.message
    });
  }
}));

// Route pour appliquer les migrations
router.post('/migrate', authenticateToken, requireRole('directeur'), asyncHandler(async (req, res) => {
  try {
    console.log('🔄 Application des migrations PostgreSQL...');
    
    // Exécuter les migrations Drizzle
    const { execSync } = await import('child_process');
    const result = execSync('npm run db:migrate', { encoding: 'utf8' });
    
    console.log('✅ Migrations appliquées avec succès');
    
    res.json({
      message: 'Migrations appliquées avec succès',
      database: 'postgresql',
      output: result,
      status: 'success'
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'application des migrations:', error);
    res.status(500).json({
      message: 'Erreur lors de l\'application des migrations',
      database: 'postgresql',
      error: error.message,
      status: 'error'
    });
  }
}));

export default router;
