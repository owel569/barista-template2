import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import * as schema from '@shared/schema';

let pool: Pool;
let db: ReturnType<typeof drizzle>;

export async function initializeDatabase() {
  try {
    console.log('🐘 Connexion à PostgreSQL...');

    const connectionConfig = {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      keepAlive: true,
    };

    pool = new Pool(connectionConfig);
    db = drizzle(pool, { schema });

    // Test simple de connexion
    await pool.query('SELECT 1');
    console.log('✅ PostgreSQL connecté');

    return db;
  } catch (error) {
    console.error('❌ Erreur PostgreSQL:', error);
    throw error;
  }
}

export async function getDb() {
  if (!db) {
    await initializeDatabase();
  }
  return db;
}

export async function checkDatabaseHealth() {
  try {
    await pool.query('SELECT NOW()');
    return { healthy: true, type: 'postgresql' };
  } catch (error) {
    return { healthy: false, error: error.message, type: 'postgresql' };
  }
}

export { db };

// Nettoyage gracieux
process.on('SIGINT', async () => {
  if (pool) {
    await pool.end();
    console.log('✅ PostgreSQL fermé proprement');
  }
  process.exit(0);
});