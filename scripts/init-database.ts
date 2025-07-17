
import { getDb, checkDatabaseHealth } from '../server/db';
import { 
  users, menuCategories, menuItems, tables, reservations, reservationItems, 
  contactMessages, orders, orderItems, customers, employees, workShifts, 
  activityLogs, permissions, menuItemImages
} from '../shared/schema';
import { hashPassword } from '../server/middleware/auth';
import { sql, eq } from 'drizzle-orm';

interface InitOptions {
  skipTestData?: boolean;
  forceReset?: boolean;
  environment?: 'development' | 'production' | 'test';
}

async function initializeDatabase(options: InitOptions = {}) {
  const { skipTestData = false, forceReset = false, environment = 'development' } = options;
  
  try {
    console.log('🗄️ Initialisation de la base de données PostgreSQL...');
    console.log(`📊 Environnement: ${environment}`);
    
    // Vérifier la santé de la base de données
    const healthCheck = await checkDatabaseHealth();
    if (!healthCheck.healthy) {
      throw new Error(`Base de données non accessible: ${healthCheck.error}`);
    }
    console.log('✅ Vérification de santé de la DB réussie');

    const db = await getDb();

    if (forceReset) {
      console.log('🔄 Reset forcé de la base de données...');
      await resetDatabase(db);
    }

    // Créer les tables avec gestion des dépendances
    console.log('📋 Création des tables...');
    await createTables(db);

    // Créer les index pour performance
    console.log('🔍 Création des index de performance...');
    await createIndexes(db);

    // Insérer des données de test seulement en développement
    if (!skipTestData && environment === 'development') {
      console.log('📝 Insertion des données de test...');
      await insertTestData(db);
    } else if (environment === 'production') {
      console.log('🏭 Mode production: insertion des données minimales...');
      await insertMinimalProductionData(db);
    }

    // Vérification finale
    await verifyDatabaseIntegrity(db);

    console.log('🚀 Base de données initialisée avec succès');
    return { success: true, environment };

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    throw error;
  }
}

async function resetDatabase(db: any) {
  try {
    // Supprimer les tables dans l'ordre inverse des dépendances
    const dropTables = [
      'reservation_items', 'order_items', 'work_shifts', 'activity_logs', 
      'permissions', 'menu_item_images', 'reservations', 'orders', 
      'menu_items', 'menu_categories', 'employees', 'customers', 
      'tables', 'contact_messages', 'users'
    ];

    for (const table of dropTables) {
      await db.execute(sql.raw(`DROP TABLE IF EXISTS ${table} CASCADE`));
    }
    
    console.log('✅ Tables supprimées avec succès');
  } catch (error) {
    console.warn('⚠️ Erreur lors du reset (peut être ignorée):', error);
  }
}

