import { getDb } from '../server/db';
import { 
  users, menuCategories, menuItems, tables, reservations, reservationItems, 
  contactMessages, orders, orderItems, customers, employees, workShifts, 
  activityLogs, permissions 
} from '../shared/schema';
import { hashPassword } from '../server/middleware/auth';
import { sql } from 'drizzle-orm';

async function initializeDatabase() {
  try {
    console.log('🗄️ Initialisation de la base de données PostgreSQL...');
    
    const db = await getDb();

    // Créer les tables avec CASCADE pour éviter les problèmes d'ordre
    console.log('📋 Création des tables...');
    
    // Créer les tables principales
    await db.execute(sql`
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
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS menu_categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        slug TEXT UNIQUE NOT NULL,
        display_order INTEGER NOT NULL DEFAULT 0
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS menu_items (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        price REAL NOT NULL,
        category_id INTEGER NOT NULL,
        image_url TEXT,
        available BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS tables (
        id SERIAL PRIMARY KEY,
        number INTEGER UNIQUE NOT NULL,
        capacity INTEGER NOT NULL DEFAULT 4,
        status TEXT NOT NULL DEFAULT 'libre',
        location TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS reservations (
        id SERIAL PRIMARY KEY,
        customer_name TEXT NOT NULL,
        customer_email TEXT,
        customer_phone TEXT,
        date DATE NOT NULL,
        time TEXT NOT NULL,
        guests INTEGER NOT NULL,
        table_id INTEGER,
        status TEXT NOT NULL DEFAULT 'en_attente',
        special_requests TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS reservation_items (
        id SERIAL PRIMARY KEY,
        reservation_id INTEGER NOT NULL,
        menu_item_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        price REAL NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'nouveau',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER,
        table_id INTEGER,
        status TEXT NOT NULL DEFAULT 'en_attente',
        total_amount REAL NOT NULL DEFAULT 0,
        payment_method TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL,
        menu_item_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        price REAL NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        phone TEXT,
        address TEXT,
        loyalty_points INTEGER DEFAULT 0,
        total_visits INTEGER DEFAULT 0,
        total_spent REAL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        phone TEXT,
        position TEXT,
        hourly_rate REAL,
        hire_date DATE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS work_shifts (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        break_duration INTEGER DEFAULT 0,
        hourly_rate REAL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        entity TEXT NOT NULL,
        entity_id INTEGER,
        details TEXT,
        timestamp TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS permissions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        module TEXT NOT NULL,
        can_view BOOLEAN NOT NULL DEFAULT true,
        can_create BOOLEAN NOT NULL DEFAULT false,
        can_update BOOLEAN NOT NULL DEFAULT false,
        can_delete BOOLEAN NOT NULL DEFAULT false
      )
    `);

    // Créer les index pour performance
    await db.execute(sql`CREATE INDEX IF NOT EXISTS users_username_idx ON users(username)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS users_email_idx ON users(email)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS menu_items_category_idx ON menu_items(category_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS reservations_date_idx ON reservations(date)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at)`);

    console.log('✅ Tables créées avec succès');

    // Insérer des données de test
    console.log('📝 Insertion des données de test...');
    await insertTestData(db);

    console.log('🚀 Base de données initialisée avec succès');

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    throw error;
  }
}

async function insertTestData(db: any) {
  // Vérifier s'il y a déjà des données
  const existingUsers = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
  if (existingUsers.rows[0].count > 0) {
    console.log('📊 Données déjà présentes, ignorer l\'insertion');
    return;
  }

  // Créer l'utilisateur admin
  const adminPassword = await hashPassword('admin123');
  await db.execute(sql`
    INSERT INTO users (username, password, role, first_name, last_name, email) 
    VALUES ('admin', ${adminPassword}, 'directeur', 'Admin', 'Barista', 'admin@barista-cafe.com')
  `);

  // Créer un employé
  const employeePassword = await hashPassword('employee123');
  await db.execute(sql`
    INSERT INTO users (username, password, role, first_name, last_name, email) 
    VALUES ('employee', ${employeePassword}, 'employe', 'Employee', 'Barista', 'employee@barista-cafe.com')
  `);

  // Créer les catégories de menu
  await db.execute(sql`
    INSERT INTO menu_categories (name, description, slug, display_order) VALUES 
    ('Cafés', 'Nos cafés artisanaux', 'cafes', 1),
    ('Boissons chaudes', 'Thés et boissons chaudes', 'boissons-chaudes', 2),
    ('Pâtisseries', 'Pâtisseries et desserts', 'patisseries', 3),
    ('Sandwichs', 'Sandwichs et plats légers', 'sandwichs', 4)
  `);

  // Créer les éléments de menu
  await db.execute(sql`
    INSERT INTO menu_items (name, description, price, category_id, available) VALUES 
    ('Espresso', 'Café espresso italien authentique', 2.50, 1, true),
    ('Cappuccino', 'Espresso avec mousse de lait crémeuse', 3.80, 1, true),
    ('Latte', 'Café au lait avec art latte', 4.20, 1, true),
    ('Americano', 'Espresso allongé avec eau chaude', 3.00, 1, true),
    ('Thé Earl Grey', 'Thé noir bergamote premium', 2.80, 2, true),
    ('Chocolat chaud', 'Chocolat belge avec chantilly', 3.50, 2, true),
    ('Croissant', 'Croissant artisanal au beurre', 2.20, 3, true),
    ('Muffin myrtilles', 'Muffin fait maison aux myrtilles', 2.80, 3, true),
    ('Sandwich jambon', 'Sandwich jambon fromage sur pain artisanal', 6.50, 4, true),
    ('Croque-monsieur', 'Croque-monsieur traditionnel', 7.20, 4, true)
  `);

  // Créer les tables
  await db.execute(sql`
    INSERT INTO tables (number, capacity, status, location) VALUES 
    (1, 2, 'libre', 'Terrasse'),
    (2, 4, 'libre', 'Intérieur'),
    (3, 6, 'libre', 'Salon'),
    (4, 2, 'libre', 'Bar'),
    (5, 8, 'libre', 'Salle privée')
  `);

  // Créer quelques clients
  await db.execute(sql`
    INSERT INTO customers (name, email, phone, loyalty_points, total_visits, total_spent) VALUES 
    ('Jean Dupont', 'jean.dupont@email.com', '+33123456789', 120, 15, 158.50),
    ('Marie Martin', 'marie.martin@email.com', '+33987654321', 85, 8, 95.20),
    ('Pierre Bernard', 'pierre.bernard@email.com', '+33456789123', 200, 25, 312.80)
  `);

  console.log('✅ Données de test insérées');
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase().catch(console.error);
}

export { initializeDatabase };