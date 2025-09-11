import { getDbAsync, connection } from '../server/db';
import { hash } from 'bcryptjs';

// Utilitaire de sécurité
const SecurityUtils = {
  async hashPassword(password: string): Promise<string> {
    return await hash(password, 12);
  }
};
import { sql } from 'drizzle-orm';
import {
  users, menuCategories, menuItems, tables, customers, employees,
  orders, orderItems, permissions, reservations
} from '../shared/schema';
// Types inférés du schéma
type User = typeof users.$inferSelect;
type MenuCategory = typeof menuCategories.$inferSelect;
type MenuItem = typeof menuItems.$inferSelect;
type Table = typeof tables.$inferSelect;
type Customer = typeof customers.$inferSelect;
type Employee = typeof employees.$inferSelect;
type Order = typeof orders.$inferSelect;
type OrderItem = typeof orderItems.$inferSelect;
type Permission = typeof permissions.$inferSelect;

// Types pour le seeding
interface SeedResult<T> {
  success: boolean;
  data: T[];
  count: number;
  error?: string;
}

interface SeedStats {
  users: number;
  categories: number;
  menuItems: number;
  tables: number;
  customers: number;
  employees: number;
  orders: number;
  orderItems: number;
  permissions: number;
  reservations: number;
}

// Données réalistes pour les employés
const hireDates = [
  new Date('2023-01-15'),
  new Date('2023-03-22'),
  new Date('2023-06-10'),
  new Date('2023-09-05'),
  new Date('2024-01-08'),
];

export async function seedDatabase(options: {
  skipExisting?: boolean;
  includeOrders?: boolean;
  includeReservations?: boolean;
} = {}): Promise<SeedStats> {

  const stats: SeedStats = {
    users: 0, categories: 0, menuItems: 0, tables: 0,
    customers: 0, employees: 0, orders: 0, orderItems: 0,
    permissions: 0, reservations: 0
  };

  if (process.env.NODE_ENV === 'production') {
    throw new Error('🚫 Seeding interdit en production pour sécurité');
  }

  console.log('🌱 Début du seeding de la base de données...');

  try {
    const db = await waitForDatabase();

    // Transaction globale pour garantir l'atomicité
    await db.transaction(async (tx: any) => {
      // 1. Utilisateurs et employés
      const usersResult = await seedUsersWithTransaction(tx);
      stats.users = usersResult.count;

      const employeesResult = await seedEmployeesWithTransaction(tx);
      stats.employees = employeesResult.count;

      // 2. Permissions
      const permissionsResult = await seedPermissionsWithTransaction(tx, usersResult.data);
      stats.permissions = permissionsResult.count;

      // 3. Structure du menu
      const categoriesResult = await seedMenuCategoriesWithTransaction(tx);
      stats.categories = categoriesResult.count;

      const menuItemsResult = await seedMenuItemsWithTransaction(tx, categoriesResult.data);
      stats.menuItems = menuItemsResult.count;

      // 4. Tables
      const tablesResult = await seedTablesWithTransaction(tx);
      stats.tables = tablesResult.count;

      // 5. Clients
      const customersResult = await seedCustomersWithTransaction(tx);
      stats.customers = customersResult.count;

      // 6. Commandes (optionnel)
      if (options.includeOrders) {
        const ordersResult = await seedSampleOrdersWithTransaction(tx, customersResult.data, menuItemsResult.data);
        stats.orders = ordersResult.orders;
        stats.orderItems = ordersResult.orderItems;
      }

      // 7. Réservations (optionnel)
      if (options.includeReservations) {
        const reservationsResult = await seedSampleReservationsWithTransaction(tx, customersResult.data, tablesResult.data);
        stats.reservations = reservationsResult.count;
      }
    });

    console.log('✅ Seeding terminé avec succès');
    printSeedingStats(stats);
    return stats;

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    throw error;
  }
}

