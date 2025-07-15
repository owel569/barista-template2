#!/usr/bin/env node
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const execAsync = promisify(exec);

// Configuration PostgreSQL pour production
const DB_CONFIG = {
  host: '127.0.0.1',
  port: 5432,
  database: 'barista_cafe',
  user: 'postgres',
  password: 'postgres'
};

// Fonction pour démarrer PostgreSQL
async function setupPostgreSQL() {
  try {
    console.log('🐘 Configuration PostgreSQL pour production...');
    
    // Vérifier si PostgreSQL est déjà installé
    try {
      await execAsync('which psql');
      console.log('✅ PostgreSQL trouvé');
    } catch (error) {
      console.log('📦 Installation de PostgreSQL...');
      await execAsync('sudo apt update && sudo apt install -y postgresql postgresql-contrib');
    }
    
    // Démarrer le service PostgreSQL
    try {
      await execAsync('sudo service postgresql start');
      console.log('✅ Service PostgreSQL démarré');
    } catch (error) {
      console.log('⚠️ Service PostgreSQL déjà démarré ou erreur:', error.message);
    }
    
    // Créer l'utilisateur et la base de données
    try {
      await execAsync(`sudo -u postgres createuser -s ${DB_CONFIG.user}`);
      console.log('✅ Utilisateur PostgreSQL créé');
    } catch (error) {
      console.log('ℹ️ Utilisateur PostgreSQL existe déjà');
    }
    
    try {
      await execAsync(`sudo -u postgres createdb ${DB_CONFIG.database}`);
      console.log('✅ Base de données créée');
    } catch (error) {
      console.log('ℹ️ Base de données existe déjà');
    }
    
    // Configurer le mot de passe
    await execAsync(`sudo -u postgres psql -c "ALTER USER ${DB_CONFIG.user} PASSWORD '${DB_CONFIG.password}';"`);
    console.log('✅ Mot de passe configuré');
    
    return true;
  } catch (error) {
    console.error('❌ Erreur PostgreSQL:', error.message);
    return false;
  }
}

// Fonction pour créer la configuration d'environnement
function createEnvironmentConfig() {
  console.log('🔧 Configuration de l\'environnement...');
  
  const envContent = `# Configuration PostgreSQL Production - Barista Café
DATABASE_URL=postgresql://${DB_CONFIG.user}:${DB_CONFIG.password}@${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}
PGHOST=${DB_CONFIG.host}
PGPORT=${DB_CONFIG.port}
PGUSER=${DB_CONFIG.user}
PGPASSWORD=${DB_CONFIG.password}
PGDATABASE=${DB_CONFIG.database}

# Configuration Application
NODE_ENV=production
JWT_SECRET=barista_cafe_production_jwt_secret_2025_ultra_secure
PORT=5000

# Configuration Performance
CACHE_TTL_MENU=600
CACHE_TTL_CATEGORIES=1800
CACHE_TTL_TABLES=300
DB_POOL_SIZE=20
DB_CONNECTION_TIMEOUT=30000
DB_STATEMENT_TIMEOUT=60000
`;
  
  writeFileSync('.env', envContent);
  console.log('✅ Configuration .env créée');
  
  // Configuration Drizzle pour PostgreSQL
  const drizzleConfig = `import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://${DB_CONFIG.user}:${DB_CONFIG.password}@${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}",
  },
  verbose: true,
  strict: true,
});
`;
  
  writeFileSync('drizzle.config.ts', drizzleConfig);
  console.log('✅ Configuration Drizzle mise à jour');
}

