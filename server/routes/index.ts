import { Router } from 'express';
import { eq, desc, asc, sql, and, or, gte, lte, like, count } from 'drizzle-orm';
import { z } from 'zod';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { asyncHandler } from '../middleware/error-handler';
import { getDb } from '../db';
import { 
  users, menuCategories, menuItems, tables, customers, reservations, orders, orderItems,
  contactMessages, menuItemImages, activityLogs, permissions
} from '../../shared/schema';
import { authenticateToken, requireRole, requireRoles, generateToken, comparePassword } from '../middleware/auth';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const router = Router();

// =====================
// SCHEMAS DE VALIDATION
// =====================

const loginSchema = z.object({
  username: z.string().min(3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères')
});

const userSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  role: z.enum(['admin', 'directeur', 'manager', 'employe']),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional()
});

const customerSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  loyaltyPoints: z.number().default(0)
});

const menuItemSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  price: z.number().positive(),
  categoryId: z.number().positive(),
  imageUrl: z.string().url().optional(),
  available: z.boolean().default(true)
});

const orderSchema = z.object({
  customerId: z.number().positive().optional(),
  tableId: z.number().positive().optional(),
  items: z.array(z.object({
    menuItemId: z.number().positive(),
    quantity: z.number().positive(),
    specialInstructions: z.string().optional()
  })),
  totalAmount: z.number().positive()
});

const reservationSchema = z.object({
  customerId: z.number().positive(),
  tableId: z.number().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  partySize: z.number().min(1).max(20),
  notes: z.string().optional()
});

// =====================
// ROUTES D'AUTHENTIFICATION
// =====================

// Connexion utilisateur
router.post('/auth/login', validateBody(loginSchema), asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const db = await getDb();

  const user = await db.select().from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!user.length) {
    return res.status(401).json({
      success: false,
      message: 'Nom d\'utilisateur ou mot de passe incorrect'
    });
  }

  const isValidPassword = await bcrypt.compare(password, user[0].password);
  if (!isValidPassword) {
    return res.status(401).json({
      success: false,
      message: 'Nom d\'utilisateur ou mot de passe incorrect'
    });
  }

  // Mettre à jour la dernière connexion
  await db.update(users)
    .set({ lastLogin: new Date() })
    .where(eq(users.id, user[0].id));

  // Générer le token JWT
  const token = jwt.sign(
    { 
      id: user[0].id, 
      username: user[0].username, 
      role: user[0].role 
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );

  // Log de l'activité
  /*
  await db.insert(activityLogs).values({
    userId: user[0].id,
    action: 'login',
    entity: 'user',
    entityId: user[0].id,
    details: `Connexion réussie depuis ${req.ip}`
  });
  */

  res.json({
    success: true,
    message: 'Connexion réussie',
    token,
    user: {
      id: user[0].id,
      username: user[0].username,
      role: user[0].role,
      firstName: user[0].firstName,
      lastName: user[0].lastName,
      email: user[0].email
    }
  });
}));

// Validation du token
router.get('/auth/validate', authenticateToken, asyncHandler(async (req, res) => {
  const db = await getDb();

  const user = await db.select({
    id: users.id,
    username: users.username,
    role: users.role,
    firstName: users.firstName,
    lastName: users.lastName,
    email: users.email
  }).from(users)
    .where(eq(users.id, req.user.id))
    .limit(1);

  if (!user.length) {
    return res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }

  res.json({
    success: true,
    user: user[0]
  });
}));

// =====================
// ROUTES UTILISATEURS
// =====================

// Obtenir tous les utilisateurs
router.get('/users', authenticateToken, asyncHandler(async (req, res) => {
  const db = await getDb();

  const usersList = await db.select({
    id: users.id,
    username: users.username,
    role: users.role,
    firstName: users.firstName,
    lastName: users.lastName,
    email: users.email,
    lastLogin: users.lastLogin,
    createdAt: users.createdAt
  }).from(users)
    .orderBy(desc(users.createdAt));

  res.json({
    success: true,
    users: usersList
  });
}));

