import { pgTable, serial, text, varchar, integer, decimal, boolean, timestamp, json, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

// ==========================================
// ENUMS
// ==========================================

export const userRoleEnum = pgEnum('user_role', ['admin', 'manager', 'staff', 'user']);
export const orderStatusEnum = pgEnum('order_status', ['pending', 'preparing', 'ready', 'delivered', 'cancelled']);
export const reservationStatusEnum = pgEnum('reservation_status', ['pending', 'confirmed', 'cancelled', 'completed']);
export const tableStatusEnum = pgEnum('table_status', ['available', 'occupied', 'reserved', 'maintenance']);
export const tableLocationEnum = pgEnum('table_location', ['inside', 'outside', 'terrace', 'private_room']);

// ==========================================
// TABLES
// ==========================================

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  username: varchar('username', { length: 100 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  role: varchar('role', { length: 50 }).default('customer').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  permissions: text('permissions').array(),
  avatarUrl: varchar('avatar_url', { length: 255 }),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const menuCategories = pgTable("menu_categories", {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  imageUrl: varchar('image_url', { length: 255 }),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const menuItems = pgTable('menu_items', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  categoryId: integer('category_id').references(() => menuCategories.id),
  imageUrl: varchar('image_url', { length: 500 }),
  isAvailable: boolean('is_available').notNull().default(true),
  isVegetarian: boolean('is_vegetarian').notNull().default(false),
  isVegan: boolean('is_vegan').notNull().default(false),
  isGlutenFree: boolean('is_gluten_free').notNull().default(false),
  stock: integer('stock').notNull().default(0),
  allergens: text('allergens').array(),
  ingredients: text('ingredients').array(),
  nutritionalInfo: json('nutritional_info'),
  preparationTime: integer('preparation_time'),
  preparationTimeMinutes: integer('preparation_time_minutes'),
  calories: integer('calories'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  displayOrder: integer('display_order').default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const tables = pgTable("tables", {
  id: serial('id').primaryKey(),
  number: integer('number').notNull().unique(),
  capacity: integer('capacity').notNull(),
  status: tableStatusEnum('status').notNull().default('available'),
  location: varchar('location', { length: 50 }),
  section: varchar('section', { length: 50 }),
  features: json('features').default([]),
  description: text('description'),
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const customers = pgTable("customers", {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  firstName: varchar('first_name', { length: 50 }).notNull(),
  lastName: varchar('last_name', { length: 50 }).notNull(),
  email: varchar('email', { length: 100 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }),
  loyaltyPoints: integer('loyalty_points').notNull().default(0),
  totalOrders: integer('total_orders').notNull().default(0),
  totalSpent: decimal('total_spent', { precision: 10, scale: 2 }).notNull().default('0'),
  lastVisit: timestamp('last_visit'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const reservations = pgTable("reservations", {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').references(() => customers.id),
  tableId: integer('table_id').references(() => tables.id),
  date: timestamp('date').notNull(),
  time: varchar('time', { length: 10 }).notNull(),
  reservationTime: timestamp('reservation_time').notNull(),
  guestName: varchar('guest_name', { length: 100 }),
  partySize: integer('party_size').notNull(),
  status: reservationStatusEnum('status').notNull().default('pending'),
  specialRequests: text('special_requests'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: varchar('order_number', { length: 20 }).notNull().unique(),
  customerId: integer('customer_id').references(() => customers.id),
  tableId: integer('table_id').references(() => tables.id),
  itemId: integer('item_id').references(() => menuItems.id),
  status: orderStatusEnum('status').notNull().default('pending'),
  orderType: varchar('order_type', { length: 50 }).notNull().default('dine-in'),
  total: decimal('total', { precision: 10, scale: 2 }).notNull().default('0.00'),
  items: json('items'),
  specialRequests: text('special_requests'),
  customerInfo: json('customer_info'),
  paymentMethod: varchar('payment_method', { length: 20 }),
  paymentStatus: varchar('payment_status', { length: 20 }).notNull().default('pending'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const orderItems = pgTable("order_items", {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id),
  menuItemId: integer('menu_item_id').references(() => menuItems.id),
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  specialInstructions: text('special_instructions'),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

export const contactMessages = pgTable("contact_messages", {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 100 }).notNull(),
  subject: varchar('subject', { length: 200 }).notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

export const feedback = pgTable("feedback", {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').references(() => customers.id),
  orderId: integer('order_id').references(() => orders.id),
  rating: integer('rating').notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  title: varchar('title', { length: 255 }),
  comment: text('comment'),
  suggestions: text('suggestions'),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  response: text('response'),
  responseBy: integer('response_by').references(() => users.id),
  respondedAt: timestamp('responded_at'),
  internalNotes: text('internal_notes'),
  isAnonymous: boolean('is_anonymous').notNull().default(false),
  contactEmail: varchar('contact_email', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const menuItemImages = pgTable('menu_item_images', {
  id: serial('id').primaryKey(),
  menuItemId: integer('menu_item_id').references(() => menuItems.id),
  imageUrl: varchar('image_url', { length: 255 }).notNull(),
  altText: varchar('alt_text', { length: 200 }),
  isPrimary: boolean('is_primary').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  entity: varchar('entity', { length: 50 }).notNull(),
  entityId: integer('entity_id'),
  details: text('details'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

export const employees = pgTable('employees', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  employeeNumber: varchar('employee_number', { length: 20 }).notNull().unique(),
  position: varchar('position', { length: 50 }).notNull(),
  hireDate: timestamp('hire_date').notNull(),
  salary: decimal('salary', { precision: 10, scale: 2 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const suppliers = pgTable('suppliers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  contactPerson: varchar('contact_person', { length: 100 }),
  email: varchar('email', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  city: varchar('city', { length: 50 }),
  country: varchar('country', { length: 50 }),
  paymentTerms: varchar('payment_terms', { length: 50 }),
  taxId: varchar('tax_id', { length: 50 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const inventory = pgTable('inventory', {
  id: serial('id').primaryKey(),
  menuItemId: integer('menu_item_id').references(() => menuItems.id),
  currentStock: integer('current_stock').notNull().default(0),
  minStock: integer('min_stock').notNull().default(0),
  maxStock: integer('max_stock').notNull().default(0),
  unit: varchar('unit', { length: 20 }).notNull(),
  cost: decimal('cost', { precision: 10, scale: 2 }).notNull().default('0'),
  supplierId: integer('supplier_id').references(() => suppliers.id),
  expiryDate: timestamp('expiry_date'),
  location: varchar('location', { length: 100 }),
  batchNumber: varchar('batch_number', { length: 50 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const loyaltyTransactions = pgTable('loyalty_transactions', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').references(() => customers.id),
  points: integer('points').notNull(),
  type: varchar('type', { length: 20 }).notNull(),
  description: text('description'),
  orderId: integer('order_id').references(() => orders.id),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

export const permissions = pgTable("permissions", {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  module: varchar('module', { length: 50 }).notNull(),
  canView: boolean('can_view').notNull().default(false),
  canCreate: boolean('can_create').notNull().default(false),
  canUpdate: boolean('can_update').notNull().default(false),
  canDelete: boolean('can_delete').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// ==========================================
// RELATIONS
// ==========================================

export const menuCategoriesRelations = relations(menuCategories, ({ many }) => ({
  menuItems: many(menuItems)
}));

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  category: one(menuCategories, {
    fields: [menuItems.categoryId],
    references: [menuCategories.id]
  }),
  orderItems: many(orderItems),
  images: many(menuItemImages)
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  menuItems: many(menuItems)
}));

export const customersRelations = relations(customers, ({ many }) => ({
  reservations: many(reservations),
  orders: many(orders),
  feedback: many(feedback),
  loyaltyTransactions: many(loyaltyTransactions)
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id]
  }),
  table: one(tables, {
    fields: [orders.tableId],
    references: [tables.id]
  }),
  orderItems: many(orderItems),
  feedback: many(feedback),
  loyaltyTransactions: many(loyaltyTransactions)
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id]
  }),
  menuItem: one(menuItems, {
    fields: [orderItems.menuItemId],
    references: [menuItems.id]
  })
}));

export const reservationsRelations = relations(reservations, ({ one }) => ({
  customer: one(customers, {
    fields: [reservations.customerId],
    references: [customers.id]
  }),
  table: one(tables, {
    fields: [reservations.tableId],
    references: [tables.id]
  })
}));

export const tablesRelations = relations(tables, ({ many }) => ({
  reservations: many(reservations),
  orders: many(orders)
}));

export const usersRelations = relations(users, ({ many }) => ({
  activityLogs: many(activityLogs),
  permissions: many(permissions),
  employee: many(employees),
  feedback: many(feedback)
}));

export const menuItemImagesRelations = relations(menuItemImages, ({ one }) => ({
  menuItem: one(menuItems, {
    fields: [menuItemImages.menuItemId],
    references: [menuItems.id]
  })
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id]
  })
}));

export const permissionsRelations = relations(permissions, ({ one }) => ({
  user: one(users, {
    fields: [permissions.userId],
    references: [users.id]
  })
}));

export const employeesRelations = relations(employees, ({ one }) => ({
  user: one(users, {
    fields: [employees.userId],
    references: [users.id]
  })
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  inventoryItems: many(inventory)
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  menuItem: one(menuItems, {
    fields: [inventory.menuItemId],
    references: [menuItems.id]
  }),
  supplier: one(suppliers, {
    fields: [inventory.supplierId],
    references: [suppliers.id]
  })
}));

export const loyaltyTransactionsRelations = relations(loyaltyTransactions, ({ one }) => ({
  customer: one(customers, {
    fields: [loyaltyTransactions.customerId],
    references: [customers.id]
  }),
  order: one(orders, {
    fields: [loyaltyTransactions.orderId],
    references: [orders.id]
  })
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  customer: one(customers, {
    fields: [feedback.customerId],
    references: [customers.id]
  }),
  order: one(orders, {
    fields: [feedback.orderId],
    references: [orders.id]
  }),
  responseBy: one(users, {
    fields: [feedback.responseBy],
    references: [users.id]
  })
}));

// ==========================================
// SCHÉMAS ZOD POUR VALIDATION
// ==========================================

export const insertUserSchema = createInsertSchema(users);
export const insertMenuCategorySchema = createInsertSchema(menuCategories);
export const insertMenuItemSchema = createInsertSchema(menuItems);
export const insertCategorySchema = createInsertSchema(categories);
export const insertTableSchema = createInsertSchema(tables);
export const insertCustomerSchema = createInsertSchema(customers);
export const insertReservationSchema = createInsertSchema(reservations);
export const insertOrderSchema = createInsertSchema(orders);
export const insertOrderItemSchema = createInsertSchema(orderItems);
export const insertContactMessageSchema = createInsertSchema(contactMessages);
export const insertFeedbackSchema = createInsertSchema(feedback);
export const insertMenuItemImageSchema = createInsertSchema(menuItemImages);
export const insertActivityLogSchema = createInsertSchema(activityLogs);
export const insertEmployeeSchema = createInsertSchema(employees);
export const insertSupplierSchema = createInsertSchema(suppliers);
export const insertInventorySchema = createInsertSchema(inventory);
export const insertLoyaltyTransactionSchema = createInsertSchema(loyaltyTransactions);
export const insertPermissionSchema = createInsertSchema(permissions);

export const selectUserSchema = createSelectSchema(users);
export const selectMenuCategorySchema = createSelectSchema(menuCategories);
export const selectMenuItemSchema = createSelectSchema(menuItems);
export const selectCategorySchema = createSelectSchema(categories);
export const selectTableSchema = createSelectSchema(tables);
export const selectCustomerSchema = createSelectSchema(customers);
export const selectReservationSchema = createSelectSchema(reservations);
export const selectOrderSchema = createSelectSchema(orders);
export const selectOrderItemSchema = createSelectSchema(orderItems);
export const selectContactMessageSchema = createSelectSchema(contactMessages);
export const selectFeedbackSchema = createSelectSchema(feedback);
export const selectMenuItemImageSchema = createSelectSchema(menuItemImages);
export const selectActivityLogSchema = createSelectSchema(activityLogs);
export const selectEmployeeSchema = createSelectSchema(employees);
export const selectSupplierSchema = createSelectSchema(suppliers);
export const selectInventorySchema = createSelectSchema(inventory);
export const selectLoyaltyTransactionSchema = createSelectSchema(loyaltyTransactions);
export const selectPermissionSchema = createSelectSchema(permissions);