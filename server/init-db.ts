import { db } from "./db";
import { users, menuCategories, menuItems, tables, reservations } from "@shared/schema";
import bcrypt from "bcrypt";

export async function initializeDatabase() {
  try {
    console.log("Initialisation de la base de données...");

    // Vérifier si les données existent déjà
    const existingCategories = await db.select().from(menuCategories);
    const existingItems = await db.select().from(menuItems);
    const existingTables = await db.select().from(tables);
    const existingUsers = await db.select().from(users);

    // Create default admin user seulement s'il n'existe pas
    if (existingUsers.length === 0) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await db.insert(users).values({
        username: "admin",
        password: hashedPassword,
        role: "admin"
      });
      console.log("✅ Utilisateur admin créé");
    }

    // Create menu categories seulement s'il n'en existe pas
    if (existingCategories.length === 0) {
      const categories = [
        { name: "Cafés", slug: "cafes", displayOrder: 1 },
        { name: "Boissons", slug: "boissons", displayOrder: 2 },
        { name: "Pâtisseries", slug: "patisseries", displayOrder: 3 },
        { name: "Plats", slug: "plats", displayOrder: 4 }
      ];

      await db.insert(menuCategories).values(categories);
      console.log("✅ Catégories de menu créées");
    }

    // Get category IDs
    const dbCategories = await db.select().from(menuCategories);
    const categoryMap = new Map(dbCategories.map(cat => [cat.slug, cat.id]));

    // Create menu items seulement s'il n'en existe pas
    if (existingItems.length === 0) {
      const items = [
        {
          name: "Espresso Classique",
          description: "Un espresso authentique aux arômes intenses et à la crema parfaite",
          price: "3.50",
          categoryId: categoryMap.get("cafes")!,
          imageUrl: "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop",
          available: true
        },
        {
          name: "Latte Art",
          description: "Café latte avec mousse de lait onctueuse et motifs artistiques",
          price: "4.80",
          categoryId: categoryMap.get("cafes")!,
          imageUrl: "https://images.pexels.com/photos/851555/pexels-photo-851555.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop",
          available: true
        },
        {
          name: "Cappuccino Premium",
          description: "Équilibre parfait entre espresso, lait vapeur et mousse veloutée",
          price: "4.20",
          categoryId: categoryMap.get("cafes")!,
          imageUrl: "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop",
          available: true
        },
        {
          name: "Americano",
          description: "Espresso allongé à l'eau chaude pour un goût authentique",
          price: "3.20",
          categoryId: categoryMap.get("cafes")!,
          imageUrl: "https://images.pexels.com/photos/1251175/pexels-photo-1251175.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop",
          available: true
        },
        {
          name: "Thé Vert Premium",
          description: "Sélection de thés verts d'exception aux arômes délicats",
          price: "3.80",
          categoryId: categoryMap.get("boissons")!,
          imageUrl: "https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop",
          available: true
        },
        {
          name: "Chocolat Chaud",
          description: "Chocolat artisanal à la chantilly et copeaux de chocolat",
          price: "4.50",
          categoryId: categoryMap.get("boissons")!,
          imageUrl: "https://images.pexels.com/photos/1549200/pexels-photo-1549200.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop",
          available: true
        },
        {
          name: "Jus d'Orange Pressé",
          description: "Jus d'orange fraîchement pressé, 100% naturel",
          price: "4.20",
          categoryId: categoryMap.get("boissons")!,
          imageUrl: "https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop",
          available: true
        },
        {
          name: "Croissants Artisanaux",
          description: "Croissants au beurre, feuilletés à la perfection",
          price: "2.80",
          categoryId: categoryMap.get("patisseries")!,
          imageUrl: "https://images.pexels.com/photos/2067396/pexels-photo-2067396.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop",
          available: true
        },
        {
          name: "Macarons Français",
          description: "Assortiment de macarons aux saveurs variées",
          price: "6.50",
          categoryId: categoryMap.get("patisseries")!,
          imageUrl: "https://images.pexels.com/photos/1350560/pexels-photo-1350560.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop",
          available: true
        },
        {
          name: "Éclair au Chocolat",
          description: "Éclair garni de crème pâtissière et glaçage chocolat",
          price: "4.20",
          categoryId: categoryMap.get("patisseries")!,
          imageUrl: "https://images.pexels.com/photos/1414234/pexels-photo-1414234.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop",
          available: true
        },
        {
          name: "Mille-feuille",
          description: "Pâte feuilletée et crème pâtissière traditionnelle",
          price: "5.80",
          categoryId: categoryMap.get("patisseries")!,
          imageUrl: "https://images.pexels.com/photos/1998921/pexels-photo-1998921.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop",
          available: true
        },
        {
          name: "Sandwich Club",
          description: "Sandwich club traditionnel avec frites maison",
          price: "8.90",
          categoryId: categoryMap.get("plats")!,
          imageUrl: "https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop",
          available: true
        },
        {
          name: "Salade César",
          description: "Salade fraîche avec poulet grillé et parmesan",
          price: "9.50",
          categoryId: categoryMap.get("plats")!,
          imageUrl: "https://images.pexels.com/photos/1059905/pexels-photo-1059905.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop",
          available: true
        },
        {
          name: "Quiche Lorraine",
          description: "Quiche traditionnelle aux lardons et fromage",
          price: "7.50",
          categoryId: categoryMap.get("plats")!,
          imageUrl: "https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop",
          available: true
        }
      ];

      // Insérer les éléments un par un pour éviter les doublons
      for (const item of items) {
        try {
          await db.insert(menuItems).values(item);
        } catch (error: any) {
          // Ignorer les erreurs de contrainte unique (doublons)
          if (!error.message?.includes('unique constraint')) {
            console.error('Erreur lors de l\'insertion d\'un élément de menu:', error);
          }
        }
      }
      console.log("✅ Éléments de menu créés");
    }

    // Create tables seulement s'il n'en existe pas
    if (existingTables.length === 0) {
      const restaurantTables = [
        { number: 1, capacity: 2, available: true },
        { number: 2, capacity: 4, available: true },
        { number: 3, capacity: 2, available: true },
        { number: 4, capacity: 6, available: true },
        { number: 5, capacity: 4, available: true },
        { number: 6, capacity: 8, available: true }
      ];

      await db.insert(tables).values(restaurantTables);
      console.log("✅ Tables créées");
    }

    console.log("Base de données initialisée avec succès !");
    console.log("Identifiants administrateur: nom d'utilisateur=admin, mot de passe=admin123");
    
  } catch (error) {
    console.error("Erreur lors de l'initialisation de la base de données:", error);
  }
}