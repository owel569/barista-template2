import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';

// Configuration sécurisée pour la base de données
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/barista_cafe_db';

// Configuration optimisée pour Replit
const connectionConfig = {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,
  onnotice: () => {}, // Supprimer les notices PostgreSQL pour éviter le spam
  onnotify: () => {},
  debug: process.env.NODE_ENV === 'development' ? false : false
};

let connection: postgres.Sql;
let db: ReturnType<typeof drizzle>;

try {
  // Initialiser la connexion avec gestion d'erreurs
  connection = postgres(connectionString, connectionConfig);
  db = drizzle(connection, { schema });
  
  // Test de connexion immédiat mais non bloquant
  connection`SELECT 1 as test`.then(() => {
    console.log('✅ Base de données connectée avec succès');
  }).catch((error) => {
    console.error('⚠️  Avertissement de connexion DB:', error.message);
  });
  
} catch (error) {
  console.error('❌ Erreur de configuration de la base de données:', error);
  throw error;
}

// Export sécurisé avec validation
export const getDb = () => {
  if (!db) {
    throw new Error('Base de données non initialisée');
  }
  return db;
};

export { db };
export default db;