async function seedUsersWithTransaction(tx: any): Promise<SeedResult<User>> {
  try {
    console.log('👥 Création des utilisateurs...');

    const userData = [
      {
        username: 'admin',
        password: await SecurityUtils.hashPassword('admin123'),
        role: 'directeur',
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'admin@barista-cafe.com'
      },
      {
        username: 'manager',
        password: await SecurityUtils.hashPassword('manager123'),
        role: 'gerant',
        firstName: 'Marie',
        lastName: 'Martin',
        email: 'manager@barista-cafe.com'
      },
      {
        username: 'employee',
        password: await SecurityUtils.hashPassword('employee123'),
        role: 'employe',
        firstName: 'Pierre',
        lastName: 'Bernard',
        email: 'employee@barista-cafe.com'
      }
    ];

    const createdUsers = await tx.insert(users).values(userData).onConflictDoNothing().returning();

    return {
      success: true,
      data: createdUsers,
      count: createdUsers.length
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      count: 0,
      error: `Erreur création utilisateurs: ${error instanceof Error ? error.message : error}`
    };
  }
}

async function seedEmployeesWithTransaction(tx: any): Promise<SeedResult<Employee>> {
  try {
    console.log('👨‍💼 Création des employés...');

    const employeeData = [
      {
        employeeNumber: 'EMP001',
        position: 'Barista senior',
        hireDate: hireDates[0],
        salary: 2200
      },
      {
        employeeNumber: 'EMP002',
        position: 'Serveur',
        hireDate: hireDates[1],
        salary: 1800
      },
      {
        employeeNumber: 'EMP003',
        position: 'Pâtissière',
        hireDate: hireDates[2],
        salary: 2000
      }
    ];

    const createdEmployees = await tx.insert(employees).values(employeeData).onConflictDoNothing().returning();

    return {
      success: true,
      data: createdEmployees,
      count: createdEmployees.length
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      count: 0,
      error: `Erreur création employés: ${(error as Error).message}`
    };
  }
}

async function seedPermissionsWithTransaction(tx: any, createdUsers: User[]): Promise<SeedResult<Permission>> {
  try {
    console.log('🔐 Création des permissions...');

    const modules = ['menu', 'orders', 'customers', 'employees', 'analytics', 'settings'];
    const permissionData = [];

    for (const user of createdUsers) {
      for (const module of modules) {
        let canView = true;
        let canCreate = false;
        let canUpdate = false;
        let canDelete = false;

        // Permissions par rôle
        switch (user.role) {
          case 'directeur':
            canCreate = canUpdate = canDelete = true;
            break;
          case 'gerant':
            canCreate = canUpdate = true;
            canDelete = ['menu', 'customers'].includes(module);
            break;
          case 'employe':
            canView = ['menu', 'orders', 'customers'].includes(module);
            canCreate = canUpdate = module === 'orders';
            break;
        }

        if (canView) {
          permissionData.push({
            userId: user.id,
            module,
            canView,
            canCreate,
            canUpdate,
            canDelete
          });
        }
      }
    }

    const createdPermissions = await (tx as any).insert(permissions).values(permissionData).onConflictDoNothing().returning();

    return {
      success: true,
      data: createdPermissions,
      count: createdPermissions.length
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      count: 0,
      error: `Erreur création permissions: ${(error as Error).message}`
    };
  }
}

async function seedMenuCategoriesWithTransaction(tx: any): Promise<SeedResult<MenuCategory>> {
  try {
    console.log('📂 Création des catégories de menu...');

    const categoryData = [
      { name: 'Cafés', description: 'Nos cafés artisanaux', sortOrder: 1 },
      { name: 'Boissons chaudes', description: 'Thés et boissons chaudes', sortOrder: 2 },
      { name: 'Pâtisseries', description: 'Pâtisseries et desserts', sortOrder: 3 },
      { name: 'Sandwichs', description: 'Sandwichs et plats légers', sortOrder: 4 },
      { name: 'Boissons froides', description: 'Smoothies et boissons rafraîchissantes', sortOrder: 5 }
    ];

    const createdCategories = await tx.insert(menuCategories).values(categoryData).onConflictDoNothing().returning();

    return {
      success: true,
      data: createdCategories,
      count: createdCategories.length
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      count: 0,
      error: `Erreur création catégories: ${(error as Error).message}`
    };
  }
}

