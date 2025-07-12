import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar, date, time, pgEnum, index, jsonb } from "drizzle-orm/pg-core";
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

// Users table for admin authentication with enhanced roles
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(), // Hash BCrypt du mot de passe
  role: userRoleEnum("role").notNull().default("employe"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  phone: text("phone"),
  isActive: boolean("is_active").notNull().default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  usernameIdx: index("users_username_idx").on(table.username),
  roleIdx: index("users_role_idx").on(table.role),
}));

// Activity logs table for audit trail
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  action: text("action").notNull(), // created, updated, deleted, viewed
  entity: text("entity").notNull(), // reservation, order, menu_item, etc.
  entityId: integer("entity_id"),
  details: text("details"), // JSON string with additional info
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Permissions table for fine-grained access control
export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  module: text("module").notNull(), // reservations, orders, menu, clients, etc.
  canView: boolean("can_view").notNull().default(true),
  canCreate: boolean("can_create").notNull().default(false),
  canUpdate: boolean("can_update").notNull().default(false),
  canDelete: boolean("can_delete").notNull().default(false),
}, (table) => ({
  userIdIdx: index("permissions_user_id_idx").on(table.userId),
  moduleIdx: index("permissions_module_idx").on(table.module),
}));

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

// Tables in the restaurant
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
  metadata: jsonb("metadata"), // Métadonnées flexibles pour infos supplémentaires
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  dateIdx: index("reservations_date_idx").on(table.date),
  statusIdx: index("reservations_status_idx").on(table.status),
  tableIdx: index("reservations_table_idx").on(table.tableId),
}));

// Reservation preorder items
export const reservationItems = pgTable("reservation_items", {
  id: serial("id").primaryKey(),
  reservationId: integer("reservation_id").notNull(),
  menuItemId: integer("menu_item_id").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 8, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Contact messages
export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: messageStatusEnum("status").notNull().default("new"),
  messageData: jsonb("message_data"), // Métadonnées du message
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  statusIdx: index("contact_messages_status_idx").on(table.status),
  emailIdx: index("contact_messages_email_idx").on(table.email),
}));

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  orderType: orderTypeEnum("order_type").notNull().default("dine-in"),
  status: orderStatusEnum("status").notNull().default("pending"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  tableId: integer("table_id"),
  metadata: jsonb("metadata"), // Informations supplémentaires de commande
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  statusIdx: index("orders_status_idx").on(table.status),
  createdAtIdx: index("orders_created_at_idx").on(table.createdAt),
}));

// Order items table
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  menuItemId: integer("menu_item_id").notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 8, scale: 2 }).notNull(),
  notes: text("notes"),
});

// Customers table
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  address: text("address"),
  dateOfBirth: date("date_of_birth"),
  totalOrders: integer("total_orders").notNull().default(0),
  totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).notNull().default("0.00"),
  preferredContactMethod: contactMethodEnum("preferred_contact_method").notNull().default("email"),
  preferences: jsonb("preferences"), // Préférences client structurées
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  emailIdx: index("customers_email_idx").on(table.email),
  phoneIdx: index("customers_phone_idx").on(table.phone),
}));

// Employees table
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  position: positionEnum("position").notNull(),
  department: departmentEnum("department").notNull(),
  salary: decimal("salary", { precision: 10, scale: 2 }),
  hireDate: date("hire_date").notNull(),
  status: employeeStatusEnum("status").notNull().default("active"),
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  employeeData: jsonb("employee_data"), // Données RH supplémentaires
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  statusIdx: index("employees_status_idx").on(table.status),
  departmentIdx: index("employees_department_idx").on(table.department),
}));

// Work shifts table
export const workShifts = pgTable("work_shifts", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  position: positionEnum("position").notNull(),
  status: shiftStatusEnum("status").notNull().default("scheduled"),
  shiftData: jsonb("shift_data"), // Données de garde supplémentaires
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  employeeIdx: index("work_shifts_employee_idx").on(table.employeeId),
  dateIdx: index("work_shifts_date_idx").on(table.date),
}));

