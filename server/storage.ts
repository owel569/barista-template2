import { 
  users, menuCategories, menuItems, categories, tables, customers, 
  reservations, orders, orderItems, contactMessages, feedback,
  menuItemImages, activityLogs, employees, shifts, suppliers,
  inventory, loyaltyTransactions, permissions
} from '../shared/schema';

// Types des entités basés sur le schéma
export type User = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
export type MenuCategory = typeof menuCategories.$inferSelect;
export type MenuCategoryInsert = typeof menuCategories.$inferInsert;
export type MenuItem = typeof menuItems.$inferSelect;
export type MenuItemInsert = typeof menuItems.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type CategoryInsert = typeof categories.$inferInsert;
export type Table = typeof tables.$inferSelect;
export type TableInsert = typeof tables.$insert;
export type Customer = typeof customers.$inferSelect;
export type CustomerInsert = typeof customers.$inferInsert;
export type Reservation = typeof reservations.$inferSelect;
export type ReservationInsert = typeof reservations.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type OrderInsert = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type OrderItemInsert = typeof orderItems.$inferInsert;
export type ContactMessage = typeof contactMessages.$inferSelect;
export type ContactMessageInsert = typeof contactMessages.$inferInsert;
export type Feedback = typeof feedback.$inferSelect;
export type FeedbackInsert = typeof feedback.$inferInsert;
export type MenuItemImage = typeof menuItemImages.$inferSelect;
export type MenuItemImageInsert = typeof menuItemImages.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type ActivityLogInsert = typeof activityLogs.$inferInsert;
export type Employee = typeof employees.$inferSelect;
export type EmployeeInsert = typeof employees.$inferInsert;
export type Shift = typeof shifts.$inferSelect;
export type ShiftInsert = typeof shifts.$inferInsert;
export type Supplier = typeof suppliers.$inferSelect;
export type SupplierInsert = typeof suppliers.$inferInsert;
export type Inventory = typeof inventory.$inferSelect;
export type InventoryInsert = typeof inventory.$inferInsert;
export type LoyaltyTransaction = typeof loyaltyTransactions.$inferSelect;
export type LoyaltyTransactionInsert = typeof loyaltyTransactions.$inferInsert;
export type Permission = typeof permissions.$inferSelect;
export type PermissionInsert = typeof permissions.$inferInsert;

// Interface de stockage générique
export interface IStorage {
  // Users
  users: {
    create: (data: UserInsert) => Promise<User>;
    findById: (id: number) => Promise<User | null>;
    findByEmail: (email: string) => Promise<User | null>;
    findByUsername: (username: string) => Promise<User | null>;
    findAll: () => Promise<User[]>;
    update: (id: number, data: Partial<UserInsert>) => Promise<User | null>;
    delete: (id: number) => Promise<boolean>;
    findByRole: (role: string) => Promise<User[]>;
  };

  // Menu Categories
  menuCategories: {
    create: (data: MenuCategoryInsert) => Promise<MenuCategory>;
    findById: (id: number) => Promise<MenuCategory | null>;
    findAll: () => Promise<MenuCategory[]>;
    findActive: () => Promise<MenuCategory[]>;
    update: (id: number, data: Partial<MenuCategoryInsert>) => Promise<MenuCategory | null>;
    delete: (id: number) => Promise<boolean>;
  };

  // Menu Items
  menuItems: {
    create: (data: MenuItemInsert) => Promise<MenuItem>;
    findById: (id: number) => Promise<MenuItem | null>;
    findAll: () => Promise<MenuItem[]>;
    findByCategory: (categoryId: number) => Promise<MenuItem[]>;
    findAvailable: () => Promise<MenuItem[]>;
    update: (id: number, data: Partial<MenuItemInsert>) => Promise<MenuItem | null>;
    delete: (id: number) => Promise<boolean>;
    search: (query: string) => Promise<MenuItem[]>;
  };

  // Categories
  categories: {
    create: (data: CategoryInsert) => Promise<Category>;
    findById: (id: number) => Promise<Category | null>;
    findAll: () => Promise<Category[]>;
    findActive: () => Promise<Category[]>;
    update: (id: number, data: Partial<CategoryInsert>) => Promise<Category | null>;
    delete: (id: number) => Promise<boolean>;
  };

  // Tables
  tables: {
    create: (data: TableInsert) => Promise<Table>;
    findById: (id: number) => Promise<Table | null>;
    findByNumber: (number: number) => Promise<Table | null>;
    findAll: () => Promise<Table[]>;
    findByStatus: (status: string) => Promise<Table[]>;
    findAvailable: () => Promise<Table[]>;
    update: (id: number, data: Partial<TableInsert>) => Promise<Table | null>;
    delete: (id: number) => Promise<boolean>;
  };

