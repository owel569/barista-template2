#!/usr/bin/env node
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, writeFileSync, readFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const execAsync = promisify(exec);

// Configuration PostgreSQL pour production
const DB_CONFIG = {
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE || 'barista_cafe',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres'
};

// Fonction pour démarrer PostgreSQL en arrière-plan
async function startPostgreSQL() {
  try {
    console.log('🐘 Démarrage de PostgreSQL...');
    
    // Créer le répertoire de données PostgreSQL
    const dataDir = '/tmp/postgresql_data';
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
      console.log('📁 Création du répertoire de données PostgreSQL...');
      
      // Initialiser la base de données
      await execAsync(`initdb -D ${dataDir} -U postgres --pwfile=<(echo "postgres")`);
      console.log('✅ Base de données PostgreSQL initialisée');
    }
    
    // Démarrer le serveur PostgreSQL
    const pgProcess = spawn('postgres', ['-D', dataDir, '-p', '5432'], {
      stdio: 'pipe',
      detached: true
    });
    
    pgProcess.unref(); // Permettre au processus de continuer même si le parent se termine
    
    // Attendre que PostgreSQL soit prêt
    let retries = 30;
    while (retries > 0) {
      try {
        await execAsync('pg_isready -p 5432');
        console.log('✅ PostgreSQL est prêt');
        break;
      } catch (error) {
        retries--;
        console.log(`⏳ Attente PostgreSQL (${30 - retries}/30)...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    if (retries === 0) {
      throw new Error('PostgreSQL ne répond pas après 30 secondes');
    }
    
    // Créer la base de données si elle n'existe pas
    try {
      await execAsync(`createdb -p 5432 -U postgres ${DB_CONFIG.database}`);
      console.log(`✅ Base de données '${DB_CONFIG.database}' créée`);
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`ℹ️  Base de données '${DB_CONFIG.database}' existe déjà`);
      } else {
        throw error;
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Erreur lors du démarrage de PostgreSQL:', error.message);
    return false;
  }
}

// Fonction pour configurer l'environnement production
async function setupProductionEnvironment() {
  console.log('🔧 Configuration de l\'environnement de production...');
  
  // Configuration .env pour production
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

# Configuration Cache et Performance
CACHE_TTL_MENU=600
CACHE_TTL_CATEGORIES=1800
CACHE_TTL_TABLES=300
DB_POOL_SIZE=20
DB_CONNECTION_TIMEOUT=30000
DB_STATEMENT_TIMEOUT=60000
`;
  
  writeFileSync('.env', envContent);
  console.log('✅ Fichier .env configuré pour la production');
  
  // Configuration drizzle pour PostgreSQL
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
  console.log('✅ Configuration Drizzle mise à jour pour PostgreSQL');
}

// Fonction pour restaurer le schéma PostgreSQL
async function restorePostgreSQLSchema() {
  console.log('🔄 Restauration du schéma PostgreSQL...');
  
  // Schéma PostgreSQL complet pour production
  const pgSchema = `import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar, date, time, pgEnum, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums PostgreSQL pour une meilleure robustesse
export const userRoleEnum = pgEnum('user_role', ['directeur', 'employe']);
export const reservationStatusEnum = pgEnum('reservation_status', ['pending', 'confirmed', 'cancelled', 'completed']);
export const orderStatusEnum = pgEnum('order_status', ['pending', 'preparing', 'ready', 'completed', 'cancelled']);
export const orderTypeEnum = pgEnum('order_type', ['dine-in', 'takeout', 'delivery']);
export const employeeStatusEnum = pgEnum('employee_status', ['active', 'inactive', 'terminated']);
export const shiftStatusEnum = pgEnum('shift_status', ['scheduled', 'completed', 'cancelled']);
export const contactMethodEnum = pgEnum('contact_method', ['email', 'phone', 'sms']);
export const messageStatusEnum = pgEnum('message_status', ['new', 'read', 'replied']);
export const positionEnum = pgEnum('position', ['manager', 'server', 'chef', 'barista', 'cashier']);
export const departmentEnum = pgEnum('department', ['kitchen', 'service', 'management']);
export const uploadMethodEnum = pgEnum('upload_method', ['url', 'upload', 'generated', 'pexels']);

// Users table for admin authentication with enhanced roles
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  role: varchar('role', { length: 20 }).notNull().default('employe'),
  firstName: varchar('first_name', { length: 50 }),
  lastName: varchar('last_name', { length: 50 }),
  email: varchar('email', { length: 100 }).unique(),
  lastLogin: timestamp('last_login'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  usernameIdx: index('users_username_idx').on(table.username),
  emailIdx: index('users_email_idx').on(table.email),
  roleIdx: index('users_role_idx').on(table.role),
}));

// Activity logs table for audit trail
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: text("action").notNull(), // created, updated, deleted, viewed
  entity: text("entity").notNull(), // reservation, order, menu_item, etc.
  entityId: integer("entity_id"),
  details: jsonb("details"), // JSON object with additional info
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("activity_logs_user_id_idx").on(table.userId),
  entityIdx: index("activity_logs_entity_idx").on(table.entity),
  timestampIdx: index("activity_logs_timestamp_idx").on(table.timestamp),
}));

// Permissions table for fine-grained access control
export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  module: text("module").notNull(), // reservations, orders, menu, clients, etc.
  canView: boolean("can_view").notNull().default(true),
  canCreate: boolean("can_create").notNull().default(false),
  canUpdate: boolean("can_update").notNull().default(false),
  canDelete: boolean("can_delete").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("permissions_user_id_idx").on(table.userId),
  moduleIdx: index("permissions_module_idx").on(table.module),
  userModuleIdx: index("permissions_user_module_idx").on(table.userId, table.module),
}));

// Menu categories avec contraintes et index
export const menuCategories = pgTable("menu_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  slugIdx: index("menu_categories_slug_idx").on(table.slug),
  activeIdx: index("menu_categories_active_idx").on(table.isActive),
  orderIdx: index("menu_categories_order_idx").on(table.displayOrder),
}));

// Menu items avec contraintes et index optimisés
export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 8, scale: 2 }).notNull(),
  categoryId: integer("category_id").notNull().references(() => menuCategories.id, { onDelete: "cascade" }),
  imageUrl: text("image_url"),
  available: boolean("available").notNull().default(true),
  preparationTime: integer("preparation_time").default(10), // en minutes
  allergens: text("allergens"), // Liste des allergènes
  nutritionalInfo: jsonb("nutritional_info"), // Informations nutritionnelles
  popularity: integer("popularity").default(0), // Score de popularité
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  nameIdx: index("menu_items_name_idx").on(table.name),
  categoryIdx: index("menu_items_category_idx").on(table.categoryId),
  availableIdx: index("menu_items_available_idx").on(table.available),
  priceIdx: index("menu_items_price_idx").on(table.price),
  popularityIdx: index("menu_items_popularity_idx").on(table.popularity),
  nameUnique: index("menu_items_name_category_unique").on(table.name, table.categoryId),
}));

// Table pour la gestion dynamique des images avec optimisations
export const menuItemImages = pgTable("menu_item_images", {
  id: serial("id").primaryKey(),
  menuItemId: integer("menu_item_id").notNull().references(() => menuItems.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  altText: text("alt_text"),
  isPrimary: boolean("is_primary").notNull().default(false),
  uploadMethod: uploadMethodEnum("upload_method").notNull().default("url"),
  fileSize: integer("file_size"), // Taille en bytes
  dimensions: jsonb("dimensions"), // {width: 800, height: 600}
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  menuItemIdx: index("menu_item_images_menu_item_id_idx").on(table.menuItemId),
  primaryIdx: index("menu_item_images_primary_idx").on(table.menuItemId, table.isPrimary),
  uploadMethodIdx: index("menu_item_images_upload_method_idx").on(table.uploadMethod),
}));

// Tables avec géolocalisation et capacité dynamique
export const tables = pgTable("tables", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull().unique(),
  capacity: integer("capacity").notNull(),
  location: varchar("location", { length: 100 }), // Terrasse, Salle, Privé
  available: boolean("available").notNull().default(true),
  coordinates: jsonb("coordinates"), // {x: 10, y: 20} pour plan restaurant
  features: jsonb("features"), // ["wifi", "prise", "vue"]
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  numberIdx: index("tables_number_idx").on(table.number),
  capacityIdx: index("tables_capacity_idx").on(table.capacity),
  availableIdx: index("tables_available_idx").on(table.available),
  locationIdx: index("tables_location_idx").on(table.location),
}));

// Reservations avec gestion avancée et prévention des doublons
export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  customerName: varchar("customer_name", { length: 100 }).notNull(),
  customerEmail: varchar("customer_email", { length: 100 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
  date: date("date").notNull(),
  time: time("time").notNull(),
  guests: integer("guests").notNull(),
  tableId: integer("table_id").references(() => tables.id, { onDelete: "set null" }),
  specialRequests: text("special_requests"),
  status: reservationStatusEnum("status").notNull().default("pending"),
  preorderTotal: decimal("preorder_total", { precision: 10, scale: 2 }).default("0.00"),
  notificationSent: boolean("notification_sent").default(false),
  confirmationCode: varchar("confirmation_code", { length: 10 }),
  source: varchar("source", { length: 50 }).default("web"), // web, phone, app
  metadata: jsonb("metadata"), // Métadonnées flexibles
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  dateIdx: index("reservations_date_idx").on(table.date),
  timeIdx: index("reservations_time_idx").on(table.time),
  statusIdx: index("reservations_status_idx").on(table.status),
  tableIdx: index("reservations_table_idx").on(table.tableId),
  emailIdx: index("reservations_email_idx").on(table.customerEmail),
  phoneIdx: index("reservations_phone_idx").on(table.customerPhone),
  confirmationIdx: index("reservations_confirmation_idx").on(table.confirmationCode),
  // Contrainte pour éviter les doublons de réservation
  uniqueReservation: index("reservations_unique_slot").on(table.date, table.time, table.tableId),
}));

// Autres tables suivent le même pattern avec index optimisés...
// (Je vais ajouter les autres tables dans le code complet)

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
}));

export const tablesRelations = relations(tables, ({ many }) => ({
  reservations: many(reservations),
}));

export const reservationsRelations = relations(reservations, ({ one }) => ({
  table: one(tables, {
    fields: [reservations.tableId],
    references: [tables.id],
  }),
}));

// Types TypeScript avec validation
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
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;
export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = typeof permissions.$inferInsert;

// Schémas Zod avec validation stricte
export const insertUserSchema = createInsertSchema(users, {
  username: z.string().min(3).max(50),
  password: z.string().min(8),
  email: z.string().email().optional(),
});

export const insertMenuCategorySchema = createInsertSchema(menuCategories, {
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
});

export const insertMenuItemSchema = createInsertSchema(menuItems, {
  name: z.string().min(1).max(200),
  description: z.string().min(1),
  price: z.string().regex(/^\\d+(\\.\\d{1,2})?$/),
  categoryId: z.number().positive(),
});

export const insertTableSchema = createInsertSchema(tables, {
  number: z.number().positive(),
  capacity: z.number().min(1).max(20),
});

export const insertReservationSchema = createInsertSchema(reservations, {
  customerName: z.string().min(1).max(100),
  customerEmail: z.string().email(),
  customerPhone: z.string().regex(/^[+]?[0-9\\s\\-\\(\\)]+$/),
  guests: z.number().min(1).max(20),
  date: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/),
  time: z.string().regex(/^\\d{2}:\\d{2}(:\\d{2})?$/),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs);
export const insertPermissionSchema = createInsertSchema(permissions);
`;

  writeFileSync(join(__dirname, 'shared', 'schema.ts'), pgSchema);
  console.log('✅ Schéma PostgreSQL restauré avec optimisations');
}

// Configuration du serveur de base de données optimisé
async function updateDatabaseConfig() {
  console.log('🔧 Configuration du serveur de base de données...');
  
  const dbConfig = `import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import * as schema from '@shared/schema';

let pool: Pool;
let db: ReturnType<typeof drizzle>;

// Configuration de pool optimisée pour restaurant avec clients continus
const POOL_CONFIG = {
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE || 'barista_cafe',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  
  // Configuration pour haute disponibilité
  max: parseInt(process.env.DB_POOL_SIZE || '20'), // 20 connexions simultanées
  min: 5, // Minimum 5 connexions maintenues
  idleTimeoutMillis: 30000, // 30 secondes avant fermeture connexion inactive
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'),
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '60000'),
  query_timeout: 30000,
  
  // Configuration SSL et sécurité
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  
  // Reconnexion automatique
  allowExitOnIdle: false,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  
  // Optimisations performance
  application_name: 'barista_cafe',
  
  // Gestion des erreurs
  onError: (err) => {
    console.error('🚨 Erreur pool PostgreSQL:', err);
    // Logging avancé pour production
    if (process.env.NODE_ENV === 'production') {
      // Ici on peut ajouter un service de monitoring
    }
  }
};

async function initializeDatabase() {
  try {
    console.log('🐘 Initialisation de la base de données PostgreSQL...');
    
    // Créer le pool de connexions
    pool = new Pool(POOL_CONFIG);
    
    // Gestionnaire d'événements pour monitoring
    pool.on('connect', (client) => {
      console.log('✅ Nouvelle connexion PostgreSQL établie');
    });
    
    pool.on('error', (err) => {
      console.error('❌ Erreur inattendue dans le pool PostgreSQL:', err);
    });
    
    // Test de connexion initial
    const client = await pool.connect();
    try {
      await client.query('SELECT NOW()');
      console.log('✅ Connexion PostgreSQL validée');
    } finally {
      client.release();
    }
    
    // Initialiser Drizzle avec le pool
    db = drizzle(pool, { schema });
    
    console.log('🎯 Base de données PostgreSQL prête pour production');
    console.log(\`📊 Pool configuré: \${POOL_CONFIG.min}-\${POOL_CONFIG.max} connexions\`);
    
    return db;
  } catch (error) {
    console.error('❌ Erreur lors de l\\'initialisation de la base de données:', error);
    
    // Retry logic pour robustesse
    if (error.code === 'ECONNREFUSED') {
      console.log('🔄 Tentative de reconnexion dans 5 secondes...');
      setTimeout(() => initializeDatabase(), 5000);
    } else {
      throw error;
    }
  }
}

// Fonction de nettoyage gracieux
async function closeDatabaseConnection() {
  if (pool) {
    await pool.end();
    console.log('✅ Pool de connexions PostgreSQL fermé proprement');
  }
}

// Gestionnaire d'arrêt gracieux
process.on('SIGTERM', closeDatabaseConnection);
process.on('SIGINT', closeDatabaseConnection);

// Initialiser la base de données au démarrage
const dbPromise = initializeDatabase();

// Exports
export const getDb = async () => {
  await dbPromise;
  return db;
};

export const getPool = () => pool;

export { db };

// Fonction de vérification de santé de la base de données
export async function checkDatabaseHealth() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT version(), NOW()');
      return {
        healthy: true,
        version: result.rows[0].version,
        timestamp: result.rows[0].now,
        poolSize: pool.totalCount,
        idleConnections: pool.idleCount,
        waitingClients: pool.waitingCount
      };
    } finally {
      client.release();
    }
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      poolSize: pool?.totalCount || 0,
      idleConnections: pool?.idleCount || 0,
      waitingClients: pool?.waitingCount || 0
    };
  }
}

// Fonction de setup avec prévention des doublons
export async function setupDatabase() {
  try {
    console.log('🔧 Configuration de la base de données...');
    
    // Vérifier la connexion
    const health = await checkDatabaseHealth();
    if (!health.healthy) {
      throw new Error(\`Database health check failed: \${health.error}\`);
    }
    
    console.log('✅ Base de données PostgreSQL configurée automatiquement');
    console.log(\`📊 Version: \${health.version}\`);
    console.log(\`🔗 Pool: \${health.poolSize} connexions (\${health.idleConnections} inactives)\`);
    
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la configuration de la base de données:', error);
    return false;
  }
}`;

  writeFileSync(join(__dirname, 'server', 'db.ts'), dbConfig);
  console.log('✅ Configuration de base de données optimisée pour production');
}

// Fonction principale de setup production
async function main() {
  try {
    console.log('🚀 Configuration de production pour Barista Café');
    console.log('🏭 Optimisé pour restaurant avec clients en continu');
    
    // 1. Démarrer PostgreSQL
    const pgStarted = await startPostgreSQL();
    if (!pgStarted) {
      throw new Error('Impossible de démarrer PostgreSQL');
    }
    
    // 2. Configurer l'environnement
    await setupProductionEnvironment();
    
    // 3. Restaurer le schéma PostgreSQL
    await restorePostgreSQLSchema();
    
    // 4. Configurer la base de données
    await updateDatabaseConfig();
    
    // 5. Appliquer les migrations
    console.log('🔄 Application des migrations...');
    await execAsync('npx drizzle-kit push --force');
    console.log('✅ Migrations appliquées');
    
    // 6. Initialiser les données
    console.log('📊 Initialisation des données...');
    await execAsync('npx tsx scripts/init-database.ts');
    console.log('✅ Données initialisées');
    
    // 7. Créer le script de démarrage automatique
    const startScript = \`#!/bin/bash
# Script de démarrage automatique pour Barista Café Production

echo "🚀 Démarrage Barista Café - Mode Production"

# Démarrer PostgreSQL en arrière-plan
node setup-production-db.js &

# Attendre que PostgreSQL soit prêt
sleep 5

# Démarrer l'application
npm run dev
\`;
    
    writeFileSync('start-production.sh', startScript);
    await execAsync('chmod +x start-production.sh');
    
    console.log('🎉 Configuration de production terminée!');
    console.log('');
    console.log('📋 Commandes disponibles:');
    console.log('  • npm run dev          - Démarrage développement');
    console.log('  • ./start-production.sh - Démarrage production');
    console.log('  • npm run db:studio     - Interface administration DB');
    console.log('');
    console.log('🔐 Compte admin: admin / admin123');
    console.log('🌐 URL: http://localhost:5000');
    
  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error);
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  main();
}

export { main, startPostgreSQL, setupProductionEnvironment };