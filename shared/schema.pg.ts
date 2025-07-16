import { pgTable, text, integer, real, timestamp, serial, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table with optimized indexes
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').unique().notNull(),
  password: text('password').notNull(),
  role: text('role').notNull().default('employe'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  email: text('email').unique(),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  usernameIdx: index('users_username_idx').on(table.username),
  emailIdx: index('users_email_idx').on(table.email),
  roleIdx: index('users_role_idx').on(table.role),
}));

// Activity logs with efficient indexing
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: integer("entity_id"),
  details: text("details"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("activity_logs_user_id_idx").on(table.userId),
  entityIdx: index("activity_logs_entity_idx").on(table.entity),
  timestampIdx: index("activity_logs_timestamp_idx").on(table.timestamp),
}));

// Permissions table
export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  module: text("module").notNull(),
  canView: boolean("can_view").notNull().default(true),
  canCreate: boolean("can_create").notNull().default(false),
  canUpdate: boolean("can_update").notNull().default(false),
  canDelete: boolean("can_delete").notNull().default(false),
}, (table) => ({
  userIdIdx: index("permissions_user_id_idx").on(table.userId),
  moduleIdx: index("permissions_module_idx").on(table.module),
}));

// Menu categories with optimized structure
export const menuCategories = pgTable("menu_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  slug: text("slug").notNull().unique(),
  displayOrder: integer("display_order").notNull().default(0),
}, (table) => ({
  slugIdx: index("menu_categories_slug_idx").on(table.slug),
  orderIdx: index("menu_categories_order_idx").on(table.displayOrder),
}));

// Menu items with performance optimizations
export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  categoryId: integer("category_id").notNull(),
  imageUrl: text("image_url"),
  available: boolean("available").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  categoryIdx: index("menu_items_category_idx").on(table.categoryId),
  availableIdx: index("menu_items_available_idx").on(table.available),
  nameIdx: index("menu_items_name_idx").on(table.name),
}));

// Tables with optimized design
export const tables = pgTable("tables", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull().unique(),
  capacity: integer("capacity").notNull(),
  status: text("status").notNull().default('available'),
  location: text("location"),
}, (table) => ({
  numberIdx: index("tables_number_idx").on(table.number),
  statusIdx: index("tables_status_idx").on(table.status),
}));

// Customers with loyalty program
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").unique(),
  phone: text("phone"),
  loyaltyPoints: integer("loyalty_points").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  emailIdx: index("customers_email_idx").on(table.email),
  phoneIdx: index("customers_phone_idx").on(table.phone),
  loyaltyIdx: index("customers_loyalty_idx").on(table.loyaltyPoints),
}));

// Reservations with optimized queries
export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id"),
  tableId: integer("table_id").notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  reservationDate: timestamp("reservation_date").notNull(),
  partySize: integer("party_size").notNull(),
  status: text("status").notNull().default('confirmed'),
  specialRequests: text("special_requests"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  dateIdx: index("reservations_date_idx").on(table.reservationDate),
  statusIdx: index("reservations_status_idx").on(table.status),
  tableIdx: index("reservations_table_idx").on(table.tableId),
  customerIdx: index("reservations_customer_idx").on(table.customerId),
}));

// Reservation items
export const reservationItems = pgTable("reservation_items", {
  id: serial("id").primaryKey(),
  reservationId: integer("reservation_id").notNull(),
  menuItemId: integer("menu_item_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: real("unit_price").notNull(),
  notes: text("notes"),
}, (table) => ({
  reservationIdx: index("reservation_items_reservation_idx").on(table.reservationId),
  menuItemIdx: index("reservation_items_menu_item_idx").on(table.menuItemId),
}));

// Orders system
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id"),
  reservationId: integer("reservation_id"),
  total: real("total").notNull(),
  status: text("status").notNull().default('pending'),
  orderType: text("order_type").notNull().default('dine-in'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  statusIdx: index("orders_status_idx").on(table.status),
  customerIdx: index("orders_customer_idx").on(table.customerId),
  dateIdx: index("orders_date_idx").on(table.createdAt),
}));

// Order items
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  menuItemId: integer("menu_item_id").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  specialInstructions: text("special_instructions"),
}, (table) => ({
  orderIdx: index("order_items_order_idx").on(table.orderId),
  menuItemIdx: index("order_items_menu_item_idx").on(table.menuItemId),
}));

// Contact messages
export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default('new'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  statusIdx: index("contact_messages_status_idx").on(table.status),
  emailIdx: index("contact_messages_email_idx").on(table.email),
  dateIdx: index("contact_messages_date_idx").on(table.createdAt),
}));

// Employees
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").unique().notNull(),
  phone: text("phone"),
  position: text("position").notNull(),
  department: text("department"),
  hireDate: timestamp("hire_date").defaultNow().notNull(),
  salary: real("salary"),
  isActive: boolean("is_active").notNull().default(true),
}, (table) => ({
  emailIdx: index("employees_email_idx").on(table.email),
  positionIdx: index("employees_position_idx").on(table.position),
  activeIdx: index("employees_active_idx").on(table.isActive),
}));

// Menu item images for dynamic image management
export const menuItemImages = pgTable("menu_item_images", {
  id: serial("id").primaryKey(),
  menuItemId: integer("menu_item_id").notNull(),
  imageUrl: text("image_url").notNull(),
  altText: text("alt_text"),
  isPrimary: boolean("is_primary").notNull().default(false),
  uploadMethod: text("upload_method").notNull().default('url'), // 'url', 'upload', 'generated', 'pexels'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  menuItemIdx: index("menu_item_images_menu_item_idx").on(table.menuItemId),
  primaryIdx: index("menu_item_images_primary_idx").on(table.isPrimary),
}));

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
  reservationItems: many(reservationItems),
  orderItems: many(orderItems),
  images: many(menuItemImages),
}));

export const tablesRelations = relations(tables, ({ many }) => ({
  reservations: many(reservations),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  reservations: many(reservations),
  orders: many(orders),
}));

export const reservationsRelations = relations(reservations, ({ one, many }) => ({
  customer: one(customers, {
    fields: [reservations.customerId],
    references: [customers.id],
  }),
  table: one(tables, {
    fields: [reservations.tableId],
    references: [tables.id],
  }),
  items: many(reservationItems),
  orders: many(orders),
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

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  reservation: one(reservations, {
    fields: [orders.reservationId],
    references: [reservations.id],
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
}));

export const menuItemImagesRelations = relations(menuItemImages, ({ one }) => ({
  menuItem: one(menuItems, {
    fields: [menuItemImages.menuItemId],
    references: [menuItems.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMenuCategorySchema = createInsertSchema(menuCategories).omit({
  id: true,
});

export const insertMenuItemSchema = createInsertSchema(menuItems).omit({
  id: true,
  createdAt: true,
});

export const insertTableSchema = createInsertSchema(tables).omit({
  id: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

export const insertReservationSchema = createInsertSchema(reservations).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({
  id: true,
  createdAt: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
});

export const insertMenuItemImageSchema = createInsertSchema(menuItemImages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type MenuCategory = typeof menuCategories.$inferSelect;
export type InsertMenuCategory = z.infer<typeof insertMenuCategorySchema>;

export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;

export type Table = typeof tables.$inferSelect;
export type InsertTable = z.infer<typeof insertTableSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Reservation = typeof reservations.$inferSelect;
export type InsertReservation = z.infer<typeof insertReservationSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type MenuItemImage = typeof menuItemImages.$inferSelect;
export type InsertMenuItemImage = z.infer<typeof insertMenuItemImageSchema>;