  // Customers
  customers: {
    create: (data: CustomerInsert) => Promise<Customer>;
    findById: (id: number) => Promise<Customer | null>;
    findByEmail: (email: string) => Promise<Customer | null>;
    findAll: () => Promise<Customer[]>;
    findActive: () => Promise<Customer[]>;
    update: (id: number, data: Partial<CustomerInsert>) => Promise<Customer | null>;
    delete: (id: number) => Promise<boolean>;
    search: (query: string) => Promise<Customer[]>;
  };

  // Reservations
  reservations: {
    create: (data: ReservationInsert) => Promise<Reservation>;
    findById: (id: number) => Promise<Reservation | null>;
    findAll: () => Promise<Reservation[]>;
    findByCustomer: (customerId: number) => Promise<Reservation[]>;
    findByTable: (tableId: number) => Promise<Reservation[]>;
    findByDate: (date: string) => Promise<Reservation[]>;
    findByStatus: (status: string) => Promise<Reservation[]>;
    update: (id: number, data: Partial<ReservationInsert>) => Promise<Reservation | null>;
    delete: (id: number) => Promise<boolean>;
  };

  // Orders
  orders: {
    create: (data: OrderInsert) => Promise<Order>;
    findById: (id: number) => Promise<Order | null>;
    findByNumber: (orderNumber: string) => Promise<Order | null>;
    findAll: () => Promise<Order[]>;
    findByCustomer: (customerId: number) => Promise<Order[]>;
    findByTable: (tableId: number) => Promise<Order[]>;
    findByStatus: (status: string) => Promise<Order[]>;
    findByDateRange: (start: string, end: string) => Promise<Order[]>;
    update: (id: number, data: Partial<OrderInsert>) => Promise<Order | null>;
    delete: (id: number) => Promise<boolean>;
  };

  // Order Items
  orderItems: {
    create: (data: OrderItemInsert) => Promise<OrderItem>;
    findById: (id: number) => Promise<OrderItem | null>;
    findByOrder: (orderId: number) => Promise<OrderItem[]>;
    findAll: () => Promise<OrderItem[]>;
    update: (id: number, data: Partial<OrderItemInsert>) => Promise<OrderItem | null>;
    delete: (id: number) => Promise<boolean>;
  };

  // Contact Messages
  contactMessages: {
    create: (data: ContactMessageInsert) => Promise<ContactMessage>;
    findById: (id: number) => Promise<ContactMessage | null>;
    findAll: () => Promise<ContactMessage[]>;
    findUnread: () => Promise<ContactMessage[]>;
    markAsRead: (id: number) => Promise<boolean>;
    delete: (id: number) => Promise<boolean>;
  };

  // Feedback
  feedback: {
    create: (data: FeedbackInsert) => Promise<Feedback>;
    findById: (id: number) => Promise<Feedback | null>;
    findAll: () => Promise<Feedback[]>;
    findByCustomer: (customerId: number) => Promise<Feedback[]>;
    findByOrder: (orderId: number) => Promise<Feedback[]>;
    findByStatus: (status: string) => Promise<Feedback[]>;
    update: (id: number, data: Partial<FeedbackInsert>) => Promise<Feedback | null>;
    delete: (id: number) => Promise<boolean>;
  };

  // Menu Item Images
  menuItemImages: {
    create: (data: MenuItemImageInsert) => Promise<MenuItemImage>;
    findById: (id: number) => Promise<MenuItemImage | null>;
    findByMenuItem: (menuItemId: number) => Promise<MenuItemImage[]>;
    findAll: () => Promise<MenuItemImage[]>;
    update: (id: number, data: Partial<MenuItemImageInsert>) => Promise<MenuItemImage | null>;
    delete: (id: number) => Promise<boolean>;
  };

  // Activity Logs
  activityLogs: {
    create: (data: ActivityLogInsert) => Promise<ActivityLog>;
    findById: (id: number) => Promise<ActivityLog | null>;
    findAll: () => Promise<ActivityLog[]>;
    findByUser: (userId: number) => Promise<ActivityLog[]>;
    findByEntity: (entity: string, entityId?: number) => Promise<ActivityLog[]>;
    findByDateRange: (start: string, end: string) => Promise<ActivityLog[]>;
    delete: (id: number) => Promise<boolean>;
  };

  // Employees
  employees: {
    create: (data: EmployeeInsert) => Promise<Employee>;
    findById: (id: number) => Promise<Employee | null>;
    findByNumber: (employeeNumber: string) => Promise<Employee | null>;
    findAll: () => Promise<Employee[]>;
    findActive: () => Promise<Employee[]>;
    findByPosition: (position: string) => Promise<Employee[]>;
    update: (id: number, data: Partial<EmployeeInsert>) => Promise<Employee | null>;
    delete: (id: number) => Promise<boolean>;
  };

  // Shifts
  shifts: {
    create: (data: ShiftInsert) => Promise<Shift>;
    findById: (id: number) => Promise<Shift | null>;
    findAll: () => Promise<Shift[]>;
    findByEmployee: (employeeId: number) => Promise<Shift[]>;
    findByDate: (date: string) => Promise<Shift[]>;
    findByStatus: (status: string) => Promise<Shift[]>;
    findByDateRange: (start: string, end: string) => Promise<Shift[]>;
    update: (id: number, data: Partial<ShiftInsert>) => Promise<Shift | null>;
    delete: (id: number) => Promise<boolean>;
  };

