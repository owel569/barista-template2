
import { getDb } from '../server/db';
import { 
  users, menuCategories, menuItems, tables, customers, employees,
  menuItemImages, reservations, orders, orderItems, permissions,
  type User, type MenuCategory, type MenuItem, type Customer, type Employee
} from '../shared/schema';
import { hashPassword } from '../server/middleware/auth';

interface SeedOptions {
  environment: 'development' | 'production' | 'test';
  includeImages?: boolean;
  includeSampleReservations?: boolean;
  includeSampleOrders?: boolean;
  includePermissions?: boolean;
}

interface SeedResult {
  users: User[];
  categories: MenuCategory[];
  menuItems: MenuItem[];
  customers: Customer[];
  employees: Employee[];
  success: boolean;
  message: string;
}

interface SeedStats {
  usersCreated: number;
  categoriesCreated: number;
  menuItemsCreated: number;
  customersCreated: number;
  employeesCreated: number;
  imagesCreated: number;
  reservationsCreated: number;
  ordersCreated: number;
  permissionsCreated: number;
}

export async function seedDatabase(options: SeedOptions): Promise<SeedResult> {
  const { 
    environment, 
    includeImages = true, 
    includeSampleReservations = true,
    includeSampleOrders = true,
    includePermissions = true
  } = options;
  
  console.log(`🌱 Seeding database pour l'environnement: ${environment}`);
  
  if (environment === 'production') {
    console.log('🚫 Seeding interdit en production');
    return {
      users: [],
      categories: [],
      menuItems: [],
      customers: [],
      employees: [],
      success: false,
      message: 'Seeding interdit en production'
    };
  }

  const db = await getDb();
  const stats: SeedStats = {
    usersCreated: 0,
    categoriesCreated: 0,
    menuItemsCreated: 0,
    customersCreated: 0,
    employeesCreated: 0,
    imagesCreated: 0,
    reservationsCreated: 0,
    ordersCreated: 0,
    permissionsCreated: 0
  };

  try {
    // Vérifier si la base est déjà peuplée
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      console.log('📊 Base de données déjà peuplée');
      return {
        users: existingUsers,
        categories: [],
        menuItems: [],
        customers: [],
        employees: [],
        success: true,
        message: 'Base de données déjà peuplée'
      };
    }

    // Utiliser une transaction pour garantir l'atomicité
    const result = await db.transaction(async (tx) => {
      // Créer les utilisateurs
      const seedUsers = await seedUsersWithTransaction(tx, stats);
      
      // Créer les catégories et items de menu
      const categories = await seedMenuCategoriesWithTransaction(tx, stats);
      const menuItemsData = await seedMenuItemsWithTransaction(tx, categories, stats);
      
      // Ajouter les images si demandé
      if (includeImages) {
        await seedMenuItemImagesWithTransaction(tx, menuItemsData, stats);
      }
      
      // Créer les tables et clients
      await seedTablesWithTransaction(tx, stats);
      const customersData = await seedCustomersWithTransaction(tx, stats);
      
      // Créer les employés
      const employeesData = await seedEmployeesWithTransaction(tx, seedUsers, stats);
      
      // Créer les permissions si demandé
      if (includePermissions) {
        await seedPermissionsWithTransaction(tx, seedUsers, stats);
      }
      
      // Ajouter des réservations d'exemple si demandé
      if (includeSampleReservations && environment === 'development') {
        await seedSampleReservationsWithTransaction(tx, customersData, menuItemsData, stats);
      }

      // Ajouter des commandes d'exemple si demandé
      if (includeSampleOrders && environment === 'development') {
        await seedSampleOrdersWithTransaction(tx, customersData, menuItemsData, stats);
      }

      return {
        users: seedUsers,
        categories,
        menuItems: menuItemsData,
        customers: customersData,
        employees: employeesData
      };
    });

    console.log('✅ Seeding terminé avec succès');
    printSeedingStats(stats);
    
    return {
      ...result,
      success: true,
      message: 'Seeding terminé avec succès'
    };
    
  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    throw error;
  }
}