// Créer un utilisateur
router.post('/users', authenticateToken, validateBody(userSchema), asyncHandler(async (req, res) => {
  const db = await getDb();
  const { username, password, role, firstName, lastName, email } = req.body;

  // Vérifier si l'utilisateur existe déjà
  const existingUser = await db.select().from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (existingUser.length) {
    return res.status(400).json({
      success: false,
      message: 'Ce nom d\'utilisateur existe déjà'
    });
  }

  // Hacher le mot de passe
  const hashedPassword = await bcrypt.hash(password, 10);

  // Créer l'utilisateur
  const newUser = await db.insert(users).values({
    username,
    password: hashedPassword,
    role,
    firstName,
    lastName,
    email
  }).returning();

  // Log de l'activité
  /*
  await db.insert(activityLogs).values({
    userId: (req as any).user.id,
    action: 'create',
    entity: 'user',
    entityId: newUser[0].id,
    details: `Création de l'utilisateur ${username}`
  });
  */

  res.status(201).json({
    success: true,
    message: 'Utilisateur créé avec succès',
    user: {
      id: newUser[0].id,
      username: newUser[0].username,
      role: newUser[0].role,
      firstName: newUser[0].firstName,
      lastName: newUser[0].lastName,
      email: newUser[0].email
    }
  });
}));

// =====================
// ROUTES CLIENTS
// =====================

// Obtenir tous les clients
router.get('/customers', authenticateToken, asyncHandler(async (req, res) => {
  const db = await getDb();

  const customersList = await db.select().from(customers)
    .orderBy(desc(customers.createdAt));

  res.json({
    success: true,
    customers: customersList
  });
}));

// Créer un client
router.post('/customers', authenticateToken, validateBody(customerSchema), asyncHandler(async (req, res) => {
  const db = await getDb();

  const newCustomer = await db.insert(customers).values(req.body).returning();

  // Log de l'activité
  /*
  await db.insert(activityLogs).values({
    userId: req.user.id,
    action: 'create',
    entity: 'customer',
    entityId: newCustomer[0].id,
    details: `Création du client ${req.body.firstName} ${req.body.lastName}`
  });
  */

  res.status(201).json({
    success: true,
    message: 'Client créé avec succès',
    customer: newCustomer[0]
  });
}));

// =====================
// ROUTES MENU
// =====================

// Obtenir toutes les catégories
router.get('/menu/categories', asyncHandler(async (req, res) => {
  const db = await getDb();

  const categories = await db.select().from(menuCategories)
    .orderBy(asc(menuCategories.displayOrder));

  res.json({
    success: true,
    categories
  });
}));

// Obtenir tous les articles du menu
router.get('/menu/items', asyncHandler(async (req, res) => {
  const db = await getDb();

  const items = await db.select({
    id: menuItems.id,
    name: menuItems.name,
    description: menuItems.description,
    price: menuItems.price,
    available: menuItems.available,
    imageUrl: menuItems.imageUrl,
    category: {
      id: menuCategories.id,
      name: menuCategories.name,
      slug: menuCategories.slug
    }
  }).from(menuItems)
    .innerJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
    .where(eq(menuItems.available, true))
    .orderBy(asc(menuCategories.displayOrder), asc(menuItems.name));

  res.json({
    success: true,
    items
  });
}));

// Créer un article du menu
router.post('/menu/items', authenticateToken, validateBody(menuItemSchema), asyncHandler(async (req, res) => {
  const db = await getDb();

  const newItem = await db.insert(menuItems).values(req.body).returning();

  // Log de l'activité
  /*
  await db.insert(activityLogs).values({
    userId: (req as any).user.id,
    action: 'create',
    entity: 'menu_item',
    entityId: newItem[0].id,
    details: `Création de l'article ${req.body.name}`
  });
  */

  res.status(201).json({
    success: true,
    message: 'Article créé avec succès',
    item: newItem[0]
  });
}));

// =====================
// ROUTES COMMANDES
// =====================