async function createTables(db: any) {
  // Ordre de création respectant les dépendances
  const createQueries = [
    // Table users (sans dépendances)
    sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'employe',
        first_name TEXT,
        last_name TEXT,
        email TEXT UNIQUE,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `,

    // Table menu_categories (sans dépendances)
    sql`
      CREATE TABLE IF NOT EXISTS menu_categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        slug TEXT UNIQUE NOT NULL,
        display_order INTEGER NOT NULL DEFAULT 0
      )
    `,

    // Table menu_items (dépend de menu_categories)
    sql`
      CREATE TABLE IF NOT EXISTS menu_items (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        price REAL NOT NULL,
        category_id INTEGER NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
        image_url TEXT,
        available BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `,

    // Table menu_item_images (dépend de menu_items)
    sql`
      CREATE TABLE IF NOT EXISTS menu_item_images (
        id SERIAL PRIMARY KEY,
        menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        alt_text TEXT,
        is_primary BOOLEAN NOT NULL DEFAULT true,
        upload_method TEXT NOT NULL DEFAULT 'url',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `,

    // Table tables (sans dépendances)
    sql`
      CREATE TABLE IF NOT EXISTS tables (
        id SERIAL PRIMARY KEY,
        number INTEGER UNIQUE NOT NULL,
        capacity INTEGER NOT NULL,
        available BOOLEAN NOT NULL DEFAULT true
      )
    `,

    // Table customers (sans dépendances)
    sql`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        loyalty_points INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `,

    // Table employees (dépend de users)
    sql`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        position TEXT NOT NULL,
        hourly_rate REAL NOT NULL,
        hire_date TIMESTAMP NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `,

    // Table reservations (dépend de customers et tables)
    sql`
      CREATE TABLE IF NOT EXISTS reservations (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        table_id INTEGER NOT NULL REFERENCES tables(id) ON DELETE RESTRICT,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        party_size INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `,

    // Table reservation_items (dépend de reservations et menu_items)
    sql`
      CREATE TABLE IF NOT EXISTS reservation_items (
        id SERIAL PRIMARY KEY,
        reservation_id INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
        menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        special_instructions TEXT
      )
    `,

    // Table orders (dépend de customers et tables)
    sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        table_id INTEGER REFERENCES tables(id) ON DELETE SET NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        total_amount REAL NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `,

    // Table order_items (dépend de orders et menu_items)
    sql`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        special_instructions TEXT
      )
    `,

    // Table work_shifts (dépend de employees)
    sql`
      CREATE TABLE IF NOT EXISTS work_shifts (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT,
        hours_worked REAL,
        status TEXT NOT NULL DEFAULT 'scheduled',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `,

    // Table activity_logs (dépend de users)
    sql`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        action TEXT NOT NULL,
        entity TEXT NOT NULL,
        entity_id INTEGER,
        details TEXT,
        timestamp TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `,

    // Table permissions (dépend de users)
    sql`
      CREATE TABLE IF NOT EXISTS permissions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        module TEXT NOT NULL,
        can_view BOOLEAN NOT NULL DEFAULT true,
        can_create BOOLEAN NOT NULL DEFAULT false,
        can_update BOOLEAN NOT NULL DEFAULT false,
        can_delete BOOLEAN NOT NULL DEFAULT false
      )
    `,

    // Table contact_messages (sans dépendances)
    sql`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'new',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `
  ];

  for (const query of createQueries) {
    await db.execute(query);
  }

  console.log('✅ Tables créées avec succès');
}

async function createIndexes(db: any) {
  const indexQueries = [
    // Index pour users
    sql`CREATE INDEX IF NOT EXISTS users_username_idx ON users(username)`,
    sql`CREATE INDEX IF NOT EXISTS users_email_idx ON users(email)`,
    sql`CREATE INDEX IF NOT EXISTS users_role_idx ON users(role)`,
    
    // Index pour menu_items
    sql`CREATE INDEX IF NOT EXISTS menu_items_category_idx ON menu_items(category_id)`,
    sql`CREATE INDEX IF NOT EXISTS menu_items_available_idx ON menu_items(available)`,
    sql`CREATE INDEX IF NOT EXISTS menu_items_name_idx ON menu_items(name)`,
    
    // Index pour reservations
    sql`CREATE INDEX IF NOT EXISTS reservations_date_idx ON reservations(date)`,
    sql`CREATE INDEX IF NOT EXISTS reservations_customer_idx ON reservations(customer_id)`,
    sql`CREATE INDEX IF NOT EXISTS reservations_status_idx ON reservations(status)`,
    sql`CREATE INDEX IF NOT EXISTS reservations_date_time_table_idx ON reservations(date, time, table_id)`,
    
    // Index pour orders
    sql`CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at)`,
    sql`CREATE INDEX IF NOT EXISTS orders_customer_idx ON orders(customer_id)`,
    sql`CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status)`,
    
    // Index pour tables
    sql`CREATE INDEX IF NOT EXISTS tables_number_idx ON tables(number)`,
    sql`CREATE INDEX IF NOT EXISTS tables_available_idx ON tables(available)`,
    
    // Index pour customers
    sql`CREATE INDEX IF NOT EXISTS customers_email_idx ON customers(email)`,
    sql`CREATE INDEX IF NOT EXISTS customers_loyalty_idx ON customers(loyalty_points)`,
    
    // Index pour activity_logs
    sql`CREATE INDEX IF NOT EXISTS activity_logs_user_id_idx ON activity_logs(user_id)`,
    sql`CREATE INDEX IF NOT EXISTS activity_logs_timestamp_idx ON activity_logs(timestamp)`,
    sql`CREATE INDEX IF NOT EXISTS activity_logs_entity_idx ON activity_logs(entity)`,
  ];

  for (const query of indexQueries) {
    await db.execute(query);
  }

  console.log('✅ Index créés avec succès');
}

async function insertTestData(db: any) {
  // Vérifier s'il y a déjà des données
  const existingUsers = await db.select().from(users).limit(1);
  if (existingUsers.length > 0) {
    console.log('📊 Données déjà présentes, ignorer l\'insertion');
    return;
  }

  try {
    // Créer l'utilisateur admin
    const adminPassword = await hashPassword('admin123');
    const [adminUser] = await db.insert(users).values({
      username: 'admin',
      password: adminPassword,
      role: 'directeur',
      firstName: 'Admin',
      lastName: 'Barista',
      email: 'admin@barista-cafe.com'
    }).returning();

    // Créer un employé
    const employeePassword = await hashPassword('employee123');
    const [employeeUser] = await db.insert(users).values({
      username: 'employee',
      password: employeePassword,
      role: 'employe',
      firstName: 'Employee',
      lastName: 'Barista',
      email: 'employee@barista-cafe.com'
    }).returning();

    // Créer les catégories de menu
    const categories = await db.insert(menuCategories).values([
      { name: 'Cafés', description: 'Nos cafés artisanaux', slug: 'cafes', displayOrder: 1 },
      { name: 'Boissons chaudes', description: 'Thés et boissons chaudes', slug: 'boissons-chaudes', displayOrder: 2 },
      { name: 'Pâtisseries', description: 'Pâtisseries et desserts', slug: 'patisseries', displayOrder: 3 },
      { name: 'Sandwichs', description: 'Sandwichs et plats légers', slug: 'sandwichs', displayOrder: 4 }
    ]).returning();

    // Créer les éléments de menu
    const menuItemsData = [
      { name: 'Espresso', description: 'Café espresso italien authentique', price: 2.50, categoryId: categories[0].id },
      { name: 'Cappuccino', description: 'Espresso avec mousse de lait crémeuse', price: 3.80, categoryId: categories[0].id },
      { name: 'Latte', description: 'Café au lait avec art latte', price: 4.20, categoryId: categories[0].id },
      { name: 'Americano', description: 'Espresso allongé avec eau chaude', price: 3.00, categoryId: categories[0].id },
      { name: 'Thé Earl Grey', description: 'Thé noir bergamote premium', price: 2.80, categoryId: categories[1].id },
      { name: 'Chocolat chaud', description: 'Chocolat belge avec chantilly', price: 3.50, categoryId: categories[1].id },
      { name: 'Croissant', description: 'Croissant artisanal au beurre', price: 2.20, categoryId: categories[2].id },
      { name: 'Muffin myrtilles', description: 'Muffin fait maison aux myrtilles', price: 2.80, categoryId: categories[2].id },
      { name: 'Sandwich jambon', description: 'Sandwich jambon fromage sur pain artisanal', price: 6.50, categoryId: categories[3].id },
      { name: 'Croque-monsieur', description: 'Croque-monsieur traditionnel', price: 7.20, categoryId: categories[3].id }
    ];

    const insertedMenuItems = await db.insert(menuItems).values(menuItemsData).returning();

    // Créer les tables
    await db.insert(tables).values([
      { number: 1, capacity: 2, available: true },
      { number: 2, capacity: 4, available: true },
      { number: 3, capacity: 6, available: true },
      { number: 4, capacity: 2, available: true },
      { number: 5, capacity: 8, available: true }
    ]);

    // Créer quelques clients
    await db.insert(customers).values([
      { firstName: 'Jean', lastName: 'Dupont', email: 'jean.dupont@email.com', phone: '+33123456789', loyaltyPoints: 120 },
      { firstName: 'Marie', lastName: 'Martin', email: 'marie.martin@email.com', phone: '+33987654321', loyaltyPoints: 85 },
      { firstName: 'Pierre', lastName: 'Bernard', email: 'pierre.bernard@email.com', phone: '+33456789123', loyaltyPoints: 200 }
    ]);

    // Créer des employés
    await db.insert(employees).values([
      {
        userId: adminUser.id,
        firstName: 'Admin',
        lastName: 'Barista',
        position: 'Directeur',
        hourlyRate: 25.0,
        hireDate: new Date('2023-01-01'),
        isActive: true
      },
      {
        userId: employeeUser.id,
        firstName: 'Employee',
        lastName: 'Barista',
        position: 'Serveur',
        hourlyRate: 15.0,
        hireDate: new Date('2023-06-01'),
        isActive: true
      }
    ]);

    console.log('✅ Données de test insérées avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'insertion des données de test:', error);
    throw error;
  }
}

async function insertMinimalProductionData(db: any) {
  // Données minimales pour la production
  const existingUsers = await db.select().from(users).limit(1);
  if (existingUsers.length > 0) {
    console.log('📊 Utilisateurs déjà présents en production');
    return;
  }

  // Créer seulement l'utilisateur admin en production
  const adminPassword = await hashPassword(process.env.ADMIN_PASSWORD || 'admin123');
  await db.insert(users).values({
    username: 'admin',
    password: adminPassword,
    role: 'directeur',
    firstName: 'Admin',
    lastName: 'System',
    email: process.env.ADMIN_EMAIL || 'admin@system.com'
  });

  console.log('✅ Données minimales de production insérées');
}

async function verifyDatabaseIntegrity(db: any) {
  try {
    // Vérifier que les tables existent et sont accessibles
    const tableChecks = [
      { name: 'users', query: () => db.select().from(users).limit(1) },
      { name: 'menu_categories', query: () => db.select().from(menuCategories).limit(1) },
      { name: 'menu_items', query: () => db.select().from(menuItems).limit(1) },
      { name: 'tables', query: () => db.select().from(tables).limit(1) },
      { name: 'customers', query: () => db.select().from(customers).limit(1) }
    ];

    for (const check of tableChecks) {
      await check.query();
      console.log(`✅ Table ${check.name} vérifiée`);
    }

    console.log('✅ Intégrité de la base de données vérifiée');
  } catch (error) {
    console.error('❌ Erreur de vérification d\'intégrité:', error);
    throw error;
  }
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  const environment = process.env.NODE_ENV as 'development' | 'production' | 'test' || 'development';
  const forceReset = process.argv.includes('--reset');
  const skipTestData = process.argv.includes('--skip-test-data');

  initializeDatabase({ 
    environment, 
    forceReset, 
    skipTestData 
  }).catch((error) => {
    console.error('❌ Échec de l\'initialisation:', error);
    process.exit(1);
  });
}

export { initializeDatabase };
