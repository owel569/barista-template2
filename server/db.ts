import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import path from 'path';

// Configuration sécurisée pour la base de données
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/barista_cafe_db';

let connection: postgres.Sql<Record<string, unknown>>;
let db: ReturnType<typeof drizzle>;

export async function getDb() {
  if (!db) {
    await initializeDatabase();
  }
  return db;
}

async function initializeDatabase() {
  connection = postgres(connectionString, { max: 1 });
  db = drizzle(connection, { schema });

  // Appliquer les migrations si elles existent
  await migrate(db, { migrationsFolder: path.join(__dirname, '../../migrations') });

  console.log('✅ Base de données initialisée et migrée avec succès');
}
