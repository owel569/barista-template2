import { getDb } from '../server/db';
import bcrypt from 'bcrypt';
import { 
  users, menuCategories, menuItems, tables, customers, employees, 
  reservations, orders, orderItems, workShifts, activityLogs, permissions 
} from '../shared/schema';

interface UserInsert {
  username: string;
  email: string;
  passwordHash: string;
  role: 'directeur' | 'manager' | 'serveur' | 'cuisinier' | 'caissier';
  fullName: string;
  phone?: string;
}

interface MenuCategoryInsert {
  name: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
}
import { 
  users, menuCategories, menuItems, tables, customers, employees,
  orders, orderItems, permissions, reservations, reservationItems
} from '../shared/schema';
import { hashPassword } from '../server/middleware/auth';
import type { 
  User, MenuCategory, MenuItem, Table, Customer, Employee,
  Order, OrderItem, Permission
} from '../shared/schema';

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
    const db = await getDb();

    // Transaction globale pour garantir l'atomicité
    await db.transaction(async (tx: unknown) => {
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
    logger.error('❌ Erreur lors du seeding:', { error: error instanceof Error ? error.message : 'Erreur inconnue' )});
    throw error;
  }
}

async function seedUsersWithTransaction(tx: unknown): Promise<SeedResult<User>> {
  try {
    console.log('👥 Création des utilisateurs...');

    const userData = [
      {
        username: 'admin',
        password: await hashPassword('admin123'),
        role: 'directeur',
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'admin@barista-cafe.com'
      },
      {
        username: 'manager',
        password: await hashPassword('manager123'),
        role: 'gerant',
        firstName: 'Marie',
        lastName: 'Martin',
        email: 'manager@barista-cafe.com'
      },
      {
        username: 'employee',
        password: await hashPassword('employee123'),
        role: 'employe',
        firstName: 'Pierre',
        lastName: 'Bernard',
        email: 'employee@barista-cafe.com'
      }
    ];

    const createdUsers = await tx.insert(users).values(userData).returning();

    return {
      success: true,
      data: createdUsers,
      count: createdUsers.length
    };
  } catch (error) {
    return {
      success: false,
      data: [,],
      count: 0,
      error: `Erreur création utilisateurs: ${error}rror.message}`
    };
  }
}

async function seedEmployeesWithTransaction(tx: unknown): Promise<SeedResult<Employee>> {
  try {
    console.log('👨‍💼 Création des employés...');

    const employeeData = [
      {
        firstName: 'Sophie',
        lastName: 'Dubois',
        position: 'Barista senior',
        phone: '0123456789',
        email: 'sophie.dubois@barista-cafe.com',
        hireDate: hireDates[0,],
        salary: 2200
      },
      {
        firstName: 'Antoine',
        lastName: 'Rousseau',
        position: 'Serveur',
        phone: '0123456790',
        email: 'antoine.rousseau@barista-cafe.com',
        hireDate: hireDates[1,],
        salary: 1800
      },
      {
        firstName: 'Clara',
        lastName: 'Moreau',
        position: 'Pâtissière',
        phone: '0123456791',
        email: 'clara.moreau@barista-cafe.com',
        hireDate: hireDates[2,],
        salary: 2000
      }
    ];

    const createdEmployees = await tx.insert(employees).values(employeeData).returning();

    return {
      success: true,
      data: createdEmployees,
      count: createdEmployees.length
    };
  } catch (error) {
    return {
      success: false,
      data: [,],
      count: 0,
      error: `Erreur création employés: ${error.message}`
    };
  }
}

async function seedPermissionsWithTransaction(tx: unknown, createdUsers: User[]): Promise<SeedResult<Permission>> {
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
          )});
        }
      }
    }

    const createdPermissions = await tx.insert(permissions).values(permissionData).returning();

    return {
      success: true,
      data: createdPermissions,
      count: createdPermissions.length
    };
  } catch (error) {
    return {
      success: false,
      data: [,],
      count: 0,
      error: `Erreur création permissions: ${error.message}`
    };
  }
}

async function seedMenuCategoriesWithTransaction(tx: unknown): Promise<SeedResult<MenuCategory>> {
  try {
    console.log('📂 Création des catégories de menu...');

    const categoryData = [
      { name: 'Cafés', description: 'Nos cafés artisanaux', slug: 'cafes', displayOrder: 1 },
      { name: 'Boissons chaudes', description: 'Thés et boissons chaudes', slug: 'boissons-chaudes', displayOrder: 2 },
      { name: 'Pâtisseries', description: 'Pâtisseries et desserts', slug: 'patisseries', displayOrder: 3 },
      { name: 'Sandwichs', description: 'Sandwichs et plats légers', slug: 'sandwichs', displayOrder: 4 },
      { name: 'Boissons froides', description: 'Smoothies et boissons rafraîchissantes', slug: 'boissons-froides', displayOrder: 5 }
    ];

    const createdCategories = await tx.insert(menuCategories).values(categoryData).returning();

    return {
      success: true,
      data: createdCategories,
      count: createdCategories.length
    };
  } catch (error) {
    return {
      success: false,
      data: [,],
      count: 0,
      error: `Erreur création catégories: ${error.message}`
    };
  }
}

