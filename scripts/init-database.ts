import { getDb } from '../server/db';
import { sql } from 'drizzle-orm';
import { 
  users, menuCategories, menuItems, tables, customers, reservations
} from '../shared/schema';
import { logger } from '../server/utils/logger';
import { fakerFR as faker } from '@faker-js/faker';

async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, 12); // Augmentation du coût pour plus de sécurité
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

export async function initializeDatabase(): Promise<InitializationResult> {
  let db;
  try {
    console.log('🗄️ Début de l\'initialisation de la base de données...');

    // Vérifier la connexion à la base de données
    db = await getDb();
    
    // Test de connexion
    await db.execute(sql`SELECT 1 as test`);
    console.log('✅ Connexion à la base de données établie');

    // Vérifier si des données existent déjà de manière plus robuste
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      console.log('📊 Données déjà présentes - initialisation ignorée');
      return { 
        success: true, 
        message: 'Base de données déjà initialisée' 
      };
    }

    console.log('📝 Création des données initiales...');

    // Transaction pour assurer la cohérence des données
    const result = await db.transaction(async (tx) => {
      // 1. Créer les utilisateurs par défaut
      const adminPassword = await hashPassword('admin123');
      const employeePassword = await hashPassword('employe123');

      const usersData: typeof users.$inferInsert[] = [
        {
          username: 'admin',
          password: adminPassword,
          role: 'directeur',
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
          role: 'employe',
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
          role: 'employe',
          firstName: 'Pierre',
          lastName: 'Chef',
          email: 'pierre.chef@barista-cafe.com',
          phone: '+33123456781',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const insertedUsers = await tx.insert(users).values(usersData).returning();

      // 2. Créer les catégories de menu
      const categoriesData: typeof menuCategories.$inferInsert[] = [
        { 
          name: 'Cafés', 
          description: 'Nos cafés artisanaux torréfiés localement', 
          sortOrder: 1,
          isActive: true
        },
        { 
          name: 'Boissons', 
          description: 'Boissons chaudes, froides et rafraîchissantes', 
          sortOrder: 2,
          isActive: true
        },
        { 
          name: 'Pâtisseries', 
          description: 'Pâtisseries fraîches faites maison', 
          sortOrder: 3,
          isActive: true
        },
        { 
          name: 'Plats', 
          description: 'Plats et sandwichs préparés avec soin', 
          sortOrder: 4,
          isActive: true
        },
        { 
          name: 'Spécialités', 
          description: 'Nos créations exclusives', 
          sortOrder: 5,
          isActive: true
        }
      ];

      const insertedCategories = await tx.insert(menuCategories).values(categoriesData).returning();

      // 3. Créer les articles de menu avec des données plus réalistes
      const menuItemsData: typeof menuItems.$inferInsert[] = [
        // Cafés
        { 
          name: 'Espresso Classique', 
          description: 'Café espresso italien traditionnel aux arômes intenses', 
          price: 2.50, 
          categoryId: insertedCategories[0].id,
          preparationTime: 5,
          isAvailable: true,
          ingredients: ['Café moulu', 'Eau chaude'],
          calories: 5
        },
        { 
          name: 'Cappuccino Crémeux', 
          description: 'Espresso avec mousse de lait onctueuse et cacao', 
          price: 3.80, 
          categoryId: insertedCategories[0].id,
          preparationTime: 7,
          isAvailable: true,
          ingredients: ['Café moulu', 'Lait entier', 'Cacao'],
          calories: 120
        },
        { 
          name: 'Latte Artisanal', 
          description: 'Café au lait avec art latte et vanille', 
          price: 4.20, 
          categoryId: insertedCategories[0].id,
          preparationTime: 8,
          isAvailable: true,
          ingredients: ['Café moulu', 'Lait', 'Sirop de vanille'],
          calories: 150
        },
        { 
          name: 'Macchiato Caramel', 
          description: 'Espresso marqué de mousse et caramel', 
          price: 3.50, 
          categoryId: insertedCategories[0].id,
          preparationTime: 6,
          isAvailable: true,
          ingredients: ['Café moulu', 'Lait', 'Caramel'],
          calories: 180
        },

        // Boissons
        { 
          name: 'Thé Earl Grey Premium', 
          description: 'Thé noir bergamote de qualité supérieure', 
          price: 2.80, 
          categoryId: insertedCategories[1].id,
          preparationTime: 4,
          isAvailable: true,
          ingredients: ['Thé Earl Grey', 'Eau chaude'],
          calories: 2
        },
        { 
          name: 'Chocolat Chaud Artisanal', 
          description: 'Chocolat belge fondant à la chantilly maison', 
          price: 3.50, 
          categoryId: insertedCategories[1].id,
          preparationTime: 8,
          isAvailable: true,
          ingredients: ['Chocolat belge', 'Lait', 'Crème chantilly'],
          calories: 280
        },
        { 
          name: 'Smoothie Fraise-Banane', 
          description: 'Mélange crémeux de fruits frais et yaourt grec', 
          price: 4.80, 
          categoryId: insertedCategories[1].id,
          preparationTime: 5,
          isAvailable: true,
          ingredients: ['Fraises', 'Banane', 'Yaourt grec', 'Miel'],
          calories: 180
        },
        { 
          name: 'Limonade Maison', 
          description: 'Limonade fraîchement pressée au citron jaune', 
          price: 3.20, 
          categoryId: insertedCategories[1].id,
          preparationTime: 3,
          isAvailable: true,
          ingredients: ['Citron jaune', 'Eau gazeuse', 'Sucre de canne'],
          calories: 90
        },

        // Pâtisseries
        { 
          name: 'Croissant au Beurre AOP', 
          description: 'Croissant traditionnel au beurre Charentes-Poitou', 
          price: 2.20, 
          categoryId: insertedCategories[2].id,
          preparationTime: 2,
          isAvailable: true,
          ingredients: ['Farine', 'Beurre AOP', 'Levure'],
          calories: 240
        },
        { 
          name: 'Cookies Double Chocolat', 
          description: 'Cookies moelleux aux pépites de chocolat noir et blanc', 
          price: 2.80, 
          categoryId: insertedCategories[2].id,
          preparationTime: 2,
          isAvailable: true,
          ingredients: ['Farine', 'Chocolat noir', 'Chocolat blanc', 'Beurre'],
          calories: 320
        },
        { 
          name: 'Tarte au Citron Meringuée', 
          description: 'Tarte acidulée au citron jaune et meringue italienne', 
          price: 4.50, 
          categoryId: insertedCategories[2].id,
          preparationTime: 3,
          isAvailable: true,
          ingredients: ['Citron jaune', 'Sucre', 'Œufs', 'Beurre'],
          calories: 380
        },
        { 
          name: 'Muffin Myrtilles Bio', 
          description: 'Muffin moelleux aux myrtilles biologiques', 
          price: 3.20, 
          categoryId: insertedCategories[2].id,
          preparationTime: 2,
          isAvailable: true,
          ingredients: ['Myrtilles bio', 'Farine', 'Œufs', 'Beurre'],
          calories: 280
        },

        // Plats
        { 
          name: 'Sandwich Club Poulet', 
          description: 'Pain de campagne, poulet rôti, bacon croustillant, avocat', 
          price: 6.50, 
          categoryId: insertedCategories[3].id,
          preparationTime: 12,
          isAvailable: true,
          ingredients: ['Pain de campagne', 'Poulet', 'Bacon', 'Avocat', 'Mayonnaise'],
          calories: 420
        },
        { 
          name: 'Salade César Signature', 
          description: 'Laitue romaine, poulet grillé, parmesan, croûtons maison', 
          price: 7.80, 
          categoryId: insertedCategories[3].id,
          preparationTime: 10,
          isAvailable: true,
          ingredients: ['Laitue romaine', 'Poulet', 'Parmesan', 'Croûtons', 'Sauce césar'],
          calories: 320
        },
        { 
          name: 'Quiche Lorraine du Chef', 
          description: 'Quiche traditionnelle au lard fumé, œufs et crème fraîche', 
          price: 6.80, 
          categoryId: insertedCategories[3].id,
          preparationTime: 15,
          isAvailable: true,
          ingredients: ['Œufs', 'Lard fumé', 'Crème fraîche', 'Pâte brisée'],
          calories: 450
        },
        { 
          name: 'Wrap Végétarien', 
          description: 'Wrap complet aux légumes grillés et hummus', 
          price: 5.90, 
          categoryId: insertedCategories[3].id,
          preparationTime: 8,
          isAvailable: true,
          ingredients: ['Tortilla', 'Légumes grillés', 'Hummus', 'Salade'],
          calories: 280
        },

        // Spécialités
        { 
          name: 'Assiette Dégustation', 
          description: 'Sélection de fromages, charcuterie et accompagnements', 
          price: 12.50, 
          categoryId: insertedCategories[4].id,
          preparationTime: 15,
          isAvailable: true,
          ingredients: ['Fromages assortis', 'Charcuterie', 'Fruits', 'Noix'],
          calories: 520
        },
        { 
          name: 'Plateau Brunch', 
          description: 'Œufs brouillés, bacon, avocat, pain toasté et fruits', 
          price: 14.80, 
          categoryId: insertedCategories[4].id,
          preparationTime: 20,
          isAvailable: true,
          ingredients: ['Œufs', 'Bacon', 'Avocat', 'Pain', 'Fruits frais'],
          calories: 480
        }
      ];

      const insertedMenuItems = await tx.insert(menuItems).values(menuItemsData).returning();

      // 4. Créer les tables avec différentes capacités
      const tablesData: typeof tables.$inferInsert[] = [
        { number: 1, capacity: 2, location: 'terrasse', status: 'available', isActive: true },
        { number: 2, capacity: 4, location: 'salon', status: 'available', isActive: true },
        { number: 3, capacity: 6, location: 'salon', status: 'available', isActive: true },
        { number: 4, capacity: 2, location: 'terrasse', status: 'available', isActive: true },
        { number: 5, capacity: 8, location: 'salle privée', status: 'available', isActive: true },
        { number: 6, capacity: 4, location: 'salon', status: 'available', isActive: true },
        { number: 7, capacity: 2, location: 'terrasse', status: 'available', isActive: true },
        { number: 8, capacity: 6, location: 'salle privée', status: 'available', isActive: true }
      ];

      const insertedTables = await tx.insert(tables).values(tablesData).returning();

      // 5. Créer des clients de démonstration
      const sampleCustomers = Array.from({ length: 10 }, (_, i) => {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        return {
          firstName,
          lastName,
          email: faker.internet.email({ firstName: firstName.toLowerCase(), lastName: lastName.toLowerCase() }),
          phone: faker.phone.number('+33 # ## ## ## ##'),
          loyaltyPoints: faker.number.int({ min: 0, max: 500 }),
          preferences: JSON.stringify({
            allergies: faker.helpers.arrayElements(['gluten', 'lactose', 'fruits à coque', 'œufs', 'poisson'], { min: 0, max: 2 }),
            favoriteItems: faker.helpers.arrayElements(insertedMenuItems.map(item => item.id), { min: 1, max: 3 }),
            dietaryRestrictions: faker.helpers.maybe(() => 
              faker.helpers.arrayElement(['végétarien', 'végétalien', 'sans gluten', 'halal']), 
              { probability: 0.3 }
            )
          }),
          totalVisits: faker.number.int({ min: 1, max: 50 }),
          averageSpend: faker.number.float({ min: 15.0, max: 80.0, fractionDigits: 2 }),
          createdAt: faker.date.past({ years: 2 }),
          updatedAt: new Date()
        };
      });

      const insertedCustomers = await tx.insert(customers).values(sampleCustomers).returning();

      // 6. Créer des réservations de démonstration
      const sampleReservations = insertedCustomers.slice(0, 8).map((customer, index) => {
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
          guests: faker.number.int({ min: 1, max: Math.min(selectedTable.capacity, 6) }),
          status: faker.helpers.arrayElement(['confirmed', 'pending', 'completed', 'cancelled']),
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
          createdAt: faker.date.past({ days: 30 }),
          updatedAt: new Date()
        };
      });

      const insertedReservations = await tx.insert(reservations).values(sampleReservations).returning();

      return {
        admin: insertedUsers[0].id,
        categories: insertedCategories.length,
        menuItems: insertedMenuItems.length,
        tables: insertedTables.length,
        sampleCustomers: insertedCustomers.length,
        sampleReservations: insertedReservations.length
      };
    });

    console.log('✅ Base de données initialisée avec succès');
    console.log('👥 Comptes créés:');
    console.log('   👤 Admin: admin/admin123 (Directeur)');
    console.log('   👤 Employé: employe/employe123');
    console.log('   👤 Cuisinier: cuisinier/cuisine123');
    console.log(`📂 ${result.categories} catégories créées`);
    console.log(`🍽️ ${result.menuItems} articles de menu créés`);
    console.log(`🪑 ${result.tables} tables créées`);
    console.log(`👥 ${result.sampleCustomers} clients de démonstration créés`);
    console.log(`📅 ${result.sampleReservations} réservations de démonstration créées`);

    return { 
      success: true, 
      message: 'Initialisation terminée avec succès', 
      data: result 
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    logger.error('❌ Erreur lors de l\'initialisation:', { error: errorMessage });

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
    const db = await getDb();

    // Supprimer toutes les données dans l'ordre inverse des dépendances
    await db.delete(reservations);
    await db.delete(customers);
    await db.delete(menuItems);
    await db.delete(menuCategories);
    await db.delete(tables);
    await db.delete(users);

    console.log('🗑️ Base de données réinitialisée');
    return initializeDatabase();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    logger.error('❌ Erreur lors de la réinitialisation:', { error: errorMessage });
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
      logger.error('💥 Erreur critique:', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
      process.exit(1);
    });
}