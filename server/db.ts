import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import * as schema from '@shared/schema';

let pool: Pool;
let db: ReturnType<typeof drizzle>;

export async function initializeDatabase() : void {
  try {
    console.log('🐘 Connexion à PostgreSQL...');

    const connectionConfig = {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
      max: 5, // Réduit le nombre max de connexions
      min: 1, // Garde au moins 1 connexion active
      idleTimeoutMillis: 60000, // Augmente le timeout idle
      connectionTimeoutMillis: 15000, // Augmente le timeout de connexion
      acquireTimeoutMillis: 10000, // Timeout pour acquérir une connexion
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      // Configuration additionnelle pour la stabilité
      application_name: 'barista_cafe',
      statement_timeout: 30000, // 30 secondes pour les requêtes
    };

    pool = new Pool(connectionConfig);
    db = drizzle(pool, { schema });

    // Gestionnaires d'événements pour la reconnexion automatique
    pool.on('error', (err) => {
      console.error('🔥 Erreur pool PostgreSQL:', err);
    });

    pool.on('connect', () => {
      console.log('🔌 Nouvelle connexion PostgreSQL établie');
    });

    // Test simple de connexion avec retry
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        await pool.query('SELECT 1');
        console.log('✅ PostgreSQL connecté');
        break;
      } catch (error) {
        attempts++;
        if (attempts === maxAttempts) throw error;
        console.log(`🔄 Tentative ${attempts}/${maxAttempts} échouée, nouvelle tentative...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return db;
  } catch (error) {
    console.error('❌ Erreur PostgreSQL:', error);
    throw error;
  }
}

export async function getDb() : void {
  if (!db || !pool) {
    await initializeDatabase();
  }

  // Vérification de santé avant utilisation
  try {
    await pool.query('SELECT 1');
  } catch (error) {
    console.log('🔄 Reconnexion PostgreSQL nécessaire...');
    await initializeDatabase();
  }
  
  return db;
}

export async function checkDatabaseHealth() : void {
  try {
    if (!pool) {
      await initializeDatabase();
    }
    await pool.query('SELECT NOW()');
    return { healthy: true, type: 'postgresql' };
  } catch (error) {
    console.error('❌ Health check failed:', error);
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