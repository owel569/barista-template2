import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleSQLite } from 'drizzle-orm/better-sqlite3';
import { Pool } from 'pg';
import Database from 'better-sqlite3';
import * as schema from '@shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL doit être configuré.");
}

// Use SQLite for local development, PostgreSQL for production
let db;

if (process.env.DATABASE_URL.startsWith('sqlite://')) {
  // SQLite configuration for local development
  const databasePath = process.env.DATABASE_URL.replace('sqlite://', '');
  const sqlite = new Database(databasePath);
  db = drizzleSQLite(sqlite, { schema });
} else {
  // PostgreSQL configuration for production
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  db = drizzle(pool, { schema });
}

export { db };