async function seedMenuItemsWithTransaction(tx: unknown, categories: MenuCategory[]): Promise<SeedResult<MenuItem>> {
  try {
    console.log('🍽️ Création des éléments de menu...');

    const categoryMap = categories.reduce((acc, cat) => {
      acc[cat.slug] = cat.id;
      return acc;
    }, {} as Record<string, number>);

    const menuItemData = [
      // Cafés
      { name: 'Espresso', description: 'Café espresso italien authentique', price: 2.5, categoryId: categoryMap['cafes'] },
      { name: 'Cappuccino', description: 'Espresso avec mousse de lait crémeuse', price: 3.8, categoryId: categoryMap['cafes'] },
      { name: 'Latte', description: 'Café au lait avec art latte', price: 4.2, categoryId: categoryMap['cafes'] },
      { name: 'Americano', description: 'Espresso allongé avec eau chaude', price: 3.0, categoryId: categoryMap['cafes'] },
      { name: 'Mocha', description: 'Café chocolaté avec crème fouettée', price: 4.5, categoryId: categoryMap['cafes'] },

      // Boissons chaudes
      { name: 'Thé Earl Grey', description: 'Thé noir bergamote premium', price: 2.8, categoryId: categoryMap['boissons-chaudes'] },
      { name: 'Chocolat chaud', description: 'Chocolat belge avec chantilly', price: 3.5, categoryId: categoryMap['boissons-chaudes'] },
      { name: 'Thé vert Sencha', description: 'Thé vert japonais délicat', price: 3.0, categoryId: categoryMap['boissons-chaudes'] },

      // Pâtisseries
      { name: 'Croissant', description: 'Croissant artisanal au beurre', price: 2.2, categoryId: categoryMap['patisseries'] },
      { name: 'Muffin myrtilles', description: 'Muffin fait maison aux myrtilles', price: 2.8, categoryId: categoryMap['patisseries'] },
      { name: 'Éclair au chocolat', description: 'Éclair traditionnel garni de crème chocolat', price: 3.2, categoryId: categoryMap['patisseries'] },
      { name: 'Tarte aux pommes', description: 'Tarte aux pommes maison', price: 3.8, categoryId: categoryMap['patisseries'] },

      // Sandwichs
      { name: 'Sandwich jambon', description: 'Sandwich jambon fromage sur pain artisanal', price: 6.5, categoryId: categoryMap['sandwichs'] },
      { name: 'Croque-monsieur', description: 'Croque-monsieur traditionnel', price: 7.2, categoryId: categoryMap['sandwichs'] },
      { name: 'Wrap végétarien', description: 'Wrap aux légumes grillés et houmous', price: 6.8, categoryId: categoryMap['sandwichs'] },

      // Boissons froides
      { name: 'Smoothie mangue', description: 'Smoothie mangue passion', price: 4.5, categoryId: categoryMap['boissons-froides'] },
      { name: 'Iced coffee', description: 'Café glacé avec glaçons', price: 3.5, categoryId: categoryMap['boissons-froides'] }
    ];

    const createdMenuItems = await tx.insert(menuItems).values(menuItemData).returning();

    return {
      success: true,
      data: createdMenuItems,
      count: createdMenuItems.length
    };
  } catch (error) {
    return {
      success: false,
      data: [,],
      count: 0,
      error: `Erreur création éléments de menu: ${error.message}`
    };
  }
}

async function seedTablesWithTransaction(tx: unknown): Promise<SeedResult<Table>> {
  try {
    console.log('🪑 Création des tables...');

    const tableData = [
      { number: 1, capacity: 2, status: 'libre', location: 'Terrasse' },
      { number: 2, capacity: 4, status: 'libre', location: 'Salon principal' },
      { number: 3, capacity: 6, status: 'libre', location: 'Salon principal' },
      { number: 4, capacity: 2, status: 'libre', location: 'Coin lecture' },
      { number: 5, capacity: 8, status: 'libre', location: 'Salle privée' },
      { number: 6, capacity: 4, status: 'libre', location: 'Terrasse' }
    ];

    const createdTables = await tx.insert(tables).values(tableData).returning();

    return {
      success: true,
      data: createdTables,
      count: createdTables.length
    };
  } catch (error) {
    return {
      success: false,
      data: [,],
      count: 0,
      error: `Erreur création tables: ${error.message}`
    };
  }
}