  // Suppliers
  suppliers: {
    create: (data: SupplierInsert) => Promise<Supplier>;
    findById: (id: number) => Promise<Supplier | null>;
    findAll: () => Promise<Supplier[]>;
    findActive: () => Promise<Supplier[]>;
    update: (id: number, data: Partial<SupplierInsert>) => Promise<Supplier | null>;
    delete: (id: number) => Promise<boolean>;
    search: (query: string) => Promise<Supplier[]>;
  };

  // Inventory
  inventory: {
    create: (data: InventoryInsert) => Promise<Inventory>;
    findById: (id: number) => Promise<Inventory | null>;
    findAll: () => Promise<Inventory[]>;
    findByMenuItem: (menuItemId: number) => Promise<Inventory[]>;
    findBySupplier: (supplierId: number) => Promise<Inventory[]>;
    findLowStock: () => Promise<Inventory[]>;
    update: (id: number, data: Partial<InventoryInsert>) => Promise<Inventory | null>;
    delete: (id: number) => Promise<boolean>;
  };

  // Loyalty Transactions
  loyaltyTransactions: {
    create: (data: LoyaltyTransactionInsert) => Promise<LoyaltyTransaction>;
    findById: (id: number) => Promise<LoyaltyTransaction | null>;
    findAll: () => Promise<LoyaltyTransaction[]>;
    findByCustomer: (customerId: number) => Promise<LoyaltyTransaction[]>;
    findByOrder: (orderId: number) => Promise<LoyaltyTransaction[]>;
    findByType: (type: string) => Promise<LoyaltyTransaction[]>;
    delete: (id: number) => Promise<boolean>;
  };

  // Permissions
  permissions: {
    create: (data: PermissionInsert) => Promise<Permission>;
    findById: (id: number) => Promise<Permission | null>;
    findAll: () => Promise<Permission[]>;
    findByUser: (userId: number) => Promise<Permission[]>;
    findByModule: (module: string) => Promise<Permission[]>;
    update: (id: number, data: Partial<PermissionInsert>) => Promise<Permission | null>;
    delete: (id: number) => Promise<boolean>;
  };
}

// Implémentation MemStorage - stockage en mémoire
export class MemStorage implements IStorage {
  private static instance: MemStorage;
  private data: {
    users: Map<number, User>;
    menuCategories: Map<number, MenuCategory>;
    menuItems: Map<number, MenuItem>;
    categories: Map<number, Category>;
    tables: Map<number, Table>;
    customers: Map<number, Customer>;
    reservations: Map<number, Reservation>;
    orders: Map<number, Order>;
    orderItems: Map<number, OrderItem>;
    contactMessages: Map<number, ContactMessage>;
    feedback: Map<number, Feedback>;
    menuItemImages: Map<number, MenuItemImage>;
    activityLogs: Map<number, ActivityLog>;
    employees: Map<number, Employee>;
    shifts: Map<number, Shift>;
    suppliers: Map<number, Supplier>;
    inventory: Map<number, Inventory>;
    loyaltyTransactions: Map<number, LoyaltyTransaction>;
    permissions: Map<number, Permission>;
  };
  private counters: Record<string, number> = {};

  constructor() {
    this.data = {
      users: new Map(),
      menuCategories: new Map(),
      menuItems: new Map(),
      categories: new Map(),
      tables: new Map(),
      customers: new Map(),
      reservations: new Map(),
      orders: new Map(),
      orderItems: new Map(),
      contactMessages: new Map(),
      feedback: new Map(),
      menuItemImages: new Map(),
      activityLogs: new Map(),
      employees: new Map(),
      shifts: new Map(),
      suppliers: new Map(),
      inventory: new Map(),
      loyaltyTransactions: new Map(),
      permissions: new Map(),
    };

    // Initialiser les compteurs
    Object.keys(this.data).forEach(key => {
      this.counters[key] = 1;
    });

    console.log('✅ MemStorage initialisé avec stockage en mémoire');
  }

  static getInstance(): MemStorage {
    if (!MemStorage.instance) {
      MemStorage.instance = new MemStorage();
    }
    return MemStorage.instance;
  }

  private generateId(table: string): number {
    return this.counters[table]++;
  }

  private addTimestamps<T extends Record<string, any>>(data: T): T & { createdAt: Date; updatedAt: Date } {
    const now = new Date();
    return {
      ...data,
      createdAt: now,
      updatedAt: now,
    };
  }

  private updateTimestamps<T extends Record<string, any>>(data: T): T & { updatedAt: Date } {
    return {
      ...data,
      updatedAt: new Date(),
    };
  }

