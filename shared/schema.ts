import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table for admin authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Menu categories
export const menuCategories = pgTable("menu_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  displayOrder: integer("display_order").notNull().default(0),
});

// Menu items
export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 8, scale: 2 }).notNull(),
  categoryId: integer("category_id").notNull(),
  imageUrl: text("image_url"),
  available: boolean("available").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
  date: text("date").notNull(), // YYYY-MM-DD format
  time: text("time").notNull(), // HH:MM format
  guests: integer("guests").notNull(),
  tableId: integer("table_id"),
  specialRequests: text("special_requests"),
  status: text("status").notNull().default("pending"), // pending, confirmed, cancelled, completed
  preorderTotal: decimal("preorder_total", { precision: 8, scale: 2 }).default("0.00"),
  notificationSent: boolean("notification_sent").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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
  status: text("status").notNull().default("new"), // new, read, replied
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  orderType: text("order_type").notNull().default("dine-in"), // dine-in, takeout, delivery
  status: text("status").notNull().default("pending"), // pending, preparing, ready, completed, cancelled
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  tableId: integer("table_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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
  dateOfBirth: text("date_of_birth"), // YYYY-MM-DD format
  totalOrders: integer("total_orders").notNull().default(0),
  totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).notNull().default("0.00"),
  preferredContactMethod: text("preferred_contact_method").notNull().default("email"), // email, phone, sms
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Employees table
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  position: text("position").notNull(), // manager, server, chef, barista, cashier
  department: text("department").notNull(), // kitchen, service, management
  salary: decimal("salary", { precision: 10, scale: 2 }),
  hireDate: text("hire_date").notNull(), // YYYY-MM-DD format
  status: text("status").notNull().default("active"), // active, inactive, terminated
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Work shifts table
export const workShifts = pgTable("work_shifts", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  startTime: text("start_time").notNull(), // HH:MM format
  endTime: text("end_time").notNull(), // HH:MM format
  position: text("position").notNull(),
  status: text("status").notNull().default("scheduled"), // scheduled, completed, cancelled
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

export const insertMenuCategorySchema = createInsertSchema(menuCategories).pick({
  name: true,
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
}).extend({
  customerEmail: z.string().email("Email invalide"),
  customerPhone: z.string().min(10, "Numéro de téléphone invalide"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide").refine((date) => {
    const year = parseInt(date.split('-')[0]);
    const currentYear = new Date().getFullYear();
    return year >= currentYear && year <= 3000;
  }, "L'année doit être entre maintenant et 3000"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Format d'heure invalide"),
  guests: z.number().min(1).max(8, "Maximum 8 personnes"),
  status: z.string().default("confirmed"),
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).pick({
  firstName: true,
  lastName: true,
  email: true,
  subject: true,
  message: true,
}).extend({
  email: z.string().email("Email invalide"),
  firstName: z.string().min(2, "Prénom requis"),
  lastName: z.string().min(2, "Nom requis"),
  message: z.string().min(10, "Message trop court"),
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
  totalAmount: z.string().regex(/^\d+\.?\d{0,2}$/, "Montant invalide"),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).pick({
  orderId: true,
  menuItemId: true,
  quantity: true,
  price: true,
  notes: true,
}).extend({
  quantity: z.number().min(1, "Quantité minimum 1"),
  price: z.string().regex(/^\d+\.?\d{0,2}$/, "Prix invalide"),
});

export const insertCustomerSchema = createInsertSchema(customers).pick({
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  address: true,
  dateOfBirth: true,
  preferredContactMethod: true,
  notes: true,
}).extend({
  email: z.string().email("Email invalide"),
  firstName: z.string().min(2, "Prénom requis"),
  lastName: z.string().min(2, "Nom requis"),
  phone: z.string().min(10, "Numéro de téléphone invalide"),
  address: z.string().optional(),
  dateOfBirth: z.string().optional().refine((date) => {
    if (!date || date === "") return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
    const year = parseInt(date.split('-')[0]);
    return year >= 1900 && year <= 3000;
  }, "L'année doit être entre 1900 et 3000"),
  preferredContactMethod: z.enum(["email", "phone", "sms"]).default("email"),
  notes: z.string().optional(),
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
  phone: z.string().min(10, "Numéro de téléphone invalide"),
  position: z.string().min(2, "Poste requis"),
  department: z.string().min(2, "Département requis"),
  hireDate: z.string().refine((date) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
    const year = parseInt(date.split('-')[0]);
    return year >= 1970 && year <= 3000;
  }, "Format de date invalide ou année doit être entre 1970 et 3000"),
  salary: z.string().optional().refine((salary) => {
    if (!salary || salary === "") return true;
    return /^\d+\.?\d{0,2}$/.test(salary);
  }, "Salaire invalide"),
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
    const year = parseInt(date.split('-')[0]);
    const currentYear = new Date().getFullYear();
    return year >= currentYear && year <= 3000;
  }, "L'année doit être entre maintenant et 3000"),
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