async function seedUsersWithTransaction(tx: any, stats: SeedStats): Promise<User[]> {
  try {
    const adminPassword = await hashPassword('admin123');
    const employeePassword = await hashPassword('employee123');
    const managerPassword = await hashPassword('manager123');
    
    const seedUsers = await tx.insert(users).values([
      {
        username: 'admin',
        password: adminPassword,
        role: 'directeur',
        firstName: 'Admin',
        lastName: 'Barista',
        email: 'admin@barista-cafe.com'
      },
      {
        username: 'employee',
        password: employeePassword,
        role: 'employe',
        firstName: 'Employee',
        lastName: 'Barista',
        email: 'employee@barista-cafe.com'
      },
      {
        username: 'manager',
        password: managerPassword,
        role: 'gerant',
        firstName: 'Manager',
        lastName: 'Barista',
        email: 'manager@barista-cafe.com'
      }
    ]).returning();
    
    stats.usersCreated = seedUsers.length;
    console.log(`✅ ${seedUsers.length} utilisateurs créés`);
    return seedUsers;
  } catch (error) {
    console.error('❌ Erreur lors de la création des utilisateurs:', error);
    throw error;
  }
}

async function seedMenuCategoriesWithTransaction(tx: any, stats: SeedStats): Promise<MenuCategory[]> {
  try {
    const categories = await tx.insert(menuCategories).values([
      { name: 'Cafés', description: 'Nos cafés artisanaux premium', slug: 'cafes', displayOrder: 1 },
      { name: 'Boissons chaudes', description: 'Thés, chocolats et boissons réconfortantes', slug: 'boissons-chaudes', displayOrder: 2 },
      { name: 'Boissons froides', description: 'Smoothies, jus frais et boissons glacées', slug: 'boissons-froides', displayOrder: 3 },
      { name: 'Pâtisseries', description: 'Viennoiseries et desserts maison', slug: 'patisseries', displayOrder: 4 },
      { name: 'Sandwichs', description: 'Sandwichs et plats légers', slug: 'sandwichs', displayOrder: 5 },
      { name: 'Salades', description: 'Salades fraîches et équilibrées', slug: 'salades', displayOrder: 6 }
    ]).returning();
    
    stats.categoriesCreated = categories.length;
    console.log(`✅ ${categories.length} catégories de menu créées`);
    return categories;
  } catch (error) {
    console.error('❌ Erreur lors de la création des catégories:', error);
    throw error;
  }
}

