import 'dotenv/config';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { sql } from 'drizzle-orm';
import * as schema from '@shared/schema';

// Configuration automatique de SQLite
let sqlite: Database.Database;
let db: ReturnType<typeof drizzle>;

async function initializeDatabase() {
  try {
    const databasePath = process.env.DATABASE_URL?.replace('file:', '') || './barista_cafe.db';
    
    console.log('✅ Utilisation de la base de données SQLite pour le développement');

    sqlite = new Database(databasePath);
    sqlite.pragma('journal_mode = WAL'); // Enable WAL mode for better performance
    sqlite.pragma('synchronous = normal'); // Balanced performance/safety
    sqlite.pragma('cache_size = 1000'); // Increase cache size
    sqlite.pragma('temp_store = memory'); // Use memory for temp tables
    sqlite.pragma('foreign_keys = ON'); // Enable foreign key constraints

    db = drizzle(sqlite, { schema });
    console.log('✅ Base de données SQLite connectée:', databasePath);
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

export async function setupDatabase() {
  try {
    console.log('✅ Utilisation de la base de données PostgreSQL Replit');

    // Configuration de la base de données avec retry
    const connectionString = process.env.DATABASE_URL || 'postgresql://replit:replit@localhost:5432/barista_cafe';
    console.log('✅ Base de données connectée:', connectionString.replace(/:[^:@]+@/, ':***@'));

    // Test de connexion avec retry
    let retries = 3;
    while (retries > 0) {
      try {
        await db.execute(sql`SELECT 1`);
        console.log('✅ PostgreSQL configuré automatiquement');
        return true;
      } catch (error) {
        retries--;
        console.log(`🔄 Tentative de connexion (${3 - retries}/3)...`);
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la configuration de la base de données:', error);
    console.log('📝 Suggestion: Vérifiez que PostgreSQL est démarré avec `pg_ctl start`');
    return false;
  }
}