// Obtenir toutes les commandes
router.get('/orders', authenticateToken, asyncHandler(async (req, res) => {
  const db = await getDb();

  const ordersList = await db.select({
    id: orders.id,
    totalAmount: orders.totalAmount,
    status: orders.status,
    createdAt: orders.createdAt,
    customer: {
      id: customers.id,
      firstName: customers.firstName,
      lastName: customers.lastName,
      email: customers.email
    },
    table: {
      id: tables.id,
      number: tables.number
    }
  }).from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .leftJoin(tables, eq(orders.tableId, tables.id))
    .orderBy(desc(orders.createdAt));

  res.json({
    success: true,
    orders: ordersList
  });
}));

// Créer une commande
router.post('/orders', authenticateToken, validateBody(orderSchema), asyncHandler(async (req, res) => {
  const db = await getDb();
  const { customerId, tableId, items, totalAmount } = req.body;

  // Créer la commande
  const newOrder = await db.insert(orders).values({
    customerId,
    tableId,
    totalAmount,
    status: 'pending'
  }).returning();

  // Ajouter les articles de la commande
  for (const item of items) {
    const menuItem = await db.select().from(menuItems)
      .where(eq(menuItems.id, item.menuItemId))
      .limit(1);

    if (menuItem.length) {
      await db.insert(orderItems).values({
        orderId: newOrder[0].id,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice: menuItem[0].price,
        totalPrice: menuItem[0].price * item.quantity,
        specialInstructions: item.specialInstructions
      });
    }
  }

  // Log de l'activité
  /*
  await db.insert(activityLogs).values({
    userId: req.user.id,
    action: 'create',
    entity: 'order',
    entityId: newOrder[0].id,
    details: `Création de la commande #${newOrder[0].id} - ${totalAmount}€`
  });
  */

  res.status(201).json({
    success: true,
    message: 'Commande créée avec succès',
    order: newOrder[0]
  });
}));

// =====================
// ROUTES RÉSERVATIONS
// =====================

// Obtenir toutes les réservations
router.get('/reservations', authenticateToken, asyncHandler(async (req, res) => {
  const db = await getDb();

  const reservationsList = await db.select({
    id: reservations.id,
    date: reservations.date,
    time: reservations.time,
    partySize: reservations.partySize,
    status: reservations.status,
    notes: reservations.notes,
    createdAt: reservations.createdAt,
    customer: {
      id: customers.id,
      firstName: customers.firstName,
      lastName: customers.lastName,
      email: customers.email,
      phone: customers.phone
    },
    table: {
      id: tables.id,
      number: tables.number,
      capacity: tables.capacity
    }
  }).from(reservations)
    .innerJoin(customers, eq(reservations.customerId, customers.id))
    .innerJoin(tables, eq(reservations.tableId, tables.id))
    .orderBy(desc(reservations.createdAt));

  res.json({
    success: true,
    reservations: reservationsList
  });
}));

// Créer une réservation
router.post('/reservations', authenticateToken, validateBody(reservationSchema), asyncHandler(async (req, res) => {
  const db = await getDb();

  // Vérifier la disponibilité de la table
  const conflictingReservation = await db.select().from(reservations)
    .where(
      and(
        eq(reservations.tableId, req.body.tableId),
        eq(reservations.date, req.body.date),
        eq(reservations.time, req.body.time),
        eq(reservations.status, 'confirmed')
      )
    )
    .limit(1);

  if (conflictingReservation.length) {
    return res.status(400).json({
      success: false,
      message: 'Cette table est déjà réservée pour cette date et heure'
    });
  }

  const newReservation = await db.insert(reservations).values({
    ...req.body,
    status: 'pending'
  }).returning();

  // Log de l'activité
  /*
  await db.insert(activityLogs).values({
    userId: req.user.id,
    action: 'create',
    entity: 'reservation',
    entityId: newReservation[0].id,
    details: `Création de la réservation #${newReservation[0].id} - ${req.body.date} ${req.body.time}`
  });
  */

  res.status(201).json({
    success: true,
    message: 'Réservation créée avec succès',
    reservation: newReservation[0]
  });
}));

// =====================
// ROUTES STATISTIQUES
// =====================