async function seedMenuItemsWithTransaction(tx: any, categories: MenuCategory[], stats: SeedStats): Promise<MenuItem[]> {
  try {
    const menuItemsData = [
      // Cafés
      { name: 'Espresso', description: 'Café espresso italien authentique, corsé et aromatique', price: 2.50, categoryId: categories[0].id },
      { name: 'Cappuccino', description: 'Espresso avec mousse de lait crémeuse et saupoudrage de cacao', price: 3.80, categoryId: categories[0].id },
      { name: 'Latte', description: 'Café au lait avec art latte réalisé par nos baristas', price: 4.20, categoryId: categories[0].id },
      { name: 'Americano', description: 'Espresso allongé avec eau chaude, goût délicat', price: 3.00, categoryId: categories[0].id },
      { name: 'Macchiato', description: 'Espresso "taché" d\'une cuillère de mousse de lait', price: 3.20, categoryId: categories[0].id },
      
      // Boissons chaudes
      { name: 'Thé Earl Grey', description: 'Thé noir bergamote premium, délicat et parfumé', price: 2.80, categoryId: categories[1].id },
      { name: 'Chocolat chaud', description: 'Chocolat belge avec chantilly maison', price: 3.50, categoryId: categories[1].id },
      { name: 'Thé vert Jasmin', description: 'Thé vert parfumé aux fleurs de jasmin', price: 3.00, categoryId: categories[1].id },
      { name: 'Chai Latte', description: 'Mélange d\'épices indiennes avec lait mousseux', price: 4.00, categoryId: categories[1].id },
      
      // Boissons froides
      { name: 'Smoothie mangue', description: 'Smoothie à la mangue fraîche et yaourt grec', price: 4.50, categoryId: categories[2].id },
      { name: 'Jus d\'orange frais', description: 'Jus d\'orange pressé à la demande', price: 3.20, categoryId: categories[2].id },
      { name: 'Iced Coffee', description: 'Café glacé avec glaçons et sirop au choix', price: 3.80, categoryId: categories[2].id },
      
      // Pâtisseries
      { name: 'Croissant beurre', description: 'Croissant artisanal au beurre de Normandie', price: 2.20, categoryId: categories[3].id },
      { name: 'Pain au chocolat', description: 'Viennoiserie feuilletée avec chocolat noir', price: 2.50, categoryId: categories[3].id },
      { name: 'Muffin myrtilles', description: 'Muffin fait maison aux myrtilles sauvages', price: 2.80, categoryId: categories[3].id },
      { name: 'Éclair au café', description: 'Éclair fourré à la crème pâtissière au café', price: 3.50, categoryId: categories[3].id },
      
      // Sandwichs
      { name: 'Sandwich jambon', description: 'Jambon de Bayonne, fromage et salade sur pain artisanal', price: 6.50, categoryId: categories[4].id },
      { name: 'Croque-monsieur', description: 'Croque-monsieur traditionnel gratiné au four', price: 7.20, categoryId: categories[4].id },
      { name: 'Club sandwich', description: 'Poulet, bacon, tomate, salade sur pain de mie grillé', price: 8.50, categoryId: categories[4].id },
      
      // Salades
      { name: 'Salade César', description: 'Salade romaine, parmesan, croûtons, sauce césar maison', price: 7.80, categoryId: categories[5].id },
      { name: 'Salade de chèvre', description: 'Mesclun, chèvre chaud, noix, miel et vinaigrette', price: 8.20, categoryId: categories[5].id }
    ];

    const insertedMenuItems = await tx.insert(menuItems).values(menuItemsData).returning();
    stats.menuItemsCreated = insertedMenuItems.length;
    console.log(`✅ ${insertedMenuItems.length} items de menu créés`);
    return insertedMenuItems;
  } catch (error) {
    console.error('❌ Erreur lors de la création des items de menu:', error);
    throw error;
  }
}

async function seedMenuItemImagesWithTransaction(tx: any, menuItemsData: MenuItem[], stats: SeedStats): Promise<void> {
  try {
    const imageUrls = [
      'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/4109766/pexels-photo-4109766.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/1030894/pexels-photo-1030894.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/734983/pexels-photo-734983.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/1756464/pexels-photo-1756464.jpeg?auto=compress&cs=tinysrgb&w=400'
    ];

    const imageMappings = menuItemsData.slice(0, 5).map((item, index) => ({
      menuItemId: item.id,
      imageUrl: imageUrls[index],
      altText: item.name,
      isPrimary: true,
      uploadMethod: 'pexels'
    }));

    await tx.insert(menuItemImages).values(imageMappings);
    stats.imagesCreated = imageMappings.length;
    console.log(`✅ ${imageMappings.length} images de menu ajoutées`);
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des images:', error);
    throw error;
  }
}

async function seedTablesWithTransaction(tx: any, stats: SeedStats): Promise<void> {
  try {
    await tx.insert(tables).values([
      { number: 1, capacity: 2, available: true },
      { number: 2, capacity: 4, available: true },
      { number: 3, capacity: 6, available: true },
      { number: 4, capacity: 2, available: true },
      { number: 5, capacity: 8, available: true },
      { number: 6, capacity: 4, available: true },
      { number: 7, capacity: 2, available: true },
      { number: 8, capacity: 6, available: true }
    ]);
    
    console.log('✅ 8 tables créées');
  } catch (error) {
    console.error('❌ Erreur lors de la création des tables:', error);
    throw error;
  }
}

