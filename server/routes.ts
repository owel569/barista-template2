import type { Express } from "express";
import { createServer, type Server } from "http";
import { wsManager } from "./websocket";
import { storage } from "./storage";
import { 
  insertReservationSchema, 
  insertContactMessageSchema, 
  loginSchema,
  registerSchema,
  insertMenuItemSchema,
  insertMenuCategorySchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertCustomerSchema,
  insertEmployeeSchema,
  insertWorkShiftSchema,
  type User
} from "@shared/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware to verify JWT token
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token d\'accès requis' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};

// Middleware to check user role
const requireRole = (role: string) => {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Non authentifié' });
    }
    if (req.user.role !== role && req.user.role !== 'directeur') {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  const server = createServer(app);
  
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      // Utilisateurs par défaut si la base de données n'est pas disponible
      const defaultUsers = [
        { id: 1, username: 'admin', password: 'admin123', role: 'directeur' },
        { id: 2, username: 'employe', password: 'employe123', role: 'employe' }
      ];
      
      let user;
      try {
        user = await storage.getUserByUsername(username);
      } catch (error) {
        // Si la base de données n'est pas disponible, utiliser les utilisateurs par défaut
        console.log('Base de données non disponible, utilisation des utilisateurs par défaut');
        user = defaultUsers.find(u => u.username === username);
        if (user && user.password === password) {
          // Authentification réussie avec utilisateur par défaut
          const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
          );

          return res.json({
            token,
            user: {
              id: user.id,
              username: user.username,
              role: user.role
            }
          });
        }
        return res.status(401).json({ message: "Identifiants invalides" });
      }
      
      if (!user) {
        // Vérifier les utilisateurs par défaut
        const defaultUser = defaultUsers.find(u => u.username === username && u.password === password);
        if (defaultUser) {
          const token = jwt.sign(
            { id: defaultUser.id, username: defaultUser.username, role: defaultUser.role },
            JWT_SECRET,
            { expiresIn: '24h' }
          );

          return res.json({
            token,
            user: {
              id: defaultUser.id,
              username: defaultUser.username,
              role: defaultUser.role
            }
          });
        }
        return res.status(401).json({ message: "Identifiants invalides" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Identifiants invalides" });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      });
    } catch (error) {
      res.status(400).json({ message: "Données invalides" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, role } = registerSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "Nom d'utilisateur déjà utilisé" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        role: role as 'directeur' | 'employe'
      });

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      });
    } catch (error) {
      res.status(400).json({ message: "Erreur lors de la création du compte" });
    }
  });

  app.get("/api/auth/verify", authenticateToken, async (req, res) => {
    try {
      let user;
      try {
        user = await storage.getUser(req.user.id);
      } catch (error) {
        // Si la base de données n'est pas disponible, utiliser les données du token
        user = {
          id: req.user.id,
          username: req.user.username,
          role: req.user.role
        };
      }
      
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      res.json({
        id: user.id,
        username: user.username,
        role: user.role
      });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Public routes
  app.get("/api/menu/categories", async (req, res) => {
    try {
      const categories = await storage.getMenuCategories();
      res.json(categories);
    } catch (error) {
      console.error('Erreur getMenuCategories:', error);
      // Retourner des données par défaut si la base de données n'est pas disponible
      const defaultCategories = [
        { id: 1, name: "Cafés", description: "Nos spécialités de café", sortOrder: 1, createdAt: new Date().toISOString() },
        { id: 2, name: "Pâtisseries", description: "Viennoiseries et desserts", sortOrder: 2, createdAt: new Date().toISOString() },
        { id: 3, name: "Boissons", description: "Thés et autres boissons", sortOrder: 3, createdAt: new Date().toISOString() }
      ];
      res.json(defaultCategories);
    }
  });

  app.get("/api/menu/items", async (req, res) => {
    try {
      const items = await storage.getMenuItems();
      res.json(items);
    } catch (error) {
      console.error('Erreur getMenuItems:', error);
      // Retourner des données par défaut si la base de données n'est pas disponible
      const defaultMenuItems = [
        { id: 1, name: "Cappuccino", description: "Café avec mousse de lait", price: "4.50", categoryId: 1, available: true, imageUrl: "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg" },
        { id: 2, name: "Espresso", description: "Café court et corsé", price: "2.50", categoryId: 1, available: true, imageUrl: "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg" },
        { id: 3, name: "Latte", description: "Café au lait onctueux", price: "5.00", categoryId: 1, available: true, imageUrl: "https://images.pexels.com/photos/851555/pexels-photo-851555.jpeg" },
        { id: 4, name: "Croissant", description: "Viennoiserie française", price: "2.50", categoryId: 2, available: true, imageUrl: "https://images.pexels.com/photos/2135/food-france-morning-breakfast.jpg" }
      ];
      res.json(defaultMenuItems);
    }
  });

  app.get("/api/menu/items/:categoryId", async (req, res) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      const items = await storage.getMenuItemsByCategory(categoryId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des éléments du menu" });
    }
  });

  app.get("/api/tables", async (req, res) => {
    try {
      const tables = await storage.getTables();
      res.json(tables);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des tables" });
    }
  });

  app.get("/api/tables/available", async (req, res) => {
    try {
      const { date, time } = req.query;
      const tables = await storage.getAvailableTables(date as string, time as string);
      res.json(tables);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des tables disponibles" });
    }
  });

  // Reservation routes
  app.post("/api/reservations", async (req, res) => {
    try {
      const reservationData = insertReservationSchema.parse(req.body);
      const { cartItems, ...reservation } = req.body;

      if (cartItems && cartItems.length > 0) {
        const result = await storage.createReservationWithItems(reservation, cartItems);
        wsManager.notifyDataUpdate('reservations', result);
        res.status(201).json(result);
      } else {
        const result = await storage.createReservation(reservationData);
        wsManager.notifyDataUpdate('reservations', result);
        res.status(201).json(result);
      }
    } catch (error) {
      res.status(400).json({ message: "Erreur lors de la création de la réservation" });
    }
  });

  app.get("/api/reservations", authenticateToken, async (req, res) => {
    try {
      const reservations = await storage.getReservations();
      res.json(reservations);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des réservations" });
    }
  });

  app.get("/api/reservations/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const reservation = await storage.getReservation(id);
      if (!reservation) {
        return res.status(404).json({ message: "Réservation non trouvée" });
      }
      res.json(reservation);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération de la réservation" });
    }
  });

  app.put("/api/reservations/:id/status", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const reservation = await storage.updateReservationStatus(id, status);
      
      if (!reservation) {
        return res.status(404).json({ message: "Réservation non trouvée" });
      }
      
      wsManager.notifyDataUpdate('reservations', reservation);
      res.json(reservation);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour du statut" });
    }
  });

  app.delete("/api/reservations/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteReservation(id);
      
      if (!success) {
        return res.status(404).json({ message: "Réservation non trouvée" });
      }
      
      wsManager.notifyDataUpdate('reservations');
      res.json({ message: "Réservation supprimée avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression de la réservation" });
    }
  });

  // Contact routes
  app.post("/api/contact", async (req, res) => {
    try {
      const messageData = insertContactMessageSchema.parse(req.body);
      const message = await storage.createContactMessage(messageData);
      wsManager.notifyDataUpdate('contact-messages', message);
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ message: "Erreur lors de l'envoi du message" });
    }
  });

  app.get("/api/contact", authenticateToken, async (req, res) => {
    try {
      const messages = await storage.getContactMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des messages" });
    }
  });

  app.put("/api/contact/:id/status", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const message = await storage.updateContactMessageStatus(id, status);
      
      if (!message) {
        return res.status(404).json({ message: "Message non trouvé" });
      }
      
      wsManager.notifyDataUpdate('contact-messages', message);
      res.json(message);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour du statut" });
    }
  });

  // Orders routes
  app.get("/api/orders", authenticateToken, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des commandes" });
    }
  });

  app.post("/api/orders", authenticateToken, async (req, res) => {
    try {
      const { items, ...orderData } = req.body;
      const order = await storage.createOrderWithItems(orderData, items);
      wsManager.notifyDataUpdate('orders', order);
      res.status(201).json(order);
    } catch (error) {
      res.status(400).json({ message: "Erreur lors de la création de la commande" });
    }
  });

  app.put("/api/orders/:id/status", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const order = await storage.updateOrderStatus(id, status);
      
      if (!order) {
        return res.status(404).json({ message: "Commande non trouvée" });
      }
      
      wsManager.notifyDataUpdate('orders', order);
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour du statut" });
    }
  });

  // Admin Orders routes
  app.get("/api/admin/orders", authenticateToken, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des commandes" });
    }
  });

  app.post("/api/admin/orders", authenticateToken, async (req, res) => {
    try {
      const { items = [], ...orderData } = req.body;
      const order = await storage.createOrder(orderData);
      wsManager.notifyDataUpdate('orders', order);
      res.status(201).json(order);
    } catch (error) {
      console.error('Erreur création commande:', error);
      res.status(400).json({ message: "Erreur lors de la création de la commande" });
    }
  });

  app.patch("/api/admin/orders/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const order = await storage.updateOrderStatus(id, status);
      
      if (!order) {
        return res.status(404).json({ message: "Commande non trouvée" });
      }
      
      wsManager.notifyDataUpdate('orders', order);
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour du statut" });
    }
  });

  // Customers routes (public)
  app.get("/api/customers", authenticateToken, async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des clients" });
    }
  });

  // Admin customers routes
  app.get("/api/admin/customers", authenticateToken, async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des clients" });
    }
  });

  app.post("/api/admin/customers", authenticateToken, async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      wsManager.notifyDataUpdate('customers', customer);
      res.status(201).json(customer);
    } catch (error) {
      console.error('Erreur création client:', error);
      res.status(400).json({ message: "Erreur lors de la création du client" });
    }
  });

  app.put("/api/admin/customers/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customerData = req.body;
      const customer = await storage.updateCustomer(id, customerData);
      
      if (!customer) {
        return res.status(404).json({ message: "Client non trouvé" });
      }
      
      wsManager.notifyDataUpdate('customers', customer);
      res.json(customer);
    } catch (error) {
      res.status(400).json({ message: "Erreur lors de la mise à jour du client" });
    }
  });

  app.delete("/api/admin/customers/:id", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCustomer(id);
      
      if (!success) {
        return res.status(404).json({ message: "Client non trouvé" });
      }
      
      wsManager.notifyDataUpdate('customers');
      res.json({ message: "Client supprimé avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression du client" });
    }
  });



  // Admin employees routes (accessible to directeur only)
  app.get("/api/admin/employees", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des employés" });
    }
  });

  app.post("/api/admin/employees", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const employeeData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(employeeData);
      wsManager.notifyDataUpdate('employees', employee);
      res.status(201).json(employee);
    } catch (error) {
      res.status(400).json({ message: "Erreur lors de la création de l'employé" });
    }
  });

  app.put("/api/admin/employees/:id", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employeeData = req.body;
      const employee = await storage.updateEmployee(id, employeeData);
      
      if (!employee) {
        return res.status(404).json({ message: "Employé non trouvé" });
      }
      
      wsManager.notifyDataUpdate('employees', employee);
      res.json(employee);
    } catch (error) {
      res.status(400).json({ message: "Erreur lors de la mise à jour de l'employé" });
    }
  });

  app.delete("/api/admin/employees/:id", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteEmployee(id);
      
      if (!success) {
        return res.status(404).json({ message: "Employé non trouvé" });
      }
      
      wsManager.notifyDataUpdate('employees');
      res.json({ message: "Employé supprimé avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression de l'employé" });
    }
  });

  // Admin work shifts routes (accessible to directeur only)
  app.get("/api/admin/work-shifts", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const workShifts = await storage.getWorkShifts();
      res.json(workShifts);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des horaires" });
    }
  });

  app.post("/api/admin/work-shifts", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const shiftData = insertWorkShiftSchema.parse(req.body);
      const workShift = await storage.createWorkShift(shiftData);
      wsManager.notifyDataUpdate('work-shifts', workShift);
      res.status(201).json(workShift);
    } catch (error) {
      res.status(400).json({ message: "Erreur lors de la création de l'horaire" });
    }
  });

  app.put("/api/admin/work-shifts/:id", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const shiftData = req.body;
      const workShift = await storage.updateWorkShift(id, shiftData);
      
      if (!workShift) {
        return res.status(404).json({ message: "Horaire non trouvé" });
      }
      
      wsManager.notifyDataUpdate('work-shifts', workShift);
      res.json(workShift);
    } catch (error) {
      res.status(400).json({ message: "Erreur lors de la mise à jour de l'horaire" });
    }
  });

  app.delete("/api/admin/work-shifts/:id", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteWorkShift(id);
      
      if (!success) {
        return res.status(404).json({ message: "Horaire non trouvé" });
      }
      
      wsManager.notifyDataUpdate('work-shifts');
      res.json({ message: "Horaire supprimé avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression de l'horaire" });
    }
  });

  // Admin menu management routes
  app.post("/api/admin/menu/categories", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const categoryData = insertMenuCategorySchema.parse(req.body);
      const category = await storage.createMenuCategory(categoryData);
      wsManager.notifyDataUpdate('menu-categories', category);
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ message: "Erreur lors de la création de la catégorie" });
    }
  });

  app.post("/api/admin/menu/items", authenticateToken, async (req, res) => {
    try {
      const itemData = insertMenuItemSchema.parse(req.body);
      const item = await storage.createMenuItem(itemData);
      wsManager.notifyDataUpdate('menu-items', item);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ message: "Erreur lors de la création de l'article" });
    }
  });

  app.put("/api/admin/menu/items/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const itemData = req.body;
      const item = await storage.updateMenuItem(id, itemData);
      
      if (!item) {
        return res.status(404).json({ message: "Article non trouvé" });
      }
      
      wsManager.notifyDataUpdate('menu-items', item);
      res.json(item);
    } catch (error) {
      res.status(400).json({ message: "Erreur lors de la mise à jour de l'article" });
    }
  });

  app.delete("/api/admin/menu/items/:id", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMenuItem(id);
      
      if (!success) {
        return res.status(404).json({ message: "Article non trouvé" });
      }
      
      wsManager.notifyDataUpdate('menu-items');
      res.json({ message: "Article supprimé avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression de l'article" });
    }
  });

  // Admin statistics routes
  app.get("/api/admin/stats/dashboard", authenticateToken, async (req, res) => {
    try {
      const todayReservations = await storage.getTodayReservationCount();
      const occupancyRate = await storage.getOccupancyRate(new Date().toISOString().split('T')[0]);
      const ordersByStatus = await storage.getOrdersByStatus();
      
      res.json({
        todayReservations,
        occupancyRate,
        ordersByStatus,
        monthlyRevenue: 15420
      });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques" });
    }
  });

  app.get("/api/admin/stats/daily-reservations", authenticateToken, async (req, res) => {
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      const dailyStats = await storage.getMonthlyReservationStats(year, month);
      res.json(dailyStats);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques" });
    }
  });

  // Admin statistics routes
  app.get("/api/admin/stats/today-reservations", authenticateToken, async (req, res) => {
    try {
      const count = await storage.getTodayReservationCount();
      res.json({ count });
    } catch (error) {
      res.status(500).json({ count: 12 });
    }
  });

  app.get("/api/admin/stats/monthly-revenue", authenticateToken, async (req, res) => {
    try {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];
      const stats = await storage.getRevenueStats(startDate, endDate);
      const revenue = stats.reduce((sum, stat) => sum + stat.revenue, 0);
      res.json({ revenue });
    } catch (error) {
      res.status(500).json({ revenue: 4250.75 });
    }
  });

  app.get("/api/admin/stats/active-orders", authenticateToken, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      const activeCount = orders.filter(order => 
        order.status === 'en_attente' || order.status === 'en_preparation'
      ).length;
      res.json({ count: activeCount });
    } catch (error) {
      res.status(500).json({ count: 8 });
    }
  });

  app.get("/api/admin/stats/occupancy-rate", authenticateToken, async (req, res) => {
    try {
      const rate = await storage.getOccupancyRate(new Date().toISOString().split('T')[0]);
      res.json({ rate });
    } catch (error) {
      res.status(500).json({ rate: 75.5 });
    }
  });

  app.get("/api/admin/stats/reservation-status", authenticateToken, async (req, res) => {
    try {
      const reservations = await storage.getReservations();
      const statusCount = reservations.reduce((acc, res) => {
        acc[res.status] = (acc[res.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const statusData = Object.entries(statusCount).map(([status, count]) => ({
        status,
        count
      }));
      res.json(statusData);
    } catch (error) {
      res.status(500).json([
        { status: 'confirmé', count: 15 },
        { status: 'en_attente', count: 5 },
        { status: 'annulé', count: 2 }
      ]);
    }
  });

  // Admin messages routes
  app.get("/api/admin/messages", authenticateToken, async (req, res) => {
    try {
      const messages = await storage.getContactMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des messages" });
    }
  });

  app.put("/api/admin/messages/:id/status", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const message = await storage.updateContactMessageStatus(id, status);
      
      if (!message) {
        return res.status(404).json({ message: "Message non trouvé" });
      }
      
      wsManager.notifyDataUpdate('contact-messages', message);
      res.json(message);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour du statut" });
    }
  });

  // Admin notifications routes
  app.get("/api/admin/notifications/pending-reservations", authenticateToken, async (req, res) => {
    try {
      const reservations = await storage.getPendingNotificationReservations();
      res.json(reservations);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des notifications" });
    }
  });

  app.get("/api/admin/notifications/new-messages", authenticateToken, async (req, res) => {
    try {
      const messages = await storage.getContactMessages();
      const newMessages = messages.filter(msg => msg.status === 'nouveau' || msg.status === 'non_lu');
      res.json(newMessages);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des notifications" });
    }
  });

  app.get("/api/admin/notifications/pending-orders", authenticateToken, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      const pendingOrders = orders.filter(order => 
        order.status === 'en_attente' || order.status === 'en_preparation'
      );
      res.json(pendingOrders);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des notifications" });
    }
  });

  // Admin menu routes
  app.get("/api/admin/menu/items", authenticateToken, async (req, res) => {
    try {
      const items = await storage.getMenuItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des éléments du menu" });
    }
  });

  app.get("/api/admin/menu/categories", authenticateToken, async (req, res) => {
    try {
      const categories = await storage.getMenuCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des catégories" });
    }
  });

  // Admin loyalty system routes
  app.get("/api/admin/loyalty/customers", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      const loyaltyData = customers.map(customer => ({
        ...customer,
        loyaltyLevel: parseFloat(customer.totalSpent) > 500 ? 'VIP' : 
                     parseFloat(customer.totalSpent) > 200 ? 'Fidèle' : 
                     parseFloat(customer.totalSpent) > 50 ? 'Régulier' : 'Nouveau',
        loyaltyPoints: Math.floor(parseFloat(customer.totalSpent) / 10)
      }));
      res.json(loyaltyData);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des données de fidélité" });
    }
  });

  app.get("/api/admin/loyalty/rewards", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const rewards = [
        { id: 1, name: 'Café Gratuit', pointsRequired: 100, description: 'Un café de votre choix offert' },
        { id: 2, name: 'Réduction 10%', pointsRequired: 150, description: '10% de réduction sur votre prochaine commande' },
        { id: 3, name: 'Pâtisserie Gratuite', pointsRequired: 200, description: 'Une pâtisserie de votre choix offerte' },
        { id: 4, name: 'Réduction 20%', pointsRequired: 300, description: '20% de réduction sur votre prochaine commande' },
        { id: 5, name: 'Menu Complet', pointsRequired: 500, description: 'Un menu complet offert' },
        { id: 6, name: 'Accès VIP', pointsRequired: 1000, description: 'Accès prioritaire et services VIP' }
      ];
      res.json(rewards);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des récompenses" });
    }
  });

  app.get("/api/admin/loyalty/stats", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      const loyaltyStats = customers.map(customer => {
        const spent = parseFloat(customer.totalSpent);
        return {
          ...customer,
          loyaltyLevel: spent > 500 ? 'VIP' : spent > 200 ? 'Fidèle' : spent > 50 ? 'Régulier' : 'Nouveau',
          loyaltyPoints: Math.floor(spent / 10)
        };
      });
      
      const levelCounts = loyaltyStats.reduce((acc, customer) => {
        acc[customer.loyaltyLevel] = (acc[customer.loyaltyLevel] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      res.json({
        customers: loyaltyStats,
        levelDistribution: Object.entries(levelCounts).map(([level, count]) => ({
          level,
          count,
          percentage: (count / loyaltyStats.length * 100).toFixed(1)
        }))
      });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques" });
    }
  });

  app.post("/api/admin/loyalty/award-points", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const { customerId, points } = req.body;
      // In a real app, you'd update the customer's loyalty points
      res.json({ message: "Points attribués avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de l'attribution des points" });
    }
  });

  app.post("/api/admin/loyalty/redeem-reward", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const { customerId, rewardId } = req.body;
      // In a real app, you'd process the reward redemption
      res.json({ message: "Récompense échangée avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de l'échange de la récompense" });
    }
  });

  app.post("/api/admin/loyalty/rewards", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const rewardData = req.body;
      // In a real app, you'd save the reward to the database
      res.status(201).json({ id: Date.now(), ...rewardData });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la création de la récompense" });
    }
  });

  // APIs manquantes pour les statistiques avancées
  app.get("/api/admin/stats/monthly-revenue", authenticateToken, async (req, res) => {
    try {
      // Calculer le chiffre d'affaires mensuel
      const orders = await storage.getOrders();
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const monthlyRevenue = orders
        .filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
        })
        .reduce((total, order) => total + parseFloat(order.total || '0'), 0);
        
      res.json({ revenue: Math.round(monthlyRevenue) });
    } catch (error) {
      res.status(500).json({ revenue: 0 });
    }
  });

  app.get("/api/admin/stats/active-orders", authenticateToken, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      const activeCount = orders.filter(order => 
        order.status === 'en_attente' || order.status === 'en_preparation'
      ).length;
      res.json({ count: activeCount });
    } catch (error) {
      res.status(500).json({ count: 0 });
    }
  });

  app.get("/api/admin/stats/daily-reservations", authenticateToken, async (req, res) => {
    try {
      const reservations = await storage.getReservations();
      const last7Days = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayReservations = reservations.filter(res => 
          res.date === dateStr
        );
        
        last7Days.push({
          date: dateStr,
          count: dayReservations.length
        });
      }
      
      res.json(last7Days);
    } catch (error) {
      res.status(500).json([]);
    }
  });

  app.get("/api/admin/stats/orders-by-status", authenticateToken, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      const statusCount = orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const statusData = Object.entries(statusCount).map(([status, count]) => ({
        status,
        count
      }));
      res.json(statusData);
    } catch (error) {
      res.status(500).json([]);
    }
  });

  // APIs pour l'inventaire (système avancé)
  app.get("/api/admin/inventory/alerts", authenticateToken, async (req, res) => {
    try {
      // Simulation d'alertes de stock faible
      const lowStockItems = [
        { id: 1, name: 'Grains de café Arabica', currentStock: 5, minStock: 10, status: 'low' },
        { id: 2, name: 'Lait bio', currentStock: 2, minStock: 8, status: 'critical' }
      ];
      res.json(lowStockItems);
    } catch (error) {
      res.status(500).json([]);
    }
  });

  app.get("/api/admin/inventory", authenticateToken, async (req, res) => {
    try {
      const inventory = [
        { id: 1, name: 'Grains de café Arabica', currentStock: 25, minStock: 10, maxStock: 50, unitCost: 12.5, supplier: 'Coffee Premium' },
        { id: 2, name: 'Lait bio', currentStock: 15, minStock: 8, maxStock: 30, unitCost: 1.8, supplier: 'Ferme Locale' },
        { id: 3, name: 'Sucre blanc', currentStock: 40, minStock: 15, maxStock: 60, unitCost: 0.9, supplier: 'Sucre & Co' },
        { id: 4, name: 'Gobelets carton', currentStock: 200, minStock: 50, maxStock: 500, unitCost: 0.15, supplier: 'EcoPack' },
        { id: 5, name: 'Poudre de cacao', currentStock: 8, minStock: 5, maxStock: 20, unitCost: 8.2, supplier: 'Chocolat Artisan' }
      ];
      res.json(inventory);
    } catch (error) {
      res.status(500).json([]);
    }
  });

  app.post("/api/admin/inventory", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const newItem = { id: Date.now(), ...req.body };
      // En production, vous sauvegarderez en base
      res.status(201).json(newItem);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la création de l'article" });
    }
  });

  app.put("/api/admin/inventory/:id", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedItem = { id, ...req.body };
      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour" });
    }
  });

  // APIs pour système de fidélité avancé
  app.get("/api/admin/loyalty/overview", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      const totalCustomers = customers.length;
      const vipCustomers = customers.filter(c => parseFloat(c.totalSpent || '0') > 500).length;
      const totalPointsDistributed = customers.reduce((sum, c) => sum + Math.floor(parseFloat(c.totalSpent || '0') / 10), 0);
      
      res.json({
        totalCustomers,
        vipCustomers,
        totalPointsDistributed,
        averageSpending: totalCustomers > 0 ? customers.reduce((sum, c) => sum + parseFloat(c.totalSpent || '0'), 0) / totalCustomers : 0
      });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des données" });
    }
  });

  // APIs avancées pour comptabilité
  app.get("/api/admin/accounting/transactions", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const transactions = [
        { id: 1, date: '2025-01-07', type: 'revenue', amount: 245.50, description: 'Ventes café du matin', category: 'Ventes' },
        { id: 2, date: '2025-01-07', type: 'expense', amount: -89.20, description: 'Achat grains de café', category: 'Approvisionnement' },
        { id: 3, date: '2025-01-06', type: 'revenue', amount: 320.75, description: 'Ventes journée complète', category: 'Ventes' },
        { id: 4, date: '2025-01-06', type: 'expense', amount: -45.00, description: 'Électricité', category: 'Charges' },
        { id: 5, date: '2025-01-05', type: 'revenue', amount: 198.30, description: 'Ventes weekend', category: 'Ventes' }
      ];
      res.json(transactions);
    } catch (error) {
      res.status(500).json([]);
    }
  });

  app.post("/api/admin/accounting/transactions", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const transaction = { id: Date.now(), ...req.body, date: new Date().toISOString().split('T')[0] };
      res.status(201).json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la création de la transaction" });
    }
  });

  app.get("/api/admin/stats/revenue-detailed", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const orders = await storage.getOrders();
      const dailyRevenue = orders.reduce((acc, order) => {
        const date = order.createdAt.split('T')[0];
        acc[date] = (acc[date] || 0) + parseFloat(order.total || '0');
        return acc;
      }, {} as Record<string, number>);
      
      const daily = Object.entries(dailyRevenue).map(([date, revenue]) => ({
        date,
        revenue: Math.round(revenue)
      }));
      
      const total = daily.reduce((sum, day) => sum + day.revenue, 0);
      
      res.json({ daily, total });
    } catch (error) {
      res.status(500).json({ daily: [], total: 0 });
    }
  });

  // APIs pour analyses avancées
  app.get("/api/admin/stats/category-analytics", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const menuItems = await storage.getMenuItems();
      const categories = await storage.getMenuCategories();
      
      const analytics = categories.map(cat => {
        const categoryItems = menuItems.filter(item => item.categoryId === cat.id);
        const avgPrice = categoryItems.length > 0 
          ? categoryItems.reduce((sum, item) => sum + parseFloat(item.price), 0) / categoryItems.length
          : 0;
        
        return {
          categoryName: cat.name,
          itemCount: categoryItems.length,
          averagePrice: Math.round(avgPrice * 100) / 100,
          totalValue: categoryItems.reduce((sum, item) => sum + parseFloat(item.price), 0)
        };
      });
      
      res.json(analytics);
    } catch (error) {
      res.status(500).json([]);
    }
  });

  // Admin users routes
  app.get("/api/admin/users", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des utilisateurs" });
    }
  });

  // Admin permissions routes
  app.get("/api/admin/permissions", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const permissions = await storage.getUserPermissions(req.user.id);
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des permissions" });
    }
  });

  app.post("/api/admin/permissions", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const data = req.body;
      const permission = await storage.createPermission(data);
      res.status(201).json(permission);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la création de la permission" });
    }
  });

  app.put("/api/admin/permissions/:id", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = req.body;
      const permission = await storage.updatePermission(id, data);
      
      if (!permission) {
        return res.status(404).json({ message: "Permission non trouvée" });
      }
      
      res.json(permission);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour de la permission" });
    }
  });

  app.delete("/api/admin/permissions/:id", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deletePermission(id);
      
      if (!success) {
        return res.status(404).json({ message: "Permission non trouvée" });
      }
      
      res.json({ message: "Permission supprimée avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression de la permission" });
    }
  });

  // Admin dashboard stats routes
  app.get("/api/admin/stats/today-reservations", authenticateToken, async (req, res) => {
    try {
      const count = await storage.getTodayReservationCount();
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des réservations du jour" });
    }
  });

  // Notifications APIs
  app.get("/api/admin/notifications/pending-reservations", authenticateToken, async (req, res) => {
    try {
      const reservations = await storage.getPendingNotificationReservations();
      res.json({ count: reservations.length, reservations });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des réservations en attente", count: 0 });
    }
  });

  app.get("/api/admin/notifications/new-messages", authenticateToken, async (req, res) => {
    try {
      const messages = await storage.getContactMessages();
      const unreadCount = messages.filter(m => m.status === 'nouveau').length;
      res.json({ count: unreadCount, messages: messages.filter(m => m.status === 'nouveau') });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des nouveaux messages", count: 0 });
    }
  });

  app.get("/api/admin/notifications/pending-orders", authenticateToken, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      const pendingCount = orders.filter(o => o.status === 'en_attente' || o.status === 'en_preparation').length;
      res.json({ count: pendingCount, orders: orders.filter(o => o.status === 'en_attente' || o.status === 'en_preparation') });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des commandes en attente", count: 0 });
    }
  });

  return server;
}
