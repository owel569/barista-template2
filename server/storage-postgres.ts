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
import { getDb } from "./db";
import { eq, and, desc, asc, sql, between, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Users
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  updateUserLastLogin(id: number): Promise<User | undefined>;

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
  getTable(id: number): Promise<Table | undefined>;
  createTable(table: InsertTable): Promise<Table>;
  updateTable(id: number, table: Partial<InsertTable>): Promise<Table | undefined>;
  deleteTable(id: number): Promise<boolean>;

  // Reservations
  getReservations(): Promise<Reservation[]>;
  getReservation(id: number): Promise<Reservation | undefined>;
  createReservation(reservation: InsertReservation): Promise<Reservation>;
  updateReservation(id: number, reservation: Partial<InsertReservation>): Promise<Reservation | undefined>;
  deleteReservation(id: number): Promise<boolean>;

  // Contact Messages
  getContactMessages(): Promise<ContactMessage[]>;
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;

  // Orders
  getOrders(): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: any): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  deleteOrder(id: number): Promise<boolean>;

  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  createCustomer(customer: any): Promise<Customer>;
  updateCustomer(id: number, customer: any): Promise<Customer>;
  deleteCustomer(id: number): Promise<boolean>;

  // Employees
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: number): Promise<Employee | undefined>;
  getEmployeeByEmail(email: string): Promise<Employee | undefined>;
  createEmployee(employee: any): Promise<Employee>;
  updateEmployee(id: number, employee: any): Promise<Employee>;
  deleteEmployee(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUsers(): Promise<User[]> {
    const db = await getDb();
    return await db.select().from(users).orderBy(asc(users.createdAt));
  }

  async getUser(id: number): Promise<User | undefined> {
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const db = await getDb();
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const db = await getDb();
    const [updatedUser] = await db.update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async updateUserLastLogin(id: number): Promise<User | undefined> {
    const db = await getDb();
    const [updatedUser] = await db.update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Menu Categories
  async getMenuCategories(): Promise<MenuCategory[]> {
    const db = await getDb();
    return await db.select().from(menuCategories).orderBy(asc(menuCategories.name));
  }

  async createMenuCategory(category: InsertMenuCategory): Promise<MenuCategory> {
    const db = await getDb();
    const [newCategory] = await db.insert(menuCategories).values(category).returning();
    return newCategory;
  }

  // Menu Items
  async getMenuItems(): Promise<MenuItem[]> {
    const db = await getDb();
    return await db.select().from(menuItems).orderBy(asc(menuItems.name));
  }

  async getMenuItemsByCategory(categoryId: number): Promise<MenuItem[]> {
    const db = await getDb();
    return await db.select().from(menuItems)
      .where(eq(menuItems.categoryId, categoryId))
      .orderBy(asc(menuItems.name));
  }

  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    const db = await getDb();
    const [newItem] = await db.insert(menuItems).values(item).returning();
    return newItem;
  }

  async updateMenuItem(id: number, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const db = await getDb();
    const [updatedItem] = await db.update(menuItems)
      .set(item)
      .where(eq(menuItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteMenuItem(id: number): Promise<boolean> {
    const db = await getDb();
    const result = await db.delete(menuItems).where(eq(menuItems.id, id));
    return result.rowsAffected > 0;
  }

  // Tables
  async getTables(): Promise<Table[]> {
    const db = await getDb();
    return await db.select().from(tables).orderBy(asc(tables.number));
  }

  async getTable(id: number): Promise<Table | undefined> {
    const db = await getDb();
    const [table] = await db.select().from(tables).where(eq(tables.id, id));
    return table;
  }

  async createTable(table: InsertTable): Promise<Table> {
    const db = await getDb();
    const [newTable] = await db.insert(tables).values(table).returning();
    return newTable;
  }

  async updateTable(id: number, table: Partial<InsertTable>): Promise<Table | undefined> {
    const db = await getDb();
    const [updatedTable] = await db.update(tables)
      .set(table)
      .where(eq(tables.id, id))
      .returning();
    return updatedTable;
  }

  async deleteTable(id: number): Promise<boolean> {
    const db = await getDb();
    const result = await db.delete(tables).where(eq(tables.id, id));
    return result.rowsAffected > 0;
  }

  // Reservations
  async getReservations(): Promise<Reservation[]> {
    const db = await getDb();
    return await db.select().from(reservations).orderBy(desc(reservations.createdAt));
  }

  async getReservation(id: number): Promise<Reservation | undefined> {
    const db = await getDb();
    const [reservation] = await db.select().from(reservations).where(eq(reservations.id, id));
    return reservation;
  }

  async createReservation(reservation: InsertReservation): Promise<Reservation> {
    const db = await getDb();
    const [newReservation] = await db.insert(reservations).values(reservation).returning();
    return newReservation;
  }

  async updateReservation(id: number, reservation: Partial<InsertReservation>): Promise<Reservation | undefined> {
    const db = await getDb();
    const [updatedReservation] = await db.update(reservations)
      .set(reservation)
      .where(eq(reservations.id, id))
      .returning();
    return updatedReservation;
  }

  async deleteReservation(id: number): Promise<boolean> {
    const db = await getDb();
    const result = await db.delete(reservations).where(eq(reservations.id, id));
    return result.rowsAffected > 0;
  }

  // Contact Messages
  async getContactMessages(): Promise<ContactMessage[]> {
    const db = await getDb();
    return await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
  }

  async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
    const db = await getDb();
    const [newMessage] = await db.insert(contactMessages).values(message).returning();
    return newMessage;
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    const db = await getDb();
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const db = await getDb();
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async createOrder(order: any): Promise<Order> {
    const db = await getDb();
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const db = await getDb();
    const [updatedOrder] = await db.update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  async deleteOrder(id: number): Promise<boolean> {
    const db = await getDb();
    const result = await db.delete(orders).where(eq(orders.id, id));
    return result.rowsAffected > 0;
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    const db = await getDb();
    return await db.select().from(customers).orderBy(asc(customers.name));
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const db = await getDb();
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const db = await getDb();
    const [customer] = await db.select().from(customers).where(eq(customers.email, email));
    return customer;
  }

  async createCustomer(customer: any): Promise<Customer> {
    const db = await getDb();
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: number, customer: any): Promise<Customer> {
    const db = await getDb();
    const [updatedCustomer] = await db.update(customers)
      .set(customer)
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    const db = await getDb();
    const result = await db.delete(customers).where(eq(customers.id, id));
    return result.rowsAffected > 0;
  }

  // Employees
  async getEmployees(): Promise<Employee[]> {
    const db = await getDb();
    return await db.select().from(employees).orderBy(asc(employees.name));
  }

  async getEmployee(id: number): Promise<Employee | undefined> {
    const db = await getDb();
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee;
  }

  async getEmployeeByEmail(email: string): Promise<Employee | undefined> {
    const db = await getDb();
    const [employee] = await db.select().from(employees).where(eq(employees.email, email));
    return employee;
  }

  async createEmployee(employee: any): Promise<Employee> {
    const db = await getDb();
    const [newEmployee] = await db.insert(employees).values(employee).returning();
    return newEmployee;
  }

  async updateEmployee(id: number, employee: any): Promise<Employee> {
    const db = await getDb();
    const [updatedEmployee] = await db.update(employees)
      .set(employee)
      .where(eq(employees.id, id))
      .returning();
    return updatedEmployee;
  }

  async deleteEmployee(id: number): Promise<boolean> {
    const db = await getDb();
    const result = await db.delete(employees).where(eq(employees.id, id));
    return result.rowsAffected > 0;
  }
}

export const storage = new DatabaseStorage();