// Fonction pour restaurer le schéma PostgreSQL
function restorePostgreSQLSchema() {
  console.log('🔄 Restauration du schéma PostgreSQL...');
  
  // Schéma PostgreSQL complet simplifié
  const pgSchema = `import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar, date, time, pgEnum, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums PostgreSQL
export const userRoleEnum = pgEnum('user_role', ['directeur', 'employe']);
export const reservationStatusEnum = pgEnum('reservation_status', ['pending', 'confirmed', 'cancelled', 'completed']);
export const uploadMethodEnum = pgEnum('upload_method', ['url', 'upload', 'generated', 'pexels']);

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  role: varchar('role', { length: 20 }).notNull().default('employe'),
  firstName: varchar('first_name', { length: 50 }),
  lastName: varchar('last_name', { length: 50 }),
  email: varchar('email', { length: 100 }),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Activity logs
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: integer("entity_id"),
  details: text("details"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Permissions
export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  module: text("module").notNull(),
  canView: boolean("can_view").notNull().default(true),
  canCreate: boolean("can_create").notNull().default(false),
  canUpdate: boolean("can_update").notNull().default(false),
  canDelete: boolean("can_delete").notNull().default(false),
});

// Menu categories
export const menuCategories = pgTable("menu_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  slug: text("slug").notNull().unique(),
  displayOrder: integer("display_order").notNull().default(0),
});

// Menu items
export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 8, scale: 2 }).notNull(),
  categoryId: integer("category_id").notNull(),
  imageUrl: text("image_url"),
  available: boolean("available").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Menu item images
export const menuItemImages = pgTable("menu_item_images", {
  id: serial("id").primaryKey(),
  menuItemId: integer("menu_item_id").notNull(),
  imageUrl: text("image_url").notNull(),
  altText: text("alt_text"),
  isPrimary: boolean("is_primary").notNull().default(true),
  uploadMethod: uploadMethodEnum("upload_method").notNull().default("url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tables
export const tables = pgTable("tables", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull().unique(),
  capacity: integer("capacity").notNull(),
  available: boolean("available").notNull().default(true),
});

// Reservations
export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  date: date("date").notNull(),
  time: time("time").notNull(),
  guests: integer("guests").notNull(),
  tableId: integer("table_id"),
  specialRequests: text("special_requests"),
  status: reservationStatusEnum("status").notNull().default("pending"),
  preorderTotal: decimal("preorder_total", { precision: 8, scale: 2 }).default("0.00"),
  notificationSent: boolean("notification_sent").default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Reservation items
export const reservationItems = pgTable("reservation_items", {
  id: serial("id").primaryKey(),
  reservationId: integer("reservation_id").notNull(),
  menuItemId: integer("menu_item_id").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 8, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 8, scale: 2 }).notNull(),
  specialInstructions: text("special_instructions"),
});

// Contact messages
export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Customers
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  loyaltyPoints: integer("loyalty_points").notNull().default(0),
  totalSpent: decimal("total_spent", { precision: 8, scale: 2 }).notNull().default("0.00"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Employees
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  position: text("position").notNull(),
  department: text("department").notNull(),
  hourlyRate: decimal("hourly_rate", { precision: 8, scale: 2 }).notNull(),
  hireDate: date("hire_date").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id"),
  employeeId: integer("employee_id"),
  tableId: integer("table_id"),
  orderType: text("order_type").notNull().default("dine-in"),
  status: text("status").notNull().default("pending"),
  subtotal: decimal("subtotal", { precision: 8, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 8, scale: 2 }).notNull(),
  total: decimal("total", { precision: 8, scale: 2 }).notNull(),
  paymentMethod: text("payment_method"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Order items
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  menuItemId: integer("menu_item_id").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 8, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 8, scale: 2 }).notNull(),
  specialInstructions: text("special_instructions"),
});

// Work shifts
export const workShifts = pgTable("work_shifts", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time"),
  hoursWorked: decimal("hours_worked", { precision: 4, scale: 2 }),
  status: text("status").notNull().default("scheduled"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  activityLogs: many(activityLogs),
  permissions: many(permissions),
}));

export const menuCategoriesRelations = relations(menuCategories, ({ many }) => ({
  menuItems: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  category: one(menuCategories, {
    fields: [menuItems.categoryId],
    references: [menuCategories.id],
  }),
  images: many(menuItemImages),
  reservationItems: many(reservationItems),
  orderItems: many(orderItems),
}));

export const tablesRelations = relations(tables, ({ many }) => ({
  reservations: many(reservations),
  orders: many(orders),
}));

export const reservationsRelations = relations(reservations, ({ one, many }) => ({
  table: one(tables, {
    fields: [reservations.tableId],
    references: [tables.id],
  }),
  items: many(reservationItems),
}));

export const reservationItemsRelations = relations(reservationItems, ({ one }) => ({
  reservation: one(reservations, {
    fields: [reservationItems.reservationId],
    references: [reservations.id],
  }),
  menuItem: one(menuItems, {
    fields: [reservationItems.menuItemId],
    references: [menuItems.id],
  }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
}));

export const employeesRelations = relations(employees, ({ many }) => ({
  orders: many(orders),
  workShifts: many(workShifts),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  employee: one(employees, {
    fields: [orders.employeeId],
    references: [employees.id],
  }),
  table: one(tables, {
    fields: [orders.tableId],
    references: [tables.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  menuItem: one(menuItems, {
    fields: [orderItems.menuItemId],
    references: [menuItems.id],
  }),
}));

export const workShiftsRelations = relations(workShifts, ({ one }) => ({
  employee: one(employees, {
    fields: [workShifts.employeeId],
    references: [employees.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type MenuCategory = typeof menuCategories.$inferSelect;
export type InsertMenuCategory = typeof menuCategories.$inferInsert;
export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = typeof menuItems.$inferInsert;
export type MenuItemImage = typeof menuItemImages.$inferSelect;
export type InsertMenuItemImage = typeof menuItemImages.$inferInsert;
export type Table = typeof tables.$inferSelect;
export type InsertTable = typeof tables.$inferInsert;
export type Reservation = typeof reservations.$inferSelect;
export type InsertReservation = typeof reservations.$inferInsert;
export type ReservationItem = typeof reservationItems.$inferSelect;
export type InsertReservationItem = typeof reservationItems.$inferInsert;
export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = typeof contactMessages.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;
export type WorkShift = typeof workShifts.$inferSelect;
export type InsertWorkShift = typeof workShifts.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;
export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = typeof permissions.$inferInsert;

// Zod schemas
export const insertUserSchema = createInsertSchema(users);
export const insertMenuCategorySchema = createInsertSchema(menuCategories);
export const insertMenuItemSchema = createInsertSchema(menuItems);
export const insertTableSchema = createInsertSchema(tables);
export const insertReservationSchema = createInsertSchema(reservations);
export const insertContactMessageSchema = createInsertSchema(contactMessages);
export const insertCustomerSchema = createInsertSchema(customers);
export const insertEmployeeSchema = createInsertSchema(employees);
export const insertOrderSchema = createInsertSchema(orders);
export const insertActivityLogSchema = createInsertSchema(activityLogs);
export const insertPermissionSchema = createInsertSchema(permissions);
`;

  writeFileSync(join(__dirname, 'shared', 'schema.ts'), pgSchema);
  console.log('✅ Schéma PostgreSQL restauré');
}

