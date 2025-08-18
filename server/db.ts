import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';

// Configuration sécurisée pour la base de données
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/barista_cafe_db';

// Initialiser la connexion directement
const connection = postgres(connectionString, { max: 1 });
export const db = drizzle(connection, { schema });

console.log('✅ Base de données connectée avec succès');

// Export par défaut et named export
export const getDb = () => db;
export default db;