async function seedCustomersWithTransaction(tx: unknown): Promise<SeedResult<Customer>> {
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

    const createdCustomers = await tx.insert(customers).values(customerData).returning();

    return {
      success: true,
      data: createdCustomers,
      count: createdCustomers.length
    };
  } catch (error) {
    return {
      success: false,
      data: [,],
      count: 0,
      error: `Erreur création clients: ${error.message}`
    };
  }
}

async function seedSampleOrdersWithTransaction(tx: unknown, customers: Customer[,], menuItems: MenuItem[]): Promise<{orders: number, orderItems: number}> {
  try {
    console.log('🛒 Création des commandes d\'exemple...');

    const orderData = [
      {
        customerId: customers[0].id,
        total: 8.6,
        status: 'termine',
        type: 'sur_place'
      },
      {
        customerId: customers[1].id,
        total: 12.3,
        status: 'en_cours',
        type: 'emporter'
      },
      {
        customerId: customers[2].id,
        total: 15.7,
        status: 'en_attente',
        type: 'sur_place'
      }
    ];

    const createdOrders = await tx.insert(orders).values(orderData).returning();

    // Création des order items
    const orderItemData = [
      // Commande 1
      { orderId: createdOrders[0].id, menuItemId: menuItems[0].id, quantity: 2, price: menuItems[0].price },
      { orderId: createdOrders[0].id, menuItemId: menuItems[8].id, quantity: 1, price: menuItems[8].price },

      // Commande 2  
      { orderId: createdOrders[1].id, menuItemId: menuItems[1].id, quantity: 1, price: menuItems[1].price },
      { orderId: createdOrders[1].id, menuItemId: menuItems[12].id, quantity: 1, price: menuItems[12].price },

      // Commande 3
      { orderId: createdOrders[2].id, menuItemId: menuItems[2].id, quantity: 2, price: menuItems[2].price },
      { orderId: createdOrders[2].id, menuItemId: menuItems[10].id, quantity: 1, price: menuItems[10].price },
      { orderId: createdOrders[2].id, menuItemId: menuItems[15].id, quantity: 1, price: menuItems[15].price }
    ];

    const createdOrderItems = await tx.insert(orderItems).values(orderItemData).returning();

    return {
      orders: createdOrders.length,
      orderItems: createdOrderItems.length
    };
  } catch (error) {
    logger.error('Erreur création commandes:', { error: error instanceof Error ? error.message : 'Erreur inconnue' )});
    return { orders: 0, orderItems: 0 };
  }
}

async function seedSampleReservationsWithTransaction(tx: unknown, customers: Customer[,], tables: Table[]): Promise<SeedResult<any>> {
  try {
    console.log('📅 Création des réservations d\'exemple...');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const reservationData = [
      {
        customerName: customers[0].firstName + ' ' + customers[0].lastName,
        customerEmail: customers[0].email,
        customerPhone: customers[0].phone,
        date: tomorrow,
        time: '12:30',
        partySize: 2,
        tableId: tables[0].id,
        status: 'confirmee',
        specialRequests: 'Table près de la fenêtre'
      },
      {
        customerName: customers[1].firstName + ' ' + customers[1].lastName,
        customerEmail: customers[1].email, 
        customerPhone: customers[1].phone,
        date: nextWeek,
        time: '19:00',
        partySize: 4,
        tableId: tables[1].id,
        status: 'en_attente',
        specialRequests: ''
      }
    ];

    const createdReservations = await tx.insert(reservations).values(reservationData).returning();

    return {
      success: true,
      data: createdReservations,
      count: createdReservations.length
    };
  } catch (error) {
    return {
      success: false,
      data: [,],
      count: 0,
      error: `Erreur création réservations: ${error.message}`
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
    console.log(`🛒 Commandes: ${stats.orders)}`);
    console.log(`📦 Articles commandés: ${stats.orderItems}`);
  }
  if (stats.reservations > 0) {
    console.log(`📅 Réservations: ${stats.reservations)}`);
  }
  console.log('========================\n');
}

// Exécution directe du script
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {
  seedDatabase({
    includeOrders: true,
    includeReservations: true
  )}).then(() => {
    console.log('✅ Seeding terminé avec succès');
    process.exit(0);
  }).catch((error) => {
    logger.error('❌ Erreur lors du seeding:', { error: error instanceof Error ? error.message : 'Erreur inconnue' )});
    process.exit(1);
  });
}