import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@shared/schema';
import { ensurePostgresRunning } from './postgres-auto';

// Configuration automatique de PostgreSQL
let pool: Pool;
let db: ReturnType<typeof drizzle>;

async function initializeDatabase() {
  try {
    // Assurer que PostgreSQL fonctionne automatiquement
    const databaseUrl = await ensurePostgresRunning();
    
    // Utiliser l'URL de base de données (soit celle configurée, soit celle générée automatiquement)
    const connectionString = process.env.DATABASE_URL || databaseUrl;
    
    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    db = drizzle(pool, { schema });
    console.log('✅ Base de données connectée:', connectionString.replace(/\/\/.*@/, '//***@'));
    return db;
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error);
    throw error;
  }
}

// Initialiser la base de données au démarrage
const dbPromise = initializeDatabase();

// Exporter la base de données (sera disponible après l'initialisation)
export const getDb = async () => {
  await dbPromise;
  return db;
};

// Export synchrone pour la compatibilité (ne pas utiliser avant l'initialisation)
export { db };
