import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import * as schema from '@shared/schema';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

let pool: Pool;
let db: ReturnType<typeof drizzle>;
let isInitialized = false;
let initPromise: Promise<ReturnType<typeof drizzle>> | null = null;

// Cache des requêtes fréquentes
const queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

async function initializeDatabase() {
  if (isInitialized && db) return db;

  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      console.log('🗄️ Initialisation PostgreSQL optimisée...');

      // Configuration PostgreSQL pool optimisée
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        // Configuration stable pour Replit
        max: 5, // Limiter à 5 connexions max
        min: 1, // Maintenir 1 connexion minimum
        idleTimeoutMillis: 120000, // 2 minutes d'inactivité
        connectionTimeoutMillis: 10000, // 10 secondes pour se connecter
        // Reconnexion automatique
        keepAlive: true,
        keepAliveInitialDelayMillis: 5000,
        acquireTimeoutMillis: 60000, // 1 minute pour acquérir une connexion
      });

      // Initialiser Drizzle avec optimisations
      db = drizzle(pool, { 
        schema,
        logger: process.env.NODE_ENV === 'development'
      });

      // Test de connexion avec retry
      await testConnection();

      // Configuration des events du pool
      setupPoolEvents();

      // Configuration backup automatique
      if (process.env.BACKUP_ENABLED === 'true') {
        setupAutomaticBackup();
      }

      // Nettoyage périodique du cache
      setupCacheCleanup();

      isInitialized = true;
      console.log('✅ PostgreSQL connecté et optimisé');

      return db;
    } catch (error) {
      console.error('❌ Erreur PostgreSQL:', error);
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
}

async function testConnection(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      try {
        await client.query('SELECT NOW()');
        client.release();
        return;
      } catch (error) {
        client.release();
        throw error;
      }
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

function setupPoolEvents() {
  pool.on('connect', (client) => {
    console.log('🔗 Nouvelle connexion PostgreSQL');
  });

  pool.on('error', (err, client) => {
    console.error('❌ Erreur pool PostgreSQL:', err);
  });

  pool.on('remove', (client) => {
    console.log('🔌 Connexion PostgreSQL fermée');
  });
}

function setupCacheCleanup() {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of queryCache.entries()) {
      if (now - value.timestamp > value.ttl) {
        queryCache.delete(key);
      }
    }
  }, 300000); // Nettoyage toutes les 5 minutes
}

// Fonction de cache intelligent
export function getCachedQuery(key: string, ttl: number = 300000) {
  const cached = queryCache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  return null;
}

export function setCachedQuery(key: string, data: any, ttl: number = 300000) {
  queryCache.set(key, { data, timestamp: Date.now(), ttl });
}

// Backup automatique pour éviter la perte de données
function setupAutomaticBackup() {
  const backupInterval = parseInt(process.env.BACKUP_INTERVAL || '3600') * 1000;

  setInterval(async () => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `./backups/barista_cafe_${timestamp}.db`;

      // Créer le répertoire de backup
      await execAsync('mkdir -p ./backups');

      // Copier la base de données
      await execAsync(`cp ./barista_cafe.db "${backupPath}"`);

      // Nettoyer les anciens backups
      const retention = parseInt(process.env.BACKUP_RETENTION || '7');
      await execAsync(`find ./backups -name "*.db" -type f -mtime +${retention} -delete`);

      console.log(`✅ Backup automatique: ${backupPath}`);
    } catch (error) {
      console.error('❌ Erreur backup:', error);
    }
  }, backupInterval);
}

const dbPromise = initializeDatabase();

export const getDb = async () => {
  await dbPromise;
  return db;
};

export { db };

export async function setupDatabase() {
  try {
    const result = await pool.query('SELECT 1');
    console.log('✅ Base de données PostgreSQL configurée');
    return true;
  } catch (error) {
    console.error('❌ Erreur configuration PostgreSQL:', error);
    return false;
  }
}

// Fonction de vérification de santé
export async function checkDatabaseHealth() {
  try {
    const result = await pool.query("SELECT now() as timestamp");
    return {
      healthy: true,
      timestamp: result.rows[0]?.timestamp,
      type: 'postgresql',
      size: await getDatabaseSize()
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      type: 'postgresql'
    };
  }
}

async function getDatabaseSize() {
  try {
    const result = await pool.query("SELECT pg_size_pretty(pg_database_size(current_database())) as size");
    return result.rows[0]?.size || 'unknown';
  } catch {
    return 'unknown';
  }
}

// Nettoyage gracieux
process.on('SIGINT', () => {
  if (pool) {
    pool.end();
    console.log('✅ PostgreSQL fermé proprement');
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  if (pool) {
    pool.end();
    console.log('✅ PostgreSQL fermé proprement');
  }
  process.exit(0);
});

// Gestion des erreurs de connexion PostgreSQL
pool.on('error', (err) => {
  console.error('Erreur PostgreSQL:', err);
});

pool.on('connect', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Nouvelle connexion PostgreSQL établie');
  }
});