// Configuration de la base de données
function configureDatabaseConnection() {
  console.log('🔧 Configuration de la connexion base de données...');
  
  const dbConfig = `import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import * as schema from '@shared/schema';

let pool: Pool;
let db: ReturnType<typeof drizzle>;

async function initializeDatabase() {
  try {
    console.log('🐘 Initialisation PostgreSQL...');
    
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/barista_cafe';
    
    pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 30000,
      statement_timeout: 60000,
      query_timeout: 30000,
      ssl: false,
      allowExitOnIdle: false,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });

    db = drizzle(pool, { schema });
    
    // Test de connexion
    const client = await pool.connect();
    try {
      await client.query('SELECT NOW()');
      console.log('✅ PostgreSQL connecté');
    } finally {
      client.release();
    }
    
    return db;
  } catch (error) {
    console.error('❌ Erreur PostgreSQL:', error);
    throw error;
  }
}

const dbPromise = initializeDatabase();

export const getDb = async () => {
  await dbPromise;
  return db;
};

export { db };

export async function setupDatabase() {
  try {
    await db.execute(sql\`SELECT 1\`);
    console.log('✅ Base de données configurée');
    return true;
  } catch (error) {
    console.error('❌ Erreur configuration base de données:', error);
    return false;
  }
}`;

  writeFileSync(join(__dirname, 'server', 'db.ts'), dbConfig);
  console.log('✅ Configuration base de données mise à jour');
}

// Créer le script de démarrage
function createStartScript() {
  const startScript = `#!/bin/bash
# Script de démarrage automatique Barista Café

echo "🚀 Démarrage Barista Café - Production"

# Démarrer PostgreSQL
sudo service postgresql start

# Attendre que PostgreSQL soit prêt
sleep 3

# Démarrer l'application
npm run dev
`;

  writeFileSync('start-production.sh', startScript);
  execAsync('chmod +x start-production.sh');
  console.log('✅ Script de démarrage créé');
}

// Fonction principale
async function main() {
  try {
    console.log('🏭 Configuration production Barista Café');
    
    // 1. Configurer PostgreSQL
    const pgSetup = await setupPostgreSQL();
    if (!pgSetup) {
      console.log('⚠️ Utilisation de SQLite comme fallback');
      return;
    }
    
    // 2. Créer la configuration
    createEnvironmentConfig();
    
    // 3. Restaurer le schéma
    restorePostgreSQLSchema();
    
    // 4. Configurer la connexion
    configureDatabaseConnection();
    
    // 5. Créer le script de démarrage
    createStartScript();
    
    // 6. Appliquer les migrations
    console.log('🔄 Application des migrations...');
    await execAsync('npx drizzle-kit push');
    console.log('✅ Migrations appliquées');
    
    // 7. Initialiser les données
    console.log('📊 Initialisation des données...');
    await execAsync('npx tsx scripts/init-database.ts');
    console.log('✅ Données initialisées');
    
    console.log('🎉 Configuration terminée!');
    console.log('');
    console.log('📋 Commandes:');
    console.log('  • ./start-production.sh - Démarrage automatique');
    console.log('  • npm run dev - Démarrage manuel');
    console.log('');
    console.log('🔐 Admin: admin / admin123');
    console.log('🌐 http://localhost:5000');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

main();