  // Users
  users = {
    create: async (data: UserInsert): Promise<User> => {
      const id = this.generateId('users');
      const user = { id, ...this.addTimestamps(data) } as User;
      this.data.users.set(id, user);
      return user;
    },

    findById: async (id: number): Promise<User | null> => {
      return this.data.users.get(id) || null;
    },

    findByEmail: async (email: string): Promise<User | null> => {
      for (const user of this.data.users.values()) {
        if (user.email === email) return user;
      }
      return null;
    },

    findByUsername: async (username: string): Promise<User | null> => {
      for (const user of this.data.users.values()) {
        if (user.username === username) return user;
      }
      return null;
    },

    findAll: async (): Promise<User[]> => {
      return Array.from(this.data.users.values());
    },

    findByRole: async (role: string): Promise<User[]> => {
      return Array.from(this.data.users.values()).filter(user => user.role === role);
    },

    update: async (id: number, data: Partial<UserInsert>): Promise<User | null> => {
      const existing = this.data.users.get(id);
      if (!existing) return null;

      const updated = { ...existing, ...this.updateTimestamps(data) } as User;
      this.data.users.set(id, updated);
      return updated;
    },

    delete: async (id: number): Promise<boolean> => {
      return this.data.users.delete(id);
    },
  };

  // Menu Categories
  menuCategories = {
    create: async (data: MenuCategoryInsert): Promise<MenuCategory> => {
      const id = this.generateId('menuCategories');
      const category = { id, ...this.addTimestamps(data) } as MenuCategory;
      this.data.menuCategories.set(id, category);
      return category;
    },

    findById: async (id: number): Promise<MenuCategory | null> => {
      return this.data.menuCategories.get(id) || null;
    },

    findAll: async (): Promise<MenuCategory[]> => {
      return Array.from(this.data.menuCategories.values());
    },

    findActive: async (): Promise<MenuCategory[]> => {
      return Array.from(this.data.menuCategories.values()).filter(cat => cat.isActive);
    },

    update: async (id: number, data: Partial<MenuCategoryInsert>): Promise<MenuCategory | null> => {
      const existing = this.data.menuCategories.get(id);
      if (!existing) return null;

      const updated = { ...existing, ...this.updateTimestamps(data) } as MenuCategory;
      this.data.menuCategories.set(id, updated);
      return updated;
    },

    delete: async (id: number): Promise<boolean> => {
      return this.data.menuCategories.delete(id);
    },
  };

  // Menu Items
  menuItems = {
    create: async (data: MenuItemInsert): Promise<MenuItem> => {
      const id = this.generateId('menuItems');
      const item = { id, ...this.addTimestamps(data) } as MenuItem;
      this.data.menuItems.set(id, item);
      return item;
    },

    findById: async (id: number): Promise<MenuItem | null> => {
      return this.data.menuItems.get(id) || null;
    },

    findAll: async (): Promise<MenuItem[]> => {
      return Array.from(this.data.menuItems.values());
    },

    findByCategory: async (categoryId: number): Promise<MenuItem[]> => {
      return Array.from(this.data.menuItems.values()).filter(item => item.categoryId === categoryId);
    },

    findAvailable: async (): Promise<MenuItem[]> => {
      return Array.from(this.data.menuItems.values()).filter(item => item.available);
    },

    search: async (query: string): Promise<MenuItem[]> => {
      const lowercaseQuery = query.toLowerCase();
      return Array.from(this.data.menuItems.values()).filter(item => 
        item.name.toLowerCase().includes(lowercaseQuery) ||
        (item.description && item.description.toLowerCase().includes(lowercaseQuery))
      );
    },

    update: async (id: number, data: Partial<MenuItemInsert>): Promise<MenuItem | null> => {
      const existing = this.data.menuItems.get(id);
      if (!existing) return null;

      const updated = { ...existing, ...this.updateTimestamps(data) } as MenuItem;
      this.data.menuItems.set(id, updated);
      return updated;
    },

    delete: async (id: number): Promise<boolean> => {
      return this.data.menuItems.delete(id);
    },
  };

  // Categories
  categories = {
    create: async (data: CategoryInsert): Promise<Category> => {
      const id = this.generateId('categories');
      const category = { id, ...this.addTimestamps(data) } as Category;
      this.data.categories.set(id, category);
      return category;
    },

    findById: async (id: number): Promise<Category | null> => {
      return this.data.categories.get(id) || null;
    },

    findAll: async (): Promise<Category[]> => {
      return Array.from(this.data.categories.values());
    },

    findActive: async (): Promise<Category[]> => {
      return Array.from(this.data.categories.values()).filter(cat => cat.isActive);
    },

    update: async (id: number, data: Partial<CategoryInsert>): Promise<Category | null> => {
      const existing = this.data.categories.get(id);
      if (!existing) return null;

      const updated = { ...existing, ...this.updateTimestamps(data) } as Category;
      this.data.categories.set(id, updated);
      return updated;
    },

    delete: async (id: number): Promise<boolean> => {
      return this.data.categories.delete(id);
    },
  };