// Define relations
export const menuCategoriesRelations = relations(menuCategories, ({ many }) => ({
  menuItems: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one }) => ({
  category: one(menuCategories, {
    fields: [menuItems.categoryId],
    references: [menuCategories.id],
  }),
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
  reservationItems: many(reservationItems),
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
  table: one(tables, {
    fields: [orders.tableId],
    references: [tables.id],
  }),
  orderItems: many(orderItems),
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

export const employeesRelations = relations(employees, ({ many }) => ({
  workShifts: many(workShifts),
}));

export const workShiftsRelations = relations(workShifts, ({ one }) => ({
  employee: one(employees, {
    fields: [workShifts.employeeId],
    references: [employees.id],
  }),
}));

// New relations for enhanced user system
export const usersRelations = relations(users, ({ many }) => ({
  activityLogs: many(activityLogs),
  permissions: many(permissions),
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

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  isActive: true,
}).extend({
  email: z.string().email("Email invalide").optional(),
  phone: z.string().regex(/^(\+33|0)[1-9](\d{8})$/, "Format téléphone invalide (ex: +33612345678 ou 0612345678)").optional(),
  role: z.enum(["directeur", "employe"]).default("employe"),
  password: z.string().min(8, "Mot de passe minimum 8 caractères"), // Sera hashé avec BCrypt
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).pick({
  userId: true,
  action: true,
  entity: true,
  entityId: true,
  details: true,
});

export const insertPermissionSchema = createInsertSchema(permissions).pick({
  userId: true,
  module: true,
  canView: true,
  canCreate: true,
  canUpdate: true,
  canDelete: true,
});

export const insertMenuCategorySchema = createInsertSchema(menuCategories).pick({
  name: true,
  description: true,
  slug: true,
  displayOrder: true,
});

export const insertMenuItemSchema = createInsertSchema(menuItems).pick({
  name: true,
  description: true,
  price: true,
  categoryId: true,
  imageUrl: true,
  available: true,
}).extend({
  price: z.coerce.number().min(0.01, "Le prix doit être supérieur à 0").max(999.99, "Prix maximum : 999.99€"),
});

export const insertTableSchema = createInsertSchema(tables).pick({
  number: true,
  capacity: true,
  available: true,
});

export const insertReservationSchema = createInsertSchema(reservations).pick({
  customerName: true,
  customerEmail: true,
  customerPhone: true,
  date: true,
  time: true,
  guests: true,
  tableId: true,
  specialRequests: true,
  status: true,
  metadata: true,
}).extend({
  customerEmail: z.string().email("Email invalide"),
  customerPhone: z.string().regex(/^(\+33|0)[1-9](\d{8})$/, "Format téléphone invalide (ex: +33612345678 ou 0612345678)"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)").refine((date) => {
    const d = new Date(date + 'T00:00:00');
    if (isNaN(d.getTime())) return false;
    const isoDate = d.toISOString().split('T')[0];
    if (isoDate !== date) return false;
    const year = d.getFullYear();
    const currentYear = new Date().getFullYear();
    return year >= currentYear && year <= 3000;
  }, "Date invalide ou l'année doit être entre maintenant et 3000"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Format d'heure invalide (HH:MM)").refine((time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
  }, "Heure invalide (HH:MM, HH: 0-23, MM: 0-59)"),
  guests: z.number().min(1).max(8, "Maximum 8 personnes"),
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]).default("confirmed"),
  metadata: z.any().optional(),
});

