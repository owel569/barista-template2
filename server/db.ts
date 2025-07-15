import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@shared/schema';
// PostgreSQL configuration removed - using environment variables directly

// Configuration automatique de PostgreSQL
let pool: Pool;
let db: ReturnType<typeof drizzle>;

async function initializeDatabase() {
  try {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    console.log('✅ Utilisation de la base de données PostgreSQL Replit');
    
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