  // Tables
  tables = {
    create: async (data: TableInsert): Promise<Table> => {
      const id = this.generateId('tables');
      const table = { id, ...this.addTimestamps(data) } as Table;
      this.data.tables.set(id, table);
      return table;
    },

    findById: async (id: number): Promise<Table | null> => {
      return this.data.tables.get(id) || null;
    },

    findByNumber: async (number: number): Promise<Table | null> => {
      for (const table of this.data.tables.values()) {
        if (table.number === number) return table;
      }
      return null;
    },

    findAll: async (): Promise<Table[]> => {
      return Array.from(this.data.tables.values());
    },

    findByStatus: async (status: string): Promise<Table[]> => {
      return Array.from(this.data.tables.values()).filter(table => table.status === status);
    },

    findAvailable: async (): Promise<Table[]> => {
      return Array.from(this.data.tables.values()).filter(table => table.status === 'available');
    },

    update: async (id: number, data: Partial<TableInsert>): Promise<Table | null> => {
      const existing = this.data.tables.get(id);
      if (!existing) return null;

      const updated = { ...existing, ...this.updateTimestamps(data) } as Table;
      this.data.tables.set(id, updated);
      return updated;
    },

    delete: async (id: number): Promise<boolean> => {
      return this.data.tables.delete(id);
    },
  };

  // Customers
  customers = {
    create: async (data: CustomerInsert): Promise<Customer> => {
      const id = this.generateId('customers');
      const customer = { id, ...this.addTimestamps(data) } as Customer;
      this.data.customers.set(id, customer);
      return customer;
    },

    findById: async (id: number): Promise<Customer | null> => {
      return this.data.customers.get(id) || null;
    },

    findByEmail: async (email: string): Promise<Customer | null> => {
      for (const customer of this.data.customers.values()) {
        if (customer.email === email) return customer;
      }
      return null;
    },

    findAll: async (): Promise<Customer[]> => {
      return Array.from(this.data.customers.values());
    },

    findActive: async (): Promise<Customer[]> => {
      return Array.from(this.data.customers.values()).filter(customer => customer.isActive);
    },

    search: async (query: string): Promise<Customer[]> => {
      const lowercaseQuery = query.toLowerCase();
      return Array.from(this.data.customers.values()).filter(customer => 
        customer.firstName.toLowerCase().includes(lowercaseQuery) ||
        customer.lastName.toLowerCase().includes(lowercaseQuery) ||
        customer.email.toLowerCase().includes(lowercaseQuery)
      );
    },

    update: async (id: number, data: Partial<CustomerInsert>): Promise<Customer | null> => {
      const existing = this.data.customers.get(id);
      if (!existing) return null;

      const updated = { ...existing, ...this.updateTimestamps(data) } as Customer;
      this.data.customers.set(id, updated);
      return updated;
    },

    delete: async (id: number): Promise<boolean> => {
      return this.data.customers.delete(id);
    },
  };

  // Reservations
  reservations = {
    create: async (data: ReservationInsert): Promise<Reservation> => {
      const id = this.generateId('reservations');
      const reservation = { id, ...this.addTimestamps(data) } as Reservation;
      this.data.reservations.set(id, reservation);
      return reservation;
    },

    findById: async (id: number): Promise<Reservation | null> => {
      return this.data.reservations.get(id) || null;
    },

    findAll: async (): Promise<Reservation[]> => {
      return Array.from(this.data.reservations.values());
    },

    findByCustomer: async (customerId: number): Promise<Reservation[]> => {
      return Array.from(this.data.reservations.values()).filter(res => res.customerId === customerId);
    },

    findByTable: async (tableId: number): Promise<Reservation[]> => {
      return Array.from(this.data.reservations.values()).filter(res => res.tableId === tableId);
    },

    findByDate: async (date: string): Promise<Reservation[]> => {
      return Array.from(this.data.reservations.values()).filter(res => 
        res.date.toISOString().startsWith(date)
      );
    },

    findByStatus: async (status: string): Promise<Reservation[]> => {
      return Array.from(this.data.reservations.values()).filter(res => res.status === status);
    },

    update: async (id: number, data: Partial<ReservationInsert>): Promise<Reservation | null> => {
      const existing = this.data.reservations.get(id);
      if (!existing) return null;

      const updated = { ...existing, ...this.updateTimestamps(data) } as Reservation;
      this.data.reservations.set(id, updated);
      return updated;
    },

    delete: async (id: number): Promise<boolean> => {
      return this.data.reservations.delete(id);
    },
  };

