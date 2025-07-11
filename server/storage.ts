import { 
  users, menuCategories, menuItems, tables, reservations, reservationItems, contactMessages,
  orders, orderItems, customers, employees, workShifts, activityLogs, permissions,
  type User, type InsertUser, type MenuCategory, type InsertMenuCategory,
  type MenuItem, type InsertMenuItem, type Table, type InsertTable,
  type Reservation, type InsertReservation, type ContactMessage, type InsertContactMessage,
  type Order, type InsertOrder, type OrderItem, type InsertOrderItem,
  type Customer, type InsertCustomer, type Employee, type InsertEmployee,
  type WorkShift, type InsertWorkShift, type ActivityLog, type InsertActivityLog,
  type Permission, type InsertPermission
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql, between, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Users
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  updateUserLastLogin(id: number): Promise<User | undefined>;

  // Activity Logs
  getActivityLogs(limit?: number): Promise<ActivityLog[]>;
  getActivityLogsByUser(userId: number): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;

  // Permissions
  getUserPermissions(userId: number): Promise<Permission[]>;
  createPermission(permission: InsertPermission): Promise<Permission>;
  updatePermission(id: number, permission: Partial<InsertPermission>): Promise<Permission | undefined>;
  deletePermission(id: number): Promise<boolean>;

  // Menu Categories
  getMenuCategories(): Promise<MenuCategory[]>;
  createMenuCategory(category: InsertMenuCategory): Promise<MenuCategory>;

  // Menu Items
  getMenuItems(): Promise<MenuItem[]>;
  getMenuItemsByCategory(categoryId: number): Promise<MenuItem[]>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: number, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined>;
  deleteMenuItem(id: number): Promise<boolean>;

  // Tables
  getTables(): Promise<Table[]>;
  getAvailableTables(date: string, time: string): Promise<Table[]>;
  createTable(table: InsertTable): Promise<Table>;

  // Reservations
  getReservations(): Promise<Reservation[]>;
  getReservationsWithItems(): Promise<any[]>;
  getPendingNotificationReservations(): Promise<any[]>;
  getReservationsByDate(date: string): Promise<Reservation[]>;
  getReservation(id: number): Promise<Reservation | undefined>;
  createReservation(reservation: any): Promise<Reservation>;
  createReservationWithItems(reservation: any, cartItems: any[]): Promise<Reservation>;
  updateReservationStatus(id: number, status: string): Promise<Reservation | undefined>;
  updateReservation(id: number, reservation: any): Promise<Reservation | undefined>;
  markNotificationSent(id: number): Promise<Reservation | undefined>;
  deleteReservation(id: number): Promise<boolean>;
  checkReservationConflict(date: string, time: string, tableId?: number): Promise<boolean>;

  // Contact Messages
  getContactMessages(): Promise<ContactMessage[]>;
  createContactMessage(message: any): Promise<ContactMessage>;
  updateContactMessageStatus(id: number, status: string): Promise<ContactMessage | undefined>;
  updateMessageStatus(id: number, status: string): Promise<ContactMessage | undefined>;

  // Orders
  getOrders(): Promise<Order[]>;
  getOrdersByDate(date: string): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: any): Promise<Order>;
  createOrderWithItems(order: any, items: any[]): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  deleteOrder(id: number): Promise<boolean>;

  // Order Items
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  updateOrderItem(id: number, orderItem: Partial<InsertOrderItem>): Promise<OrderItem | undefined>;
  deleteOrderItem(id: number): Promise<boolean>;

  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  createCustomer(customer: any): Promise<Customer>;
  updateCustomer(id: number, customer: any): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;

  // Employees
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: number): Promise<Employee | undefined>;
  getEmployeeByEmail(email: string): Promise<Employee | undefined>;
  createEmployee(employee: any): Promise<Employee>;
  updateEmployee(id: number, employee: any): Promise<Employee | undefined>;
  deleteEmployee(id: number): Promise<boolean>;

  // Work Shifts
  getWorkShifts(): Promise<WorkShift[]>;
  getWorkShiftsByEmployee(employeeId: number): Promise<WorkShift[]>;
  getWorkShiftsByDate(date: string): Promise<WorkShift[]>;
  createWorkShift(workShift: InsertWorkShift): Promise<WorkShift>;
  updateWorkShift(id: number, workShift: Partial<InsertWorkShift>): Promise<WorkShift | undefined>;
  deleteWorkShift(id: number): Promise<boolean>;

  // Statistics
  getTodayReservationCount(): Promise<number>;
  getOccupancyRate(date: string): Promise<number>;
  getMonthlyReservationStats(year: number, month: number): Promise<{ date: string; count: number }[]>;
  getRevenueStats(startDate: string, endDate: string): Promise<{ date: string; revenue: number }[]>;
  getOrdersByStatus(): Promise<{ status: string; count: number }[]>;
  getTopCustomers(limit?: number): Promise<{ customer: Customer; totalSpent: number; totalOrders: number }[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.createdAt));
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set({ ...user, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  async updateUserLastLogin(id: number): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  // Activity Logs
  async getActivityLogs(limit: number = 50): Promise<ActivityLog[]> {
    return await db.select().from(activityLogs)
      .orderBy(desc(activityLogs.timestamp))
      .limit(limit);
  }

  async getActivityLogsByUser(userId: number): Promise<ActivityLog[]> {
    return await db.select().from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.timestamp));
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [newLog] = await db.insert(activityLogs).values(log).returning();
    return newLog;
  }

  // Permissions
  async getUserPermissions(userId: number): Promise<Permission[]> {
    return await db.select().from(permissions)
      .where(eq(permissions.userId, userId));
  }

  async createPermission(permission: InsertPermission): Promise<Permission> {
    const [newPermission] = await db.insert(permissions).values(permission).returning();
    return newPermission;
  }

  async updatePermission(id: number, permission: Partial<InsertPermission>): Promise<Permission | undefined> {
    const [updatedPermission] = await db.update(permissions)
      .set(permission)
      .where(eq(permissions.id, id))
      .returning();
    return updatedPermission || undefined;
  }

  async deletePermission(id: number): Promise<boolean> {
    const result = await db.delete(permissions).where(eq(permissions.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Menu Categories
  async getMenuCategories(): Promise<MenuCategory[]> {
    try {
      const result = await db.select().from(menuCategories).orderBy(asc(menuCategories.displayOrder));
      return result;
    } catch (error) {
      console.error('Erreur getMenuCategories:', error);
      // Retourner des données par défaut si la BD n'est pas disponible
      return [
        { id: 1, name: 'Cafés', description: 'Nos délicieux cafés', slug: 'cafes', displayOrder: 1 },
        { id: 2, name: 'Thés', description: 'Sélection de thés premium', slug: 'thes', displayOrder: 2 },
        { id: 3, name: 'Pâtisseries', description: 'Pâtisseries fraîches', slug: 'patisseries', displayOrder: 3 },
        { id: 4, name: 'Plats', description: 'Plats savoureux', slug: 'plats', displayOrder: 4 }
      ];
    }
  }

  async createMenuCategory(category: InsertMenuCategory): Promise<MenuCategory> {
    const [newCategory] = await db.insert(menuCategories).values(category).returning();
    return newCategory;
  }

  // Menu Items
  async getMenuItems(): Promise<MenuItem[]> {
    try {
      const result = await db.select().from(menuItems).orderBy(asc(menuItems.name));
      return result;
    } catch (error) {
      console.error('Erreur getMenuItems:', error);
      // Retourner des données par défaut si la BD n'est pas disponible
      return [
        { id: 1, name: 'Espresso', description: 'Café court et corsé', price: '2.50', categoryId: 1, available: true, imageUrl: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg' },
        { id: 2, name: 'Cappuccino', description: 'Café avec mousse de lait', price: '3.50', categoryId: 1, available: true, imageUrl: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg' },
        { id: 3, name: 'Thé Vert', description: 'Thé vert premium', price: '2.00', categoryId: 2, available: true, imageUrl: 'https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg' },
        { id: 4, name: 'Croissant', description: 'Croissant frais au beurre', price: '2.80', categoryId: 3, available: true, imageUrl: 'https://images.pexels.com/photos/209540/pexels-photo-209540.jpeg' }
      ];
    }
  }

  async getMenuItemsByCategory(categoryId: number): Promise<MenuItem[]> {
    return await db.select().from(menuItems).where(eq(menuItems.categoryId, categoryId));
  }

  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    const [newItem] = await db.insert(menuItems).values(item).returning();
    return newItem;
  }

  async updateMenuItem(id: number, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const [updatedItem] = await db
      .update(menuItems)
      .set(item)
      .where(eq(menuItems.id, id))
      .returning();
    return updatedItem || undefined;
  }

  async deleteMenuItem(id: number): Promise<boolean> {
    const result = await db.delete(menuItems).where(eq(menuItems.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Tables
  async getTables(): Promise<Table[]> {
    return await db.select().from(tables).orderBy(asc(tables.number));
  }

  async getAvailableTables(date: string, time: string): Promise<Table[]> {
    // Get all tables that are not reserved at the given date and time
    const reservedTables = await db
      .select({ tableId: reservations.tableId })
      .from(reservations)
      .where(
        and(
          eq(reservations.date, date),
          eq(reservations.time, time),
          eq(reservations.status, "confirmed")
        )
      );

    const reservedTableIds = reservedTables.map(r => r.tableId).filter(id => id !== null);

    if (reservedTableIds.length === 0) {
      return await this.getTables();
    }

    return await db
      .select()
      .from(tables)
      .where(
        and(
          eq(tables.available, true),
          // Use NOT IN equivalent
        )
      );
  }

  async createTable(table: InsertTable): Promise<Table> {
    const [newTable] = await db.insert(tables).values(table).returning();
    return newTable;
  }

  // Reservations
  async getReservations(): Promise<Reservation[]> {
    return await db.select().from(reservations).orderBy(desc(reservations.createdAt));
  }

  async getReservationsWithItems(): Promise<any[]> {
    const reservationsData = await db.select().from(reservations).orderBy(desc(reservations.createdAt));
    
    const reservationsWithItems = await Promise.all(
      reservationsData.map(async (reservation) => {
        const items = await db
          .select({
            id: reservationItems.id,
            menuItemName: menuItems.name,
            quantity: reservationItems.quantity,
            unitPrice: reservationItems.unitPrice,
            notes: reservationItems.notes,
          })
          .from(reservationItems)
          .leftJoin(menuItems, eq(reservationItems.menuItemId, menuItems.id))
          .where(eq(reservationItems.reservationId, reservation.id));

        return {
          ...reservation,
          reservationItems: items,
        };
      })
    );

    return reservationsWithItems;
  }

  async getPendingNotificationReservations(): Promise<any[]> {
    return await db
      .select()
      .from(reservations)
      .where(eq(reservations.notificationSent, false))
      .orderBy(desc(reservations.createdAt));
  }

  async createReservationWithItems(reservationData: any, cartItems: any[]): Promise<Reservation> {
    const [reservation] = await db.insert(reservations).values(reservationData).returning();
    
    if (cartItems && cartItems.length > 0) {
      const reservationItemsData = cartItems.map((item) => ({
        reservationId: reservation.id,
        menuItemId: item.menuItem.id,
        quantity: item.quantity,
        unitPrice: item.menuItem.price,
        notes: item.notes || null,
      }));
      
      await db.insert(reservationItems).values(reservationItemsData);
    }
    
    return reservation;
  }

  async markNotificationSent(id: number): Promise<Reservation | undefined> {
    const [reservation] = await db
      .update(reservations)
      .set({ notificationSent: true })
      .where(eq(reservations.id, id))
      .returning();
    return reservation || undefined;
  }

  async getReservationsByDate(date: string): Promise<Reservation[]> {
    return await db
      .select()
      .from(reservations)
      .where(eq(reservations.date, date))
      .orderBy(asc(reservations.time));
  }

  async getReservation(id: number): Promise<Reservation | undefined> {
    const [reservation] = await db.select().from(reservations).where(eq(reservations.id, id));
    return reservation || undefined;
  }

async createReservation(reservation: any): Promise<Reservation> {
  // On retire createdAt s'il existe (juste au cas où), pour laisser la BDD le gérer (defaultNow)
  const data = { ...reservation };
  delete (data as any).createdAt;
  console.log('Données reçues pour insertion réservation:', data);
  const [newReservation] = await db.insert(reservations).values(data).returning();
  return newReservation;
}

  async updateReservationStatus(id: number, status: string): Promise<Reservation | undefined> {
    const [updatedReservation] = await db
      .update(reservations)
      .set({ status })
      .where(eq(reservations.id, id))
      .returning();
    return updatedReservation || undefined;
  }

  async updateReservation(id: number, reservationData: any): Promise<Reservation | undefined> {
    const data = { ...reservationData };
    delete (data as any).id;
    delete (data as any).createdAt;
    
    const [updatedReservation] = await db
      .update(reservations)
      .set(data)
      .where(eq(reservations.id, id))
      .returning();
    return updatedReservation || undefined;
  }

  async deleteReservation(id: number): Promise<boolean> {
    const result = await db.delete(reservations).where(eq(reservations.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async checkReservationConflict(date: string, time: string, tableId?: number): Promise<boolean> {
    const whereConditions = [
      eq(reservations.date, date),
      eq(reservations.time, time),
      eq(reservations.status, "confirmed")
    ];

    if (tableId) {
      whereConditions.push(eq(reservations.tableId, tableId));
    }

    const [conflict] = await db
      .select({ id: reservations.id })
      .from(reservations)
      .where(and(...whereConditions))
      .limit(1);

    return !!conflict;
  }

  // Contact Messages
  async getContactMessages(): Promise<ContactMessage[]> {
    return await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
  }

  async getMessages(): Promise<ContactMessage[]> {
    return await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
  }

async createContactMessage(message: any): Promise<ContactMessage> {
  // Préparer les données pour l'insertion
  const data = {
    firstName: message.firstName || '',
    lastName: message.lastName || '',
    email: message.email,
    subject: message.subject,
    message: message.message,
    phone: message.phone || null,
    status: 'nouveau'
  };
  
  console.log('Données reçues pour insertion message:', data);
  const [newMessage] = await db.insert(contactMessages).values(data).returning();
  return newMessage;
}

async createMessage(message: any): Promise<ContactMessage> {
  return this.createContactMessage(message);
}

  async updateContactMessageStatus(id: number, status: string): Promise<ContactMessage | undefined> {
    const [updatedMessage] = await db
      .update(contactMessages)
      .set({ status })
      .where(eq(contactMessages.id, id))
      .returning();
    return updatedMessage || undefined;
  }

  async updateMessageStatus(id: number, status: string): Promise<ContactMessage | undefined> {
    return this.updateContactMessageStatus(id, status);
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrdersByDate(date: string): Promise<Order[]> {
    const startOfDay = new Date(date + 'T00:00:00Z');
    const endOfDay = new Date(date + 'T23:59:59Z');
    return await db.select().from(orders).where(
      and(
        gte(orders.createdAt, startOfDay),
        lte(orders.createdAt, endOfDay)
      )
    );
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async createOrder(order: any): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async createOrderWithItems(orderData: any, items: any[]): Promise<Order> {
    // Créer la commande
    const [newOrder] = await db.insert(orders).values(orderData).returning();
    
    // Ajouter les articles de la commande
    if (items && items.length > 0) {
      const orderItemsData = items.map(item => ({
        orderId: newOrder.id,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes || null,
      }));
      
      await db.insert(orderItems).values(orderItemsData);
    }
    
    return newOrder;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder || undefined;
  }

  async deleteOrder(id: number): Promise<boolean> {
    const result = await db.delete(orders).where(eq(orders.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Order Items
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const [newOrderItem] = await db.insert(orderItems).values(orderItem).returning();
    return newOrderItem;
  }

  async updateOrderItem(id: number, orderItem: Partial<InsertOrderItem>): Promise<OrderItem | undefined> {
    const [updatedOrderItem] = await db
      .update(orderItems)
      .set(orderItem)
      .where(eq(orderItems.id, id))
      .returning();
    return updatedOrderItem || undefined;
  }

  async deleteOrderItem(id: number): Promise<boolean> {
    const result = await db.delete(orderItems).where(eq(orderItems.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(asc(customers.lastName), asc(customers.firstName));
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.email, email));
    return customer || undefined;
  }

  async createCustomer(customer: any): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: number, customer: any): Promise<Customer | undefined> {
    const [updatedCustomer] = await db
      .update(customers)
      .set({ ...customer, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer || undefined;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    const result = await db.delete(customers).where(eq(customers.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Employees
  async getEmployees(): Promise<Employee[]> {
    return await db.select().from(employees).orderBy(asc(employees.lastName), asc(employees.firstName));
  }

  async getEmployee(id: number): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee || undefined;
  }

  async getEmployeeByEmail(email: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.email, email));
    return employee || undefined;
  }

  async createEmployee(employee: any): Promise<Employee> {
    const [newEmployee] = await db.insert(employees).values(employee).returning();
    return newEmployee;
  }

  async updateEmployee(id: number, employee: any): Promise<Employee | undefined> {
    const [updatedEmployee] = await db
      .update(employees)
      .set({ ...employee, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();
    return updatedEmployee || undefined;
  }

  async deleteEmployee(id: number): Promise<boolean> {
    const result = await db.delete(employees).where(eq(employees.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Work Shifts
  async getWorkShifts(): Promise<WorkShift[]> {
    return await db.select().from(workShifts).orderBy(desc(workShifts.date), asc(workShifts.startTime));
  }

  async getWorkShiftsByEmployee(employeeId: number): Promise<WorkShift[]> {
    return await db.select().from(workShifts).where(eq(workShifts.employeeId, employeeId));
  }

  async getWorkShiftsByDate(date: string): Promise<WorkShift[]> {
    return await db.select().from(workShifts).where(eq(workShifts.date, date));
  }

  async createWorkShift(workShift: InsertWorkShift): Promise<WorkShift> {
    const [newWorkShift] = await db.insert(workShifts).values(workShift).returning();
    return newWorkShift;
  }

  async updateWorkShift(id: number, workShift: Partial<InsertWorkShift>): Promise<WorkShift | undefined> {
    const [updatedWorkShift] = await db
      .update(workShifts)
      .set(workShift)
      .where(eq(workShifts.id, id))
      .returning();
    return updatedWorkShift || undefined;
  }

  async deleteWorkShift(id: number): Promise<boolean> {
    const result = await db.delete(workShifts).where(eq(workShifts.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Statistics
  async getTodayReservationCount(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const result = await db
      .select({ count: reservations.id })
      .from(reservations)
      .where(eq(reservations.date, today));
    return result.length;
  }

  async getOccupancyRate(date: string): Promise<number> {
    const totalTables = await db.select({ count: tables.id }).from(tables);
    const reservedTables = await db
      .select({ count: reservations.id })
      .from(reservations)
      .where(
        and(
          eq(reservations.date, date),
          eq(reservations.status, "confirmed")
        )
      );

    if (totalTables.length === 0) return 0;
    return Math.round((reservedTables.length / totalTables.length) * 100);
  }

  async getMonthlyReservationStats(year: number, month: number): Promise<{ date: string; count: number }[]> {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
    
    const result = await db
      .select({
        date: reservations.date
      })
      .from(reservations)
      .where(
        and(
          gte(reservations.date, startDate),
          lte(reservations.date, endDate)
        )
      );

    const stats: { [key: string]: number } = {};
    result.forEach(row => {
      stats[row.date] = (stats[row.date] || 0) + 1;
    });

    return Object.entries(stats).map(([date, count]) => ({ date, count }));
  }

  async getRevenueStats(startDate: string, endDate: string): Promise<{ date: string; revenue: number }[]> {
    const start = new Date(startDate + 'T00:00:00Z');
    const end = new Date(endDate + 'T23:59:59Z');
    
    const result = await db
      .select({
        date: orders.createdAt,
        revenue: orders.totalAmount
      })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, start),
          lte(orders.createdAt, end),
          eq(orders.status, "completed")
        )
      );

    const stats: { [key: string]: number } = {};
    result.forEach(row => {
      const date = row.date.toISOString().split('T')[0];
      stats[date] = (stats[date] || 0) + parseFloat(row.revenue);
    });

    return Object.entries(stats).map(([date, revenue]) => ({ date, revenue }));
  }

  async getOrdersByStatus(): Promise<{ status: string; count: number }[]> {
    const result = await db
      .select({
        status: orders.status,
        count: orders.id
      })
      .from(orders);

    const stats: { [key: string]: number } = {};
    result.forEach(row => {
      stats[row.status] = (stats[row.status] || 0) + 1;
    });

    return Object.entries(stats).map(([status, count]) => ({ status, count }));
  }

  async getTopCustomers(limit: number = 10): Promise<{ customer: Customer; totalSpent: number; totalOrders: number }[]> {
    const result = await db
      .select()
      .from(customers)
      .orderBy(desc(customers.totalSpent))
      .limit(limit);

    return result.map(customer => ({
      customer,
      totalSpent: parseFloat(customer.totalSpent),
      totalOrders: customer.totalOrders
    }));
  }
}

export const storage = new DatabaseStorage();