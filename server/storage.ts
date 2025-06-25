import { 
  users, menuCategories, menuItems, tables, reservations, contactMessages,
  type User, type InsertUser, type MenuCategory, type InsertMenuCategory,
  type MenuItem, type InsertMenuItem, type Table, type InsertTable,
  type Reservation, type InsertReservation, type ContactMessage, type InsertContactMessage
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

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
  getReservationsByDate(date: string): Promise<Reservation[]>;
  getReservation(id: number): Promise<Reservation | undefined>;
  createReservation(reservation: InsertReservation): Promise<Reservation>;
  updateReservationStatus(id: number, status: string): Promise<Reservation | undefined>;
  deleteReservation(id: number): Promise<boolean>;
  checkReservationConflict(date: string, time: string, tableId?: number): Promise<boolean>;

  // Contact Messages
  getContactMessages(): Promise<ContactMessage[]>;
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  updateContactMessageStatus(id: number, status: string): Promise<ContactMessage | undefined>;

  // Statistics
  getTodayReservationCount(): Promise<number>;
  getOccupancyRate(date: string): Promise<number>;
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

  // Menu Categories
  async getMenuCategories(): Promise<MenuCategory[]> {
    return await db.select().from(menuCategories).orderBy(asc(menuCategories.displayOrder));
  }

  async createMenuCategory(category: InsertMenuCategory): Promise<MenuCategory> {
    const [newCategory] = await db.insert(menuCategories).values(category).returning();
    return newCategory;
  }

  // Menu Items
  async getMenuItems(): Promise<MenuItem[]> {
    return await db.select().from(menuItems).orderBy(asc(menuItems.name));
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

async createReservation(reservation: InsertReservation): Promise<Reservation> {
  // On retire createdAt s'il existe (juste au cas où), pour laisser la BDD le gérer (defaultNow)
  const data = { ...reservation };
  delete (data as any).createdAt;
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

async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
  // On retire createdAt s'il existe (juste au cas où), pour laisser la BDD le gérer (defaultNow)
  const data = { ...message };
  delete (data as any).createdAt;
  const [newMessage] = await db.insert(contactMessages).values(data).returning();
  return newMessage;
}

  async updateContactMessageStatus(id: number, status: string): Promise<ContactMessage | undefined> {
    const [updatedMessage] = await db
      .update(contactMessages)
      .set({ status })
      .where(eq(contactMessages.id, id))
      .returning();
    return updatedMessage || undefined;
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
}

export const storage = new DatabaseStorage();