async function seedMenuItemsWithTransaction(tx: any, categories: MenuCategory[]): Promise<SeedResult<MenuItem>> {
  try {
    console.log('🍽️ Création des éléments de menu...');

    const categoryMap = categories.reduce((acc, cat) => {
      acc[cat.name.toLowerCase()] = cat.id;
      return acc;
    }, {} as Record<string, number>);

    const menuItemData = [
      // Cafés
      { name: 'Espresso', description: 'Café espresso italien authentique', price: '2.50', categoryId: categoryMap['cafés'] },
      { name: 'Cappuccino', description: 'Espresso avec mousse de lait crémeuse', price: '3.80', categoryId: categoryMap['cafés'] },
      { name: 'Latte', description: 'Café au lait avec art latte', price: '4.20', categoryId: categoryMap['cafés'] },
      { name: 'Americano', description: 'Espresso allongé avec eau chaude', price: '3.00', categoryId: categoryMap['cafés'] },
      { name: 'Mocha', description: 'Café chocolaté avec crème fouettée', price: '4.50', categoryId: categoryMap['cafés'] },

      // Boissons chaudes
      { name: 'Thé Earl Grey', description: 'Thé noir bergamote premium', price: '2.80', categoryId: categoryMap['boissons chaudes'] },
      { name: 'Chocolat chaud', description: 'Chocolat belge avec chantilly', price: '3.50', categoryId: categoryMap['boissons chaudes'] },
      { name: 'Thé vert Sencha', description: 'Thé vert japonais délicat', price: '3.00', categoryId: categoryMap['boissons chaudes'] },

      // Pâtisseries
      { name: 'Croissant', description: 'Croissant artisanal au beurre', price: '2.20', categoryId: categoryMap['pâtisseries'] },
      { name: 'Muffin myrtilles', description: 'Muffin fait maison aux myrtilles', price: '2.80', categoryId: categoryMap['pâtisseries'] },
      { name: 'Éclair au chocolat', description: 'Éclair traditionnel garni de crème chocolat', price: '3.20', categoryId: categoryMap['pâtisseries'] },
      { name: 'Tarte aux pommes', description: 'Tarte aux pommes maison', price: '3.80', categoryId: categoryMap['pâtisseries'] },

      // Sandwichs
      { name: 'Sandwich jambon', description: 'Sandwich jambon fromage sur pain artisanal', price: '6.50', categoryId: categoryMap['sandwichs'] },
      { name: 'Croque-monsieur', description: 'Croque-monsieur traditionnel', price: '7.20', categoryId: categoryMap['sandwichs'] },
      { name: 'Wrap végétarien', description: 'Wrap aux légumes grillés et houmous', price: '6.80', categoryId: categoryMap['sandwichs'] },

      // Boissons froides
      { name: 'Smoothie mangue', description: 'Smoothie mangue passion', price: '4.50', categoryId: categoryMap['boissons froides'] },
      { name: 'Iced coffee', description: 'Café glacé avec glaçons', price: '3.50', categoryId: categoryMap['boissons froides'] }
    ];

    const createdMenuItems = await tx.insert(menuItems).values(menuItemData).onConflictDoNothing().returning();

    return {
      success: true,
      data: createdMenuItems,
      count: createdMenuItems.length
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      count: 0,
      error: `Erreur création éléments de menu: ${(error as Error).message}`
    };
  }
}

