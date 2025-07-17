import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import * as schema from '../shared/schema';

let pool: Pool;
let db: ReturnType<typeof drizzle>;

// Cache pour les requêtes
const queryCache = new Map<string, { data: any; timestamp: number }>();

async function initializeDatabase() {
  try {
    console.log('🗄️ Initialisation PostgreSQL optimisée...');
    
    // Configuration PostgreSQL avec variables d'environnement Replit
    const connectionConfig = {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
      max: 20, // Nombre maximum de connexions
      idleTimeoutMillis: 30000, // Timeout pour les connexions inactives
      connectionTimeoutMillis: 2000, // Timeout pour les nouvelles connexions
    };

    pool = new Pool(connectionConfig);
    db = drizzle(pool, { schema });
    
    // Test de connexion
    await testConnection();
    
    console.log('✅ PostgreSQL connecté et optimisé');
    return db;
  } catch (error) {
    console.error('❌ Erreur PostgreSQL:', error);
    throw error;
  }
}

async function testConnection(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query('SELECT 1');
      return true;
    } catch (error) {
      console.log(`⚠️ Tentative de connexion ${i + 1}/${retries} échouée`);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Setup des événements du pool
function setupPoolEvents() {
  pool.on('connect', () => {
    console.log('🔗 Nouvelle connexion PostgreSQL établie');
  });

  pool.on('error', (err) => {
    console.error('❌ Erreur inattendue PostgreSQL:', err);
  });
}

// Nettoyage du cache
function setupCacheCleanup() {
  setInterval(() => {
    const now = Date.now();
    const expiredKeys = Array.from(queryCache.entries())
      .filter(([_, { timestamp }]) => now - timestamp > 300000) // 5 minutes
      .map(([key]) => key);
    
    expiredKeys.forEach(key => queryCache.delete(key));
    
    if (expiredKeys.length > 0) {
      console.log(`🧹 Cache nettoyé: ${expiredKeys.length} entrées supprimées`);
    }
  }, 60000); // Nettoyage toutes les minutes
}

export function getCachedQuery(key: string, ttl: number = 300000) {
  const cached = queryCache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  return null;
}

export function setCachedQuery(key: string, data: any, ttl: number = 300000) {
  queryCache.set(key, { data, timestamp: Date.now() });
}

// Backup automatique vers un service externe
function setupAutomaticBackup() {
  if (process.env.BACKUP_ENABLED !== 'true') return;

  const backupInterval = parseInt(process.env.BACKUP_INTERVAL || '86400') * 1000; // 24h par défaut
  
  setInterval(async () => {
    try {
      console.log('🔄 Début du backup automatique...');
      
      // Dump de la base de données
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `barista_cafe_${timestamp}.sql`;
      
      // Ici, vous pourriez intégrer un service de backup cloud
      console.log(`✅ Backup programmé: ${backupName}`);
    } catch (error) {
      console.error('❌ Erreur backup:', error);
    }
  }, backupInterval);
}

// Initialisation asynchrone
export const getDb = async () => {
  if (!db) {
    await initializeDatabase();
    setupPoolEvents();
    setupCacheCleanup();
    setupAutomaticBackup();
  }
  return db;
};

// Fonction de setup pour le démarrage
export async function setupDatabase() {
  try {
    await getDb();
    console.log('🚀 Base de données PostgreSQL prête');
  } catch (error) {
    console.error('💥 Échec de l\'initialisation PostgreSQL:', error);
    throw error;
  }
}

// Fonction de vérification de santé
export async function checkDatabaseHealth() {
  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    const duration = Date.now() - start;
    
    return {
      status: 'healthy',
      responseTime: duration,
      activeConnections: pool.totalCount,
      idleConnections: pool.idleCount,
      waitingConnections: pool.waitingCount
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

// Fonction pour obtenir la taille de la base de données
async function getDatabaseSize() {
  try {
    const result = await pool.query(`
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as size,
        pg_database_size(current_database()) as size_bytes
    `);
    return result.rows[0];
  } catch (error) {
    console.error('Erreur lors de la récupération de la taille:', error);
    return { size: 'Unknown', size_bytes: 0 };
  }
}

export default db;