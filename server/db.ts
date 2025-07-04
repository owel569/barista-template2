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
    let connectionString: string;
    
    // Priorité à la base de données Replit si disponible
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('replit')) {
      connectionString = process.env.DATABASE_URL;
      console.log('✅ Utilisation de la base de données Replit');
    } else if (process.env.DATABASE_URL) {
      connectionString = process.env.DATABASE_URL;
      console.log('✅ Utilisation de la base de données configurée');
    } else {
      // Fallback vers le système PostgreSQL automatique
      const databaseUrl = await ensurePostgresRunning();
      connectionString = databaseUrl;
      console.log('✅ Utilisation du système PostgreSQL automatique');
    }
    
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
