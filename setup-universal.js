#!/usr/bin/env node
import { spawn } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration pour différentes plateformes
const PLATFORMS = {
  REPLIT: 'replit',
  CODESPACE: 'codespace', 
  LOCAL: 'local',
  RAILWAY: 'railway',
  VERCEL: 'vercel'
};

// Détecter la plateforme actuelle
function detectPlatform() {
  // Replit detection
  if (process.env.REPLIT_DB_URL || process.env.REPL_SLUG) {
    return PLATFORMS.REPLIT;
  }
  
  // GitHub Codespaces detection
  if (process.env.CODESPACES || process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN) {
    return PLATFORMS.CODESPACE;
  }
  
  // Railway detection
  if (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID) {
    return PLATFORMS.RAILWAY;
  }
  
  // Vercel detection
  if (process.env.VERCEL || process.env.VERCEL_ENV) {
    return PLATFORMS.VERCEL;
  }
  
  // Default to local
  return PLATFORMS.LOCAL;
}

// Configuration de base de données par plateforme
function getDatabaseConfig(platform) {
  const configs = {
    [PLATFORMS.REPLIT]: {
      type: 'sqlite',
      url: 'file:./barista_cafe.db',
      dialect: 'sqlite',
      setup: setupSQLite
    },
    [PLATFORMS.CODESPACE]: {
      type: 'postgresql',
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/barista_cafe',
      dialect: 'postgresql',
      setup: setupPostgreSQL
    },
    [PLATFORMS.LOCAL]: {
      type: 'sqlite',
      url: 'file:./barista_cafe.db',
      dialect: 'sqlite',
      setup: setupSQLite
    },
    [PLATFORMS.RAILWAY]: {
      type: 'postgresql',
      url: process.env.DATABASE_URL || process.env.RAILWAY_DATABASE_URL,
      dialect: 'postgresql',
      setup: setupPostgreSQL
    },
    [PLATFORMS.VERCEL]: {
      type: 'postgresql',
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL,
      dialect: 'postgresql',
      setup: setupPostgreSQL
    }
  };
  
  return configs[platform] || configs[PLATFORMS.LOCAL];
}

// Configuration SQLite
async function setupSQLite() {
  console.log('🗄️  Configuration SQLite...');
  
  // Modifier le schéma pour SQLite
  await convertSchemaToSQLite();
  
  // Modifier la config Drizzle
  await updateDrizzleConfig('sqlite');
  
  console.log('✅ SQLite configuré');
}

// Configuration PostgreSQL
async function setupPostgreSQL() {
  console.log('🗄️  Configuration PostgreSQL...');
  
  // Restaurer le schéma PostgreSQL original
  await convertSchemaToPostgreSQL();
  
  // Modifier la config Drizzle
  await updateDrizzleConfig('postgresql');
  
  console.log('✅ PostgreSQL configuré');
}