  // Orders
  orders = {
    create: async (data: OrderInsert): Promise<Order> => {
      const id = this.generateId('orders');
      const order = { id, ...this.addTimestamps(data) } as Order;
      this.data.orders.set(id, order);
      return order;
    },

    findById: async (id: number): Promise<Order | null> => {
      return this.data.orders.get(id) || null;
    },

    findByNumber: async (orderNumber: string): Promise<Order | null> => {
      for (const order of this.data.orders.values()) {
        if (order.orderNumber === orderNumber) return order;
      }
      return null;
    },

    findAll: async (): Promise<Order[]> => {
      return Array.from(this.data.orders.values());
    },

    findByCustomer: async (customerId: number): Promise<Order[]> => {
      return Array.from(this.data.orders.values()).filter(order => order.customerId === customerId);
    },

    findByTable: async (tableId: number): Promise<Order[]> => {
      return Array.from(this.data.orders.values()).filter(order => order.tableId === tableId);
    },

    findByStatus: async (status: string): Promise<Order[]> => {
      return Array.from(this.data.orders.values()).filter(order => order.status === status);
    },

    findByDateRange: async (start: string, end: string): Promise<Order[]> => {
      const startDate = new Date(start);
      const endDate = new Date(end);
      return Array.from(this.data.orders.values()).filter(order => 
        order.createdAt >= startDate && order.createdAt <= endDate
      );
    },

    update: async (id: number, data: Partial<OrderInsert>): Promise<Order | null> => {
      const existing = this.data.orders.get(id);
      if (!existing) return null;

      const updated = { ...existing, ...this.updateTimestamps(data) } as Order;
      this.data.orders.set(id, updated);
      return updated;
    },

    delete: async (id: number): Promise<boolean> => {
      return this.data.orders.delete(id);
    },
  };

  // OrderItems
  orderItems = {
    create: async (data: OrderItemInsert): Promise<OrderItem> => {
      const id = this.generateId('orderItems');
      const orderItem = { id, ...this.addTimestamps(data) } as OrderItem;
      this.data.orderItems.set(id, orderItem);
      return orderItem;
    },

    findById: async (id: number): Promise<OrderItem | null> => {
      return this.data.orderItems.get(id) || null;
    },

    findByOrder: async (orderId: number): Promise<OrderItem[]> => {
      return Array.from(this.data.orderItems.values()).filter(item => item.orderId === orderId);
    },

    findAll: async (): Promise<OrderItem[]> => {
      return Array.from(this.data.orderItems.values());
    },

    update: async (id: number, data: Partial<OrderItemInsert>): Promise<OrderItem | null> => {
      const existing = this.data.orderItems.get(id);
      if (!existing) return null;

      const updated = { ...existing, ...data } as OrderItem;
      this.data.orderItems.set(id, updated);
      return updated;
    },

    delete: async (id: number): Promise<boolean> => {
      return this.data.orderItems.delete(id);
    },
  };

  // ContactMessages
  contactMessages = {
    create: async (data: ContactMessageInsert): Promise<ContactMessage> => {
      const id = this.generateId('contactMessages');
      const message = { id, ...this.addTimestamps(data) } as ContactMessage;
      this.data.contactMessages.set(id, message);
      return message;
    },

    findById: async (id: number): Promise<ContactMessage | null> => {
      return this.data.contactMessages.get(id) || null;
    },

    findAll: async (): Promise<ContactMessage[]> => {
      return Array.from(this.data.contactMessages.values());
    },

    findUnread: async (): Promise<ContactMessage[]> => {
      return Array.from(this.data.contactMessages.values()).filter(msg => !msg.isRead);
    },

    markAsRead: async (id: number): Promise<boolean> => {
      const existing = this.data.contactMessages.get(id);
      if (!existing) return false;

      const updated = { ...existing, isRead: true } as ContactMessage;
      this.data.contactMessages.set(id, updated);
      return true;
    },

    delete: async (id: number): Promise<boolean> => {
      return this.data.contactMessages.delete(id);
    },
  };

  // Feedback
  feedback = {
    create: async (data: FeedbackInsert): Promise<Feedback> => {
      const id = this.generateId('feedback');
      const feedback = { id, ...this.addTimestamps(data) } as Feedback;
      this.data.feedback.set(id, feedback);
      return feedback;
    },

    findById: async (id: number): Promise<Feedback | null> => {
      return this.data.feedback.get(id) || null;
    },

    findAll: async (): Promise<Feedback[]> => {
      return Array.from(this.data.feedback.values());
    },

    findByCustomer: async (customerId: number): Promise<Feedback[]> => {
      return Array.from(this.data.feedback.values()).filter(f => f.customerId === customerId);
    },

    findByOrder: async (orderId: number): Promise<Feedback[]> => {
      return Array.from(this.data.feedback.values()).filter(f => f.orderId === orderId);
    },

    findByStatus: async (status: string): Promise<Feedback[]> => {
      return Array.from(this.data.feedback.values()).filter(f => f.status === status);
    },

    update: async (id: number, data: Partial<FeedbackInsert>): Promise<Feedback | null> => {
      const existing = this.data.feedback.get(id);
      if (!existing) return null;

      const updated = { ...existing, ...this.updateTimestamps(data) } as Feedback;
      this.data.feedback.set(id, updated);
      return updated;
    },

    delete: async (id: number): Promise<boolean> => {
      return this.data.feedback.delete(id);
    },
  };

