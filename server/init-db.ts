import { db } from "./db";
import { users, menuCategories, menuItems, tables, reservations, customers, employees, orders, contactMessages } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { cleanupDuplicateMenuItems } from "./cleanup-duplicates";
import { insertTestData } from "./test-data";

export async function initializeDatabase() {
  try {
    console.log("Initialisation de la base de données...");

    // Nettoyer les doublons existants
    await cleanupDuplicateMenuItems();

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
        role: "directeur",
        firstName: "Directeur",
        lastName: "Principal",
        email: "admin@barista-cafe.com",
        isActive: true
      });
      console.log("✅ Utilisateur directeur créé");

      // Créer aussi un employé de test
      const employeePassword = await bcrypt.hash("employe123", 10);
      await db.insert(users).values({
        username: "employe",
        password: employeePassword,
        role: "employe",
        firstName: "Jean",
        lastName: "Dupont",
        email: "jean.dupont@barista-cafe.com",
        isActive: true
      });
      console.log("✅ Utilisateur employé créé");
    }

    // Create menu categories seulement s'il n'en existe pas
    if (existingCategories.length === 0) {
      const categories = [
        { name: "Cafés", description: "Nos spécialités de café", slug: "cafes", displayOrder: 1 },
        { name: "Boissons", description: "Thés et autres boissons", slug: "boissons", displayOrder: 2 },
        { name: "Pâtisseries", description: "Viennoiseries et desserts", slug: "patisseries", displayOrder: 3 },
        { name: "Plats", description: "Plats savoureux", slug: "plats", displayOrder: 4 }
      ];

      await db.insert(menuCategories).values(categories);
      console.log("✅ Catégories de menu créées");
    }

    // Get category IDs
    const dbCategories = await db.select().from(menuCategories);
    const categoryMap = new Map(dbCategories.map(cat => [cat.slug, cat.id]));

    // Create menu items - vérifier chaque item individuellement
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

    // Insérer chaque élément seulement s'il n'existe pas déjà
    let itemsInserted = 0;
    for (const item of items) {
      try {
        // Vérifier si l'item existe déjà
        const existingItem = await db.select().from(menuItems).where(eq(menuItems.name, item.name));
        if (existingItem.length === 0) {
          await db.insert(menuItems).values(item);
          itemsInserted++;
        }
      } catch (error: any) {
        // Ignorer les erreurs de contrainte unique (doublons)
        if (!error.message?.includes('unique constraint')) {
          console.error('Erreur lors de l\'insertion d\'un élément de menu:', error);
        }
      }
    }
    
    if (itemsInserted > 0) {
      console.log(`✅ ${itemsInserted} éléments de menu créés`);
    } else {
      console.log("✅ Éléments de menu déjà présents");
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

    // Créer des données de test pour les clients
    const existingCustomers = await db.select().from(customers);
    if (existingCustomers.length === 0) {
      const testCustomers = [
        {
          firstName: "Marie",
          lastName: "Dupont",
          email: "marie.dupont@example.com",
          phone: "+33612345678",
          address: "15 rue de la Paix, Paris",
          dateOfBirth: "1985-03-15",
          preferredContactMethod: "email",
          notes: "Cliente fidèle, préfère les tables côté fenêtre"
        },
        {
          firstName: "Jean",
          lastName: "Martin",
          email: "jean.martin@example.com",
          phone: "+33623456789",
          address: "8 avenue des Champs, Lyon",
          dateOfBirth: "1990-07-22",
          preferredContactMethod: "phone",
          notes: "Amateur de café noir, vient souvent le matin"
        },
        {
          firstName: "Sophie",
          lastName: "Bernard",
          email: "sophie.bernard@example.com",
          phone: "+33634567890",
          address: "32 boulevard Saint-Germain, Paris",
          dateOfBirth: "1978-12-03",
          preferredContactMethod: "email",
          notes: "Allergique aux noix, préfère les boissons décaféinées"
        }
      ];

      await db.insert(customers).values(testCustomers);
      console.log("✅ Clients de test créés");
    }

    // Créer des données de test pour les employés
    const existingEmployees = await db.select().from(employees);
    if (existingEmployees.length === 0) {
      const testEmployees = [
        {
          firstName: "Lucas",
          lastName: "Durand",
          email: "lucas.durand@barista-cafe.com",
          phone: "+33656789012",
          position: "Barista Senior",
          department: "Service",
          hireDate: "2023-01-15",
          salary: "2200",
          status: "active",
          emergencyContact: "Marie Durand - +33667890123",
          address: "25 rue Mozart, Paris",
          notes: "Spécialiste latte art, formation en cours sur nouvelles machines"
        },
        {
          firstName: "Emma",
          lastName: "Leroy",
          email: "emma.leroy@barista-cafe.com",
          phone: "+33667890123",
          position: "Serveuse",
          department: "Service",
          hireDate: "2023-03-01",
          salary: "1800",
          status: "active",
          emergencyContact: "Paul Leroy - +33678901234",
          address: "12 avenue Victor Hugo, Paris",
          notes: "Excellente relation client, parle anglais et espagnol"
        },
        {
          firstName: "Thomas",
          lastName: "Moreau",
          email: "thomas.moreau@barista-cafe.com",
          phone: "+33678901234",
          position: "Cuisinier",
          department: "Cuisine",
          hireDate: "2022-11-20",
          salary: "2400",
          status: "active",
          emergencyContact: "Anne Moreau - +33689012345",
          address: "5 boulevard Raspail, Paris",
          notes: "Spécialiste pâtisserie, disponible pour heures supplémentaires"
        }
      ];

      await db.insert(employees).values(testEmployees);
      console.log("✅ Employés de test créés");
    }

    // Créer des réservations de test
    const existingReservations = await db.select().from(reservations);
    if (existingReservations.length === 0) {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const testReservations = [
        {
          customerName: "Marie Dupont",
          customerEmail: "marie.dupont@example.com",
          customerPhone: "+33612345678",
          date: today.toISOString().split('T')[0],
          time: "12:30",
          guests: 2,
          tableId: 1,
          status: "confirmed",
          specialRequests: "Table côté fenêtre si possible",
          notificationSent: false
        },
        {
          customerName: "Jean Martin",
          customerEmail: "jean.martin@example.com",
          customerPhone: "+33623456789",
          date: today.toISOString().split('T')[0],
          time: "14:00",
          guests: 4,
          tableId: 2,
          status: "pending",
          specialRequests: "Anniversaire, besoin d'une bougie",
          notificationSent: false
        },
        {
          customerName: "Sophie Bernard",
          customerEmail: "sophie.bernard@example.com",
          customerPhone: "+33634567890",
          date: tomorrow.toISOString().split('T')[0],
          time: "19:30",
          guests: 6,
          tableId: 3,
          status: "confirmed",
          specialRequests: "Allergies aux noix, menu spécial",
          notificationSent: false
        }
      ];

      await db.insert(reservations).values(testReservations);
      console.log("✅ Réservations de test créées");
    }

    // Créer des messages de contact de test
    const existingMessages = await db.select().from(contactMessages);
    if (existingMessages.length === 0) {
      const testMessages = [
        {
          firstName: "Antoine",
          lastName: "Dubois",
          email: "antoine.dubois@example.com",
          phone: "+33601234567",
          subject: "Demande de privatisation",
          message: "Bonjour, je souhaiterais privatiser votre établissement pour un événement d'entreprise le mois prochain. Pouvez-vous me donner plus d'informations sur vos tarifs et disponibilités ?",
          status: "new"
        },
        {
          firstName: "Isabelle",
          lastName: "Fournier",
          email: "isabelle.fournier@example.com",
          phone: "+33612345678",
          subject: "Compliments sur le service",
          message: "Je tenais à vous féliciter pour l'excellent service lors de ma visite hier. L'équipe était très professionnelle et le café était délicieux !",
          status: "read"
        },
        {
          firstName: "Nicolas",
          lastName: "Blanc",
          email: "nicolas.blanc@example.com",
          phone: "+33634567890",
          subject: "Suggestion de menu",
          message: "Serait-il possible d'ajouter des options végétaliennes à votre menu ? J'aimerais venir plus souvent mais les options sont limitées pour les personnes suivant un régime végétalien.",
          status: "new"
        }
      ];

      await db.insert(contactMessages).values(testMessages);
      console.log("✅ Messages de contact de test créés");
    }

    console.log("Base de données initialisée avec succès !");
    console.log("Identifiants administrateur: nom d'utilisateur=admin, mot de passe=admin123");
    console.log("Identifiants employé: nom d'utilisateur=employe, mot de passe=employe123");
    
    // Insérer des données de test supplémentaires
    await insertTestData();
    
  } catch (error) {
    console.error("Erreur lors de l'initialisation de la base de données:", error);
  }
}