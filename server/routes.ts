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
  
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
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
      const user = await storage.getUser(req.user.id);
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
      res.status(500).json({ message: "Erreur lors de la récupération des catégories" });
    }
  });

  app.get("/api/menu/items", async (req, res) => {
    try {
      const items = await storage.getMenuItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des éléments du menu" });
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



  // Employees routes
  app.get("/api/employees", authenticateToken, async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des employés" });
    }
  });

  app.post("/api/employees", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const employeeData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(employeeData);
      wsManager.notifyDataUpdate('employees', employee);
      res.status(201).json(employee);
    } catch (error) {
      res.status(400).json({ message: "Erreur lors de la création de l'employé" });
    }
  });

  app.put("/api/employees/:id", authenticateToken, requireRole('directeur'), async (req, res) => {
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

  app.delete("/api/employees/:id", authenticateToken, requireRole('directeur'), async (req, res) => {
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

  // Work shifts routes
  app.get("/api/work-shifts", authenticateToken, async (req, res) => {
    try {
      const workShifts = await storage.getWorkShifts();
      res.json(workShifts);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des horaires" });
    }
  });

  app.post("/api/work-shifts", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const shiftData = insertWorkShiftSchema.parse(req.body);
      const workShift = await storage.createWorkShift(shiftData);
      wsManager.notifyDataUpdate('work-shifts', workShift);
      res.status(201).json(workShift);
    } catch (error) {
      res.status(400).json({ message: "Erreur lors de la création de l'horaire" });
    }
  });

  app.put("/api/work-shifts/:id", authenticateToken, requireRole('directeur'), async (req, res) => {
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

  app.delete("/api/work-shifts/:id", authenticateToken, requireRole('directeur'), async (req, res) => {
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
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques" });
    }
  });

  app.get("/api/admin/stats/monthly-revenue", authenticateToken, async (req, res) => {
    try {
      const revenue = 15420; // Mock data - implement real calculation
      res.json({ revenue });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques" });
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
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques" });
    }
  });

  app.get("/api/admin/stats/occupancy-rate", authenticateToken, async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const rate = await storage.getOccupancyRate(today);
      res.json({ rate });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques" });
    }
  });

  app.get("/api/admin/stats/reservation-status", authenticateToken, async (req, res) => {
    try {
      const reservations = await storage.getReservations();
      const statusCounts = reservations.reduce((acc, reservation) => {
        acc[reservation.status] = (acc[reservation.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const statusStats = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count
      }));
      
      res.json(statusStats);
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

  app.get("/api/admin/stats/orders-by-status", authenticateToken, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      const statusCounts = orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const statusStats = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count
      }));
      
      res.json(statusStats);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques" });
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

  // Admin settings routes
  app.get("/api/admin/settings", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const settings = {
        restaurantName: "Barista Café",
        address: "123 Rue de la Paix, Paris",
        phone: "+33 1 23 45 67 89",
        email: "contact@barista-cafe.fr",
        website: "https://barista-cafe.fr",
        openingHours: {
          monday: { open: "07:00", close: "19:00", closed: false },
          tuesday: { open: "07:00", close: "19:00", closed: false },
          wednesday: { open: "07:00", close: "19:00", closed: false },
          thursday: { open: "07:00", close: "19:00", closed: false },
          friday: { open: "07:00", close: "20:00", closed: false },
          saturday: { open: "08:00", close: "20:00", closed: false },
          sunday: { open: "08:00", close: "18:00", closed: false }
        },
        maxReservationsPerSlot: 5,
        reservationTimeSlots: ["12:00", "12:30", "13:00", "13:30", "14:00", "19:00", "19:30", "20:00", "20:30"],
        currency: "EUR",
        taxRate: 20,
        defaultLanguage: "fr",
        notificationSettings: {
          emailNotifications: true,
          smsNotifications: false,
          reservationReminders: true,
          orderUpdates: true
        }
      };
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des paramètres" });
    }
  });

  app.put("/api/admin/settings", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const data = req.body;
      // In real app, save settings to database
      res.json({ message: "Paramètres mis à jour avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour des paramètres" });
    }
  });

  // Admin inventory routes
  app.get("/api/admin/inventory/items", authenticateToken, async (req, res) => {
    try {
      const menuItems = await storage.getMenuItems();
      const inventoryItems = menuItems.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        category: 'Menu',
        currentStock: item.stock || 0,
        minStock: item.minStock || 5,
        maxStock: item.maxStock || 100,
        unitCost: item.unitCost || 0,
        supplier: item.supplier || 'Fournisseur principal',
        lastRestocked: item.lastRestocked || new Date().toISOString(),
        status: (item.stock || 0) <= (item.minStock || 5) ? 'low' : 'ok'
      }));
      res.json(inventoryItems);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération de l'inventaire" });
    }
  });

  app.post("/api/admin/inventory/items", authenticateToken, async (req, res) => {
    try {
      const data = req.body;
      const item = await storage.createMenuItem(data);
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la création de l'article" });
    }
  });

  app.get("/api/admin/inventory/alerts", authenticateToken, async (req, res) => {
    try {
      const menuItems = await storage.getMenuItems();
      const alerts = menuItems
        .filter(item => (item.stock || 0) <= (item.minStock || 5))
        .map(item => ({
          id: item.id,
          itemId: item.id,
          itemName: item.name,
          currentStock: item.stock || 0,
          minStock: item.minStock || 5,
          alertLevel: (item.stock || 0) === 0 ? 'out' : 'low' as 'low' | 'critical' | 'out',
          createdAt: new Date().toISOString()
        }));
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des alertes" });
    }
  });

  // Activity logs routes
  app.get("/api/admin/activity-logs", authenticateToken, async (req, res) => {
    try {
      const logs = await storage.getActivityLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des logs" });
    }
  });

  // User management routes (directeur only)
  app.get("/api/admin/users", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const users = await storage.getUsers();
      const safeUsers = users.map(user => ({
        ...user,
        password: undefined
      }));
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des utilisateurs" });
    }
  });

  app.put("/api/admin/users/:id", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = req.body;
      
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
      }
      
      const user = await storage.updateUser(id, userData);
      
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      
      res.json({
        ...user,
        password: undefined
      });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour de l'utilisateur" });
    }
  });

  function getStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  const server = createServer(app);
  wsManager.initialize(server);

  return server;
}