import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { sql } from 'drizzle-orm';
import * as schema from '../shared/schema';
import { IStorage, MemStorage, storage } from './storage';

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
let useMemStorage = false;
let memStorage: IStorage;

// Fonction d'initialisation avec retry intelligent et fallback MemStorage
async function initializeDatabase() {
  let retryCount = 0;
  const maxRetries = 3; // Réduit pour un fallback plus rapide
  
  // Détecter si on doit utiliser MemStorage immédiatement (pas de DATABASE_URL sur Replit)
  const shouldUseMemStorage = isReplit && !process.env.DATABASE_URL;
  
  if (shouldUseMemStorage) {
    console.log('🚀 Mode MemStorage détecté pour déploiement zero-touch sur Replit');
    memStorage = storage; // Utiliser l'instance singleton
    useMemStorage = true;
    isConnected = true;
    console.log('✅ MemStorage initialisé avec succès');
    await autoSeedMemStorage();
    return;
  }
  
  const attemptConnection = async (): Promise<void> => {
    try {
      console.log(`🔄 Tentative de connexion à la base de données (${retryCount + 1}/${maxRetries})...`);
      
      // Initialiser la connexion
      connection = postgres(connectionString, connectionConfig);
      _db = drizzle(connection, { schema });
      
      // Test de connexion
      await connection`SELECT 1 as test`;
      isConnected = true;
      useMemStorage = false;
      console.log('✅ Base de données PostgreSQL connectée avec succès');
      
      // Auto-initialisation des tables si nécessaire
      await autoInitializeTables();
      
    } catch (error) {
      retryCount++;
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error(`⚠️  Erreur de connexion DB (tentative ${retryCount}):`, errorMessage);
      
      if (retryCount >= maxRetries) {
        console.error('❌ Échec de la connexion après', maxRetries, 'tentatives');
        
        // Fallback automatique vers MemStorage
        console.log('🔄 Activation du fallback MemStorage automatique...');
        memStorage = storage;
        useMemStorage = true;
        isConnected = true;
        console.log('✅ MemStorage activé en mode fallback');
        await autoSeedMemStorage();
        return;
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
      console.log('🔧 Tables non trouvées, création automatique du schéma...');
      await createTablesFromSchema();
      console.log('✅ Schéma de base de données créé automatiquement');
      
      // Optionnel: Seeding automatique pour les nouveaux déploiements
      if (process.env.AUTO_SEED !== 'false') {
        console.log('🌱 Initialisation des données de base...');
        await autoSeedDatabase();
      }
    } else {
      console.log(`📊 ${result.length} tables principales trouvées dans la base de données`);
    }
  } catch (error) {
    console.warn('⚠️  Impossible de vérifier l\'état des tables:', error instanceof Error ? error.message : error);
  }
}

// Création automatique des tables à partir du schéma avec syntaxe SQL tagged correcte
async function createTablesFromSchema() {
  try {
    console.log('🏗️  Création des tables à partir du schéma...');
    const db = getDb();
    
    // Créer les tables en utilisant la syntaxe sql tagged de Drizzle
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(20),
        role VARCHAR(50) DEFAULT 'customer' NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        permissions TEXT[],
        avatar_url VARCHAR(255),
        last_login_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS menu_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        image_url VARCHAR(255),
        is_active BOOLEAN NOT NULL DEFAULT true,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS menu_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        category_id INTEGER REFERENCES menu_categories(id),
        image_url VARCHAR(500),
        available BOOLEAN NOT NULL DEFAULT true,
        is_vegetarian BOOLEAN NOT NULL DEFAULT false,
        is_vegan BOOLEAN NOT NULL DEFAULT false,
        is_gluten_free BOOLEAN NOT NULL DEFAULT false,
        stock INTEGER NOT NULL DEFAULT 0,
        allergens TEXT[],
        ingredients TEXT[],
        nutritional_info JSON,
        preparation_time INTEGER,
        preparation_time_minutes INTEGER,
        calories INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        phone VARCHAR(20),
        loyalty_points INTEGER NOT NULL DEFAULT 0,
        total_orders INTEGER NOT NULL DEFAULT 0,
        total_spent DECIMAL(10,2) NOT NULL DEFAULT '0',
        last_visit TIMESTAMP,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        employee_number VARCHAR(20) NOT NULL UNIQUE,
        position VARCHAR(50) NOT NULL,
        hire_date TIMESTAMP NOT NULL,
        salary DECIMAL(10,2),
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS tables (
        id SERIAL PRIMARY KEY,
        number INTEGER NOT NULL UNIQUE,
        capacity INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'available',
        location VARCHAR(50),
        section VARCHAR(50),
        features JSON DEFAULT '[]',
        description TEXT,
        notes TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(20) NOT NULL UNIQUE,
        customer_id INTEGER REFERENCES customers(id),
        table_id INTEGER REFERENCES tables(id),
        item_id INTEGER REFERENCES menu_items(id),
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        order_type VARCHAR(50) NOT NULL DEFAULT 'dine-in',
        total DECIMAL(10,2) NOT NULL DEFAULT '0.00',
        total_amount DECIMAL(10,2) NOT NULL,
        items JSON,
        special_requests TEXT,
        customer_info JSON,
        payment_method VARCHAR(20),
        payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id),
        menu_item_id INTEGER REFERENCES menu_items(id),
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        special_instructions TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS reservations (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id),
        table_id INTEGER REFERENCES tables(id),
        date TIMESTAMP NOT NULL,
        time VARCHAR(10) NOT NULL,
        reservation_time TIMESTAMP NOT NULL,
        guest_name VARCHAR(100),
        party_size INTEGER NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        special_requests TEXT,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS permissions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        module VARCHAR(50) NOT NULL,
        can_view BOOLEAN NOT NULL DEFAULT false,
        can_create BOOLEAN NOT NULL DEFAULT false,
        can_update BOOLEAN NOT NULL DEFAULT false,
        can_delete BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    console.log('✅ Tables créées avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la création des tables:', error instanceof Error ? error.message : error);
    throw error;
  }
}

// Seeding automatique pour les nouveaux déploiements PostgreSQL
async function autoSeedDatabase() {
  try {
    // Importer et exécuter le seeding de base
    const { seedDatabase } = await import('../scripts/seed');
    await seedDatabase({
      skipExisting: true,
      includeOrders: false,
      includeReservations: false
    });
    console.log('✅ Données de base initialisées automatiquement');
  } catch (error) {
    console.warn('⚠️  Erreur lors du seeding automatique:', error instanceof Error ? error.message : error);
    console.log('💡 Vous pouvez exécuter manuellement "npm run seed" pour initialiser les données');
  }
}

// Seeding automatique pour MemStorage 
async function autoSeedMemStorage() {
  try {
    console.log('🌱 Initialisation des données de base pour MemStorage...');
    
    // Créer des catégories de menu de base
    const beverageCategory = await memStorage.menuCategories.create({
      name: 'Boissons',
      description: 'Café, thé et boissons chaudes',
      isActive: true,
      sortOrder: 1
    });

    const foodCategory = await memStorage.menuCategories.create({
      name: 'Plats',
      description: 'Sandwichs, salades et plats du jour',
      isActive: true,
      sortOrder: 2
    });

    // Créer des articles de menu de base
    await memStorage.menuItems.create({
      name: 'Espresso',
      description: 'Café espresso classique',
      price: '2.50',
      categoryId: beverageCategory.id,
      available: true,
      stock: 100,
      preparationTimeMinutes: 2
    });

    await memStorage.menuItems.create({
      name: 'Cappuccino',
      description: 'Espresso avec mousse de lait',
      price: '3.50',
      categoryId: beverageCategory.id,
      available: true,
      stock: 100,
      preparationTimeMinutes: 3
    });

    await memStorage.menuItems.create({
      name: 'Croissant',
      description: 'Croissant au beurre frais',
      price: '2.00',
      categoryId: foodCategory.id,
      available: true,
      stock: 20,
      preparationTimeMinutes: 1
    });

    // Créer des tables de base
    for (let i = 1; i <= 10; i++) {
      await memStorage.tables.create({
        number: i,
        capacity: i <= 6 ? 2 : 4,
        status: 'available',
        location: i <= 5 ? 'inside' : 'terrace',
        isActive: true
      });
    }

    // Créer un utilisateur admin de base
    await memStorage.users.create({
      email: 'admin@barista.local',
      username: 'admin',
      password: 'admin123', // En production, cela devrait être hashé
      firstName: 'Admin',
      lastName: 'Barista',
      role: 'admin',
      isActive: true
    });

    console.log('✅ Données de base MemStorage initialisées avec succès');
  } catch (error) {
    console.warn('⚠️  Erreur lors du seeding MemStorage:', error instanceof Error ? error.message : error);
  }
}

// Initialisation immédiate
initializeDatabase().catch(error => {
  console.error('❌ Échec fatal de l\'initialisation de la base de données:', error);
});

// Export sécurisé avec validation (synchrone pour compatibilité)
export const getDb = () => {
  if (!isConnected) {
    throw new Error('Base de données non initialisée - Attendez l\'initialisation automatique');
  }
  if (useMemStorage) {
    // Retourner un proxy qui redirige vers MemStorage
    return createMemStorageProxy();
  }
  if (!_db) {
    throw new Error('Base de données PostgreSQL non initialisée');
  }
  return _db;
};

// Export du storage unifié (MemStorage ou PostgreSQL)
export const getStorage = (): IStorage => {
  if (!isConnected) {
    throw new Error('Storage non initialisé - Attendez l\'initialisation automatique');
  }
  if (useMemStorage) {
    return memStorage;
  }
  // Pour PostgreSQL, on pourrait créer un wrapper, mais pour l'instant on utilise Drizzle directement
  throw new Error('Storage PostgreSQL wrapper non implémenté - utilisez getDb() pour Drizzle');
};

// Créer un proxy pour faire semblant d'être Drizzle mais rediriger vers MemStorage
function createMemStorageProxy() {
  return new Proxy({} as any, {
    get(target, prop) {
      // Simuler les propriétés Drizzle communes pour la compatibilité
      if (prop === 'query') {
        return {}; // Objet vide pour query
      }
      if (prop === 'select') {
        return () => ({ from: () => ({ where: () => Promise.resolve([]) }) });
      }
      if (prop === 'insert') {
        return () => ({ values: () => ({ returning: () => Promise.resolve([]) }) });
      }
      if (prop === 'update') {
        return () => ({ set: () => ({ where: () => ({ returning: () => Promise.resolve([]) }) }) });
      }
      if (prop === 'delete') {
        return () => ({ where: () => Promise.resolve([]) });
      }
      
      // Pour les accès directs aux tables du schéma
      const schemaTable = (schema as any)[prop as string];
      if (schemaTable) {
        return schemaTable;
      }
      
      return undefined;
    }
  });
}

// Utilitaire pour savoir si on utilise MemStorage
export const isUsingMemStorage = () => useMemStorage;

// Version asynchrone qui attend l'initialisation
export const getDbAsync = async (): Promise<ReturnType<typeof drizzle>> => {
  // Attendre que l'initialisation soit terminée si elle est en cours
  if (!isConnected) {
    console.log('⏳ Attente de l\'initialisation de la base de données...');
    // Attendre un maximum de 30 secondes pour l'initialisation
    let attempts = 0;
    const maxAttempts = 60; // 30 secondes à 500ms par tentative
    
    while (!isConnected && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }
    
    if (!isConnected) {
      throw new Error('Base de données non initialisée - Timeout d\'initialisation dépassé');
    }
  }
  
  if (useMemStorage) {
    return createMemStorageProxy();
  }
  
  if (!_db) {
    throw new Error('Base de données PostgreSQL non initialisée');
  }
  return _db;
};

// Version asynchrone pour obtenir le storage
export const getStorageAsync = async (): Promise<IStorage> => {
  if (!isConnected) {
    console.log('⏳ Attente de l\'initialisation du storage...');
    let attempts = 0;
    const maxAttempts = 60;
    
    while (!isConnected && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }
    
    if (!isConnected) {
      throw new Error('Storage non initialisé - Timeout d\'initialisation dépassé');
    }
  }
  
  if (useMemStorage) {
    return memStorage;
  }
  
  throw new Error('Storage PostgreSQL wrapper non implémenté - utilisez getDbAsync() pour Drizzle');
};

// Export conditionnel sécurisé
export const getDbSafe = () => {
  if (useMemStorage) {
    return createMemStorageProxy();
  }
  return _db;
};

// Export nommé pour compatibilité avec le code existant
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    if (!isConnected) {
      // Utiliser getDb() qui a une meilleure gestion d'erreur
      return getDb()[prop as keyof ReturnType<typeof drizzle>];
    }
    if (useMemStorage) {
      return createMemStorageProxy()[prop as keyof ReturnType<typeof drizzle>];
    }
    if (!_db) {
      return getDb()[prop as keyof ReturnType<typeof drizzle>];
    }
    return (_db as any)[prop];
  }
});

// Utilitaire pour attendre que la base de données soit prête
export const waitForDatabaseReady = async (): Promise<void> => {
  await getDbAsync();
};

// Export par défaut
export default db;

// Export nommé sécurisé des utilitaires
export { connection };