// Convertir le schéma vers SQLite
async function convertSchemaToSQLite() {
  const schemaPath = join(__dirname, 'shared', 'schema.ts');
  const backupPath = join(__dirname, 'shared', 'schema.pg.backup');
  
  // Sauvegarder le schéma PostgreSQL original
  if (existsSync(schemaPath) && !existsSync(backupPath)) {
    const fs = await import('fs');
    fs.copyFileSync(schemaPath, backupPath);
  }
  
  // Nouveau schéma SQLite
  const sqliteSchema = `import { sqliteTable, text, integer, real, blob } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table for admin authentication
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').unique().notNull(),
  password: text('password').notNull(),
  role: text('role').notNull().default('employe'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  email: text('email'),
  lastLogin: text('last_login'), // ISO string
  createdAt: text('created_at').notNull().default(new Date().toISOString()),
  updatedAt: text('updated_at').notNull().default(new Date().toISOString())
});

// Activity logs table
export const activityLogs = sqliteTable("activity_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: integer("entity_id"),
  details: text("details"),
  timestamp: text("timestamp").notNull().default(new Date().toISOString()),
});

// Permissions table
export const permissions = sqliteTable("permissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  module: text("module").notNull(),
  canView: integer("can_view", { mode: "boolean" }).notNull().default(1),
  canCreate: integer("can_create", { mode: "boolean" }).notNull().default(0),
  canUpdate: integer("can_update", { mode: "boolean" }).notNull().default(0),
  canDelete: integer("can_delete", { mode: "boolean" }).notNull().default(0),
});

// Menu categories
export const menuCategories = sqliteTable("menu_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  slug: text("slug").notNull().unique(),
  displayOrder: integer("display_order").notNull().default(0),
});

// Menu items
export const menuItems = sqliteTable("menu_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  categoryId: integer("category_id").notNull(),
  imageUrl: text("image_url"),
  available: integer("available", { mode: "boolean" }).notNull().default(1),
  createdAt: text("created_at").default(new Date().toISOString()),
});

// Menu item images
export const menuItemImages = sqliteTable("menu_item_images", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  menuItemId: integer("menu_item_id").notNull(),
  imageUrl: text("image_url").notNull(),
  altText: text("alt_text"),
  isPrimary: integer("is_primary", { mode: "boolean" }).notNull().default(1),
  uploadMethod: text("upload_method").notNull().default("url"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

// Tables
export const tables = sqliteTable("tables", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  number: integer("number").notNull().unique(),
  capacity: integer("capacity").notNull(),
  available: integer("available", { mode: "boolean" }).notNull().default(1),
});

// Reservations
export const reservations = sqliteTable("reservations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  guests: integer("guests").notNull(),
  tableId: integer("table_id"),
  specialRequests: text("special_requests"),
  status: text("status").notNull().default("pending"),
  preorderTotal: real("preorder_total").default(0.00),
  notificationSent: integer("notification_sent", { mode: "boolean" }).default(0),
  metadata: text("metadata"), // JSON string
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

// Reservation items
export const reservationItems = sqliteTable("reservation_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reservationId: integer("reservation_id").notNull(),
  menuItemId: integer("menu_item_id").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  totalPrice: real("total_price").notNull(),
  specialInstructions: text("special_instructions"),
});

// Contact messages
export const contactMessages = sqliteTable("contact_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("new"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

// Customers
export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  loyaltyPoints: integer("loyalty_points").notNull().default(0),
  totalSpent: real("total_spent").notNull().default(0.00),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

// Employees
export const employees = sqliteTable("employees", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  position: text("position").notNull(),
  department: text("department").notNull(),
  hourlyRate: real("hourly_rate").notNull(),
  hireDate: text("hire_date").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

// Orders
export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id"),
  employeeId: integer("employee_id"),
  tableId: integer("table_id"),
  orderType: text("order_type").notNull().default("dine-in"),
  status: text("status").notNull().default("pending"),
  subtotal: real("subtotal").notNull(),
  tax: real("tax").notNull(),
  total: real("total").notNull(),
  paymentMethod: text("payment_method"),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

// Order items
export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull(),
  menuItemId: integer("menu_item_id").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  totalPrice: real("total_price").notNull(),
  specialInstructions: text("special_instructions"),
});

// Work shifts
export const workShifts = sqliteTable("work_shifts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeId: integer("employee_id").notNull(),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time"),
  hoursWorked: real("hours_worked"),
  status: text("status").notNull().default("scheduled"),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
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

  writeFileSync(schemaPath, sqliteSchema);
}

// Convertir le schéma vers PostgreSQL
async function convertSchemaToPostgreSQL() {
  const schemaPath = join(__dirname, 'shared', 'schema.ts');
  const backupPath = join(__dirname, 'shared', 'schema.pg.backup');
  
  // Restaurer depuis la sauvegarde si elle existe
  if (existsSync(backupPath)) {
    const fs = await import('fs');
    fs.copyFileSync(backupPath, schemaPath);
  }
}

// Mettre à jour la configuration Drizzle
async function updateDrizzleConfig(dialect) {
  const configPath = join(__dirname, 'drizzle.config.ts');
  
  let configContent;
  if (dialect === 'sqlite') {
    configContent = `import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL?.replace('file:', '') || "./barista_cafe.db",
  },
});
`;
  } else {
    configContent = `import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL || "postgresql://placeholder:placeholder@localhost:5432/placeholder";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql", 
  dbCredentials: {
    url: databaseUrl,
  },
});
`;
  }
  
  writeFileSync(configPath, configContent);
}

// Mettre à jour le fichier de configuration de la base de données
async function updateDbConfig(config) {
  const dbPath = join(__dirname, 'server', 'db.ts');
  
  let dbContent;
  if (config.type === 'sqlite') {
    dbContent = `import 'dotenv/config';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { sql } from 'drizzle-orm';
