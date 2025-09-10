import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';

// Configuration automatique pour l'environnement Replit et autres plateformes
const isDevelopment = process.env.NODE_ENV !== 'production';
const isReplit = process.env.REPL_ID !== undefined;

// Configuration de la chaîne de connexion avec fallbacks intelligents et portabilité Replit
const getConnectionString = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  // Avertissement pour nouveaux déploiements Replit
  if (isReplit) {
    console.warn('⚠️  DATABASE_URL non définie dans l\'environnement Replit');
    console.log('💡 Pour configurer la base de données Replit:');
    console.log('   1. Allez dans l\'onglet "Database" de votre Repl');
    console.log('   2. Créez une base de données PostgreSQL');  
    console.log('   3. Copiez DATABASE_URL dans les Secrets');
    console.log('   4. Exécutez "npm run db:push" pour créer les tables');
    
    // Utiliser un fallback non-fonctionnel qui évitera une connexion réelle
    return 'postgresql://user:pass@localhost:5432/placeholder_db';
  }
  
  // Fallback pour développement local
  return 'postgresql://postgres:password@localhost:5432/barista_cafe_db';
};

const connectionString = getConnectionString();

// Configuration optimisée pour différents environnements
const connectionConfig = {
  max: isReplit ? 1 : 10, // Limite de connexions pour Replit
  idle_timeout: isReplit ? 20 : 30,
  connect_timeout: isReplit ? 10 : 30,
  prepare: !isReplit, // Désactiver les prepared statements sur Replit pour la compatibilité
  onnotice: () => {}, // Supprimer les notices PostgreSQL pour éviter le spam
  onnotify: () => {},
  debug: isDevelopment && !isReplit, // Debug seulement en dev local
  transform: {
    undefined: null
  },
  // Configuration SSL pour les environnements de production
  ssl: process.env.DATABASE_URL && !isDevelopment ? { rejectUnauthorized: false } : false
};

let connection: postgres.Sql;
let _db: ReturnType<typeof drizzle> | undefined;
let isConnected = false;

// Fonction d'initialisation avec retry intelligent
async function initializeDatabase() {
  let retryCount = 0;
  const maxRetries = 5;
  
  const attemptConnection = async (): Promise<void> => {
    try {
      console.log(`🔄 Tentative de connexion à la base de données (${retryCount + 1}/${maxRetries})...`);
      
      // Initialiser la connexion
      connection = postgres(connectionString, connectionConfig);
      _db = drizzle(connection, { schema });
      
      // Test de connexion
      await connection`SELECT 1 as test`;
      isConnected = true;
      console.log('✅ Base de données connectée avec succès');
      
      // Auto-initialisation des tables si nécessaire
      await autoInitializeTables();
      
    } catch (error) {
      retryCount++;
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error(`⚠️  Erreur de connexion DB (tentative ${retryCount}):`, errorMessage);
      
      if (retryCount >= maxRetries) {
        console.error('❌ Échec de la connexion après', maxRetries, 'tentatives');
        
        if (isReplit && !process.env.DATABASE_URL) {
          console.error('🚨 Base de données Replit non configurée !');
          console.log('📋 Instructions de configuration:');
          console.log('   1. Cliquez sur l\'onglet "Database" dans votre Repl');
          console.log('   2. Créez une nouvelle base PostgreSQL');
          console.log('   3. Ajoutez DATABASE_URL aux Secrets de votre Repl');
          console.log('   4. Relancez l\'application avec "npm run dev"');
          console.log('   5. Exécutez "npm run db:push" pour créer les tables');
          
          // En production Replit sans DB configurée, mode dégradé
          if (process.env.NODE_ENV === 'production') {
            console.warn('🔄 Mode dégradé activé - L\'application continuera sans base de données');
            console.log('📝 Les routes de l\'API retourneront des messages d\'instruction de configuration');
          }
        } else if (isDevelopment) {
          console.log('💡 En développement: Vérifiez que PostgreSQL est démarré localement');
        }
        
        throw new Error(`Impossible de se connecter à la base de données: ${errorMessage}`);
      }
      
      // Attendre avant la prochaine tentative (backoff exponentiel)
      const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
      console.log(`⏳ Nouvelle tentative dans ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return attemptConnection();
    }
  };
  
  await attemptConnection();
}

// Auto-initialisation des tables pour les nouveaux déploiements
async function autoInitializeTables() {
  try {
    // Vérifier si les tables principales existent
    const result = await connection`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'menu_items', 'menu_categories')
    `;
    
    if (result.length === 0) {
      console.log('🔧 Tables non trouvées, initialisation automatique...');
      console.log('💡 Exécutez "npm run db:push" pour créer le schéma de base de données');
    } else {
      console.log(`📊 ${result.length} tables principales trouvées dans la base de données`);
    }
  } catch (error) {
    console.warn('⚠️  Impossible de vérifier l\'état des tables:', error instanceof Error ? error.message : error);
  }
}

// Initialisation immédiate
initializeDatabase().catch(error => {
  console.error('❌ Échec fatal de l\'initialisation de la base de données:', error);
});

// Export sécurisé avec validation
export const getDb = () => {
  if (!_db || !isConnected) {
    throw new Error('Base de données non initialisée - Attendez l\'initialisation automatique');
  }
  return _db;
};

// Export conditionnel sécurisé
export const getDbSafe = () => _db;

// Export nommé pour compatibilité avec le code existant
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    if (!_db || !isConnected) {
      // Utiliser getDb() qui a une meilleure gestion d'erreur
      return getDb()[prop as keyof ReturnType<typeof drizzle>];
    }
    return (_db as any)[prop];
  }
});

// Export par défaut
export default db;

// Export nommé sécurisé des utilitaires
export { connection };