async function seedTablesWithTransaction(tx: any): Promise<SeedResult<Table>> {
  try {
    console.log('🪑 Création des tables...');

    const tableData = [
      { number: 1, capacity: 2, status: 'available', location: 'Terrasse' },
      { number: 2, capacity: 4, status: 'available', location: 'Salon principal' },
      { number: 3, capacity: 6, status: 'available', location: 'Salon principal' },
      { number: 4, capacity: 2, status: 'available', location: 'Coin lecture' },
      { number: 5, capacity: 8, status: 'available', location: 'Salle privée' },
      { number: 6, capacity: 4, status: 'available', location: 'Terrasse' }
    ];

    const createdTables = await tx.insert(tables).values(tableData).onConflictDoNothing().returning();

    return {
      success: true,
      data: createdTables,
      count: createdTables.length
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      count: 0,
      error: `Erreur création tables: ${(error as Error).message}`
    };
  }
}

async function seedCustomersWithTransaction(tx: any): Promise<SeedResult<Customer>> {
  try {
    console.log('👤 Création des clients...');

    const customerData = [
      {
        firstName: 'Emma',
        lastName: 'Durand',
        email: 'emma.durand@email.com',
        phone: '0123456789',
        loyaltyPoints: 120
      },
      {
        firstName: 'Julien',
        lastName: 'Petit',
        email: 'julien.petit@email.com',
        phone: '0123456790',
        loyaltyPoints: 85
      },
      {
        firstName: 'Camille',
        lastName: 'Roux',
        email: 'camille.roux@email.com',
        phone: '0123456791',
        loyaltyPoints: 200
      },
      {
        firstName: 'Thomas',
        lastName: 'Garcia',
        email: 'thomas.garcia@email.com',
        phone: '0123456792',
        loyaltyPoints: 50
      }
    ];

    const createdCustomers = await tx.insert(customers).values(customerData).onConflictDoNothing().returning();

    return {
      success: true,
      data: createdCustomers,
      count: createdCustomers.length
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      count: 0,
      error: `Erreur création clients: ${(error as Error).message}`
    };
  }
}

