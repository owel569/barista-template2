import { sqliteTable, text, integer, real, blob, index } from "drizzle-orm/sqlite-core";
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
