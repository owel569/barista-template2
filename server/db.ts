import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import * as schema from '@shared/schema';

let pool: Pool;
let db: ReturnType<typeof drizzle>;

async function initializeDatabase() {
  try {
    console.log('🐘 Initialisation PostgreSQL optimisée...');
    
    // Configuration PostgreSQL optimisée pour Replit
    const connectionConfig = {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 10, // Connexions limitées pour éviter les timeouts
      min: 2, // Connexions minimum gardées ouvertes
      idleTimeoutMillis: 60000, // 60 secondes pour les connexions inactives
      connectionTimeoutMillis: 10000, // 10 secondes pour nouvelles connexions
      acquireTimeoutMillis: 60000, // 60 secondes pour acquérir une connexion
      createTimeoutMillis: 30000, // 30 secondes pour créer une connexion
      destroyTimeoutMillis: 5000, // 5 secondes pour détruire une connexion
      reapIntervalMillis: 1000, // Vérification toutes les secondes
      createRetryIntervalMillis: 200, // Retry toutes les 200ms
    };

    pool = new Pool(connectionConfig);
    db = drizzle(pool, { schema });
    
    // Test de connexion avec retry
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

// Setup des événements du pool avec gestion robuste
function setupPoolEvents() {
  pool.on('connect', (client) => {
    console.log('🔗 Nouvelle connexion PostgreSQL établie');
    // Configuration de la connexion pour éviter les timeouts
    client.query('SET statement_timeout = 30000'); // 30 secondes
    client.query('SET lock_timeout = 10000'); // 10 secondes
    client.query('SET idle_in_transaction_session_timeout = 60000'); // 60 secondes
  });

  pool.on('error', (err, client) => {
    console.error('❌ Erreur inattendue PostgreSQL:', err);
    // Tentative de reconnexion automatique
    if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') {
      console.log('🔄 Tentative de reconnexion automatique...');
    }
  });

  pool.on('acquire', () => {
    console.log('📥 Connexion acquise du pool');
  });

  pool.on('release', () => {
    console.log('📤 Connexion retournée au pool');
  });

  pool.on('remove', () => {
    console.log('🗑️ Connexion supprimée du pool');
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