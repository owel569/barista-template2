import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '@shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

// Configure Neon connection for compatibility with the latest version
const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, { 
  schema,
  logger: false // Disable logging to avoid compatibility issues during development
});
