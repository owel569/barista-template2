import { pgTable, serial, varchar, text, decimal, integer, boolean, timestamp, index, real } from 'drizzle-orm/pg-core';'
import { relations } from ''drizzle-orm';'
import { createInsertSchema } from ''drizzle-zod';'
import { Request, Response, NextFunction } from ''express';'
import { LRUCache } from ''lru-cache';'
import { eq } from ''drizzle-orm';'
import { db } from ''../server/db';


// ==========================================
// TABLES PRINCIPALES
// ==========================================

// Utilisateurs du système'
export const users = pgTable(''users', {'
  id: serial(''id').primaryKey(),'
  username: text(''username').unique().notNull(),'
  password: text(''password').notNull(),'
  role: text(''role').notNull().default(''employe'),'
  firstName: text(''first_name'),'
  lastName: text(''last_name'),'
  email: text(''email').unique(),'
  createdAt: timestamp(''created_at').defaultNow().notNull(),'
  token: text(''token'),
}, (table) => ({'
  usernameIdx: index(''users_username_idx').on(table.username),'
  emailIdx: index(''users_email_idx').on(table.email),
}));

// Catégories du menu
export const menuCategories = pgTable("menu_categories", {"
  id: serial(""id").primaryKey(),"
  name: text(""name").notNull(),"
  description: text(""description"),"
  slug: text(""slug").notNull().unique(),"
  displayOrder: integer(""display_order").notNull().default(0),"
  createdAt: timestamp(""created_at").defaultNow().notNull(),
}, (table) => ({"
  slugIdx: index(""menu_categories_slug_idx").on(table.slug),
}));

// Articles du menu"
export const menuItems = pgTable(""menu_items", {"
  id: serial(""id").primaryKey(),"
  name: text(""name").notNull(),"
  description: text(""description"),'
  descriptionEn: text(''description_en'),'
  descriptionFr: text(''description_fr'),"
  price: decimal(""price", { precision: 6, scale: 2 }).notNull(),"
  cost: decimal(""cost", { precision: 6, scale: 2 }),"
  categoryId: integer(""category_id").notNull().references(() => menuCategories.id),"
  imageUrl: text(""image_url"),"
  isAvailable: boolean(""is_available").notNull().default(true),'
  dietaryTags: text(''dietary_tags').array(), // [''vegetarian', ''gluten-free']'
  preparationTime: integer(''prep_time_minutes'),"
  isActive: boolean(""is_active").notNull().default(true),"
  isDeleted: boolean(""is_deleted").default(false),'
  deletedAt: timestamp(''deleted_at'),"
  createdAt: timestamp(""created_at").defaultNow().notNull(),"
  updatedAt: timestamp(""updated_at").defaultNow().notNull(),"
  createdBy: integer(""created_by").references(() => users.id),
}, (table) => ({"
  categoryIdx: index(""menu_items_category_idx").on(table.categoryId),"
  activeIdx: index(""menu_items_active_idx").on(table.isActive),
}));
'
export const onlineOrders = pgTable(''online_orders', {'
  id: serial(''id').primaryKey(),'
  orderNumber: varchar(''order_number', { length: 20 }).notNull(),'
  platform: varchar(''platform', { length: 50 }).notNull(),'
  customerName: varchar(''customer_name', { length: 100 }).notNull(),'
  customerPhone: varchar(''customer_phone', { length: 20 }).notNull(),'
  customerEmail: varchar(''customer_email', { length: 100 }).notNull(),'
  status: varchar(''status', { length: 20 }).notNull(),'
  orderType: varchar(''order_type', { length: 10 }).notNull(),'
  deliveryAddress: text(''delivery_address'),'
  subtotal: decimal(''subtotal', { precision: 10, scale: 2 }).notNull(),'
  deliveryFee: decimal(''delivery_fee', { precision: 10, scale: 2 }).notNull(),'
  total: decimal(''total', { precision: 10, scale: 2 }).notNull(),'
  paymentMethod: varchar(''payment_method', { length: 20 }).notNull(),'
  paymentStatus: varchar(''payment_status', { length: 20 }).notNull(),'
  estimatedTime: varchar(''estimated_time', { length: 20 }),'
  notes: text(''notes'),'
  createdAt: timestamp(''created_at').defaultNow(),'
  updatedAt: timestamp(''updated_at').defaultNow()
});

// Pour les commandes en ligne'
export const onlineOrderItems = pgTable(''online_order_items', {'
  id: serial(''id').primaryKey(),'
  orderId: integer(''order_id').references(() => onlineOrders.id),'
  name: varchar(''name', { length: 100 }).notNull(),'
  quantity: integer(''quantity').notNull(),'
  price: decimal(''price', { precision: 10, scale: 2 }).notNull(),'
  options: text(''options').array(),'
  specialInstructions: text(''special_instructions')
});

// Pour les commandes classiques"
export const orderItems = pgTable(""order_items", {"
  id: serial(""id").primaryKey(),'"
  orderId: integer(""order_id").notNull().references(() => orders.id, { onDelete: ''cascade' }),"
  menuItemId: integer(""menu_item_id").notNull().references(() => menuItems.id),"
  quantity: integer(""quantity").notNull(),"
  unitPrice: real(""unit_price").notNull(),"
  totalPrice: real(""total_price").notNull(),
}, (table) => ({"
  orderIdx: index(""order_items_order_idx").on(table.orderId),
}));
'
export const platforms = pgTable(''platforms', {'
  id: serial(''id').primaryKey(),'
  name: varchar(''name', { length: 50 }).notNull(),'
  isActive: boolean(''is_active').default(true),'
  commissionRate: decimal(''commission_rate', { precision: 3, scale: 2 }).notNull()
});

// Tables physiques du restaurant"
export const tables = pgTable(""tables", {"
  id: serial(""id").primaryKey(),"
  number: integer(""number").notNull().unique(),"
  capacity: integer(""capacity").notNull(),"
  available: boolean(""available").notNull().default(true),"
  createdAt: timestamp(""created_at").defaultNow().notNull(),
}, (table) => ({"
  numberIdx: index(""tables_number_idx").on(table.number),
}));

// Clients"
export const customers = pgTable(""customers", {"
  id: serial(""id").primaryKey(),"
  firstName: text(""first_name").notNull(),"
  lastName: text(""last_name").notNull(),"
  email: text(""email").unique().notNull(),"
  phone: text(""phone"),"
  loyaltyPoints: integer(""loyalty_points").notNull().default(0),"
  createdAt: timestamp(""created_at").defaultNow().notNull(),
}, (table) => ({"
  emailIdx: index(""customers_email_idx").on(table.email),
}));

// Réservations"
export const reservations = pgTable(""reservations", {"
  id: serial(""id").primaryKey(),"
  customerId: integer(""customer_id").references(() => customers.id),"
  tableId: integer(""table_id").references(() => tables.id),"
  date: text(""date").notNull(),"
  time: text(""time").notNull(),"
  partySize: integer(""party_size").notNull(),"
  status: text(""status").notNull().default(""pending"),"
  notes: text(""notes"),"
  createdAt: timestamp(""created_at").defaultNow().notNull(),
}, (table) => ({"
  dateIdx: index(""reservations_date_idx").on(table.date),"
  statusIdx: index(""reservations_status_idx").on(table.status),
}));
'
export const orderStatuses = [''pending', ''preparing', ''ready', ''delivered'] as const;
"
export const orders = pgTable(""orders", {"
  id: serial(""id").primaryKey(),"
  customerId: integer(""customer_id").references(() => customers.id),"
  totalAmount: real(""total_amount").notNull(),'"
  status: text(""status").notNull().default(''pending').$type<typeof orderStatuses[number]>(),"
  createdAt: timestamp(""created_at").defaultNow().notNull(),"
  updatedAt: timestamp(""updated_at").defaultNow().notNull(),"
  createdBy: integer(""created_by").references(() => users.id),"
  updatedBy: integer(""updated_by").references(() => users.id),
}, (table) => ({"
  statusIdx: index(""orders_status_idx").on(table.status),"
  createdAtIdx: index(""orders_created_at_idx").on(table.createdAt),
}));

// Messages de contact"
export const contactMessages = pgTable(""contact_messages", {"
  id: serial(""id").primaryKey(),"
  name: text(""name").notNull(),"
  email: text(""email").notNull(),"
  subject: text(""subject").notNull(),"
  message: text(""message").notNull(),"
  status: text(""status").notNull().default(""new"),"
  createdAt: timestamp(""created_at").defaultNow().notNull(),
}, (table) => ({"
  statusIdx: index(""contact_messages_status_idx").on(table.status),
}));

// Images des éléments de menu'
export const menuItemImages = pgTable(''menu_item_images', {'
  id: serial(''id').primaryKey(),'
  menuItemId: integer(''menu_item_id').notNull().references(() => menuItems.id, { onDelete: ''cascade' }),'
  imageUrl: text(''image_url').notNull(),'
  altText: text(''alt_text'),'
  isPrimary: boolean(''is_primary').notNull().default(false),'
  uploadMethod: text(''upload_method').notNull().default(''url'),'
  isDeleted: boolean(''is_deleted').default(false),'
  deletedAt: timestamp(''deleted_at'),'
  deletedBy: integer(''deleted_by').references(() => users.id),'
  createdAt: timestamp(''created_at').defaultNow().notNull(),'
  updatedAt: timestamp(''updated_at').defaultNow().notNull(),
}, (table) => ({'
  menuItemIdx: index(''menu_item_images_menu_item_idx').on(table.menuItemId),'
  primaryIdx: index(''menu_item_images_primary_idx').on(table.isPrimary),'
  deletedIdx: index(''menu_item_images_deleted_idx').on(table.isDeleted),
}));
'
// Journaux d''activité'
export const activityLogs = pgTable('activity_logs'', {'
  id: serial('id'').primaryKey(),'
  userId: integer('user_id'').references(() => users.id),'
  action: text('action'').notNull(),'
  entity: text('entity'').notNull(),'
  entityId: integer('entity_id''),'
  details: text('details''),'
  timestamp: timestamp('timestamp'').defaultNow().notNull()
}, (table) => ({'
  userIdx: index('activity_logs_user_idx'').on(table.userId),'
  timestampIdx: index('activity_logs_timestamp_idx'').on(table.timestamp)
}));

// Table employees pour les scripts'
export const employees = pgTable('employees'', {'
  id: serial('id'').primaryKey(),'
  userId: integer('user_id'').references(() => users.id),'
  position: text('position'').notNull(),'
  department: text('department'').notNull(),'
  hireDate: timestamp('hire_date'').defaultNow().notNull(),'
  salary: real('salary''),'
  status: text('status'').default('active'').notNull()
});

// Permissions"
export const permissions = pgTable(""permissions", {"
  id: serial(""id").primaryKey(),'"
  userId: integer(""user_id").notNull().references(() => users.id, { onDelete: 'cascade'' }),"
  module: text(""module").notNull(),"
  canView: boolean(""can_view").notNull().default(true),"
  canCreate: boolean(""can_create").notNull().default(false),"
  canUpdate: boolean(""can_update").notNull().default(false),"
  canDelete: boolean(""can_delete").notNull().default(false),"
  grantedBy: integer(""granted_by").references(() => users.id),"
  grantedAt: timestamp(""granted_at").defaultNow().notNull(),
}, (table) => ({"
  userIdx: index(""permissions_user_idx").on(table.userId),"
  moduleIdx: index(""permissions_module_idx").on(table.module),
}));

// ==========================================
// RELATIONS
// ==========================================

export const menuCategoriesRelations = relations(menuCategories, ({ many }) => ({
  menuItems: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  category: one(menuCategories, {
    fields: [menuItems.categoryId],
    references: [menuCategories.id],
  }),
  orderItems: many(orderItems),
  images: many(menuItemImages),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
  reservations: many(reservations),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
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

export const reservationsRelations = relations(reservations, ({ one }) => ({
  customer: one(customers, {
    fields: [reservations.customerId],
    references: [customers.id],
  }),
  table: one(tables, {
    fields: [reservations.tableId],
    references: [tables.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  activityLogs: many(activityLogs),
  permissions: many(permissions),"
  grantedPermissions: many(permissions, { relationName: ""grantedBy" }),
}));

export const menuItemImagesRelations = relations(menuItemImages, ({ one }) => ({
  menuItem: one(menuItems, {
    fields: [menuItemImages.menuItemId],
    references: [menuItems.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export const permissionsRelations = relations(permissions, ({ one }) => ({
  user: one(users, {
    fields: [permissions.userId],
    references: [users.id],
  }),
  grantedByUser: one(users, {
    fields: [permissions.grantedBy],
    references: [users.id],"
    relationName: ""grantedBy",
  }),
}));

// ==========================================
// TYPES TYPESCRIPT
// ==========================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type MenuCategory = typeof menuCategories.$inferSelect;
export type NewMenuCategory = typeof menuCategories.$inferInsert;

export type MenuItem = typeof menuItems.$inferSelect;
export type NewMenuItem = typeof menuItems.$inferInsert;

export type Table = typeof tables.$inferSelect;
export type NewTable = typeof tables.$inferInsert;

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

export type Reservation = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

export type ContactMessage = typeof contactMessages.$inferSelect;
export type NewContactMessage = typeof contactMessages.$inferInsert;

export type MenuItemImage = typeof menuItemImages.$inferSelect;
export type NewMenuItemImage = typeof menuItemImages.$inferInsert;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;

export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;

// Type Employee
export type Employee = typeof employees.$inferSelect;

// ==========================================
// SCHÉMAS DE VALIDATION ZOD
// ==========================================

export const insertUserSchema = createInsertSchema(users);
export const insertMenuCategorySchema = createInsertSchema(menuCategories);
export const insertMenuItemSchema = createInsertSchema(menuItems);
export const insertTableSchema = createInsertSchema(tables);
export const insertCustomerSchema = createInsertSchema(customers);
export const insertReservationSchema = createInsertSchema(reservations);
export const insertOrderSchema = createInsertSchema(orders);
export const insertOrderItemSchema = createInsertSchema(orderItems);
export const insertContactMessageSchema = createInsertSchema(contactMessages);
export const insertMenuItemImageSchema = createInsertSchema(menuItemImages);
export const insertActivityLogSchema = createInsertSchema(activityLogs);
export const insertPermissionSchema = createInsertSchema(permissions);

// Cache pour la protection contre les attaques par force brute
const authCache = new LRUCache<string, { attempts: number; lastAttempt: number }>({
  max: 1000,
  ttl: 1000 * 60 * 15 // 15 minutes
});

// Hiérarchie des rôles basée sur votre schéma
const ROLE_HIERARCHY = {
  client: 0,
  employe: 1,
  serveur: 2,
  cuisinier: 3,
  gerant: 4,
  admin: 5
} as const;

type Role = keyof typeof ROLE_HIERARCHY;

// Note: La déclaration globale de Request.user est maintenant gérée dans server/types/express.d.ts

/**'
 * Middleware d'authentification basique (JWT ou token stocké)
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;'
  const ip = req.ip || ''unknown';
'
  // 1. Vérification du header d''autorisation'
  if (!authHeader?.startsWith('Bearer '')) {'
    return sendAuthError(res, 401, 'Token manquant'', ip);
  }
'
  const token = authHeader.split(' '')[1];

  if (!token) {'
    return sendAuthError(res, 401, 'Token manquant'', ip);
  }

  try {'
    // 2. Récupération de l'utilisateur (version simplifiée)
    const user = await db.query.users.findFirst({
      where: eq(users.token, token)
    });

    if (!user) {'
      return sendAuthError(res, 401, ''Token invalide', ip);
    }
'
    // 3. Vérification du statut de l''employé si applicable (optionnel)
    // Note: La vérification employee.status nécessite une relation avec la table employees'
    // Pour l'instant, on utilise une vérification simplifiée
    '
    // 4. Ajout de l''utilisateur à la requête
    req.user = {
      ...user
    };

    return next(); // <-- Ajoute return ici pour être explicite
  } catch (error) {'
    console.error('Erreur d''authentification:', error);'
    return sendAuthError(res, 500, ''Erreur serveur', ip); // <-- Ajoute return ici
  }
}

/**'
 * Middleware d''autorisation avec gestion hiérarchique
 */
export function requireRole(
  requiredRoles: Role | Role[],
  options: { 
    hierarchy?: boolean; // Active la hiérarchie des rôles
    allowApiKey?: boolean; // Autorise les clés API'
    strict?: boolean // Rejette si le rôle n'existe pas
  } = {}
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];'
    const ip = req.ip || ''unknown';

    // 1. Vérification des clés API'
    if (options.allowApiKey && req.headers[''x-api-key'] === process.env.API_KEY) {
      return next();
    }
'
    // 2. Vérification de l''authentification
    if (!req.user) {'
      return sendAuthError(res, 401, 'Authentification requise'', ip);
    }

    // 3. Vérification des rôles
    const userRole = req.user.role as Role;
    
    // Mode strict - le rôle doit exister dans la hiérarchie
    if (options.strict && !(userRole in ROLE_HIERARCHY)) {'
      return sendAuthError(res, 403, 'Rôle non reconnu'', ip);
    }

    // Mode hiérarchique - les rôles supérieurs ont accès
    if (options.hierarchy) {
      const requiredLevel = Math.min(...roles.map(r => ROLE_HIERARCHY[r] ?? Infinity));
      const userLevel = ROLE_HIERARCHY[userRole] ?? 0;

      if (userLevel < requiredLevel) {'
        return sendAuthError(res, 403, 'Privilèges insuffisants'', ip, {
          yourRole: userRole,
          requiredLevel: roles,
          hierarchy: ROLE_HIERARCHY
        });
      }
    } 
    // Mode standard - le rôle doit être explicitement autorisé
    else if (!roles.includes(userRole)) {'
      return sendAuthError(res, 403, 'Rôle non autorisé'', ip, {
        yourRole: userRole,
        requiredRoles: roles
      });
    }

    next();
  };
}

// Middlewares prédéfinis pour les rôles courants'
export const requireClient = requireRole('client'');'
export const requireEmploye = requireRole('employe'');'
export const requireServeur = requireRole('serveur'');'
export const requireCuisinier = requireRole('cuisinier'');'
export const requireGerant = requireRole('gerant'');'
export const requireAdmin = requireRole('admin'');

// Middleware hiérarchique'
export const requireStaff = requireRole(['serveur'', 'cuisinier'', 'gerant'', 'admin''], { hierarchy: true });'
export const requireManagement = requireRole(['gerant'', 'admin''], { hierarchy: true });

/**'
 * Gestion des erreurs d'authentification
 */
function sendAuthError(
  res: Response,
  code: number,
  message: string,
  ip: string,
  details?: Record<string, unknown>
) {
  // Enregistrement des tentatives échouées
  const attempts = (authCache.get(ip)?.attempts || 0) + 1;
  authCache.set(ip, { attempts, lastAttempt: Date.now() });
'
  // Réponse d''erreur standardisée
  return res.status(code).json({
    error: {
      code,
      message,
      ...details,'
      documentation: '/docs/auth''
    }
  });
}

/**
 * Vérifie si une IP a dépassé le nombre maximal de tentatives
 */
export function checkAuthAttempts(ip: string): boolean {
  const record = authCache.get(ip);
  return record ? record.attempts > 5 : false;"
}"'"