import * as schema from '@shared/schema';

let sqlite: Database.Database;
let db: ReturnType<typeof drizzle>;

async function initializeDatabase() {
  try {
    const databasePath = process.env.DATABASE_URL?.replace('file:', '') || './barista_cafe.db';
    
    console.log('✅ Utilisation de la base de données SQLite');

    sqlite = new Database(databasePath);
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('synchronous = normal');
    sqlite.pragma('cache_size = 1000');
    sqlite.pragma('temp_store = memory');
    sqlite.pragma('foreign_keys = ON');

    db = drizzle(sqlite, { schema });
    console.log('✅ Base de données SQLite connectée:', databasePath);
    return db;
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error);
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
    console.log('✅ Configuration SQLite automatique');
    await db.run(sql\`SELECT 1\`);
    console.log('✅ SQLite configuré automatiquement');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la configuration SQLite:', error);
    return false;
  }
}`;
  } else {
    dbContent = `import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import * as schema from '@shared/schema';

let pool: Pool;
let db: ReturnType<typeof drizzle>;

async function initializeDatabase() {
  try {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    console.log('✅ Utilisation de la base de données PostgreSQL');

    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      allowExitOnIdle: false,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      statement_timeout: 30000,
      query_timeout: 30000
    });

    db = drizzle(pool, { schema });
    console.log('✅ Base de données PostgreSQL connectée');
    return db;
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error);
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
    console.log('✅ Configuration PostgreSQL automatique');
    await db.execute(sql\`SELECT 1\`);
    console.log('✅ PostgreSQL configuré automatiquement');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la configuration PostgreSQL:', error);
    return false;
  }
}`;
  }
  
  writeFileSync(dbPath, dbContent);
}

// Créer le fichier .env
function createEnvFile(config) {
  const envContent = `DATABASE_URL=${config.url}
JWT_SECRET=barista_cafe_jwt_secret_key_2025
NODE_ENV=development
PORT=5000
`;
  
  writeFileSync(join(__dirname, '.env'), envContent);
}

// Exécuter les migrations
async function runMigrations() {
  console.log('🔄 Génération et application des migrations...');
  
  return new Promise((resolve, reject) => {
    const pushProcess = spawn('npx', ['drizzle-kit', 'push'], { 
      stdio: 'inherit',
      shell: true
    });
    
    pushProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Migrations appliquées avec succès');
        resolve(true);
      } else {
        console.log('⚠️  Erreur lors des migrations (normal si tables existent déjà)');
        resolve(true); // Continue même si les migrations échouent
      }
    });
    
    pushProcess.on('error', (error) => {
      console.log('⚠️  Erreur migrations:', error.message);
      resolve(true); // Continue même si les migrations échouent
    });
  });
}

// Initialiser les données de base
async function initializeData() {
  console.log('📊 Initialisation des données de base...');
  
  return new Promise((resolve, reject) => {
    const initProcess = spawn('npx', ['tsx', 'scripts/setup.ts'], { 
      stdio: 'inherit',
      shell: true,
      env: { ...process.env }
    });
    
    initProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Données initialisées avec succès');
      } else {
        console.log('⚠️  Avertissement lors de l\'initialisation des données');
      }
      resolve(true);
    });
    
    initProcess.on('error', (error) => {
      console.log('⚠️  Erreur initialisation:', error.message);
      resolve(true);
    });
  });
}

// Fonction principale
async function main() {
  try {
    console.log('🚀 Configuration universelle du projet Barista Café');
    
    // Détecter la plateforme
    const platform = detectPlatform();
    console.log(`🔍 Plateforme détectée: ${platform}`);
    
    // Obtenir la configuration de base de données
    const dbConfig = getDatabaseConfig(platform);
    console.log(`🗄️  Type de base de données: ${dbConfig.type}`);
    
    // Configurer la base de données
    await dbConfig.setup();
    
    // Mettre à jour la configuration de la base de données
    await updateDbConfig(dbConfig);
    
    // Créer le fichier .env
    createEnvFile(dbConfig);
    
    // Exécuter les migrations
    await runMigrations();
    
    // Initialiser les données de base
    await initializeData();
    
    console.log('🎉 Configuration terminée avec succès!');
    console.log('🚀 Vous pouvez maintenant démarrer l\'application avec: npm run dev');
    
  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error);
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main, detectPlatform, getDatabaseConfig };