async function seedCustomersWithTransaction(tx: any, stats: SeedStats): Promise<Customer[]> {
  try {
    const customersData = await tx.insert(customers).values([
      { firstName: 'Jean', lastName: 'Dupont', email: 'jean.dupont@email.com', phone: '+33123456789', loyaltyPoints: 120 },
      { firstName: 'Marie', lastName: 'Martin', email: 'marie.martin@email.com', phone: '+33987654321', loyaltyPoints: 85 },
      { firstName: 'Pierre', lastName: 'Bernard', email: 'pierre.bernard@email.com', phone: '+33456789123', loyaltyPoints: 200 },
      { firstName: 'Sophie', lastName: 'Dubois', email: 'sophie.dubois@email.com', phone: '+33456123789', loyaltyPoints: 50 },
      { firstName: 'Lucas', lastName: 'Moreau', email: 'lucas.moreau@email.com', phone: '+33789123456', loyaltyPoints: 150 }
    ]).returning();
    
    stats.customersCreated = customersData.length;
    console.log(`✅ ${customersData.length} clients créés`);
    return customersData;
  } catch (error) {
    console.error('❌ Erreur lors de la création des clients:', error);
    throw error;
  }
}

async function seedEmployeesWithTransaction(tx: any, seedUsers: User[], stats: SeedStats): Promise<Employee[]> {
  try {
    // Dates réalistes d'embauche
    const hireDates = [
      new Date('2023-01-15'), // Admin - directeur
      new Date('2023-03-01'), // Employee - employé
      new Date('2023-02-10')  // Manager - gérant
    ];

    const employeesData = seedUsers.map((user, index) => ({
      userId: user.id,
      firstName: user.firstName || 'Employee',
      lastName: user.lastName || 'Barista',
      position: user.role === 'directeur' ? 'Directeur' : user.role === 'gerant' ? 'Gérant' : 'Serveur',
      hourlyRate: user.role === 'directeur' ? 25.0 : user.role === 'gerant' ? 20.0 : 15.0,
      hireDate: hireDates[index] || new Date('2023-01-01'),
      isActive: true
    }));

    const employeesResult = await tx.insert(employees).values(employeesData).returning();
    stats.employeesCreated = employeesResult.length;
    console.log(`✅ ${employeesResult.length} employés créés`);
    return employeesResult;
  } catch (error) {
    console.error('❌ Erreur lors de la création des employés:', error);
    throw error;
  }
}

async function seedPermissionsWithTransaction(tx: any, seedUsers: User[], stats: SeedStats): Promise<void> {
  try {
    const modules = [
      'dashboard', 'menu', 'reservations', 'orders', 'customers', 
      'employees', 'reports', 'settings', 'analytics', 'inventory'
    ];

    const permissionsData = [];

    for (const user of seedUsers) {
      for (const module of modules) {
        let permissions_config;
        
        // Configuration des permissions selon le rôle
        switch (user.role) {
          case 'directeur':
            permissions_config = { canView: true, canCreate: true, canUpdate: true, canDelete: true };
            break;
          case 'gerant':
            permissions_config = { 
              canView: true, 
              canCreate: true, 
              canUpdate: true, 
              canDelete: module !== 'employees' // Gérant ne peut pas supprimer les employés
            };
            break;
          case 'employe':
            permissions_config = { 
              canView: ['dashboard', 'menu', 'reservations', 'orders', 'customers'].includes(module),
              canCreate: ['reservations', 'orders'].includes(module),
              canUpdate: ['reservations', 'orders'].includes(module),
              canDelete: false
            };
            break;
          default:
            permissions_config = { canView: false, canCreate: false, canUpdate: false, canDelete: false };
        }

        permissionsData.push({
          userId: user.id,
          module: module,
          ...permissions_config
        });
      }
    }

    await tx.insert(permissions).values(permissionsData);
    stats.permissionsCreated = permissionsData.length;
    console.log(`✅ ${permissionsData.length} permissions créées`);
  } catch (error) {
    console.error('❌ Erreur lors de la création des permissions:', error);
    throw error;
  }
}

async function seedSampleReservationsWithTransaction(tx: any, customersData: Customer[], menuItemsData: MenuItem[], stats: SeedStats): Promise<void> {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const reservationsData = [
      {
        customerId: customersData[0].id,
        tableId: 1,
        date: tomorrow.toISOString().split('T')[0],
        time: '12:00',
        partySize: 2,
        status: 'confirmed',
        notes: 'Anniversaire - demande une table près de la fenêtre'
      },
      {
        customerId: customersData[1].id,
        tableId: 3,
        date: tomorrow.toISOString().split('T')[0],
        time: '19:30',
        partySize: 4,
        status: 'confirmed',
        notes: 'Dîner d\'affaires'
      }
    ];

    await tx.insert(reservations).values(reservationsData);
    stats.reservationsCreated = reservationsData.length;
    console.log(`✅ ${reservationsData.length} réservations d\'exemple créées`);
  } catch (error) {
    console.error('❌ Erreur lors de la création des réservations:', error);
    throw error;
  }
}

