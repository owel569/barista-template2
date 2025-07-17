import { getDb, checkDatabaseHealth } from '../server/db';
import { sql } from 'drizzle-orm';
import { seedDatabase } from './seed';
import { DatabaseUtils } from './db-utils';

// Interface pour les options d'initialisation
interface InitOptions {
  reset?: boolean;
  skipTestData?: boolean;
  force?: boolean;
  environment?: 'development' | 'production' | 'test';
  includeOrders?: boolean;
  includeReservations?: boolean;
}

/**
 * Initialisation complète et robuste de la base de données PostgreSQL
 * Utilise getDb() pour garantir la stabilité des connexions
 */
export async function initializeDatabase(options: InitOptions = {}): Promise<void> {
  const {
    reset = false,
    skipTestData = false,
    force = false,
    environment = process.env.NODE_ENV as 'development' | 'production' | 'test' || 'development',
    includeOrders = true,
    includeReservations = true
  } = options;

  // Sécurité production
  if (environment === 'production' && (reset || !skipTestData)) {
    throw new Error('🚫 Operations dangereuses interdites en production');
  }

  console.log('🗄️ Initialisation de la base de données PostgreSQL');
  console.log(`📊 Environnement: ${environment}`);
  console.log(`🔄 Reset: ${reset ? 'Oui' : 'Non'}`);
  console.log(`📝 Données de test: ${skipTestData ? 'Non' : 'Oui'}`);

  try {
    // 1. Vérification de santé de la DB
    console.log('🏥 Vérification de santé de la base de données...');
    const healthCheck = await checkDatabaseHealth();
    
    if (!healthCheck.healthy) {
      throw new Error(`Base de données non accessible: ${healthCheck.error}`);
    }
    console.log('✅ Vérification de santé réussie');

    // 2. Obtenir la connexion via getDb() (méthode robuste)
    const db = await getDb();
    console.log('✅ Connexion à la base de données établie');

    // 3. Reset si demandé
    if (reset) {
      if (!force && environment === 'production') {
        throw new Error('🚫 Reset en production requiert --force');
      }
      
      console.log('🗑️ Reset de la base de données demandé...');
      await DatabaseUtils.safeReset({ confirmReset: true });
    }

    // 4. Création des tables avec gestion des dépendances
    console.log('📋 Création des tables avec clés étrangères...');
    await createTablesWithForeignKeys(db);

    // 5. Création des index pour performance
    console.log('🔍 Création des index de performance...');
    await createPerformanceIndexes(db);

    // 6. Validation de l'intégrité post-création
    console.log('🔍 Validation de l\'intégrité des tables...');
    const integrityIssues = await DatabaseUtils.validateIntegrity();
    
    if (integrityIssues.length > 0) {
      console.warn('⚠️ Problèmes d\'intégrité détectés mais non bloquants');
      DatabaseUtils.printIntegrityIssues(integrityIssues);
    } else {
      console.log('✅ Intégrité des tables validée');
    }

    // 7. Insertion des données de test si demandé
    if (!skipTestData && environment !== 'production') {
      console.log('🌱 Insertion des données de test...');
      
      const seedStats = await seedDatabase({
        includeOrders,
        includeReservations
      });
      
      console.log('✅ Données de test insérées avec succès');
    }

    // 8. Statistiques finales
    console.log('📊 Génération des statistiques finales...');
    const finalStats = await DatabaseUtils.getStats();
    DatabaseUtils.printStats(finalStats);

    // 9. Vérification finale de santé
    const finalHealth = await DatabaseUtils.checkHealth();
    if (finalHealth.healthy) {
      console.log('✅ Vérification finale de santé réussie');
    } else {
      console.warn('⚠️ Problèmes détectés lors de la vérification finale');
    }

    console.log('🎉 Initialisation de la base de données terminée avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    throw error;
  }
}

/**
 * Création des tables avec toutes les clés étrangères et contraintes
 */
async function createTablesWithForeignKeys(db: any): Promise<void> {
  await db.transaction(async (tx) => {
    // Table users (base, sans dépendances)
    await tx.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'employe' CHECK (role IN ('directeur', 'gerant', 'employe')),
        first_name TEXT,
        last_name TEXT,
        email TEXT UNIQUE,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // Table menu_categories (base, sans dépendances)
    await tx.execute(sql`
      CREATE TABLE IF NOT EXISTS menu_categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        slug TEXT UNIQUE NOT NULL,
        display_order INTEGER NOT NULL DEFAULT 0
      );
    `);

    // Table menu_items (dépend de menu_categories)
    await tx.execute(sql`
      CREATE TABLE IF NOT EXISTS menu_items (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        price REAL NOT NULL CHECK (price >= 0),
        category_id INTEGER NOT NULL,
        image_url TEXT,
        available BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE RESTRICT
      );
    `);

    // Table tables (base, sans dépendances)
    await tx.execute(sql`
      CREATE TABLE IF NOT EXISTS tables (
        id SERIAL PRIMARY KEY,
        number INTEGER UNIQUE NOT NULL CHECK (number > 0),
        capacity INTEGER NOT NULL DEFAULT 4 CHECK (capacity > 0),
        status TEXT NOT NULL DEFAULT 'libre' CHECK (status IN ('libre', 'occupee', 'reservee', 'maintenance')),
        location TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Table customers (base, sans dépendances)
    await tx.execute(sql`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE,
        phone TEXT,
        loyalty_points INTEGER DEFAULT 0 CHECK (loyalty_points >= 0),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Table employees (base, sans dépendances)
    await tx.execute(sql`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        position TEXT NOT NULL,
        phone TEXT,
        email TEXT UNIQUE,
        hire_date DATE NOT NULL,
        salary REAL CHECK (salary >= 0),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Table orders (dépend de customers)
    await tx.execute(sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER,
        total REAL NOT NULL CHECK (total >= 0),
        status TEXT NOT NULL DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'en_cours', 'pret', 'termine', 'annule')),
        type TEXT NOT NULL DEFAULT 'sur_place' CHECK (type IN ('sur_place', 'emporter', 'livraison')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
      );
    `);

    // Table order_items (dépend de orders et menu_items)
    await tx.execute(sql`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL,
        menu_item_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        price REAL NOT NULL CHECK (price >= 0),
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE RESTRICT
      );
    `);

    // Table reservations (dépend de tables, optionnel customers)
    await tx.execute(sql`
      CREATE TABLE IF NOT EXISTS reservations (
        id SERIAL PRIMARY KEY,
        customer_name TEXT NOT NULL,
        customer_email TEXT,
        customer_phone TEXT,
        date DATE NOT NULL,
        time TEXT NOT NULL,
        party_size INTEGER NOT NULL CHECK (party_size > 0),
        table_id INTEGER,
        status TEXT NOT NULL DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'confirmee', 'arrivee', 'terminee', 'annulee')),
        special_requests TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE SET NULL
      );
    `);

    // Table reservation_items (dépend de reservations et menu_items)
    await tx.execute(sql`
      CREATE TABLE IF NOT EXISTS reservation_items (
        id SERIAL PRIMARY KEY,
        reservation_id INTEGER NOT NULL,
        menu_item_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        price REAL NOT NULL CHECK (price >= 0),
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE RESTRICT
      );
    `);

    // Table permissions (dépend de users)
    await tx.execute(sql`
      CREATE TABLE IF NOT EXISTS permissions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        module TEXT NOT NULL,
        can_view BOOLEAN NOT NULL DEFAULT true,
        can_create BOOLEAN NOT NULL DEFAULT false,
        can_update BOOLEAN NOT NULL DEFAULT false,
        can_delete BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, module)
      );
    `);

    // Table activity_logs (dépend de users)
    await tx.execute(sql`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        entity TEXT NOT NULL,
        entity_id INTEGER,
        details TEXT,
        timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Table work_shifts (dépend de employees)
    await tx.execute(sql`
      CREATE TABLE IF NOT EXISTS work_shifts (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL,
        date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        break_duration INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        UNIQUE(employee_id, date, start_time)
      );
    `);

    // Table contact_messages (indépendante)
    await tx.execute(sql`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'nouveau' CHECK (status IN ('nouveau', 'en_cours', 'resolu', 'ferme')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('✅ Toutes les tables créées avec clés étrangères');
  });
}

/**
 * Création des index pour optimiser les performances
 */
async function createPerformanceIndexes(db: any): Promise<void> {
  await db.transaction(async (tx) => {
    // Index pour les utilisateurs
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);`);
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);`);

    // Index pour les éléments de menu
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);`);
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(available);`);
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS idx_menu_items_name ON menu_items(name);`);

    // Index pour les commandes
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);`);
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);`);
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);`);

    // Index pour les articles de commande
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);`);
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS idx_order_items_menu_item ON order_items(menu_item_id);`);

    // Index pour les réservations
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(date);`);
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS idx_reservations_table ON reservations(table_id);`);
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);`);

    // Index pour les permissions
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS idx_permissions_user ON permissions(user_id);`);
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);`);

    // Index pour les logs d'activité
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);`);
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp);`);
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity);`);

    // Index pour les horaires de travail
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS idx_work_shifts_employee ON work_shifts(employee_id);`);
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS idx_work_shifts_date ON work_shifts(date);`);

    // Index pour les clients
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);`);
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS idx_customers_loyalty ON customers(loyalty_points);`);

    console.log('✅ Index de performance créés');
  });
}

