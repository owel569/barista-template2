import { db } from "./db";
import { users, menuCategories, menuItems, tables, reservations } from "@shared/schema";
import bcrypt from "bcrypt";

export async function initializeDatabase() {
  try {
    console.log("Initialisation de la base de données...");

    // Create default admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);
    
    try {
      await db.insert(users).values({
        username: "admin",
        password: hashedPassword,
        role: "admin"
      }).onConflictDoNothing();
    } catch (error) {
      // User might already exist
    }

    // Create menu categories
    const categories = [
      { name: "Cafés", slug: "cafes", displayOrder: 1 },
      { name: "Boissons", slug: "boissons", displayOrder: 2 },
      { name: "Pâtisseries", slug: "patisseries", displayOrder: 3 },
      { name: "Plats", slug: "plats", displayOrder: 4 }
    ];

    for (const category of categories) {
      try {
        await db.insert(menuCategories).values(category).onConflictDoNothing();
      } catch (error) {
        // Category might already exist
      }
    }

    // Get category IDs
    const dbCategories = await db.select().from(menuCategories);
    const categoryMap = new Map(dbCategories.map(cat => [cat.slug, cat.id]));

    // Create menu items
    const items = [
      {
        name: "Espresso Classique",
        description: "Un espresso authentique aux arômes intenses et à la crema parfaite",
        price: "3.50",
        categoryId: categoryMap.get("cafes")!,
        imageUrl: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=200",
        available: true
      },
      {
        name: "Latte Art",
        description: "Café latte avec mousse de lait onctueuse et motifs artistiques",
        price: "4.80",
        categoryId: categoryMap.get("cafes")!,
        imageUrl: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=200",
        available: true
      },
      {
        name: "Cappuccino Premium",
        description: "Équilibre parfait entre espresso, lait vapeur et mousse veloutée",
        price: "4.20",
        categoryId: categoryMap.get("cafes")!,
        imageUrl: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=200",
        available: true
      },
      {
        name: "Thé Vert Premium",
        description: "Sélection de thés verts d'exception",
        price: "3.80",
        categoryId: categoryMap.get("boissons")!,
        available: true
      },
      {
        name: "Chocolat Chaud",
        description: "Chocolat artisanal à la chantilly",
        price: "4.50",
        categoryId: categoryMap.get("boissons")!,
        available: true
      },
      {
        name: "Croissants Artisanaux",
        description: "Croissants au beurre, feuilletés à la perfection",
        price: "2.80",
        categoryId: categoryMap.get("patisseries")!,
        imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=200",
        available: true
      },
      {
        name: "Macarons Français",
        description: "Assortiment de macarons aux saveurs variées",
        price: "6.50",
        categoryId: categoryMap.get("patisseries")!,
        imageUrl: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=200",
        available: true
      },
      {
        name: "Sandwich Club",
        description: "Sandwich club traditionnel avec frites maison",
        price: "8.90",
        categoryId: categoryMap.get("plats")!,
        available: true
      },
      {
        name: "Salade César",
        description: "Salade fraîche avec poulet grillé et parmesan",
        price: "9.50",
        categoryId: categoryMap.get("plats")!,
        available: true
      }
    ];

    for (const item of items) {
      try {
        await db.insert(menuItems).values(item).onConflictDoNothing();
      } catch (error) {
        // Item might already exist
      }
    }

    // Create tables
    const restaurantTables = [
      { number: 1, capacity: 2, available: true },
      { number: 2, capacity: 4, available: true },
      { number: 3, capacity: 2, available: true },
      { number: 4, capacity: 6, available: true },
      { number: 5, capacity: 4, available: true },
      { number: 6, capacity: 8, available: true }
    ];

    for (const table of restaurantTables) {
      try {
        await db.insert(tables).values(table).onConflictDoNothing();
      } catch (error) {
        // Table might already exist
      }
    }

    console.log("Base de données initialisée avec succès !");
    console.log("Identifiants administrateur: nom d'utilisateur=admin, mot de passe=admin123");
    
  } catch (error) {
    console.error("Erreur lors de l'initialisation de la base de données:", error);
  }
}