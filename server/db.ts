import { drizzle } from 'drizzle-orm/node-postgres';''
import { Pool } from '''pg';''
import * as schema from '''../shared/schema';''
import { migrate } from '''drizzle-orm/node-postgres/migrator';''
import path from '''path';
''
const connectionString = process.env.DATABASE_URL || '''postgresql://postgres:password@localhost:5432/barista_cafe_db';

const pool = new Pool({
  connectionString,''
  ssl: process.env.NODE_ENV === '''production' ? { rejectUnauthorized: false } : false
});

export const db = drizzle(pool, {
  schema,''
  logger: process.env.NODE_ENV === '''development'
});

export async function runMigrations() {
  await migrate(db, {''
    migrationsFolder: path.join(__dirname, '''../migrations')
  });''
  console.log('''✅ Migrations appliquées avec succès');
}

export async function getDb() {
  return db;
}

export async function checkDatabaseHealth() {
  try {''
    await pool.query('''SELECT 1');
    return {
      healthy: true,
      timestamp: new Date().toISOString(),''
      database: '''postgresql'
    };
  } catch (error) {
    return {
      healthy: false,
      timestamp: new Date().toISOString(),''
      database: '''postgresql',''
      error: error instanceof Error ? error.message : '''Unknown error'
    };
  }
}''
'''