  // MenuItemImages
  menuItemImages = {
    create: async (data: MenuItemImageInsert): Promise<MenuItemImage> => {
      const id = this.generateId('menuItemImages');
      const image = { id, ...this.addTimestamps(data) } as MenuItemImage;
      this.data.menuItemImages.set(id, image);
      return image;
    },
    findById: async (id: number): Promise<MenuItemImage | null> => this.data.menuItemImages.get(id) || null,
    findByMenuItem: async (menuItemId: number): Promise<MenuItemImage[]> => 
      Array.from(this.data.menuItemImages.values()).filter(img => img.menuItemId === menuItemId),
    findAll: async (): Promise<MenuItemImage[]> => Array.from(this.data.menuItemImages.values()),
    update: async (id: number, data: Partial<MenuItemImageInsert>): Promise<MenuItemImage | null> => {
      const existing = this.data.menuItemImages.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...data } as MenuItemImage;
      this.data.menuItemImages.set(id, updated);
      return updated;
    },
    delete: async (id: number): Promise<boolean> => this.data.menuItemImages.delete(id),
  };

  activityLogs = {
    create: async (data: ActivityLogInsert): Promise<ActivityLog> => {
      const id = this.generateId('activityLogs');
      const log = { id, ...this.addTimestamps(data) } as ActivityLog;
      this.data.activityLogs.set(id, log);
      return log;
    },
    findById: async (id: number): Promise<ActivityLog | null> => this.data.activityLogs.get(id) || null,
    findAll: async (): Promise<ActivityLog[]> => Array.from(this.data.activityLogs.values()),
    findByUser: async (userId: number): Promise<ActivityLog[]> => 
      Array.from(this.data.activityLogs.values()).filter(log => log.userId === userId),
    findByEntity: async (entity: string, entityId?: number): Promise<ActivityLog[]> => 
      Array.from(this.data.activityLogs.values()).filter(log => 
        log.entity === entity && (entityId === undefined || log.entityId === entityId)
      ),
    findByDateRange: async (start: string, end: string): Promise<ActivityLog[]> => {
      const startDate = new Date(start);
      const endDate = new Date(end);
      return Array.from(this.data.activityLogs.values()).filter(log => 
        log.createdAt >= startDate && log.createdAt <= endDate
      );
    },
    delete: async (id: number): Promise<boolean> => this.data.activityLogs.delete(id),
  };

  employees = {
    create: async (data: EmployeeInsert): Promise<Employee> => {
      const id = this.generateId('employees');
      const employee = { id, ...this.addTimestamps(data) } as Employee;
      this.data.employees.set(id, employee);
      return employee;
    },
    findById: async (id: number): Promise<Employee | null> => this.data.employees.get(id) || null,
    findByNumber: async (employeeNumber: string): Promise<Employee | null> => {
      for (const emp of this.data.employees.values()) {
        if (emp.employeeNumber === employeeNumber) return emp;
      }
      return null;
    },
    findAll: async (): Promise<Employee[]> => Array.from(this.data.employees.values()),
    findActive: async (): Promise<Employee[]> => 
      Array.from(this.data.employees.values()).filter(emp => emp.isActive),
    findByPosition: async (position: string): Promise<Employee[]> => 
      Array.from(this.data.employees.values()).filter(emp => emp.position === position),
    update: async (id: number, data: Partial<EmployeeInsert>): Promise<Employee | null> => {
      const existing = this.data.employees.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...this.updateTimestamps(data) } as Employee;
      this.data.employees.set(id, updated);
      return updated;
    },
    delete: async (id: number): Promise<boolean> => this.data.employees.delete(id),
  };

  shifts = {
    create: async (data: ShiftInsert): Promise<Shift> => {
      const id = this.generateId('shifts');
      const shift = { id, ...this.addTimestamps(data) } as Shift;
      this.data.shifts.set(id, shift);
      return shift;
    },
    findById: async (id: number): Promise<Shift | null> => this.data.shifts.get(id) || null,
    findAll: async (): Promise<Shift[]> => Array.from(this.data.shifts.values()),
    findByEmployee: async (employeeId: number): Promise<Shift[]> => 
      Array.from(this.data.shifts.values()).filter(shift => shift.employeeId === employeeId),
    findByDate: async (date: string): Promise<Shift[]> => 
      Array.from(this.data.shifts.values()).filter(shift => 
        shift.date.toISOString().startsWith(date)
      ),
    findByStatus: async (status: string): Promise<Shift[]> => 
      Array.from(this.data.shifts.values()).filter(shift => shift.status === status),
    findByDateRange: async (start: string, end: string): Promise<Shift[]> => {
      const startDate = new Date(start);
      const endDate = new Date(end);
      return Array.from(this.data.shifts.values()).filter(shift => 
        shift.date >= startDate && shift.date <= endDate
      );
    },
    update: async (id: number, data: Partial<ShiftInsert>): Promise<Shift | null> => {
      const existing = this.data.shifts.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...this.updateTimestamps(data) } as Shift;
      this.data.shifts.set(id, updated);
      return updated;
    },
    delete: async (id: number): Promise<boolean> => this.data.shifts.delete(id),
  };

  suppliers = {
    create: async (data: SupplierInsert): Promise<Supplier> => {
      const id = this.generateId('suppliers');
      const supplier = { id, ...this.addTimestamps(data) } as Supplier;
      this.data.suppliers.set(id, supplier);
      return supplier;
    },
    findById: async (id: number): Promise<Supplier | null> => this.data.suppliers.get(id) || null,
    findAll: async (): Promise<Supplier[]> => Array.from(this.data.suppliers.values()),
    findActive: async (): Promise<Supplier[]> => 
      Array.from(this.data.suppliers.values()).filter(sup => sup.isActive),
    search: async (query: string): Promise<Supplier[]> => {
      const lowercaseQuery = query.toLowerCase();
      return Array.from(this.data.suppliers.values()).filter(sup => 
        sup.name.toLowerCase().includes(lowercaseQuery)
      );
    },
    update: async (id: number, data: Partial<SupplierInsert>): Promise<Supplier | null> => {
      const existing = this.data.suppliers.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...this.updateTimestamps(data) } as Supplier;
      this.data.suppliers.set(id, updated);
      return updated;
    },
    delete: async (id: number): Promise<boolean> => this.data.suppliers.delete(id),
  };

  inventory = {
    create: async (data: InventoryInsert): Promise<Inventory> => {
      const id = this.generateId('inventory');
      const inventory = { id, ...this.addTimestamps(data) } as Inventory;
      this.data.inventory.set(id, inventory);
      return inventory;
    },
    findById: async (id: number): Promise<Inventory | null> => this.data.inventory.get(id) || null,
    findAll: async (): Promise<Inventory[]> => Array.from(this.data.inventory.values()),
    findByMenuItem: async (menuItemId: number): Promise<Inventory[]> => 
      Array.from(this.data.inventory.values()).filter(inv => inv.menuItemId === menuItemId),
    findBySupplier: async (supplierId: number): Promise<Inventory[]> => 
      Array.from(this.data.inventory.values()).filter(inv => inv.supplierId === supplierId),
    findLowStock: async (): Promise<Inventory[]> => 
      Array.from(this.data.inventory.values()).filter(inv => inv.currentStock <= inv.minStock),
    update: async (id: number, data: Partial<InventoryInsert>): Promise<Inventory | null> => {
      const existing = this.data.inventory.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...this.updateTimestamps(data) } as Inventory;
      this.data.inventory.set(id, updated);
      return updated;
    },
    delete: async (id: number): Promise<boolean> => this.data.inventory.delete(id),
  };

  loyaltyTransactions = {
    create: async (data: LoyaltyTransactionInsert): Promise<LoyaltyTransaction> => {
      const id = this.generateId('loyaltyTransactions');
      const transaction = { id, ...this.addTimestamps(data) } as LoyaltyTransaction;
      this.data.loyaltyTransactions.set(id, transaction);
      return transaction;
    },
    findById: async (id: number): Promise<LoyaltyTransaction | null> => this.data.loyaltyTransactions.get(id) || null,
    findAll: async (): Promise<LoyaltyTransaction[]> => Array.from(this.data.loyaltyTransactions.values()),
    findByCustomer: async (customerId: number): Promise<LoyaltyTransaction[]> => 
      Array.from(this.data.loyaltyTransactions.values()).filter(t => t.customerId === customerId),
    findByOrder: async (orderId: number): Promise<LoyaltyTransaction[]> => 
      Array.from(this.data.loyaltyTransactions.values()).filter(t => t.orderId === orderId),
    findByType: async (type: string): Promise<LoyaltyTransaction[]> => 
      Array.from(this.data.loyaltyTransactions.values()).filter(t => t.type === type),
    delete: async (id: number): Promise<boolean> => this.data.loyaltyTransactions.delete(id),
  };

  permissions = {
    create: async (data: PermissionInsert): Promise<Permission> => {
      const id = this.generateId('permissions');
      const permission = { id, ...this.addTimestamps(data) } as Permission;
      this.data.permissions.set(id, permission);
      return permission;
    },
    findById: async (id: number): Promise<Permission | null> => this.data.permissions.get(id) || null,
    findAll: async (): Promise<Permission[]> => Array.from(this.data.permissions.values()),
    findByUser: async (userId: number): Promise<Permission[]> => 
      Array.from(this.data.permissions.values()).filter(p => p.userId === userId),
    findByModule: async (module: string): Promise<Permission[]> => 
      Array.from(this.data.permissions.values()).filter(p => p.module === module),
    update: async (id: number, data: Partial<PermissionInsert>): Promise<Permission | null> => {
      const existing = this.data.permissions.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...this.updateTimestamps(data) } as Permission;
      this.data.permissions.set(id, updated);
      return updated;
    },
    delete: async (id: number): Promise<boolean> => this.data.permissions.delete(id),
  };
}

// Export de l'instance singleton pour utilisation globale
export const storage = MemStorage.getInstance();