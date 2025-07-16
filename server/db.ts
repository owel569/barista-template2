import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import * as schema from '@shared/schema.pg';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

let pool: Pool;
let db: ReturnType<typeof drizzle>;

async function initializeDatabase() {
  try {
    console.log('🗄️ Initialisation PostgreSQL...');
    
    // Configuration PostgreSQL pool
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    
    // Initialiser Drizzle
    db = drizzle(pool, { schema });
    
    // Test de connexion
    const result = await pool.query('SELECT 1');
    console.log('✅ PostgreSQL connecté et optimisé');
    
    // Configuration backup automatique
    if (process.env.BACKUP_ENABLED === 'true') {
      setupAutomaticBackup();
    }
    
    return db;
  } catch (error) {
    console.error('❌ Erreur PostgreSQL:', error);
    throw error;
  }
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