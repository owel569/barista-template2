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
    
    // Configuration PostgreSQL avec variables d'environnement Replit
    const connectionConfig = {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 20, // Nombre maximum de connexions
      idleTimeoutMillis: 30000, // Timeout pour les connexions inactives
      connectionTimeoutMillis: 2000, // Timeout pour les nouvelles connexions
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

// Setup des événements du pool
function setupPoolEvents() {
  pool.on('connect', () => {
    console.log('🔗 Nouvelle connexion PostgreSQL établie');
  });

  pool.on('error', (err) => {
    console.error('❌ Erreur inattendue PostgreSQL:', err);
  });
}

const dbPromise = initializeDatabase().then(() => {
  setupPoolEvents();
  return db;
});

export const getDb = async () => {
  await dbPromise;
  return db;
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