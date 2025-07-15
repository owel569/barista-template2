import 'dotenv/config';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { sql } from 'drizzle-orm';
import * as schema from '@shared/schema';

let sqlite: Database.Database;
let db: ReturnType<typeof drizzle>;

async function initializeDatabase() {
  try {
    const databasePath = process.env.DATABASE_URL?.replace('file:', '') || './barista_cafe.db';
    
    console.log('✅ Utilisation de la base de données SQLite');

    sqlite = new Database(databasePath);
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('synchronous = normal');
    sqlite.pragma('cache_size = 1000');
    sqlite.pragma('temp_store = memory');
    sqlite.pragma('foreign_keys = ON');

    db = drizzle(sqlite, { schema });
    console.log('✅ Base de données SQLite connectée:', databasePath);
    return db;
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error);
    throw error;
  }
}

const dbPromise = initializeDatabase();

export const getDb = async () => {
  await dbPromise;
  return db;
};

export { db };

export async function setupDatabase() {
  try {
    console.log('✅ Configuration SQLite automatique');
    await db.run(sql`SELECT 1`);
    console.log('✅ SQLite configuré automatiquement');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la configuration SQLite:', error);
    return false;
  }
}