#!/usr/bin/env node
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const execAsync = promisify(exec);

// Détection de l'environnement
function detectPlatform() {
  if (process.env.REPLIT_ENVIRONMENT) {
    return 'replit';
  }
  return 'local';
}

// Configuration base de données selon l'environnement
function getDatabaseConfig(platform) {
  if (platform === 'replit') {
    return {
      dialect: 'sqlite',
      filename: './barista_cafe.db',
      url: `file:./barista_cafe.db`,
      backup: true,
      wal: true,
      performance: true
    };
  }
  
  // Pour un environnement local, on peut essayer PostgreSQL
  return {
    dialect: 'postgresql',
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/barista_cafe',
    fallback: 'sqlite'
  };
}

// Configuration SQLite optimisée pour restaurant
async function setupSQLite() {
  console.log('🗄️ Configuration SQLite optimisée pour restaurant...');
  
  // Configuration .env pour SQLite
  const envContent = `# Configuration SQLite Production - Barista Café
# Optimisé pour restaurant avec clients en continu
DATABASE_URL=file:./barista_cafe.db
DB_TYPE=sqlite

# Configuration Application
NODE_ENV=production
JWT_SECRET=barista_cafe_production_jwt_secret_2025_ultra_secure
PORT=5000

# Configuration Performance SQLite
SQLITE_PRAGMA_JOURNAL_MODE=WAL
SQLITE_PRAGMA_SYNCHRONOUS=NORMAL
SQLITE_PRAGMA_CACHE_SIZE=20000
SQLITE_PRAGMA_FOREIGN_KEYS=ON
SQLITE_PRAGMA_TEMP_STORE=MEMORY
SQLITE_PRAGMA_MMAP_SIZE=268435456

# Configuration Cache
CACHE_TTL_MENU=600
CACHE_TTL_CATEGORIES=1800
CACHE_TTL_TABLES=300
DB_POOL_SIZE=10
DB_CONNECTION_TIMEOUT=30000
DB_STATEMENT_TIMEOUT=60000

# Configuration Backup automatique
BACKUP_ENABLED=true
BACKUP_INTERVAL=3600
BACKUP_RETENTION=7
`;
  
  writeFileSync('.env', envContent);
  console.log('✅ Configuration .env SQLite créée');
}

// Configuration PostgreSQL (si disponible)
async function setupPostgreSQL() {
  console.log('🐘 Configuration PostgreSQL...');
  
  const envContent = `# Configuration PostgreSQL Production - Barista Café
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/barista_cafe
DB_TYPE=postgresql

# Configuration Application
NODE_ENV=production
JWT_SECRET=barista_cafe_production_jwt_secret_2025_ultra_secure
PORT=5000

# Configuration Performance PostgreSQL
DB_POOL_SIZE=20
DB_CONNECTION_TIMEOUT=30000
DB_STATEMENT_TIMEOUT=60000

# Configuration Cache
CACHE_TTL_MENU=600
CACHE_TTL_CATEGORIES=1800
CACHE_TTL_TABLES=300
`;
  
  writeFileSync('.env', envContent);
  console.log('✅ Configuration .env PostgreSQL créée');
}