// Commandes CLI pour utilisation directe
async function runCLI() {
  const args = process.argv.slice(2);
  const options: InitOptions = {};

  // Parsing des arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--reset':
        options.reset = true;
        break;
      case '--skip-test-data':
        options.skipTestData = true;
        break;
      case '--force':
        options.force = true;
        break;
      case '--no-orders':
        options.includeOrders = false;
        break;
      case '--no-reservations':
        options.includeReservations = false;
        break;
      case '--env':
        options.environment = args[++i] as 'development' | 'production' | 'test';
        break;
      case '--help':
        console.log('🛠️ Script d\'initialisation de la base de données Barista Café');
        console.log('============================================================');
        console.log('Options disponibles:');
        console.log('  --reset              Reset complet de la DB');
        console.log('  --skip-test-data     Pas de données de test');
        console.log('  --force              Force les opérations dangereuses');
        console.log('  --no-orders          Pas de commandes de test');
        console.log('  --no-reservations    Pas de réservations de test');
        console.log('  --env <env>          Environnement (development/production/test)');
        console.log('  --help               Afficher cette aide');
        console.log('');
        console.log('Exemples:');
        console.log('  tsx scripts/init-database-improved.ts');
        console.log('  tsx scripts/init-database-improved.ts --reset --skip-test-data');
        console.log('  tsx scripts/init-database-improved.ts --env production --skip-test-data');
        return;
    }
  }

  try {
    await initializeDatabase(options);
    console.log('✅ Initialisation terminée avec succès');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error.message);
    process.exit(1);
  }
}

// Exécution CLI si appelé directement
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {
  runCLI();
}