// Obtenir les statistiques du dashboard
router.get('/dashboard/stats', authenticateToken, asyncHandler(async (req, res) => {
  const db = await getDb();

  const today = new Date().toISOString().split('T')[0];
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  // Statistiques générales
  const [
    totalCustomers,
    totalOrders,
    totalReservations,
    todayRevenue,
    monthlyRevenue,
    todayOrders,
    pendingReservations
  ] = await Promise.all([
    db.select({ count: count() }).from(customers),
    db.select({ count: count() }).from(orders),
    db.select({ count: count() }).from(reservations),
    db.select({ 
      revenue: sql`COALESCE(SUM(${orders.totalAmount}), 0)` 
    }).from(orders)
      .where(sql`DATE(${orders.createdAt}) = ${today}`),
    db.select({ 
      revenue: sql`COALESCE(SUM(${orders.totalAmount}), 0)` 
    }).from(orders)
      .where(sql`DATE(${orders.createdAt}) >= ${startOfMonth}`),
    db.select({ count: count() }).from(orders)
      .where(sql`DATE(${orders.createdAt}) = ${today}`),
    db.select({ count: count() }).from(reservations)
      .where(eq(reservations.status, 'pending'))
  ]);

  res.json({
    success: true,
    stats: {
      totalCustomers: totalCustomers[0].count,
      totalOrders: totalOrders[0].count,
      totalReservations: totalReservations[0].count,
      todayRevenue: Number(todayRevenue[0].revenue) || 0,
      monthlyRevenue: Number(monthlyRevenue[0].revenue) || 0,
      todayOrders: todayOrders[0].count,
      pendingReservations: pendingReservations[0].count
    }
  });
}));

// Obtenir les ventes par catégorie
router.get('/analytics/sales-by-category', authenticateToken, asyncHandler(async (req, res) => {
  const db = await getDb();

  const salesByCategory = await db.select({
    categoryName: menuCategories.name,
    totalSales: sql`COALESCE(SUM(${orderItems.totalPrice}), 0)`,
    totalQuantity: sql`COALESCE(SUM(${orderItems.quantity}), 0)`
  }).from(orderItems)
    .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .innerJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
    .groupBy(menuCategories.id, menuCategories.name)
    .orderBy(sql`SUM(${orderItems.totalPrice}) DESC`);

  res.json({
    success: true,
    salesByCategory
  });
}));

// =====================
// ROUTES TABLES
// =====================

// Obtenir toutes les tables
router.get('/tables', asyncHandler(async (req, res) => {
  const db = await getDb();

  const tablesList = await db.select().from(tables)
    .orderBy(asc(tables.number));

  res.json({
    success: true,
    tables: tablesList
  });
}));

// =====================
// ROUTES EMPLOYÉS
// =====================

// Obtenir tous les employés
router.get('/employees', authenticateToken, asyncHandler(async (req, res) => {
  const db = await getDb();

  const employeesList = await db.select({
    id: employees.id,
    firstName: employees.firstName,
    lastName: employees.lastName,
    position: employees.position,
    hourlyRate: employees.hourlyRate,
    hireDate: employees.hireDate,
    isActive: employees.isActive,
    user: {
      id: users.id,
      username: users.username,
      email: users.email
    }
  }).from(employees)
    .innerJoin(users, eq(employees.userId, users.id))
    .orderBy(asc(employees.firstName));

  res.json({
    success: true,
    employees: employeesList
  });
}));

// =====================
// ROUTES LOGS D'ACTIVITÉ
// =====================

// Obtenir les logs d'activité
router.get('/activity-logs', authenticateToken, asyncHandler(async (req, res) => {
  const db = await getDb();

  /*
  const logs = await db.select({
    id: activityLogs.id,
    action: activityLogs.action,
    entity: activityLogs.entity,
    entityId: activityLogs.entityId,
    details: activityLogs.details,
    timestamp: activityLogs.timestamp,
    user: {
      id: users.id,
      username: users.username,
      firstName: users.firstName,
      lastName: users.lastName
    }
  }).from(activityLogs)
    .innerJoin(users, eq(activityLogs.userId, users.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(100);
  */

  res.json({
    success: true,
    //logs
  });
}));

export default router;

// Export function for compatibility
export const registerRoutes = (app: any) => {
  app.use('/api', router);
};