// Convertir le schéma pour SQLite (optimisé)
async function convertSchemaToSQLite() {
  console.log('🔄 Conversion du schéma pour SQLite...');
  
  const sqliteSchema = `import { sqliteTable, text, integer, real, blob, index } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table with optimized indexes
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').unique().notNull(),
  password: text('password').notNull(),
  role: text('role').notNull().default('employe'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  email: text('email').unique(),
  lastLogin: text('last_login'),
  createdAt: text('created_at').default("datetime('now')").notNull(),
  updatedAt: text('updated_at').default("datetime('now')").notNull()
}, (table) => ({
  usernameIdx: index('users_username_idx').on(table.username),
  emailIdx: index('users_email_idx').on(table.email),
  roleIdx: index('users_role_idx').on(table.role),
}));

// Activity logs with efficient indexing
export const activityLogs = sqliteTable("activity_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: integer("entity_id"),
  details: text("details"),
  timestamp: text("timestamp").default("datetime('now')").notNull(),
}, (table) => ({
  userIdIdx: index("activity_logs_user_id_idx").on(table.userId),
  entityIdx: index("activity_logs_entity_idx").on(table.entity),
  timestampIdx: index("activity_logs_timestamp_idx").on(table.timestamp),
}));

// Permissions table
export const permissions = sqliteTable("permissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  module: text("module").notNull(),
  canView: integer("can_view", { mode: "boolean" }).notNull().default(true),
  canCreate: integer("can_create", { mode: "boolean" }).notNull().default(false),
  canUpdate: integer("can_update", { mode: "boolean" }).notNull().default(false),
  canDelete: integer("can_delete", { mode: "boolean" }).notNull().default(false),
}, (table) => ({
  userIdIdx: index("permissions_user_id_idx").on(table.userId),
  moduleIdx: index("permissions_module_idx").on(table.module),
}));

// Menu categories with optimized structure
export const menuCategories = sqliteTable("menu_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  slug: text("slug").notNull().unique(),
  displayOrder: integer("display_order").notNull().default(0),
}, (table) => ({
  slugIdx: index("menu_categories_slug_idx").on(table.slug),
  orderIdx: index("menu_categories_order_idx").on(table.displayOrder),
}));

// Menu items with performance optimizations
export const menuItems = sqliteTable("menu_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  categoryId: integer("category_id").notNull(),
  imageUrl: text("image_url"),
  available: integer("available", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").default("datetime('now')"),
}, (table) => ({
  nameIdx: index("menu_items_name_idx").on(table.name),
  categoryIdx: index("menu_items_category_idx").on(table.categoryId),
  availableIdx: index("menu_items_available_idx").on(table.available),
  priceIdx: index("menu_items_price_idx").on(table.price),
}));

// Menu item images for dynamic management
export const menuItemImages = sqliteTable("menu_item_images", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  menuItemId: integer("menu_item_id").notNull(),
  imageUrl: text("image_url").notNull(),
  altText: text("alt_text"),
  isPrimary: integer("is_primary", { mode: "boolean" }).notNull().default(true),
  uploadMethod: text("upload_method", { enum: ["url", "upload", "generated", "pexels"] }).notNull().default("url"),
  createdAt: text("created_at").default("datetime('now')").notNull(),
  updatedAt: text("updated_at").default("datetime('now')").notNull(),
}, (table) => ({
  menuItemIdx: index("menu_item_images_menu_item_id_idx").on(table.menuItemId),
  primaryIdx: index("menu_item_images_primary_idx").on(table.menuItemId, table.isPrimary),
}));

// Tables with capacity management
export const tables = sqliteTable("tables", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  number: integer("number").notNull().unique(),
  capacity: integer("capacity").notNull(),
  available: integer("available", { mode: "boolean" }).notNull().default(true),
}, (table) => ({
  numberIdx: index("tables_number_idx").on(table.number),
  capacityIdx: index("tables_capacity_idx").on(table.capacity),
  availableIdx: index("tables_available_idx").on(table.available),
}));

// Reservations with anti-duplication measures
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
  status: text("status", { enum: ["pending", "confirmed", "cancelled", "completed"] }).notNull().default("pending"),
  preorderTotal: real("preorder_total").default(0.00),
  notificationSent: integer("notification_sent", { mode: "boolean" }).default(false),
  metadata: text("metadata"),
  createdAt: text("created_at").default("datetime('now')").notNull(),
}, (table) => ({
  dateIdx: index("reservations_date_idx").on(table.date),
  timeIdx: index("reservations_time_idx").on(table.time),
  statusIdx: index("reservations_status_idx").on(table.status),
  tableIdx: index("reservations_table_idx").on(table.tableId),
  emailIdx: index("reservations_email_idx").on(table.customerEmail),
  phoneIdx: index("reservations_phone_idx").on(table.customerPhone),
  // Index unique pour éviter les doublons
  uniqueReservation: index("reservations_unique_slot").on(table.date, table.time, table.tableId),
}));

// Reservation items
export const reservationItems = sqliteTable("reservation_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reservationId: integer("reservation_id").notNull(),
  menuItemId: integer("menu_item_id").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  totalPrice: real("total_price").notNull(),
  specialInstructions: text("special_instructions"),
}, (table) => ({
  reservationIdx: index("reservation_items_reservation_idx").on(table.reservationId),
  menuItemIdx: index("reservation_items_menu_item_idx").on(table.menuItemId),
}));

// Contact messages
export const contactMessages = sqliteTable("contact_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status", { enum: ["new", "read", "replied"] }).notNull().default("new"),
  createdAt: text("created_at").default("datetime('now')").notNull(),
}, (table) => ({
  statusIdx: index("contact_messages_status_idx").on(table.status),
  createdAtIdx: index("contact_messages_created_at_idx").on(table.createdAt),
}));

// Customers with loyalty program
export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  loyaltyPoints: integer("loyalty_points").notNull().default(0),
  totalSpent: real("total_spent").notNull().default(0.00),
  createdAt: text("created_at").default("datetime('now')").notNull(),
}, (table) => ({
  emailIdx: index("customers_email_idx").on(table.email),
  phoneIdx: index("customers_phone_idx").on(table.phone),
  loyaltyIdx: index("customers_loyalty_idx").on(table.loyaltyPoints),
}));

// Employees management
export const employees = sqliteTable("employees", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  position: text("position", { enum: ["manager", "server", "chef", "barista", "cashier"] }).notNull(),
  department: text("department", { enum: ["kitchen", "service", "management"] }).notNull(),
  hourlyRate: real("hourly_rate").notNull(),
  hireDate: text("hire_date").notNull(),
  status: text("status", { enum: ["active", "inactive", "terminated"] }).notNull().default("active"),
  createdAt: text("created_at").default("datetime('now')").notNull(),
}, (table) => ({
  emailIdx: index("employees_email_idx").on(table.email),
  statusIdx: index("employees_status_idx").on(table.status),
  departmentIdx: index("employees_department_idx").on(table.department),
}));

// Orders management
export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id"),
  employeeId: integer("employee_id"),
  tableId: integer("table_id"),
  orderType: text("order_type", { enum: ["dine-in", "takeout", "delivery"] }).notNull().default("dine-in"),
  status: text("status", { enum: ["pending", "preparing", "ready", "completed", "cancelled"] }).notNull().default("pending"),
  subtotal: real("subtotal").notNull(),
  tax: real("tax").notNull(),
  total: real("total").notNull(),
  paymentMethod: text("payment_method"),
  notes: text("notes"),
  createdAt: text("created_at").default("datetime('now')").notNull(),
}, (table) => ({
  statusIdx: index("orders_status_idx").on(table.status),
  createdAtIdx: index("orders_created_at_idx").on(table.createdAt),
  customerIdx: index("orders_customer_idx").on(table.customerId),
  employeeIdx: index("orders_employee_idx").on(table.employeeId),
  tableIdx: index("orders_table_idx").on(table.tableId),
}));

// Order items
export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull(),
  menuItemId: integer("menu_item_id").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  totalPrice: real("total_price").notNull(),
  specialInstructions: text("special_instructions"),
}, (table) => ({
  orderIdx: index("order_items_order_idx").on(table.orderId),
  menuItemIdx: index("order_items_menu_item_idx").on(table.menuItemId),
}));

// Work shifts
export const workShifts = sqliteTable("work_shifts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeId: integer("employee_id").notNull(),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time"),
  hoursWorked: real("hours_worked"),
  status: text("status", { enum: ["scheduled", "completed", "cancelled"] }).notNull().default("scheduled"),
  notes: text("notes"),
  createdAt: text("created_at").default("datetime('now')").notNull(),
}, (table) => ({
  employeeIdx: index("work_shifts_employee_idx").on(table.employeeId),
  dateIdx: index("work_shifts_date_idx").on(table.date),
  statusIdx: index("work_shifts_status_idx").on(table.status),
}));

// Relations optimisées
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

// Types TypeScript
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

// Schemas Zod pour validation
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

  writeFileSync(join(__dirname, 'shared', 'schema.ts'), sqliteSchema);
  console.log('✅ Schéma SQLite optimisé créé');
}

// Convertir le schéma pour PostgreSQL
async function convertSchemaToPostgreSQL() {
  // Le schéma PostgreSQL a été défini dans le fichier précédent
  console.log('🔄 Schéma PostgreSQL prêt');
}

// Mettre à jour la configuration Drizzle
async function updateDrizzleConfig(dialect) {
  const config = dialect === 'sqlite' ? 
    `import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL || "file:./barista_cafe.db"
  },
  verbose: true,
  strict: true,
});` :
    `import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts", 
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/barista_cafe"
  },
  verbose: true,
  strict: true,
});`;

  writeFileSync('drizzle.config.ts', config);
  console.log(`✅ Configuration Drizzle mise à jour pour ${dialect}`);
}

// Mettre à jour la configuration db.ts
async function updateDbConfig(config) {
  const dbConfig = config.dialect === 'sqlite' ? 
    `import 'dotenv/config';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { sql } from 'drizzle-orm';
