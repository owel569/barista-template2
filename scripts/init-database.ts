import { getDb } from '../server/db';
import { sql } from 'drizzle-orm';
import { 
  users, 
  menuCategories, 
  menuItems, 
  menuItemImages,
  reservations,
  orders,
  orderItems,
  customers,
  tables,
  employees
} from '../shared/schema';
import { getItemImageUrl } from '../client/src/lib/image-mapping';
// Logger simple pour le développement
const logger = {
  error: (msg: string, data?: any) => console.error(msg, data),
  info: (msg: string, data?: any) => console.log(msg, data)
};
import { fakerFR as faker } from '@faker-js/faker';

async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, 12);
}

interface InitializationResult {
  success: boolean;
  message: string;
  data?: {
    admin: number;
    categories: number;
    menuItems: number;
    tables: number;
    sampleCustomers: number;
    sampleReservations: number;
  };
}

async function checkTablesExist() {
  try {
    const db = getDb();

    // Vérifier si les tables existent
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    console.log('📋 Tables existantes:', tables.map(t => t.table_name));
    return tables.map(t => t.table_name);
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des tables:', error);
    return [];
  }
}

export async function initializeDatabase(): Promise<InitializationResult> {
  console.log('🔧 Initialisation de la base de données...');

  try {
    const db = getDb();

    // Vérifier les tables existantes
    const existingTables = await checkTablesExist();
    console.log('📊 Tables trouvées:', existingTables.length);

    // Test de connexion à la base de données
    try {
      await db.execute(sql`SELECT 1 as test`);
      console.log('✅ Connexion à la base de données établie');
    } catch (error) {
      console.error('❌ Erreur de connexion à la base de données');
      throw new Error('Impossible de se connecter à la base de données');
    }

    // Vérifier si des données existent déjà
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      console.log('📊 Données déjà présentes - initialisation ignorée');
      return { 
        success: true, 
        message: 'Base de données déjà initialisée' 
      };
    }

    // 1. Création des utilisateurs
    const adminPassword = await hashPassword('admin123');
    const employeePassword = await hashPassword('employe123');

    const usersData = [
      {
        username: 'admin',
        password: adminPassword,
        role: 'admin',
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'admin@barista-cafe.com',
        phone: '+33123456789',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'employe',
        password: employeePassword,
        role: 'staff',
        firstName: 'Marie',
        lastName: 'Martin',
        email: 'marie.martin@barista-cafe.com',
        phone: '+33123456780',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'cuisinier',
        password: await hashPassword('cuisine123'),
        role: 'staff',
        firstName: 'Pierre',
        lastName: 'Chef',
        email: 'pierre.chef@barista-cafe.com',
        phone: '+33123456781',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const insertedUsers = await db.insert(users).values(usersData).returning();

    // 2. Création des catégories de menu
    const categoriesData = [
      { 
        name: 'Cafés', 
        description: 'Nos cafés artisanaux torréfiés localement', 
        sortOrder: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        name: 'Boissons', 
        description: 'Boissons chaudes, froides et rafraîchissantes', 
        sortOrder: 2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        name: 'Pâtisseries', 
        description: 'Pâtisseries fraîches faites maison', 
        sortOrder: 3,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        name: 'Plats', 
        description: 'Plats et sandwichs préparés avec soin', 
        sortOrder: 4,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        name: 'Spécialités', 
        description: 'Nos créations exclusives', 
        sortOrder: 5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const insertedCategories = await db.insert(menuCategories).values(categoriesData).returning();

    // 3. Création des articles de menu - VERSION COMPLÈTE
    const menuItemsData = [
      // Cafés
      { 
        name: 'Espresso Classique', 
        description: 'Café espresso italien traditionnel aux arômes intenses et à la crema parfaite', 
        price: '2.50', 
        categoryId: insertedCategories[0].id,
        preparationTime: 5,
        isAvailable: true,
        ingredients: ['Café moulu', 'Eau chaude'],
        calories: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        name: 'Cappuccino Crémeux', 
        description: 'Espresso avec mousse de lait onctueuse et cacao', 
        price: '3.80', 
        categoryId: insertedCategories[0].id,
        preparationTime: 7,
        isAvailable: true,
        ingredients: ['Café moulu', 'Lait entier', 'Cacao'],
        calories: 120,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        name: 'Latte Artisanal', 
        description: 'Café au lait avec art latte et vanille', 
        price: '4.20', 
        categoryId: insertedCategories[0].id,
        preparationTime: 8,
        isAvailable: true,
        ingredients: ['Café moulu', 'Lait', 'Sirop de vanille'],
        calories: 150,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        name: 'Macchiato Caramel', 
        description: 'Espresso marqué de mousse et caramel', 
        price: '3.50', 
        categoryId: insertedCategories[0].id,
        preparationTime: 6,
        isAvailable: true,
        ingredients: ['Café moulu', 'Lait', 'Caramel'],
        calories: 180,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Boissons
      { 
        name: 'Thé Earl Grey Premium', 
        description: 'Thé noir bergamote de qualité supérieure', 
        price: '2.80', 
        categoryId: insertedCategories[1].id,
        preparationTime: 4,
        isAvailable: true,
        ingredients: ['Thé Earl Grey', 'Eau chaude'],
        calories: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        name: 'Chocolat Chaud Artisanal', 
        description: 'Chocolat belge fondant à la chantilly maison', 
        price: '3.50', 
        categoryId: insertedCategories[1].id,
        preparationTime: 8,
        isAvailable: true,
        ingredients: ['Chocolat belge', 'Lait', 'Crème chantilly'],
        calories: 280,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        name: 'Smoothie Fraise-Banane', 
        description: 'Mélange crémeux de fruits frais et yaourt grec', 
        price: '4.80', 
        categoryId: insertedCategories[1].id,
        preparationTime: 5,
        isAvailable: true,
        ingredients: ['Fraises', 'Banane', 'Yaourt grec', 'Miel'],
        calories: 180,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        name: 'Limonade Maison', 
        description: 'Limonade fraîchement pressée au citron jaune', 
        price: '3.20', 
        categoryId: insertedCategories[1].id,
        preparationTime: 3,
        isAvailable: true,
        ingredients: ['Citron jaune', 'Eau gazeuse', 'Sucre de canne'],
        calories: 90,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Pâtisseries
      { 
        name: 'Croissant au Beurre AOP', 
        description: 'Croissant traditionnel au beurre Charentes-Poitou', 
        price: '2.20', 
        categoryId: insertedCategories[2].id,
        preparationTime: 2,
        isAvailable: true,
        ingredients: ['Farine', 'Beurre AOP', 'Levure'],
        calories: 240,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        name: 'Cookies Double Chocolat', 
        description: 'Cookies moelleux aux pépites de chocolat noir et blanc', 
        price: '2.80', 
        categoryId: insertedCategories[2].id,
        preparationTime: 2,
        isAvailable: true,
        ingredients: ['Farine', 'Chocolat noir', 'Chocolat blanc', 'Beurre'],
        calories: 320,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        name: 'Tarte au Citron Meringuée', 
        description: 'Tarte acidulée au citron jaune et meringue italienne', 
        price: '4.50', 
        categoryId: insertedCategories[2].id,
        preparationTime: 3,
        isAvailable: true,
        ingredients: ['Citron jaune', 'Sucre', 'Œufs', 'Beurre'],
        calories: 380,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        name: 'Muffin Myrtilles Bio', 
        description: 'Muffin moelleux aux myrtilles biologiques', 
        price: '3.20', 
        categoryId: insertedCategories[2].id,
        preparationTime: 2,
        isAvailable: true,
        ingredients: ['Myrtilles bio', 'Farine', 'Œufs', 'Beurre'],
        calories: 280,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Plats
      { 
        name: 'Sandwich Club Poulet', 
        description: 'Pain de campagne, poulet rôti, bacon croustillant, avocat', 
        price: '6.50', 
        categoryId: insertedCategories[3].id,
        preparationTime: 12,
        isAvailable: true,
        ingredients: ['Pain de campagne', 'Poulet', 'Bacon', 'Avocat', 'Mayonnaise'],
        calories: 420,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        name: 'Salade César Signature', 
        description: 'Laitue romaine, poulet grillé, parmesan, croûtons maison', 
        price: '7.80', 
        categoryId: insertedCategories[3].id,
        preparationTime: 10,
        isAvailable: true,
        ingredients: ['Laitue romaine', 'Poulet', 'Parmesan', 'Croûtons', 'Sauce césar'],
        calories: 320,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        name: 'Quiche Lorraine du Chef', 
        description: 'Quiche traditionnelle au lard fumé, œufs et crème fraîche', 
        price: '6.80', 
        categoryId: insertedCategories[3].id,
        preparationTime: 15,
        isAvailable: true,
        ingredients: ['Œufs', 'Lard fumé', 'Crème fraîche', 'Pâte brisée'],
        calories: 450,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        name: 'Wrap Végétarien', 
        description: 'Wrap complet aux légumes grillés et hummus', 
        price: '5.90', 
        categoryId: insertedCategories[3].id,
        preparationTime: 8,
        isAvailable: true,
        ingredients: ['Tortilla', 'Légumes grillés', 'Hummus', 'Salade'],
        calories: 280,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Spécialités
      { 
        name: 'Assiette Dégustation', 
        description: 'Sélection de fromages, charcuterie et accompagnements', 
        price: '12.50', 
        categoryId: insertedCategories[4].id,
        preparationTime: 15,
        isAvailable: true,
        ingredients: ['Fromages assortis', 'Charcuterie', 'Fruits', 'Noix'],
        calories: 520,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        name: 'Plateau Brunch', 
        description: 'Œufs brouillés, bacon, avocat, pain toasté et fruits', 
        price: '14.80', 
        categoryId: insertedCategories[4].id,
        preparationTime: 20,
        isAvailable: true,
        ingredients: ['Œufs', 'Bacon', 'Avocat', 'Pain', 'Fruits frais'],
        calories: 480,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const insertedMenuItems = await db.insert(menuItems).values(menuItemsData).returning();

    // Associer des images aux articles de menu
    console.log('🖼️ Ajout des images pour les articles de menu...');
    for (const item of insertedMenuItems) {
      const imageUrl = getItemImageUrl(item.name, categoriesData.find(cat => cat.id === item.categoryId)?.name || 'general');
      await db.insert(menuItemImages).values({
        menuItemId: item.id,
        imageUrl: imageUrl,
        altText: `Image de ${item.name}`,
        isPrimary: true,
        uploadMethod: 'unsplash'
      });
    }
    console.log('✅ Images ajoutées aux articles de menu');


    // 4. Création des tables avec différentes capacités
    const tablesData = [
      { number: 1, capacity: 2, location: 'terrasse', status: 'available', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { number: 2, capacity: 4, location: 'salon', status: 'available', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { number: 3, capacity: 6, location: 'salon', status: 'available', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { number: 4, capacity: 2, location: 'terrasse', status: 'available', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { number: 5, capacity: 8, location: 'salle privée', status: 'available', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { number: 6, capacity: 4, location: 'salon', status: 'available', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { number: 7, capacity: 2, location: 'terrasse', status: 'available', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { number: 8, capacity: 6, location: 'salle privée', status: 'available', isActive: true, createdAt: new Date(), updatedAt: new Date() }
    ];

    const insertedTables = await db.insert(tables).values(tablesData).returning();

    // 5. Création de clients de démonstration
    const sampleCustomers = Array.from({ length: 10 }, (_, i: number) => {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      return {
        firstName,
        lastName,
        email: faker.internet.email({ firstName: firstName.toLowerCase(), lastName: lastName.toLowerCase() }),
        phone: faker.phone.number(),
        loyaltyPoints: faker.number.int({ min: 0, max: 500 }),
        totalOrders: faker.number.int({ min: 1, max: 50 }),
        totalSpent: faker.number.float({ min: 15.0, max: 80.0, fractionDigits: 2 }).toString(),
        lastVisit: faker.date.past({ years: 1 }),
        createdAt: faker.date.past({ years: 2 }),
        updatedAt: new Date()
      };
    });

    const insertedCustomers = await db.insert(customers).values(sampleCustomers).returning();

    // 6. Création de réservations de démonstration
    const sampleReservations = insertedCustomers.slice(0, 8).map((customer: any, index: number) => {
      const reservationDate = faker.date.between({ 
        from: new Date(), 
        to: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 jours
      });
      const timeSlots = ['11:30', '12:00', '12:30', '13:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'];
      const selectedTable = insertedTables[index % insertedTables.length];

      return {
        customerId: customer.id,
        tableId: selectedTable.id,
        date: reservationDate,
        time: faker.helpers.arrayElement(timeSlots),
        partySize: faker.number.int({ min: 1, max: Math.min(selectedTable.capacity, 6) }),
        status: faker.helpers.arrayElement(['confirmed', 'pending', 'completed', 'cancelled']) as 'confirmed' | 'pending' | 'completed' | 'cancelled',
        specialRequests: faker.helpers.maybe(() => 
          faker.helpers.arrayElement([
            'Anniversaire - décoration souhaitée',
            'Allergie aux fruits à coque',
            'Table près de la fenêtre si possible',
            'Chaise haute pour enfant',
            'Repas d\'affaires - environnement calme'
          ]), 
          { probability: 0.4 }
        ),
        notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.2 }),
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: new Date()
      };
    });

    const insertedReservations = await db.insert(reservations).values(sampleReservations).returning();

    return {
      admin: insertedUsers[0].id,
      categories: insertedCategories.length,
      menuItems: insertedMenuItems.length,
      tables: insertedTables.length,
      sampleCustomers: insertedCustomers.length,
      sampleReservations: insertedReservations.length
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    logger.error('❌ Erreur lors de l\'initialisation:', errorMessage);
    console.error('Détails de l\'erreur:', error);

    return { 
      success: false, 
      message: `Échec de l'initialisation: ${errorMessage}` 
    };
  }
}

// Fonction pour réinitialiser la base de données (développement seulement)
export async function resetDatabase(): Promise<InitializationResult> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Reset database not allowed in production');
  }

  try {
    const db = getDb();

    // Supprimer toutes les données dans l'ordre inverse des dépendances
    await db.delete(reservations);
    await db.delete(customers);
    await db.delete(menuItems);
    await db.delete(menuItemImages);
    await db.delete(menuCategories);
    await db.delete(tables);
    await db.delete(users);
    await db.delete(orderItems);
    await db.delete(orders);
    await db.delete(workShifts);
    await db.delete(employees);


    console.log('🗑️ Base de données réinitialisée');
    return initializeDatabase();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    logger.error('❌ Erreur lors de la réinitialisation:', errorMessage);
    console.error('Détails de l\'erreur:', error);
    throw error;
  }
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase()
    .then((result) => {
      if (result.success) {
        console.log('🎉 Initialisation terminée avec succès');
        process.exit(0);
      } else {
        console.error('💥 Échec de l\'initialisation:', result.message);
        process.exit(1);
      }
    })
    .catch((error) => {
      logger.error('💥 Erreur critique:', error instanceof Error ? error.message : 'Erreur inconnue');
      console.error('Stack trace:', error);
      process.exit(1);
    });
}