async function seedSampleOrdersWithTransaction(tx: any, customersData: Customer[], menuItemsData: MenuItem[], stats: SeedStats): Promise<void> {
  try {
    // Créer quelques commandes d'exemple
    const ordersData = [
      {
        customerId: customersData[0].id,
        tableId: 1,
        status: 'completed',
        totalAmount: 15.30
      },
      {
        customerId: customersData[1].id,
        tableId: 2,
        status: 'pending',
        totalAmount: 22.50
      },
      {
        customerId: customersData[2].id,
        tableId: null, // Commande à emporter
        status: 'preparing',
        totalAmount: 8.70
      }
    ];

    const insertedOrders = await tx.insert(orders).values(ordersData).returning();

    // Créer des items pour chaque commande
    const orderItemsData = [
      // Commande 1
      { orderId: insertedOrders[0].id, menuItemId: menuItemsData[0].id, quantity: 2, unitPrice: 2.50, totalPrice: 5.00, specialInstructions: null },
      { orderId: insertedOrders[0].id, menuItemId: menuItemsData[12].id, quantity: 1, unitPrice: 2.20, totalPrice: 2.20, specialInstructions: null },
      { orderId: insertedOrders[0].id, menuItemId: menuItemsData[6].id, quantity: 1, unitPrice: 3.50, totalPrice: 3.50, specialInstructions: 'Extra chantilly' },
      
      // Commande 2
      { orderId: insertedOrders[1].id, menuItemId: menuItemsData[2].id, quantity: 1, unitPrice: 4.20, totalPrice: 4.20, specialInstructions: null },
      { orderId: insertedOrders[1].id, menuItemId: menuItemsData[17].id, quantity: 1, unitPrice: 7.20, totalPrice: 7.20, specialInstructions: null },
      { orderId: insertedOrders[1].id, menuItemId: menuItemsData[19].id, quantity: 1, unitPrice: 7.80, totalPrice: 7.80, specialInstructions: 'Sauce à part' },
      
      // Commande 3
      { orderId: insertedOrders[2].id, menuItemId: menuItemsData[11].id, quantity: 1, unitPrice: 3.80, totalPrice: 3.80, specialInstructions: null },
      { orderId: insertedOrders[2].id, menuItemId: menuItemsData[14].id, quantity: 1, unitPrice: 2.80, totalPrice: 2.80, specialInstructions: null }
    ];

    await tx.insert(orderItems).values(orderItemsData);
    
    stats.ordersCreated = insertedOrders.length;
    console.log(`✅ ${insertedOrders.length} commandes d\'exemple créées avec leurs items`);
  } catch (error) {
    console.error('❌ Erreur lors de la création des commandes:', error);
    throw error;
  }
}

function printSeedingStats(stats: SeedStats): void {
  console.log('\n📊 Statistiques du seeding:');
  console.log(`👥 Utilisateurs: ${stats.usersCreated}`);
  console.log(`📂 Catégories: ${stats.categoriesCreated}`);
  console.log(`🍽️ Items de menu: ${stats.menuItemsCreated}`);
  console.log(`👨‍💼 Employés: ${stats.employeesCreated}`);
  console.log(`👥 Clients: ${stats.customersCreated}`);
  console.log(`🖼️ Images: ${stats.imagesCreated}`);
  console.log(`📅 Réservations: ${stats.reservationsCreated}`);
  console.log(`🛒 Commandes: ${stats.ordersCreated}`);
  console.log(`🔐 Permissions: ${stats.permissionsCreated}`);
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  const environment = process.env.NODE_ENV as 'development' | 'production' | 'test' || 'development';
  
  seedDatabase({ 
    environment,
    includeImages: true,
    includeSampleReservations: true,
    includeSampleOrders: true,
    includePermissions: true
  }).catch((error) => {
    console.error('❌ Erreur lors du seeding:', error);
    process.exit(1);
  });
}
