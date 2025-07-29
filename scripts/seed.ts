import { getDb } from '../server/db';
import { users, employees, permissions, menuCategories, menuItems, tables, customers, orders, orderItems, reservations, platforms, onlineOrders } from '../shared/schema';
import { hashPassword } from '../server/middleware/auth';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import type { PgTransaction } from 'drizzle-orm/pg-core';

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

// Types stricts pour remplacer 'any'
interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  fullName: string;
  phone?: string;
}

interface Employee {
  id: number;
  userId: number;
  position: string;
  department: string;
  hireDate: Date;
  salary: number;
  status: string;
}

interface MenuCategory {
  id: number;
  name: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
}

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: string;
  categoryId: number;
  isAvailable: boolean;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address?: string;
}

interface Table {
  id: number;
  number: number;
  capacity: number;
  status: string;
  location: string;
}

export async function seedDatabase(options: {
  skipExisting?: boolean;
  includeOrders?: boolean;
  includeReservations?: boolean;
} = {}): Promise<SeedStats> {
  const stats: SeedStats = {
    users: 0,
    categories: 0,
    menuItems: 0,
    tables: 0,
    customers: 0,
    employees: 0,
    orders: 0,
    orderItems: 0,
    permissions: 0,
    reservations: 0
  };

  console.log('🌱 Début du seeding de la base de données...');

  try {
    const db = await getDb();
    await db.transaction(async (tx: PgTransaction<any, any, any>) => {
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

      // 5. Créer les plateformes de commande en ligne
      const platformsData = [
        { name: 'Uber Eats', isActive: true, commissionRate: '0.25' },
        { name: 'Deliveroo', isActive: true, commissionRate: '0.22' },
        { name: 'Just Eat', isActive: false, commissionRate: '0.20' }
      ];
      const createdPlatforms = await tx.insert(platforms).values(platformsData).returning();

      // 6. (Optionnel) Créer une commande en ligne de test
      const [testOrder] = await tx.insert(onlineOrders).values({
        orderNumber: 'OL-001',
        platform: 'Uber Eats',
        customerName: 'Alice Martin',
        customerPhone: '+33123456789',
        customerEmail: 'alice.martin@email.com',
        status: 'new',
        orderType: 'delivery',
        deliveryAddress: '15 Rue de la Paix, 75001 Paris',
        subtotal: '9.80',
        deliveryFee: '2.50',
        total: '13.50',
        paymentMethod: 'card',
        paymentStatus: 'paid',
        estimatedTime: '25 min',
        notes: 'Sonnette au nom de Martin',
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      if (testOrder) {
        await tx.insert(orderItems).values([
          {
            orderId: testOrder.id,
            menuItemId: 1, // Assurez-vous que cet ID existe
            quantity: 2,
            unitPrice: 3.50,
            totalPrice: 7.00,
            options: ['Lait d\'amande'],
            specialInstructions: ''
          },
          {
            orderId: testOrder.id,
            menuItemId: 2, // Assurez-vous que cet ID existe
            quantity: 1,
            unitPrice: 2.80,
            totalPrice: 2.80,
            options: [],
            specialInstructions: ''
          }
        ]);
      }

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
    console.error('❌ Erreur lors du seeding:', error);
    throw error;
  }
}

async function seedUsersWithTransaction(tx: PgTransaction<any, any, any>): Promise<SeedResult<User>> {
  try {
    const userData: UserInsert[] = [
      {
        username: 'admin',
        email: 'admin@barista-cafe.com',
        passwordHash: await hashPassword('admin123'),
        role: 'directeur',
        fullName: 'Administrateur Principal',
        phone: '+33123456789'
      },
      {
        username: 'manager',
        email: 'manager@barista-cafe.com',
        passwordHash: await hashPassword('manager123'),
        role: 'manager',
        fullName: 'Marie Dupont',
        phone: '+33123456790'
      },
      {
        username: 'serveur1',
        email: 'serveur1@barista-cafe.com',
        passwordHash: await hashPassword('serveur123'),
        role: 'serveur',
        fullName: 'Jean Martin',
        phone: '+33123456791'
      },
      {
        username: 'cuisinier1',
        email: 'cuisinier1@barista-cafe.com',
        passwordHash: await hashPassword('cuisinier123'),
        role: 'cuisinier',
        fullName: 'Pierre Dubois',
        phone: '+33123456792'
      },
      {
        username: 'caissier1',
        email: 'caissier1@barista-cafe.com',
        passwordHash: await hashPassword('caissier123'),
        role: 'caissier',
        fullName: 'Sophie Bernard',
        phone: '+33123456793'
      }
    ];

    const createdUsers = await tx.insert(users).values(userData).returning();

    return {
      success: true,
      data: createdUsers,
      count: createdUsers.length
    };
  } catch (error) {
    console.error('Erreur lors du seeding des utilisateurs:', error);
    return {
      success: false,
      data: [],
      count: 0,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

async function seedEmployeesWithTransaction(tx: PgTransaction<any, any, any>): Promise<SeedResult<Employee>> {
  try {
    const employeeData = [
      {
        userId: 1,
        position: 'Directeur',
        department: 'Direction',
        hireDate: new Date('2023-01-15'),
        salary: 4500,
        status: 'active'
      },
      {
        userId: 2,
        position: 'Manager',
        department: 'Service',
        hireDate: new Date('2023-02-01'),
        salary: 3200,
        status: 'active'
      },
      {
        userId: 3,
        position: 'Serveur',
        department: 'Service',
        hireDate: new Date('2023-03-10'),
        salary: 1800,
        status: 'active'
      },
      {
        userId: 4,
        position: 'Cuisinier',
        department: 'Cuisine',
        hireDate: new Date('2023-02-15'),
        salary: 2200,
        status: 'active'
      },
      {
        userId: 5,
        position: 'Caissier',
        department: 'Service',
        hireDate: new Date('2023-03-20'),
        salary: 1600,
        status: 'active'
      }
    ];

    const createdEmployees = await tx.insert(employees).values(employeeData).returning();

    return {
      success: true,
      data: createdEmployees,
      count: createdEmployees.length
    };
  } catch (error) {
    console.error('Erreur lors du seeding des employés:', error);
    return {
      success: false,
      data: [],
      count: 0,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

async function seedPermissionsWithTransaction(tx: PgTransaction<any, any, any>, createdUsers: User[]): Promise<SeedResult<unknown>> {
  try {
    const permissionsData = [
      // Permissions pour l'administrateur
      { userId: createdUsers[0].id, module: 'dashboard', permissions: ['read', 'write', 'delete'] },
      { userId: createdUsers[0].id, module: 'users', permissions: ['read', 'write', 'delete'] },
      { userId: createdUsers[0].id, module: 'menu', permissions: ['read', 'write', 'delete'] },
      { userId: createdUsers[0].id, module: 'orders', permissions: ['read', 'write', 'delete'] },
      { userId: createdUsers[0].id, module: 'reservations', permissions: ['read', 'write', 'delete'] },
      { userId: createdUsers[0].id, module: 'analytics', permissions: ['read', 'write', 'delete'] },
      { userId: createdUsers[0].id, module: 'accounting', permissions: ['read', 'write', 'delete'] },
      
      // Permissions pour le manager
      { userId: createdUsers[1].id, module: 'dashboard', permissions: ['read', 'write'] },
      { userId: createdUsers[1].id, module: 'menu', permissions: ['read', 'write'] },
      { userId: createdUsers[1].id, module: 'orders', permissions: ['read', 'write'] },
      { userId: createdUsers[1].id, module: 'reservations', permissions: ['read', 'write'] },
      { userId: createdUsers[1].id, module: 'analytics', permissions: ['read'] },
      
      // Permissions pour le serveur
      { userId: createdUsers[2].id, module: 'dashboard', permissions: ['read'] },
      { userId: createdUsers[2].id, module: 'orders', permissions: ['read', 'write'] },
      { userId: createdUsers[2].id, module: 'reservations', permissions: ['read', 'write'] },
      
      // Permissions pour le cuisinier
      { userId: createdUsers[3].id, module: 'dashboard', permissions: ['read'] },
      { userId: createdUsers[3].id, module: 'orders', permissions: ['read', 'write'] },
      { userId: createdUsers[3].id, module: 'menu', permissions: ['read'] },
      
      // Permissions pour le caissier
      { userId: createdUsers[4].id, module: 'dashboard', permissions: ['read'] },
      { userId: createdUsers[4].id, module: 'orders', permissions: ['read', 'write'] },
      { userId: createdUsers[4].id, module: 'accounting', permissions: ['read', 'write'] }
    ];

    const createdPermissions = await tx.insert(permissions).values(permissionsData).returning();

    return {
      success: true,
      data: createdPermissions,
      count: createdPermissions.length
    };
  } catch (error) {
    console.error('Erreur lors du seeding des permissions:', error);
    return {
      success: false,
      data: [],
      count: 0,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

async function seedMenuCategoriesWithTransaction(tx: PgTransaction<any, any, any>): Promise<SeedResult<MenuCategory>> {
  try {
    const categoryData: MenuCategoryInsert[] = [
      {
        name: 'Cafés',
        description: 'Cafés et boissons chaudes',
        displayOrder: 1,
        isActive: true
      },
      {
        name: 'Pâtisseries',
        description: 'Viennoiseries et desserts',
        displayOrder: 2,
        isActive: true
      },
      {
        name: 'Boissons Fraîches',
        description: 'Jus, smoothies et boissons froides',
        displayOrder: 3,
        isActive: true
      },
      {
        name: 'Plats',
        description: 'Plats principaux et salades',
        displayOrder: 4,
        isActive: true
      }
    ];

    const createdCategories = await tx.insert(menuCategories).values(categoryData).returning();

    return {
      success: true,
      data: createdCategories,
      count: createdCategories.length
    };
  } catch (error) {
    console.error('Erreur lors du seeding des catégories:', error);
    return {
      success: false,
      data: [],
      count: 0,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

async function seedMenuItemsWithTransaction(tx: PgTransaction<any, any, any>, categories: MenuCategory[]): Promise<SeedResult<MenuItem>> {
  try {
    const menuItemData = [
      {
        name: 'Cappuccino',
        description: 'Café expresso avec mousse de lait crémeuse',
        price: '3.50',
        categoryId: categories[0].id,
        isAvailable: true
      },
      {
        name: 'Latte',
        description: 'Café expresso avec lait chaud et mousse légère',
        price: '3.80',
        categoryId: categories[0].id,
        isAvailable: true
      },
      {
        name: 'Espresso',
        description: 'Café expresso pur et intense',
        price: '2.50',
        categoryId: categories[0].id,
        isAvailable: true
      },
      {
        name: 'Croissant',
        description: 'Viennoiserie classique au beurre',
        price: '2.80',
        categoryId: categories[1].id,
        isAvailable: true
      },
      {
        name: 'Pain au Chocolat',
        description: 'Viennoiserie avec chocolat noir',
        price: '3.20',
        categoryId: categories[1].id,
        isAvailable: true
      },
      {
        name: 'Smoothie Fruits Rouges',
        description: 'Smoothie frais aux fruits rouges',
        price: '4.50',
        categoryId: categories[2].id,
        isAvailable: true
      },
      {
        name: 'Salade César',
        description: 'Salade avec poulet, parmesan et croûtons',
        price: '8.90',
        categoryId: categories[3].id,
        isAvailable: true
      }
    ];

    const createdMenuItems = await tx.insert(menuItems).values(menuItemData).returning();

    return {
      success: true,
      data: createdMenuItems,
      count: createdMenuItems.length
    };
  } catch (error) {
    console.error('Erreur lors du seeding des éléments de menu:', error);
    return {
      success: false,
      data: [],
      count: 0,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

async function seedTablesWithTransaction(tx: PgTransaction<any, any, any>): Promise<SeedResult<Table>> {
  try {
    const tableData = [
      { number: 1, capacity: 2, status: 'available', location: 'terrasse' },
      { number: 2, capacity: 4, status: 'available', location: 'terrasse' },
      { number: 3, capacity: 6, status: 'available', location: 'interieur' },
      { number: 4, capacity: 2, status: 'available', location: 'interieur' },
      { number: 5, capacity: 4, status: 'available', location: 'interieur' },
      { number: 6, capacity: 8, status: 'available', location: 'interieur' }
    ];

    const createdTables = await tx.insert(tables).values(tableData).returning();

    return {
      success: true,
      data: createdTables,
      count: createdTables.length
    };
  } catch (error) {
    console.error('Erreur lors du seeding des tables:', error);
    return {
      success: false,
      data: [],
      count: 0,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

async function seedCustomersWithTransaction(tx: PgTransaction<any, any, any>): Promise<SeedResult<Customer>> {
  try {
    const customerData = [
      {
        name: 'Alice Martin',
        email: 'alice.martin@email.com',
        phone: '+33123456789',
        address: '15 Rue de la Paix, 75001 Paris'
      },
      {
        name: 'Bob Dupont',
        email: 'bob.dupont@email.com',
        phone: '+33123456790',
        address: '25 Avenue des Champs, 75008 Paris'
      },
      {
        name: 'Claire Bernard',
        email: 'claire.bernard@email.com',
        phone: '+33123456791',
        address: '8 Rue du Commerce, 75015 Paris'
      },
      {
        name: 'David Leroy',
        email: 'david.leroy@email.com',
        phone: '+33123456792',
        address: '12 Boulevard Saint-Germain, 75006 Paris'
      },
      {
        name: 'Emma Rousseau',
        email: 'emma.rousseau@email.com',
        phone: '+33123456793',
        address: '30 Rue de Rivoli, 75004 Paris'
      }
    ];

    const createdCustomers = await tx.insert(customers).values(customerData).returning();

    return {
      success: true,
      data: createdCustomers,
      count: createdCustomers.length
    };
  } catch (error) {
    console.error('Erreur lors du seeding des clients:', error);
    return {
      success: false,
      data: [],
      count: 0,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

async function seedSampleOrdersWithTransaction(tx: PgTransaction<any, any, any>, customers: Customer[], menuItems: MenuItem[]): Promise<{orders: number, orderItems: number}> {
  try {
    const orderData = [
      {
        customerId: customers[0].id,
        totalAmount: 12.30,
        status: 'completed',
        type: 'dine-in',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        customerId: customers[1].id,
        totalAmount: 8.90,
        status: 'completed',
        type: 'takeaway',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        customerId: customers[2].id,
        totalAmount: 15.60,
        status: 'pending',
        type: 'dine-in',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const createdOrders = await tx.insert(orders).values(orderData).returning();

    // Création des order items
    const orderItemData = [
      {
        orderId: createdOrders[0].id,
        menuItemId: menuItems[0].id,
        quantity: 2,
        unitPrice: 3.50,
        totalPrice: 7.00
      },
      {
        orderId: createdOrders[0].id,
        menuItemId: menuItems[3].id,
        quantity: 1,
        unitPrice: 2.80,
        totalPrice: 2.80
      },
      {
        orderId: createdOrders[0].id,
        menuItemId: menuItems[5].id,
        quantity: 1,
        unitPrice: 4.50,
        totalPrice: 4.50
      },
      {
        orderId: createdOrders[1].id,
        menuItemId: menuItems[1].id,
        quantity: 1,
        unitPrice: 3.80,
        totalPrice: 3.80
      },
      {
        orderId: createdOrders[1].id,
        menuItemId: menuItems[4].id,
        quantity: 1,
        unitPrice: 3.20,
        totalPrice: 3.20
      },
      {
        orderId: createdOrders[2].id,
        menuItemId: menuItems[6].id,
        quantity: 1,
        unitPrice: 8.90,
        totalPrice: 8.90
      },
      {
        orderId: createdOrders[2].id,
        menuItemId: menuItems[2].id,
        quantity: 2,
        unitPrice: 2.50,
        totalPrice: 5.00
      }
    ];

    const createdOrderItems = await tx.insert(orderItems).values(orderItemData).returning();

    return {
      orders: createdOrders.length,
      orderItems: createdOrderItems.length
    };
  } catch (error) {
    console.error('Erreur lors du seeding des commandes:', error);
    return { orders: 0, orderItems: 0 };
  }
}

async function seedSampleReservationsWithTransaction(tx: PgTransaction<any, any, any>, customers: Customer[], tables: Table[]): Promise<SeedResult<unknown>> {
  try {
    const reservationData = [
      {
        customerName: customers[0].name,
        customerEmail: customers[0].email,
        customerPhone: customers[0].phone,
        date: new Date().toISOString().split('T')[0],
        time: '19:00',
        partySize: 4,
        tableId: tables[2].id,
        status: 'confirmed',
        specialRequests: 'Table près de la fenêtre'
      },
      {
        customerName: customers[1].name,
        customerEmail: customers[1].email,
        customerPhone: customers[1].phone,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: '20:00',
        partySize: 2,
        tableId: tables[0].id,
        status: 'pending',
        specialRequests: ''
      },
      {
        customerName: customers[2].name,
        customerEmail: customers[2].email,
        customerPhone: customers[2].phone,
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: '12:30',
        partySize: 6,
        tableId: tables[5].id,
        status: 'confirmed',
        specialRequests: 'Anniversaire - gâteau surprise'
      }
    ];

    const createdReservations = await tx.insert(reservations).values(reservationData).returning();

    return {
      success: true,
      data: createdReservations,
      count: createdReservations.length
    };
  } catch (error) {
    console.error('Erreur lors du seeding des réservations:', error);
    return {
      success: false,
      data: [],
      count: 0,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

function printSeedingStats(stats: SeedStats): void {
  console.log('\n📊 Statistiques du seeding:');
  console.log(`👥 Utilisateurs: ${stats.users}`);
  console.log(`👨‍💼 Employés: ${stats.employees}`);
  console.log(`🔐 Permissions: ${stats.permissions}`);
  console.log(`📂 Catégories de menu: ${stats.categories}`);
  console.log(`🍽️ Éléments de menu: ${stats.menuItems}`);
  console.log(`🪑 Tables: ${stats.tables}`);
  console.log(`👤 Clients: ${stats.customers}`);
  console.log(`📋 Commandes: ${stats.orders}`);
  console.log(`📝 Éléments de commande: ${stats.orderItems}`);
  console.log(`📅 Réservations: ${stats.reservations}`);
  console.log('\n✅ Base de données initialisée avec succès!');
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
    console.error('❌ Erreur lors du seeding:', error);
    process.exit(1);
  });
}