export const insertContactMessageSchema = z.object({
  name: z.string().min(2, "Nom requis").optional(),
  firstName: z.string().min(1, "Prénom requis").optional(),
  lastName: z.string().min(1, "Nom requis").optional(),
  email: z.string().email("Email invalide"),
  subject: z.string().min(2, "Sujet requis"),
  message: z.string().min(10, "Message trop court"),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Nom d'utilisateur requis"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const registerSchema = z.object({
  username: z.string().min(3, "Nom d'utilisateur doit contenir au moins 3 caractères"),
  password: z.string().min(6, "Mot de passe doit contenir au moins 6 caractères"),
  confirmPassword: z.string(),
  role: z.string().default("admin"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export type RegisterData = z.infer<typeof registerSchema>;

// Schema pour l'insertion de clients
export const insertCustomerSchema = createInsertSchema(customers).pick({
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  address: true,
  dateOfBirth: true,
  totalOrders: true,
  totalSpent: true,
  preferredContactMethod: true,
  preferences: true,
}).extend({
  email: z.string().email("Email invalide"),
  firstName: z.string().min(2, "Prénom requis"),
  lastName: z.string().min(2, "Nom requis"),
  phone: z.string().regex(/^(\+33|0)[1-9](\d{8})$/, "Format téléphone invalide (ex: +33612345678 ou 0612345678)"),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)").optional(),
  preferredContactMethod: z.enum(["email", "phone", "sms"]).default("email"),
  preferences: z.any().optional(),
});

// New schemas for the extended functionality
export const insertOrderSchema = createInsertSchema(orders).pick({
  customerName: true,
  customerEmail: true,
  customerPhone: true,
  orderType: true,
  status: true,
  totalAmount: true,
  notes: true,
  tableId: true,
}).extend({
  customerEmail: z.string().email("Email invalide"),
  customerPhone: z.string().min(10, "Numéro de téléphone invalide"),
  totalAmount: z.coerce.number().min(0.01, "Le montant doit être supérieur à 0").max(9999.99, "Montant maximum : 9 999,99€"),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).pick({
  orderId: true,
  menuItemId: true,
  quantity: true,
  price: true,
  notes: true,
}).extend({
  quantity: z.number().min(1, "Quantité minimum 1"),
  price: z.coerce.number().min(0.01, "Le prix doit être supérieur à 0").max(999.99, "Prix maximum : 999,99€"),
});

export const insertEmployeeSchema = createInsertSchema(employees).pick({
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  position: true,
  department: true,
  salary: true,
  hireDate: true,
  status: true,
  emergencyContact: true,
  emergencyPhone: true,
  notes: true,
}).extend({
  email: z.string().email("Email invalide"),
  firstName: z.string().min(2, "Prénom requis"),
  lastName: z.string().min(2, "Nom requis"),
  phone: z.string().min(8, "Téléphone requis (minimum 8 chiffres)"),
  position: z.string().min(2, "Poste requis"),
  department: z.string().min(2, "Département requis"),
  salary: z.coerce.number().min(0.01, "Le salaire doit être supérieur à 0").max(99999.99, "Salaire maximum : 99 999,99€"),
  hireDate: z.string().refine((date) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
    const dateParts = date.split('-');
    if (dateParts.length === 0 || !dateParts[0]) return false;
    const year = parseInt(dateParts[0]);
    return year >= 1970 && year <= 3000;
  }, "Format de date invalide ou année doit être entre 1970 et 3000"),
  status: z.enum(["active", "inactive", "terminated"]).default("active"),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  notes: z.string().optional(),
});

export const insertWorkShiftSchema = createInsertSchema(workShifts).pick({
  employeeId: true,
  date: true,
  startTime: true,
  endTime: true,
  position: true,
  status: true,
  notes: true,
}).extend({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide").refine((date) => {
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return false;
    }
    const dateParts = date.split('-');
    if (dateParts.length !== 3 || !dateParts[0]) {
      return false;
    }
    const year = parseInt(dateParts[0]);
    const currentYear = new Date().getFullYear();
    return year >= currentYear && year <= 3000;
  }, "Format de date invalide ou l'année doit être entre maintenant et 3000"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Format d'heure invalide"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Format d'heure invalide"),
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
export type Reservation = typeof reservations.$inferSelect;
export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type LoginData = z.infer<typeof loginSchema>;

// New type exports
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type WorkShift = typeof workShifts.$inferSelect;
export type InsertWorkShift = z.infer<typeof insertWorkShiftSchema>;

// New enhanced types for role-based system
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;