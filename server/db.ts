import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import * as schema from '@shared/schema';

let pool: Pool;
let db: ReturnType<typeof drizzle>;

async function initializeDatabase() {
  try {
    console.log('🐘 Initialisation PostgreSQL entreprise...');
    
    // Configuration PostgreSQL avec variables d'environnement Replit
    const connectionConfig = {
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432'),
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
      max: 10,
      min: 2,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 5000,
      acquireTimeoutMillis: 10000,
      keepAlive: true,
      application_name: 'BaristaCAFE_Replit',
    };

    pool = new Pool(connectionConfig);
    db = drizzle(pool, { schema });
    
    // Test de connexion professionnel
    await testConnection();
    
    console.log('✅ PostgreSQL entreprise configuré');
    return db;
  } catch (error) {
    console.error('❌ Erreur PostgreSQL:', error);
    throw error;
  }
}

async function testConnection(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      try {
        await client.query('SELECT 1');
        console.log('✅ Test de connexion PostgreSQL réussi');
        return true;
      } finally {
        client.release();
      }
    } catch (error) {
      console.log(`⚠️ Tentative de connexion ${i + 1}/${retries} échouée`);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Setup des événements du pool avec métriques professionnelles
function setupPoolEvents() {
  let connectionCount = 0;
  let lastPoolStatus = Date.now();

  pool.on('connect', (client) => {
    connectionCount++;
    // Configuration de session optimisée
    client.query('SET statement_timeout = 30000');
    client.query('SET lock_timeout = 15000');
    client.query('SET idle_in_transaction_session_timeout = 300000');
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔗 Connexion DB #${connectionCount} établie`);
    }
  });

  pool.on('error', (err, client) => {
    console.error('❌ [DB ERROR]', {
      code: err.code,
      message: err.message,
      timestamp: new Date().toISOString()
    });
    
    // Auto-reconnection pour erreurs réseau
    if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') {
      console.log('🔄 Reconnexion automatique en cours...');
    }
  });

  // Log du statut du pool toutes les 5 minutes seulement
  pool.on('acquire', () => {
    const now = Date.now();
    if (now - lastPoolStatus > 300000) { // 5 minutes
      console.log(`📊 Pool Status: ${pool.totalCount} total, ${pool.idleCount} idle, ${pool.waitingCount} waiting`);
      lastPoolStatus = now;
    }
  });

  // Logs simplifiés pour release/remove
  pool.on('remove', () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🗑️ Connexion fermée');
    }
  });
}

const dbPromise = initializeDatabase().then(() => {
  setupPoolEvents();
  return db;
});

export const getDb = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await dbPromise;
      // Test de santé de la connexion
      await db.execute(sql`SELECT 1`);
      return db;
    } catch (error) {
      console.error(`❌ Erreur getDb tentative ${i + 1}/${retries}:`, error);
      if (i === retries - 1) throw error;
      
      // Attendre avant la prochaine tentative
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      
      // Tenter de recréer la connexion
      try {
        if (pool) {
          await pool.end();
        }
        await initializeDatabase();
      } catch (reconnectError) {
        console.error('❌ Erreur lors de la reconnexion:', reconnectError);
      }
    }
  }
};

export { db };

export async function setupDatabase() {
  try {
    await getDb();
    await db.execute(sql`SELECT 1`);
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
    const result = await db.execute(sql`SELECT NOW() as timestamp`);
    return {
      healthy: true,
      timestamp: result[0]?.timestamp,
      type: 'postgresql'
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      type: 'postgresql'
    };
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