async function seedSampleOrdersWithTransaction(tx: any, customers: Customer[], menuItems: MenuItem[]): Promise<{orders: number, orderItems: number}> {
  try {
    console.log('🛒 Création des commandes d\'exemple...');

    const orderData = [
      {
        orderNumber: 'ORD001',
        customerId: customers[0].id,
        totalAmount: '8.60',
        status: 'delivered',
        orderType: 'dine-in'
      },
      {
        orderNumber: 'ORD002',
        customerId: customers[1].id,
        totalAmount: '12.30',
        status: 'preparing',
        orderType: 'takeout'
      },
      {
        orderNumber: 'ORD003',
        customerId: customers[2].id,
        totalAmount: '15.70',
        status: 'pending',
        orderType: 'dine-in'
      }
    ];

    const createdOrders = await tx.insert(orders).values(orderData).onConflictDoNothing().returning();

    // Créer des éléments de commande avec vérifications
    const orderItems = [];

    // Vérifications de sécurité pour éviter les erreurs undefined
    if (createdOrders[0] && menuItems[0] && menuItems[8]) {
      orderItems.push(
        { orderId: createdOrders[0].id, menuItemId: menuItems[0].id, quantity: 2, unitPrice: menuItems[0].price, totalPrice: String(Number(menuItems[0].price) * 2) },
        { orderId: createdOrders[0].id, menuItemId: menuItems[8].id, quantity: 1, unitPrice: menuItems[8].price, totalPrice: menuItems[8].price }
      );
    }

    if (createdOrders[1] && menuItems[1] && menuItems[12]) {
      orderItems.push(
        { orderId: createdOrders[1].id, menuItemId: menuItems[1].id, quantity: 1, unitPrice: menuItems[1].price, totalPrice: menuItems[1].price },
        { orderId: createdOrders[1].id, menuItemId: menuItems[12].id, quantity: 1, unitPrice: menuItems[12].price, totalPrice: menuItems[12].price }
      );
    }

    if (createdOrders[2] && menuItems[2] && menuItems[10] && menuItems[15]) {
      orderItems.push(
        { orderId: createdOrders[2].id, menuItemId: menuItems[2].id, quantity: 2, unitPrice: menuItems[2].price, totalPrice: String(Number(menuItems[2].price) * 2) },
        { orderId: createdOrders[2].id, menuItemId: menuItems[10].id, quantity: 1, unitPrice: menuItems[10].price, totalPrice: menuItems[10].price },
        { orderId: createdOrders[2].id, menuItemId: menuItems[15].id, quantity: 1, unitPrice: menuItems[15].price, totalPrice: menuItems[15].price }
      );
    }

    const createdOrderItems = await tx.insert(orderItems).values(orderItems).onConflictDoNothing().returning();

    return {
      orders: createdOrders.length,
      orderItems: createdOrderItems.length
    };
  } catch (error) {
    console.error('Erreur création commandes:', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    return { orders: 0, orderItems: 0 };
  }
}

async function seedSampleReservationsWithTransaction(tx: any, customers: Customer[], tables: Table[]): Promise<SeedResult<any>> {
  try {
    console.log('📅 Création des réservations d\'exemple...');

    const reservationData = [
      ...(customers[0] && tables[0] ? [{
        customerId: customers[0].id,
        tableId: tables[0].id,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Demain
        time: '19:00',
        partySize: 2,
        status: 'confirmed' as const,
        specialRequests: 'Table près de la fenêtre'
      }] : []),
      ...(customers[1] && tables[1] ? [{
        customerId: customers[1].id,
        tableId: tables[1].id,
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Après-demain
        time: '20:30',
        partySize: 4,
        status: 'pending' as const,
        specialRequests: 'Anniversaire - dessert spécial'
      }] : [])
    ];

    const createdReservations = await tx.insert(reservations).values(reservationData).onConflictDoNothing().returning();

    return {
      success: true,
      data: createdReservations,
      count: createdReservations.length
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      count: 0,
      error: `Erreur création réservations: ${(error as Error).message}`
    };
  }
}

function printSeedingStats(stats: SeedStats): void {
  console.log('\n📊 Statistiques du seeding:');
  console.log('========================');
  console.log(`👥 Utilisateurs: ${stats.users}`);
  console.log(`👨‍💼 Employés: ${stats.employees}`);
  console.log(`🔐 Permissions: ${stats.permissions}`);
  console.log(`📂 Catégories: ${stats.categories}`);
  console.log(`🍽️ Éléments de menu: ${stats.menuItems}`);
  console.log(`🪑 Tables: ${stats.tables}`);
  console.log(`👤 Clients: ${stats.customers}`);
  if (stats.orders > 0) {
    console.log(`🛒 Commandes: ${stats.orders}`);
    console.log(`📦 Articles commandés: ${stats.orderItems}`);
  }
  if (stats.reservations > 0) {
    console.log(`📅 Réservations: ${stats.reservations}`);
  }
  console.log('========================\n');
}

// Fonction d'attente robuste pour la base de données
async function waitForDatabase(maxRetries = 10, baseDelay = 1000): Promise<any> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Tentative de connexion à la base de données (${attempt}/${maxRetries})...`);

      const db = await getDbAsync();

      // Test de la connexion avec une requête simple
      await connection`SELECT 1 as test`;

      console.log('✅ Base de données prête pour le seeding');
      return db;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Erreur inconnue');
      console.warn(`⚠️  Tentative ${attempt} échouée:`, lastError.message);

      if (attempt < maxRetries) {
        // Backoff exponentiel avec jitter
        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
        const maxDelay = 30000; // Maximum 30 secondes
        const actualDelay = Math.min(delay, maxDelay);

        console.log(`⏳ Nouvelle tentative dans ${Math.round(actualDelay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, actualDelay));
      }
    }
  }

  throw new Error(`❌ Impossible de se connecter à la base de données après ${maxRetries} tentatives. Dernière erreur: ${lastError?.message}`);
}

// Exécution directe du script
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {
  seedDatabase({
    includeOrders: true,
    includeReservations: true
  }).then(() => {
    console.log('✅ Seeding terminé avec succès');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Erreur lors du seeding:', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    process.exit(1);
  });
}