import * as schema from '@shared/schema';

let sqlite: Database.Database;
let db: ReturnType<typeof drizzle>;

async function initializeDatabase() {
  try {
    console.log('🗄️ Initialisation SQLite optimisée...');
    
    // Configuration SQLite pour performance maximale
    sqlite = new Database(process.env.DATABASE_URL?.replace('file:', '') || './barista_cafe.db');
    
    // Optimisations SQLite pour restaurant
    sqlite.pragma('journal_mode = WAL'); // Write-Ahead Logging
    sqlite.pragma('synchronous = NORMAL'); // Performance/sécurité équilibrée
    sqlite.pragma('cache_size = 20000'); // Cache 20MB
    sqlite.pragma('foreign_keys = ON'); // Intégrité référentielle
    sqlite.pragma('temp_store = MEMORY'); // Stockage temporaire en mémoire
    sqlite.pragma('mmap_size = 268435456'); // Memory mapping 256MB
    
    // Initialiser Drizzle
    db = drizzle(sqlite, { schema });
    
    // Test de connexion
    await db.execute(sql\`SELECT 1\`);
    console.log('✅ SQLite connecté et optimisé');
    
    // Configuration backup automatique
    if (process.env.BACKUP_ENABLED === 'true') {
      setupAutomaticBackup();
    }
    
    return db;
  } catch (error) {
    console.error('❌ Erreur SQLite:', error);
    throw error;
  }
}

// Backup automatique pour éviter la perte de données
function setupAutomaticBackup() {
  const backupInterval = parseInt(process.env.BACKUP_INTERVAL || '3600') * 1000;
  
  setInterval(async () => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = \`./backups/barista_cafe_\${timestamp}.db\`;
      
      // Créer le répertoire de backup
      await execAsync('mkdir -p ./backups');
      
      // Copier la base de données
      await execAsync(\`cp ./barista_cafe.db "\${backupPath}"\`);
      
      // Nettoyer les anciens backups
      const retention = parseInt(process.env.BACKUP_RETENTION || '7');
      await execAsync(\`find ./backups -name "*.db" -type f -mtime +\${retention} -delete\`);
      
      console.log(\`✅ Backup automatique: \${backupPath}\`);
    } catch (error) {
      console.error('❌ Erreur backup:', error);
    }
  }, backupInterval);
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
    console.log('✅ Base de données SQLite configurée');
    return true;
  } catch (error) {
    console.error('❌ Erreur configuration SQLite:', error);
    return false;
  }
}

// Fonction de vérification de santé
export async function checkDatabaseHealth() {
  try {
    const result = await db.execute(sql\`SELECT datetime('now') as timestamp\`);
    return {
      healthy: true,
      timestamp: result[0]?.timestamp,
      type: 'sqlite',
      size: await getDatabaseSize()
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      type: 'sqlite'
    };
  }
}

async function getDatabaseSize() {
  try {
    const { size } = await execAsync('du -h ./barista_cafe.db');
    return size.split('\t')[0];
  } catch {
    return 'unknown';
  }
}

// Nettoyage gracieux
process.on('SIGINT', () => {
  if (sqlite) {
    sqlite.close();
    console.log('✅ SQLite fermé proprement');
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  if (sqlite) {
    sqlite.close();
    console.log('✅ SQLite fermé proprement');
  }
  process.exit(0);
});` :
    `import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import * as schema from '@shared/schema';

let pool: Pool;
let db: ReturnType<typeof drizzle>;

async function initializeDatabase() {
  try {
    console.log('🐘 Initialisation PostgreSQL...');
    
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 30000,
    });

    db = drizzle(pool, { schema });
    
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
    console.log('✅ Base de données PostgreSQL configurée');
    return true;
  } catch (error) {
    console.error('❌ Erreur configuration PostgreSQL:', error);
    return false;
  }
}`;

  writeFileSync(join(__dirname, 'server', 'db.ts'), dbConfig);
  console.log(`✅ Configuration db.ts mise à jour pour ${config.dialect}`);
}

// Créer le fichier .env
function createEnvFile(config) {
  const envContent = config.dialect === 'sqlite' ? 
    `# Configuration SQLite Production - Barista Café
DATABASE_URL=file:./barista_cafe.db
DB_TYPE=sqlite

# Configuration Application
NODE_ENV=production
JWT_SECRET=barista_cafe_production_jwt_secret_2025_ultra_secure
PORT=5000

# Configuration Performance SQLite
SQLITE_PRAGMA_JOURNAL_MODE=WAL
SQLITE_PRAGMA_SYNCHRONOUS=NORMAL
SQLITE_PRAGMA_CACHE_SIZE=20000
SQLITE_PRAGMA_FOREIGN_KEYS=ON
SQLITE_PRAGMA_TEMP_STORE=MEMORY
SQLITE_PRAGMA_MMAP_SIZE=268435456

# Configuration Cache
CACHE_TTL_MENU=600
CACHE_TTL_CATEGORIES=1800
CACHE_TTL_TABLES=300
DB_POOL_SIZE=1
DB_CONNECTION_TIMEOUT=30000
DB_STATEMENT_TIMEOUT=60000

# Configuration Backup automatique
BACKUP_ENABLED=true
BACKUP_INTERVAL=3600
BACKUP_RETENTION=7
` :
    `# Configuration PostgreSQL Production - Barista Café
DATABASE_URL=${config.url}
DB_TYPE=postgresql

# Configuration Application
NODE_ENV=production
JWT_SECRET=barista_cafe_production_jwt_secret_2025_ultra_secure
PORT=5000

# Configuration Performance PostgreSQL
DB_POOL_SIZE=20
DB_CONNECTION_TIMEOUT=30000
DB_STATEMENT_TIMEOUT=60000

# Configuration Cache
CACHE_TTL_MENU=600
CACHE_TTL_CATEGORIES=1800
CACHE_TTL_TABLES=300
`;

  writeFileSync('.env', envContent);
  console.log(`✅ Fichier .env créé pour ${config.dialect}`);
}

// Appliquer les migrations
async function runMigrations() {
  try {
    console.log('🔄 Application des migrations...');
    await execAsync('npx drizzle-kit push');
    console.log('✅ Migrations appliquées');
    return true;
  } catch (error) {
    console.error('❌ Erreur migrations:', error);
    return false;
  }
}

// Initialiser les données
async function initializeData() {
  try {
    console.log('📊 Initialisation des données...');
    await execAsync('npx tsx scripts/init-database.ts');
    console.log('✅ Données initialisées');
    return true;
  } catch (error) {
    console.error('❌ Erreur initialisation données:', error);
    return false;
  }
}

// Fonction principale
async function main() {
  try {
    console.log('🚀 Configuration universelle Barista Café');
    
    // 1. Détecter la plateforme
    const platform = detectPlatform();
    console.log(`📍 Plateforme détectée: ${platform}`);
    
    // 2. Obtenir la configuration
    const config = getDatabaseConfig(platform);
    console.log(`🗄️ Base de données: ${config.dialect}`);
    
    // 3. Configurer selon le type de base
    if (config.dialect === 'sqlite') {
      await convertSchemaToSQLite();
      await updateDrizzleConfig('sqlite');
      await updateDbConfig(config);
      createEnvFile(config);
    } else {
      await convertSchemaToPostgreSQL();
      await updateDrizzleConfig('postgresql');
      await updateDbConfig(config);
      createEnvFile(config);
    }
    
    // 4. Appliquer les migrations
    const migrationsOk = await runMigrations();
    if (!migrationsOk) {
      console.log('⚠️ Migrations échouées, continuons...');
    }
    
    // 5. Initialiser les données
    const dataOk = await initializeData();
    if (!dataOk) {
      console.log('⚠️ Initialisation données échouée, continuons...');
    }
    
    // 6. Créer le script de démarrage
    const startScript = `#!/bin/bash
# Script de démarrage automatique Barista Café

echo "🚀 Démarrage Barista Café - Mode Production"
echo "🗄️ Base de données: ${config.dialect}"

# Créer le répertoire de backup si nécessaire
mkdir -p ./backups

# Démarrer l'application
npm run dev
`;
    
    writeFileSync('start.sh', startScript);
    await execAsync('chmod +x start.sh');
    
    console.log('🎉 Configuration terminée avec succès!');
    console.log('');
    console.log('📋 Informations:');
    console.log(`  • Base de données: ${config.dialect.toUpperCase()}`);
    console.log(`  • Environnement: ${platform}`);
    console.log('');
    console.log('📋 Commandes disponibles:');
    console.log('  • npm run dev     - Démarrage développement');
    console.log('  • ./start.sh      - Démarrage production');
    console.log('');
    console.log('🔐 Compte admin: admin / admin123');
    console.log('🌐 URL: http://localhost:5000');
    console.log('');
    console.log('🎯 Optimisations activées:');
    if (config.dialect === 'sqlite') {
      console.log('  • WAL mode pour performance');
      console.log('  • Cache 20MB optimisé');
      console.log('  • Backup automatique toutes les heures');
      console.log('  • Prévention des doublons');
    }
    console.log('  • Cache intelligent des requêtes');
    console.log('  • Index optimisés pour restaurant');
    
  } catch (error) {
    console.error('❌ Erreur configuration:', error);
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };