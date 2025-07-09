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
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "Nom d'utilisateur déjà utilisé" });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create new user
      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
        role: "employe"
      });

      // Generate token
      const token = jwt.sign(
        { id: newUser.id, username: newUser.username, role: newUser.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          role: newUser.role
        }
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Erreur lors de l'enregistrement" });
    }
  });

  app.get("/api/auth/verify", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      
      // Update last login
      await storage.updateUserLastLogin(user.id);
      
      // Remove password from response
      const safeUser = { ...user, password: undefined };
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la vérification" });
    }
  });

  // Get all users (admin only)
  app.get("/api/users", authenticateToken, async (req: any, res) => {
    try {
      const users = await storage.getUsers();
      // Remove password from response
      const safeUsers = users.map((user: any) => ({
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt
      }));
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des utilisateurs" });
    }
  });

  // Get all users (admin only) - Admin route
  app.get("/api/admin/users", authenticateToken, requireRole('directeur'), async (req: any, res) => {
    try {
      const users = await storage.getUsers();
      // Remove password from response
      const safeUsers = users.map((user: any) => ({
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }));
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des utilisateurs" });
    }
  });

  // Menu routes
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
      res.status(500).json({ message: "Erreur lors de la récupération du menu" });
    }
  });

  app.get("/api/menu/items/category/:categoryId", async (req, res) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      const items = await storage.getMenuItemsByCategory(categoryId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des articles" });
    }
  });

  app.post("/api/menu/categories", authenticateToken, async (req, res) => {
    try {
      const categoryData = insertMenuCategorySchema.parse(req.body);
      const category = await storage.createMenuCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ message: "Données de catégorie invalides" });
    }
  });

  app.post("/api/menu/items", authenticateToken, async (req, res) => {
    try {
      const itemData = insertMenuItemSchema.parse(req.body);
      const item = await storage.createMenuItem(itemData);
      
      // Notifier via WebSocket
      wsManager.notifyDataUpdate('menu', item);
      
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ message: "Données d'article invalides" });
    }
  });

  app.patch("/api/menu/items/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const itemData = req.body;
      const item = await storage.updateMenuItem(id, itemData);
      
      if (!item) {
        return res.status(404).json({ message: "Article non trouvé" });
      }

      // Notifier via WebSocket
      wsManager.notifyDataUpdate('menu', item);

      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour de l'article" });
    }
  });

  app.delete("/api/menu/items/:id", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMenuItem(id);
      
      if (!success) {
        return res.status(404).json({ message: "Article non trouvé" });
      }

      // Notifier via WebSocket
      wsManager.notifyDataUpdate('menu');

      res.json({ message: "Article supprimé avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression de l'article" });
    }
  });

  // Reservation routes
  app.get("/api/reservations", authenticateToken, async (req, res) => {
    try {
      const reservations = await storage.getReservationsWithItems();
      res.json(reservations);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des réservations" });
    }
  });

  app.get("/api/reservations/pending-notifications", authenticateToken, async (req, res) => {
    try {
      const reservations = await storage.getPendingNotificationReservations();
      res.json(reservations);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des notifications" });
    }
  });

  app.get("/api/reservations/date/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const reservations = await storage.getReservationsByDate(date);
      res.json(reservations);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des réservations" });
    }
  });

  app.post("/api/reservations", async (req, res) => {
    try {
      const { cartItems, ...reservationData } = req.body;
      const parsedReservationData = insertReservationSchema.parse(reservationData);
      
      // Check for conflicts
      const hasConflict = await storage.checkReservationConflict(
        parsedReservationData.date,
        parsedReservationData.time,
        parsedReservationData.tableId || undefined
      );

      if (hasConflict) {
        return res.status(409).json({ 
          message: "Cette table est déjà réservée pour cette date et heure" 
        });
      }

      // Calculate preorder total
      let preorderTotal = 0;
      if (cartItems && cartItems.length > 0) {
        preorderTotal = cartItems.reduce((total: number, item: any) => {
          return total + (parseFloat(item.menuItem.price) * item.quantity);
        }, 0);
      }

      const reservation = await storage.createReservationWithItems({
        ...parsedReservationData,
        preorderTotal: preorderTotal.toFixed(2)
      }, cartItems || []);

      // Notifier la nouvelle réservation via WebSocket
      wsManager.notifyNewReservation(reservation);
      wsManager.notifyDataUpdate('reservations', reservation);
      wsManager.notifyStatsRefresh();

      res.status(201).json(reservation);
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ 
          message: "Données de réservation invalides",
          errors: error.errors
        });
      }
      res.status(500).json({ message: "Erreur lors de la création de la réservation" });
    }
  });

  app.patch("/api/reservations/:id/status", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!["pending", "confirmed", "cancelled", "completed"].includes(status)) {
        return res.status(400).json({ message: "Statut invalide" });
      }

      const reservation = await storage.updateReservationStatus(id, status);
      if (!reservation) {
        return res.status(404).json({ message: "Réservation non trouvée" });
      }

      // Notifier la mise à jour via WebSocket
      wsManager.notifyDataUpdate('reservations', reservation);
      wsManager.notifyStatsRefresh();

      res.json(reservation);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour de la réservation" });
    }
  });

  app.delete("/api/reservations/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteReservation(id);
      
      if (!success) {
        return res.status(404).json({ message: "Réservation non trouvée" });
      }

      // Notifier la suppression via WebSocket
      wsManager.notifyDataUpdate('reservations');
      wsManager.notifyStatsRefresh();

      res.json({ message: "Réservation supprimée avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression" });
    }
  });

  app.patch("/api/reservations/:id/notification-sent", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const reservation = await storage.markNotificationSent(id);
      
      if (!reservation) {
        return res.status(404).json({ message: "Réservation non trouvée" });
      }

      res.json(reservation);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour de la notification" });
    }
  });

  // Tables routes
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
      const { date, time } = req.query as { date: string; time: string };
      
      if (!date || !time) {
        return res.status(400).json({ message: "Date et heure requises" });
      }

      const tables = await storage.getAvailableTables(date, time);
      res.json(tables);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la vérification de disponibilité" });
    }
  });

  // Contact routes
  app.post("/api/contact", async (req, res) => {
    try {
      const inputData = req.body;
      
      // Validation basique
      if (!inputData.email || !inputData.subject || !inputData.message) {
        return res.status(400).json({ 
          message: "Email, sujet et message sont requis" 
        });
      }
      
      // Transformer les données si nécessaire (name -> firstName/lastName)
      let messageData;
      if (inputData.name && !inputData.firstName && !inputData.lastName) {
        const nameParts = inputData.name.split(' ');
        messageData = {
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: inputData.email,
          subject: inputData.subject,
          message: inputData.message,
          phone: inputData.phone || null,
        };
      } else {
        messageData = {
          firstName: inputData.firstName || '',
          lastName: inputData.lastName || '',
          email: inputData.email,
          subject: inputData.subject,
          message: inputData.message,
          phone: inputData.phone || null,
        };
      }
      
      const message = await storage.createContactMessage(messageData);
      
      // Notifier le nouveau message via WebSocket
      wsManager.notifyNewMessage(message);
      wsManager.notifyDataUpdate('messages', message);
      
      res.status(201).json(message);
    } catch (error: any) {
      console.error('Erreur création message contact:', error);
      res.status(500).json({ message: "Erreur lors de l'envoi du message" });
    }
  });

  app.get("/api/contact/messages", authenticateToken, async (req, res) => {
    try {
      const messages = await storage.getContactMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des messages" });
    }
  });

  app.patch("/api/contact/messages/:id/status", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Le statut est requis" });
      }

      const message = await storage.updateContactMessageStatus(parseInt(id), status);
      
      if (!message) {
        return res.status(404).json({ message: "Message non trouvé" });
      }

      // Notifier la mise à jour via WebSocket
      wsManager.notifyDataUpdate('messages', message);

      res.json(message);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour du statut" });
    }
  });

  // Statistics routes
  app.get("/api/stats/today-reservations", authenticateToken, async (req, res) => {
    try {
      const count = await storage.getTodayReservationCount();
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques" });
    }
  });

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
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
      
      const orders = await storage.getOrders();
      const monthlyRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
      
      res.json({ revenue: monthlyRevenue });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération du chiffre d'affaires" });
    }
  });

  app.get("/api/admin/stats/active-orders", authenticateToken, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      const activeOrders = orders.filter(order => ['pending', 'preparation', 'ready'].includes(order.status));
      res.json({ count: activeOrders.length });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des commandes actives" });
    }
  });

  app.get("/api/admin/stats/occupancy-rate", authenticateToken, async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const rate = await storage.getOccupancyRate(today);
      res.json({ rate });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors du calcul du taux d'occupation" });
    }
  });

  app.get("/api/stats/occupancy", authenticateToken, async (req, res) => {
    try {
      const { date } = req.query as { date: string };
      const today = date || new Date().toISOString().split('T')[0];
      const rate = await storage.getOccupancyRate(today);
      res.json({ rate });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors du calcul du taux d'occupation" });
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
      
      // Valider les données de base de la commande
      const validatedOrderData = insertOrderSchema.parse(orderData);
      
      // Créer la commande avec les articles
      let order;
      if (items && items.length > 0) {
        order = await storage.createOrderWithItems(validatedOrderData, items);
      } else {
        order = await storage.createOrder(validatedOrderData);
      }
      
      // Notifier la nouvelle commande via WebSocket
      wsManager.notifyNewOrder(order);
      wsManager.notifyDataUpdate('orders', order);
      wsManager.notifyStatsRefresh();
      
      res.status(201).json(order);
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ 
          message: "Données de commande invalides",
          errors: error.errors
        });
      }
      res.status(500).json({ message: "Erreur lors de la création de la commande" });
    }
  });

  app.patch("/api/orders/:id/status", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const order = await storage.updateOrderStatus(id, status);
      
      if (!order) {
        return res.status(404).json({ message: "Commande non trouvée" });
      }

      // Notifier la mise à jour via WebSocket
      wsManager.notifyDataUpdate('orders', order);
      wsManager.notifyStatsRefresh();

      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour du statut" });
    }
  });

  app.delete("/api/orders/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteOrder(id);
      
      if (!success) {
        return res.status(404).json({ message: "Commande non trouvée" });
      }

      // Notifier la suppression via WebSocket
      wsManager.notifyDataUpdate('orders');
      wsManager.notifyStatsRefresh();

      res.json({ message: "Commande supprimée avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression" });
    }
  });

  // Customers routes
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
      // Validation flexible pour le téléphone
      const customerData = { ...req.body };
      
      // Validation basique
      if (!customerData.firstName || !customerData.lastName || !customerData.email) {
        return res.status(400).json({ 
          message: "Prénom, nom et email sont requis" 
        });
      }
      
      // Validation email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerData.email)) {
        return res.status(400).json({ 
          message: "Email invalide" 
        });
      }
      
      // Validation téléphone si fourni
      if (customerData.phone && customerData.phone.length < 8) {
        return res.status(400).json({ 
          message: "Téléphone requis (minimum 8 chiffres)" 
        });
      }
      
      const customer = await storage.createCustomer(customerData);
      
      // Notifier via WebSocket
      wsManager.notifyDataUpdate('customers', customer);
      
      res.status(201).json(customer);
    } catch (error: any) {
      console.error('Erreur création client:', error);
      res.status(500).json({ message: "Erreur lors de la création du client" });
    }
  });

  app.patch("/api/admin/customers/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customerData = req.body;
      const customer = await storage.updateCustomer(id, customerData);
      
      if (!customer) {
        return res.status(404).json({ message: "Client non trouvé" });
      }

      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour du client" });
    }
  });

  app.delete("/api/admin/customers/:id", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCustomer(id);
      
      if (!success) {
        return res.status(404).json({ message: "Client non trouvé" });
      }

      // Notifier via WebSocket
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
      
      // Notifier via WebSocket
      wsManager.notifyDataUpdate('employees', employee);
      
      res.status(201).json(employee);
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ 
          message: "Données employé invalides",
          errors: error.errors
        });
      }
      res.status(500).json({ message: "Erreur lors de la création de l'employé" });
    }
  });

  app.patch("/api/employees/:id", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employeeData = req.body;
      const employee = await storage.updateEmployee(id, employeeData);
      
      if (!employee) {
        return res.status(404).json({ message: "Employé non trouvé" });
      }
      
      // Notifier via WebSocket
      wsManager.notifyDataUpdate('employees', employee);

      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour de l'employé" });
    }
  });

  app.delete("/api/employees/:id", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteEmployee(id);
      
      if (!success) {
        return res.status(404).json({ message: "Employé non trouvé" });
      }
      
      // Notifier via WebSocket
      wsManager.notifyDataUpdate('employees');
      
      res.json({ message: "Employé supprimé avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression de l'employé" });
    }
  });

  // Statistics routes for dashboard
  app.get("/api/stats/monthly-reservations", authenticateToken, async (req, res) => {
    try {
      const { year, month } = req.query as { year: string; month: string };
      const currentYear = year ? parseInt(year) : new Date().getFullYear();
      const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
      
      const stats = await storage.getMonthlyReservationStats(currentYear, currentMonth);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques mensuelles" });
    }
  });

  app.get("/api/stats/revenue", authenticateToken, async (req, res) => {
    try {
      const { startDate, endDate } = req.query as { startDate: string; endDate: string };
      const defaultEndDate = new Date().toISOString().split('T')[0];
      const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const stats = await storage.getRevenueStats(
        startDate || defaultStartDate,
        endDate || defaultEndDate
      );
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques de revenus" });
    }
  });

  app.get("/api/stats/orders-by-status", authenticateToken, async (req, res) => {
    try {
      const stats = await storage.getOrdersByStatus();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques de commandes" });
    }
  });

  app.get("/api/stats/daily-reservations", authenticateToken, async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const reservations = await storage.getReservationsByDate(today);
      res.json(reservations);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des réservations du jour" });
    }
  });

  app.get("/api/stats/reservations-by-status", authenticateToken, async (req, res) => {
    try {
      const reservations = await storage.getReservations();
      const stats = reservations.reduce((acc: any, reservation: any) => {
        const status = reservation.status;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      
      const result = Object.entries(stats).map(([status, count]) => ({
        status,
        count
      }));
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques de réservations" });
    }
  });

  // Admin dashboard routes
  app.get("/api/admin/stats", authenticateToken, async (req, res) => {
    try {
      const todayReservations = await storage.getTodayReservationCount();
      const activeOrders = await storage.getOrdersByStatus().then(orders => 
        orders.filter(order => order.status === 'pending' || order.status === 'preparing').length
      );
      const monthlyRevenue = await storage.getRevenueStats(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        new Date().toISOString().split('T')[0]
      ).then(stats => stats.reduce((sum, stat) => sum + parseFloat(stat.revenue.toString()), 0));
      const occupancyRate = await storage.getOccupancyRate(new Date().toISOString().split('T')[0]);

      res.json({
        todayReservations,
        activeOrders,
        monthlyRevenue,
        occupancyRate
      });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques" });
    }
  });

  // Dashboard specific routes
  app.get("/api/admin/stats/today-reservations", authenticateToken, async (req, res) => {
    try {
      const count = await storage.getTodayReservationCount();
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des réservations du jour" });
    }
  });

  app.get("/api/admin/stats/monthly-revenue", authenticateToken, async (req, res) => {
    try {
      const monthlyRevenue = await storage.getRevenueStats(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        new Date().toISOString().split('T')[0]
      ).then(stats => stats.reduce((sum, stat) => sum + parseFloat(stat.revenue.toString()), 0));
      res.json({ revenue: monthlyRevenue });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des revenus mensuels" });
    }
  });

  app.get("/api/admin/stats/active-orders", authenticateToken, async (req, res) => {
    try {
      const activeOrders = await storage.getOrdersByStatus().then(orders => 
        orders.filter(order => order.status === 'pending' || order.status === 'preparing').length
      );
      res.json({ count: activeOrders });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des commandes actives" });
    }
  });

  app.get("/api/admin/stats/occupancy-rate", authenticateToken, async (req, res) => {
    try {
      const rate = await storage.getOccupancyRate(new Date().toISOString().split('T')[0]);
      res.json({ rate });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération du taux d'occupation" });
    }
  });

  app.get("/api/admin/stats/reservation-status", authenticateToken, async (req, res) => {
    try {
      const reservations = await storage.getReservations();
      const stats = reservations.reduce((acc: any, reservation: any) => {
        const status = reservation.status;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      
      const result = Object.entries(stats).map(([status, count]) => ({
        status,
        count
      }));
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques de réservations" });
    }
  });

  app.get("/api/admin/stats/daily-reservations", authenticateToken, async (req, res) => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6); // Last 7 days
      
      const dailyStats = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const reservations = await storage.getReservationsByDate(dateStr);
        dailyStats.push({
          date: dateStr,
          count: reservations.length
        });
      }
      
      res.json(dailyStats);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques quotidiennes" });
    }
  });

  app.get("/api/admin/reservations/today", authenticateToken, async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const reservations = await storage.getReservationsByDate(today);
      res.json(reservations);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des réservations du jour" });
    }
  });

  app.get("/api/admin/orders/recent", authenticateToken, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      const recentOrders = orders.slice(-10).reverse(); // Get 10 most recent orders
      res.json(recentOrders);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des commandes récentes" });
    }
  });

  app.get("/api/admin/reservations/stats", authenticateToken, async (req, res) => {
    try {
      const reservations = await storage.getReservations();
      const stats = reservations.reduce((acc: any, reservation: any) => {
        const status = reservation.status;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      
      const result = Object.entries(stats).map(([status, count]) => ({
        status,
        count
      }));
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques de réservations" });
    }
  });

  app.get("/api/admin/reservations/daily", authenticateToken, async (req, res) => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6); // Last 7 days
      
      const dailyStats = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const reservations = await storage.getReservationsByDate(dateStr);
        dailyStats.push({
          date: dateStr,
          count: reservations.length
        });
      }
      
      res.json(dailyStats);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques quotidiennes" });
    }
  });

  // Employee management routes - both /api/employees and /api/admin/employees for compatibility
  app.get("/api/employees", authenticateToken, async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des employés" });
    }
  });

  app.get("/api/admin/employees", authenticateToken, requireRole('directeur'), async (req, res) => {
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
      
      // Notifier via WebSocket
      wsManager.notifyDataUpdate('employees', employee);
      
      res.status(201).json(employee);
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ 
          message: "Données employé invalides",
          errors: error.errors
        });
      }
      res.status(400).json({ message: "Erreur lors de la création de l'employé" });
    }
  });

  app.post("/api/admin/employees", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const employeeData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(employeeData);
      
      // Notifier via WebSocket
      wsManager.notifyDataUpdate('employees', employee);
      
      res.status(201).json(employee);
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ 
          message: "Données employé invalides",
          errors: error.errors
        });
      }
      res.status(400).json({ message: "Erreur lors de la création de l'employé" });
    }
  });

  app.put("/api/employees/:id", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employeeData = insertEmployeeSchema.partial().parse(req.body);
      const employee = await storage.updateEmployee(id, employeeData);
      
      if (!employee) {
        return res.status(404).json({ message: "Employé non trouvé" });
      }
      
      // Notifier via WebSocket
      wsManager.notifyDataUpdate('employees', employee);
      
      res.json(employee);
    } catch (error) {
      res.status(400).json({ message: "Erreur lors de la mise à jour de l'employé" });
    }
  });

  app.put("/api/admin/employees/:id", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employeeData = insertEmployeeSchema.partial().parse(req.body);
      const employee = await storage.updateEmployee(id, employeeData);
      
      if (!employee) {
        return res.status(404).json({ message: "Employé non trouvé" });
      }
      
      // Notifier via WebSocket
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
      
      // Notifier via WebSocket
      wsManager.notifyDataUpdate('employees');
      
      res.json({ message: "Employé supprimé avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression de l'employé" });
    }
  });

  app.delete("/api/admin/employees/:id", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteEmployee(id);
      
      if (!success) {
        return res.status(404).json({ message: "Employé non trouvé" });
      }
      
      // Notifier via WebSocket
      wsManager.notifyDataUpdate('employees');
      
      res.json({ message: "Employé supprimé avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression de l'employé" });
    }
  });

  // Permissions management routes
  app.get("/api/admin/permissions/:userId", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      // Simulate permissions - in real app, this would come from database
      const permissions = [
        { id: 1, userId, module: 'dashboard', canView: true, canCreate: false, canUpdate: false, canDelete: false },
        { id: 2, userId, module: 'reservations', canView: true, canCreate: true, canUpdate: true, canDelete: false },
        { id: 3, userId, module: 'orders', canView: true, canCreate: true, canUpdate: true, canDelete: false },
        { id: 4, userId, module: 'customers', canView: true, canCreate: false, canUpdate: false, canDelete: false },
        { id: 5, userId, module: 'menu', canView: true, canCreate: true, canUpdate: true, canDelete: false },
        { id: 6, userId, module: 'messages', canView: true, canCreate: false, canUpdate: true, canDelete: false },
        { id: 7, userId, module: 'employees', canView: false, canCreate: false, canUpdate: false, canDelete: false },
        { id: 8, userId, module: 'settings', canView: false, canCreate: false, canUpdate: false, canDelete: false },
        { id: 9, userId, module: 'statistics', canView: false, canCreate: false, canUpdate: false, canDelete: false },
        { id: 10, userId, module: 'logs', canView: false, canCreate: false, canUpdate: false, canDelete: false }
      ];
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des permissions" });
    }
  });

  app.put("/api/admin/permissions/:userId", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const permissions = req.body;
      // In real app, save to database
      res.json({ message: "Permissions mises à jour avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour des permissions" });
    }
  });

  // Inventory management routes
  app.get("/api/admin/inventory/items", authenticateToken, async (req, res) => {
    try {
      const items = await storage.getMenuItems();
      // Add inventory fields
      const inventoryItems = items.map(item => ({
        ...item,
        stock: Math.floor(Math.random() * 100),
        minStock: 10,
        maxStock: 100,
        supplier: "Fournisseur Principal",
        cost: parseFloat(item.price) * 0.6
      }));
      res.json(inventoryItems);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des articles" });
    }
  });

  app.get("/api/admin/inventory/alerts", authenticateToken, async (req, res) => {
    try {
      const alerts = [
        { id: 1, itemId: 1, itemName: "Espresso", currentStock: 5, minStock: 10, alertLevel: "low", createdAt: new Date().toISOString() },
        { id: 2, itemId: 2, itemName: "Americano", currentStock: 0, minStock: 10, alertLevel: "out", createdAt: new Date().toISOString() },
        { id: 3, itemId: 3, itemName: "Cappuccino", currentStock: 3, minStock: 10, alertLevel: "critical", createdAt: new Date().toISOString() }
      ];
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des alertes" });
    }
  });

  app.get("/api/admin/inventory/stats", authenticateToken, async (req, res) => {
    try {
      const items = await storage.getMenuItems();
      const stats = {
        totalItems: items.length,
        availableItems: items.filter(item => item.available).length,
        lowStockItems: 3,
        outOfStockItems: 1,
        totalValue: items.reduce((sum, item) => sum + parseFloat(item.price), 0) * 10,
        avgCostPerItem: items.reduce((sum, item) => sum + parseFloat(item.price), 0) / items.length
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques" });
    }
  });

  app.put("/api/admin/inventory/items/:id/stock", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { stock } = req.body;
      // In real app, update stock in database
      res.json({ message: "Stock mis à jour avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour du stock" });
    }
  });

  app.put("/api/admin/inventory/items/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = req.body;
      // In real app, update item in database
      res.json({ message: "Article mis à jour avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour de l'article" });
    }
  });

  app.post("/api/admin/inventory/items", authenticateToken, async (req, res) => {
    try {
      const data = req.body;
      // In real app, create item in database
      res.status(201).json({ message: "Article créé avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la création de l'article" });
    }
  });

  // Loyalty system routes
  app.get("/api/admin/loyalty/customers", authenticateToken, async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      const loyaltyCustomers = customers.map(customer => ({
        ...customer,
        loyaltyPoints: Math.floor(customer.totalSpent / 10),
        loyaltyLevel: customer.totalSpent > 500 ? 'VIP' : customer.totalSpent > 200 ? 'Fidèle' : customer.totalSpent > 50 ? 'Régulier' : 'Nouveau',
        nextRewardThreshold: customer.totalSpent > 500 ? 1000 : customer.totalSpent > 200 ? 500 : customer.totalSpent > 50 ? 200 : 100,
        rewards: []
      }));
      res.json(loyaltyCustomers);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des clients fidélité" });
    }
  });

  app.get("/api/admin/loyalty/rewards", authenticateToken, async (req, res) => {
    try {
      const rewards = [
        { id: 1, name: "Café gratuit", description: "Un café de votre choix offert", pointsCost: 100, type: "free_item", value: 0, isActive: true, minLevel: "Nouveau" },
        { id: 2, name: "Réduction 10%", description: "10% de réduction sur votre commande", pointsCost: 150, type: "discount", value: 10, isActive: true, minLevel: "Régulier" },
        { id: 3, name: "Pâtisserie gratuite", description: "Une pâtisserie de votre choix", pointsCost: 200, type: "free_item", value: 0, isActive: true, minLevel: "Régulier" },
        { id: 4, name: "Réduction 20%", description: "20% de réduction sur votre commande", pointsCost: 300, type: "discount", value: 20, isActive: true, minLevel: "Fidèle" },
        { id: 5, name: "Menu complet gratuit", description: "Un menu café + pâtisserie offert", pointsCost: 500, type: "free_item", value: 0, isActive: true, minLevel: "VIP" },
        { id: 6, name: "Cadeau surprise", description: "Un cadeau spécial de la maison", pointsCost: 750, type: "gift", value: 15, isActive: true, minLevel: "VIP" }
      ];
      res.json(rewards);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des récompenses" });
    }
  });

  app.get("/api/admin/loyalty/stats", authenticateToken, async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      const levelDistribution = [
        { level: "Nouveau", count: customers.filter(c => c.totalSpent <= 50).length, percentage: 0 },
        { level: "Régulier", count: customers.filter(c => c.totalSpent > 50 && c.totalSpent <= 200).length, percentage: 0 },
        { level: "Fidèle", count: customers.filter(c => c.totalSpent > 200 && c.totalSpent <= 500).length, percentage: 0 },
        { level: "VIP", count: customers.filter(c => c.totalSpent > 500).length, percentage: 0 }
      ];
      
      levelDistribution.forEach(level => {
        level.percentage = Math.round((level.count / customers.length) * 100);
      });

      const stats = {
        totalCustomers: customers.length,
        activeMembers: customers.filter(c => c.totalSpent > 0).length,
        totalPointsIssued: customers.reduce((sum, c) => sum + Math.floor(c.totalSpent / 10), 0),
        totalRewardsRedeemed: 47,
        averageOrderValue: customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length,
        retentionRate: 78,
        levelDistribution
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques fidélité" });
    }
  });

  app.post("/api/admin/loyalty/award-points", authenticateToken, async (req, res) => {
    try {
      const { customerId, points, reason } = req.body;
      // In real app, update customer points in database
      res.json({ message: "Points attribués avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de l'attribution des points" });
    }
  });

  app.post("/api/admin/loyalty/redeem-reward", authenticateToken, async (req, res) => {
    try {
      const { customerId, rewardId } = req.body;
      // In real app, process reward redemption
      res.json({ message: "Récompense échangée avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de l'échange de récompense" });
    }
  });

  app.post("/api/admin/loyalty/rewards", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const data = req.body;
      // In real app, create reward in database
      res.status(201).json({ message: "Récompense créée avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la création de la récompense" });
    }
  });

  // Admin inventory routes
  app.get("/api/admin/inventory", authenticateToken, async (req, res) => {
    try {
      const menuItems = await storage.getMenuItems();
      res.json(menuItems);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération de l'inventaire" });
    }
  });

  app.get("/api/admin/inventory/stats", authenticateToken, async (req, res) => {
    try {
      const menuItems = await storage.getMenuItems();
      const stats = {
        totalItems: menuItems.length,
        availableItems: menuItems.filter(item => item.available).length,
        lowStockItems: menuItems.filter(item => (item.stock || 0) <= (item.minStock || 5)).length,
        outOfStockItems: menuItems.filter(item => (item.stock || 0) === 0).length,
        totalValue: menuItems.reduce((sum, item) => sum + (item.cost || 0) * (item.stock || 0), 0),
        avgCostPerItem: menuItems.reduce((sum, item) => sum + (item.cost || 0), 0) / menuItems.length
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques" });
    }
  });

  app.put("/api/admin/inventory/items/:id/stock", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { stock } = req.body;
      const item = await storage.updateMenuItem(id, { stock });
      
      if (!item) {
        return res.status(404).json({ message: "Article non trouvé" });
      }
      
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour du stock" });
    }
  });

  app.put("/api/admin/inventory/items/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = req.body;
      const item = await storage.updateMenuItem(id, data);
      
      if (!item) {
        return res.status(404).json({ message: "Article non trouvé" });
      }
      
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour de l'article" });
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

  // Employee management routes
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
      
      // Notifier via WebSocket
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
      
      // Notifier via WebSocket
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
      
      // Notifier via WebSocket
      wsManager.notifyDataUpdate('employees');
      
      res.json({ message: "Employé supprimé avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression de l'employé" });
    }
  });

  // Work shifts management routes
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
      const shiftData = req.body;
      const shift = await storage.createWorkShift(shiftData);
      
      // Notifier via WebSocket
      wsManager.notifyDataUpdate('work-shifts', shift);
      
      res.status(201).json(shift);
    } catch (error) {
      res.status(400).json({ message: "Erreur lors de la création de l'horaire" });
    }
  });

  app.put("/api/work-shifts/:id", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const shiftData = req.body;
      const shift = await storage.updateWorkShift(id, shiftData);
      
      if (!shift) {
        return res.status(404).json({ message: "Horaire non trouvé" });
      }
      
      // Notifier via WebSocket
      wsManager.notifyDataUpdate('work-shifts', shift);
      
      res.json(shift);
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
      
      // Notifier via WebSocket
      wsManager.notifyDataUpdate('work-shifts');
      
      res.json({ message: "Horaire supprimé avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression de l'horaire" });
    }
  });

  // User management routes (directeur only)
  app.get("/api/admin/users", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const users = await storage.getUsers();
      // Remove password from response
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
      
      // Hash password if provided
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
      }
      
      const user = await storage.updateUser(id, userData);
      
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      
      // Remove password from response
      const safeUser = { ...user, password: undefined };
      res.json(safeUser);
    } catch (error) {
      res.status(400).json({ message: "Erreur lors de la mise à jour de l'utilisateur" });
    }
  });

  // Activity logs routes (directeur only)
  app.get("/api/admin/logs", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const logs = await storage.getActivityLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des logs" });
    }
  });

  // Admin Statistics Routes
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
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      
      const stats = await storage.getRevenueStats(startOfMonth, endOfMonth);
      const revenue = stats.reduce((total, day) => total + day.revenue, 0);
      res.json({ revenue });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des revenus" });
    }
  });

  app.get("/api/admin/stats/active-orders", authenticateToken, async (req, res) => {
    try {
      const statusStats = await storage.getOrdersByStatus();
      const activeCount = statusStats
        .filter(stat => ['en_attente', 'en_preparation', 'pret'].includes(stat.status))
        .reduce((total, stat) => total + stat.count, 0);
      res.json({ count: activeCount });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des commandes actives" });
    }
  });

  app.get("/api/admin/stats/occupancy-rate", authenticateToken, async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const rate = await storage.getOccupancyRate(today);
      res.json({ rate });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération du taux d'occupation" });
    }
  });

  // Routes pour système de fidélité
  app.get("/api/admin/loyalty/customers", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      const loyaltyData = customers.map(customer => ({
        ...customer,
        loyaltyLevel: parseFloat(customer.totalSpent) > 500 ? 'VIP' : 
                     parseFloat(customer.totalSpent) > 200 ? 'Fidèle' : 
                     parseFloat(customer.totalSpent) > 50 ? 'Régulier' : 'Nouveau',
        points: Math.floor(parseFloat(customer.totalSpent) / 10)
      }));
      res.json(loyaltyData);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des données de fidélité" });
    }
  });

  app.get("/api/admin/loyalty/rewards", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const rewards = [
        { id: 1, name: "Café gratuit", pointsRequired: 50, available: true },
        { id: 2, name: "Réduction 10%", pointsRequired: 100, available: true },
        { id: 3, name: "Pâtisserie gratuite", pointsRequired: 75, available: true },
        { id: 4, name: "Menu complet gratuit", pointsRequired: 200, available: true },
        { id: 5, name: "Réduction 20%", pointsRequired: 150, available: true },
        { id: 6, name: "Cadeau VIP", pointsRequired: 300, available: true }
      ];
      res.json(rewards);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des récompenses" });
    }
  });

  app.get("/api/admin/loyalty/stats", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      const stats = {
        totalCustomers: customers.length,
        vipCount: customers.filter(c => parseFloat(c.totalSpent) > 500).length,
        fideleCount: customers.filter(c => parseFloat(c.totalSpent) > 200 && parseFloat(c.totalSpent) <= 500).length,
        regulierCount: customers.filter(c => parseFloat(c.totalSpent) > 50 && parseFloat(c.totalSpent) <= 200).length,
        nouveauCount: customers.filter(c => parseFloat(c.totalSpent) <= 50).length,
        averageSpent: customers.reduce((sum, c) => sum + parseFloat(c.totalSpent), 0) / customers.length
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques de fidélité" });
    }
  });

  app.post("/api/admin/loyalty/award-points", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const { customerId, points, reason } = req.body;
      // In real app, update customer points
      res.json({ message: "Points attribués avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de l'attribution des points" });
    }
  });

  // Routes pour notifications admin
  app.get("/api/admin/notifications/pending-reservations", authenticateToken, async (req, res) => {
    try {
      const pendingReservations = await storage.getReservations();
      const pending = pendingReservations.filter(r => r.status === 'pending');
      res.json(pending);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des réservations en attente" });
    }
  });

  app.get("/api/admin/notifications/new-messages", authenticateToken, async (req, res) => {
    try {
      const messages = await storage.getContactMessages();
      const newMessages = messages.filter(m => m.status === 'new');
      res.json(newMessages);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des nouveaux messages" });
    }
  });

  app.get("/api/admin/notifications/pending-orders", authenticateToken, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      const pending = orders.filter(o => o.status === 'pending');
      res.json(pending);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des commandes en attente" });
    }
  });

  // Routes pour statistiques avancées
  app.get("/api/admin/stats/revenue-detailed", authenticateToken, async (req, res) => {
    try {
      const { period } = req.query;
      const now = new Date();
      let startDate: string;
      let endDate: string;
      
      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          endDate = now.toISOString().split('T')[0];
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
          endDate = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      }
      
      const stats = await storage.getRevenueStats(startDate, endDate);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques détaillées" });
    }
  });

  app.get("/api/admin/stats/customer-analytics", authenticateToken, async (req, res) => {
    try {
      const customers = await storage.getTopCustomers(10);
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des analyses clients" });
    }
  });

  app.get("/api/admin/stats/product-performance", authenticateToken, async (req, res) => {
    try {
      const menuItems = await storage.getMenuItems();
      const performance = menuItems.map(item => ({
        id: item.id,
        name: item.name,
        sales: Math.floor(Math.random() * 1000) + 100,
        revenue: parseFloat(item.price) * (Math.floor(Math.random() * 1000) + 100),
        growth: (Math.random() - 0.5) * 40
      }));
      res.json(performance);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des performances produits" });
    }
  });

  app.get("/api/admin/stats/time-analysis", authenticateToken, async (req, res) => {
    try {
      const timeData = [];
      for (let hour = 7; hour <= 18; hour++) {
        timeData.push({
          hour: `${hour}h`,
          orders: Math.floor(Math.random() * 80) + 10,
          revenue: Math.floor(Math.random() * 1000) + 200
        });
      }
      res.json(timeData);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des analyses temporelles" });
    }
  });

  app.post("/api/admin/loyalty/redeem-reward", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const { customerId, rewardId } = req.body;
      // Dans une vraie app, on gérerait l'échange de récompenses
      res.json({ message: "Récompense échangée avec succès", customerId, rewardId });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de l'échange de la récompense" });
    }
  });

  app.post("/api/admin/loyalty/rewards", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const rewardData = req.body;
      // Dans une vraie app, on sauvegarderait la récompense en base
      const newReward = { id: Date.now(), ...rewardData };
      res.status(201).json(newReward);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la création de la récompense" });
    }
  });

  app.get("/api/admin/stats/reservation-status", authenticateToken, async (req, res) => {
    try {
      // Get reservations for today
      const today = new Date().toISOString().split('T')[0];
      const reservations = await storage.getReservationsByDate(today);
      
      // Count by status
      const statusCounts = reservations.reduce((acc: any, res: any) => {
        acc[res.status] = (acc[res.status] || 0) + 1;
        return acc;
      }, {});
      
      // Convert to array format for charts
      const statusArray = Object.entries(statusCounts).map(([status, count]) => ({
        status: status === 'confirmée' ? 'Confirmée' : 
                status === 'en_attente' ? 'En attente' : 
                status === 'annulée' ? 'Annulée' : status,
        count
      }));
      
      res.json(statusArray);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des statuts" });
    }
  });

  app.get("/api/admin/stats/daily-reservations", authenticateToken, async (req, res) => {
    try {
      const now = new Date();
      const dailyStats = [];
      
      // Get last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const reservations = await storage.getReservationsByDate(dateStr);
        
        dailyStats.push({
          date: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
          count: reservations.length
        });
      }
      
      res.json(dailyStats);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques quotidiennes" });
    }
  });

  // Admin notification routes
  app.get("/api/admin/notifications/pending-reservations", authenticateToken, async (req, res) => {
    try {
      const reservations = await storage.getPendingNotificationReservations();
      res.json(reservations);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des réservations en attente" });
    }
  });

  app.get("/api/admin/notifications/new-messages", authenticateToken, async (req, res) => {
    try {
      const messages = await storage.getContactMessages();
      // Filtrer les messages non lus ou récents
      const newMessages = messages.filter(msg => msg.status === 'nouveau' || msg.status === 'non_lu');
      res.json(newMessages);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des nouveaux messages" });
    }
  });

  app.get("/api/admin/notifications/pending-orders", authenticateToken, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      // Filtrer les commandes en attente
      const pendingOrders = orders.filter(order => order.status === 'en_attente' || order.status === 'en_preparation');
      res.json(pendingOrders);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des commandes en attente" });
    }
  });

  // Contact messages routes
  app.get("/api/contact-messages", authenticateToken, async (req, res) => {
    try {
      const messages = await storage.getContactMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des messages" });
    }
  });

  app.put("/api/contact-messages/:id/status", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const message = await storage.updateContactMessageStatus(id, status);
      
      if (!message) {
        return res.status(404).json({ message: "Message non trouvé" });
      }
      
      res.json(message);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour du statut du message" });
    }
  });

  // Work shifts routes
  app.get("/api/work-shifts", authenticateToken, async (req, res) => {
    try {
      const shifts = await storage.getWorkShifts();
      res.json(shifts);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des horaires" });
    }
  });

  app.post("/api/work-shifts", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const shiftData = insertWorkShiftSchema.parse(req.body);
      const shift = await storage.createWorkShift(shiftData);
      
      // Notifier via WebSocket
      wsManager.notifyDataUpdate('work-shifts', shift);
      
      res.status(201).json(shift);
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ 
          message: "Données horaire invalides",
          errors: error.errors
        });
      }
      res.status(500).json({ message: "Erreur lors de la création de l'horaire" });
    }
  });

  app.put("/api/work-shifts/:id", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const shiftData = insertWorkShiftSchema.partial().parse(req.body);
      const shift = await storage.updateWorkShift(id, shiftData);
      
      if (!shift) {
        return res.status(404).json({ message: "Horaire non trouvé" });
      }

      // Notifier via WebSocket
      wsManager.notifyDataUpdate('work-shifts', shift);

      res.json(shift);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour de l'horaire" });
    }
  });

  app.delete("/api/work-shifts/:id", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteWorkShift(id);
      
      if (!success) {
        return res.status(404).json({ message: "Horaire non trouvé" });
      }
      
      // Notifier via WebSocket
      wsManager.notifyDataUpdate('work-shifts');
      
      res.json({ message: "Horaire supprimé avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression de l'horaire" });
    }
  });

  // Menu items management routes with permissions
  app.put("/api/menu/items/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const itemData = req.body;
      const item = await storage.updateMenuItem(id, itemData);
      
      if (!item) {
        return res.status(404).json({ message: "Article non trouvé" });
      }
      
      // Notifier via WebSocket
      wsManager.notifyDataUpdate('menu', item);
      
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour de l'article" });
    }
  });

  app.delete("/api/menu/items/:id", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMenuItem(id);
      
      if (!success) {
        return res.status(404).json({ message: "Article non trouvé" });
      }
      
      // Notifier via WebSocket
      wsManager.notifyDataUpdate('menu');
      
      res.json({ message: "Article supprimé avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression de l'article" });
    }
  });

  // Admin Routes - Complete the missing ones
  app.get("/api/admin/reservations", authenticateToken, async (req, res) => {
    try {
      const reservations = await storage.getReservations();
      res.json(reservations);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des réservations" });
    }
  });

  app.put("/api/admin/reservations/:id/status", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const reservation = await storage.updateReservationStatus(id, status);
      
      if (!reservation) {
        return res.status(404).json({ message: "Réservation non trouvée" });
      }
      
      // Notifier via WebSocket
      wsManager.notifyDataUpdate('reservations', reservation);
      
      res.json(reservation);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour du statut" });
    }
  });

  app.get("/api/admin/orders", authenticateToken, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des commandes" });
    }
  });

  app.put("/api/admin/orders/:id/status", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const order = await storage.updateOrderStatus(id, status);
      
      if (!order) {
        return res.status(404).json({ message: "Commande non trouvée" });
      }
      
      // Notifier via WebSocket
      wsManager.notifyDataUpdate('orders', order);
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour du statut" });
    }
  });

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
      
      // Notifier via WebSocket
      wsManager.notifyDataUpdate('customers', customer);
      
      res.status(201).json(customer);
    } catch (error) {
      res.status(400).json({ message: "Erreur lors de la création du client" });
    }
  });

  app.delete("/api/admin/customers/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCustomer(id);
      
      if (!success) {
        return res.status(404).json({ message: "Client non trouvé" });
      }
      
      // Notifier via WebSocket
      wsManager.notifyDataUpdate('customers');
      
      res.json({ message: "Client supprimé avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression du client" });
    }
  });

  // Notification APIs for admin dashboard
  app.get("/api/admin/notifications/pending-reservations", authenticateToken, async (req, res) => {
    try {
      const reservations = await storage.getPendingNotificationReservations();
      res.json(reservations);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des réservations en attente" });
    }
  });

  app.get("/api/admin/notifications/new-messages", authenticateToken, async (req, res) => {
    try {
      const messages = await storage.getContactMessages();
      // Filter only unread messages from the last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const newMessages = messages.filter((message: any) => 
        message.status === 'unread' && new Date(message.createdAt) > yesterday
      );
      res.json(newMessages);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des nouveaux messages" });
    }
  });

  app.get("/api/admin/notifications/pending-orders", authenticateToken, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      // Filter only pending orders
      const pendingOrders = orders.filter((order: any) => 
        order.status === 'pending' || order.status === 'preparing'
      );
      res.json(pendingOrders);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des commandes en attente" });
    }
  });

  // APIs statistiques manquantes
  app.get("/api/admin/stats/orders-by-status", authenticateToken, async (req, res) => {
    try {
      const ordersByStatus = await storage.getOrdersByStatus();
      res.json(ordersByStatus);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques de commandes" });
    }
  });

  app.get("/api/admin/stats/daily-reservations", authenticateToken, async (req, res) => {
    try {
      // Récupérer les réservations des 7 derniers jours
      const dailyStats = [];
      const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const reservations = await storage.getReservationsByDate(dateStr);
        dailyStats.push({
          date: days[date.getDay() === 0 ? 6 : date.getDay() - 1], // Ajuster pour commencer par lundi
          count: reservations.length
        });
      }
      
      res.json(dailyStats);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des réservations quotidiennes" });
    }
  });

  app.get("/api/admin/stats/reservation-status", authenticateToken, async (req, res) => {
    try {
      const reservations = await storage.getReservations();
      const statusCounts = reservations.reduce((acc: any, reservation: any) => {
        acc[reservation.status] = (acc[reservation.status] || 0) + 1;
        return acc;
      }, {});
      
      const statusData = Object.entries(statusCounts).map(([status, count]) => ({
        name: status,
        value: count,
        color: getStatusColor(status)
      }));
      
      res.json(statusData);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des statuts de réservation" });
    }
  });

  // Helper function for status colors
  function getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'confirmée': '#10b981',
      'pending': '#f59e0b',
      'cancelled': '#ef4444',
      'completed': '#3b82f6'
    };
    return colors[status] || '#6b7280';
  }

  // Inventory management API
  app.get("/api/admin/inventory/items", authenticateToken, async (req, res) => {
    try {
      const items = await storage.getMenuItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des articles" });
    }
  });

  app.get("/api/admin/inventory/alerts", authenticateToken, async (req, res) => {
    try {
      // Mock stock alerts
      const alerts = [
        { id: 1, itemId: 1, itemName: "Café Americano", currentStock: 2, minStock: 5, alertLevel: "low", createdAt: new Date().toISOString() },
        { id: 2, itemId: 2, itemName: "Croissant", currentStock: 0, minStock: 10, alertLevel: "out", createdAt: new Date().toISOString() }
      ];
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des alertes" });
    }
  });

  app.get("/api/admin/inventory/stats", authenticateToken, async (req, res) => {
    try {
      const items = await storage.getMenuItems();
      const stats = {
        totalItems: items.length,
        availableItems: items.filter((item: any) => item.available).length,
        lowStockItems: 2,
        outOfStockItems: 1,
        totalValue: 2450.50,
        avgCostPerItem: 12.75
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques" });
    }
  });

  // Permissions management API
  app.get("/api/admin/permissions", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const permissions = await storage.getUserPermissions(1);
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des permissions" });
    }
  });

  app.put("/api/admin/permissions/:id", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const permissionData = req.body;
      const permission = await storage.updatePermission(id, permissionData);
      
      if (!permission) {
        return res.status(404).json({ message: "Permission non trouvée" });
      }
      
      res.json(permission);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour de la permission" });
    }
  });

  // Contact messages API
  app.get("/api/contact-messages", authenticateToken, async (req, res) => {
    try {
      const messages = await storage.getContactMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des messages" });
    }
  });

  app.put("/api/contact-messages/:id/status", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const message = await storage.updateContactMessageStatus(id, status);
      
      if (!message) {
        return res.status(404).json({ message: "Message non trouvé" });
      }
      
      // Notifier via WebSocket
      wsManager.notifyDataUpdate('contact-messages', message);
      
      res.json(message);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour du statut" });
    }
  });

  // Settings API for restaurant configuration
  app.get("/api/settings", authenticateToken, async (req, res) => {
    try {
      // Default restaurant settings
      const settings = {
        restaurantName: "Barista Café",
        address: "123 Rue de la Paix, 75001 Paris",
        phone: "+33 1 23 45 67 89",
        email: "contact@barista-cafe.fr",
        openingHours: {
          monday: { open: "07:00", close: "19:00", closed: false },
          tuesday: { open: "07:00", close: "19:00", closed: false },
          wednesday: { open: "07:00", close: "19:00", closed: false },
          thursday: { open: "07:00", close: "19:00", closed: false },
          friday: { open: "07:00", close: "20:00", closed: false },
          saturday: { open: "08:00", close: "20:00", closed: false },
          sunday: { open: "09:00", close: "18:00", closed: false }
        },
        capacity: 45,
        averageServiceTime: 30,
        reservationAdvanceTime: 60,
        enableOnlineOrdering: true,
        enableReservations: true,
        taxRate: 0.20,
        currency: "EUR",
        timezone: "Europe/Paris",
        notifications: {
          emailEnabled: true,
          smsEnabled: false,
          newReservationAlert: true,
          newOrderAlert: true,
          newMessageAlert: true
        }
      };
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des paramètres" });
    }
  });

  app.put("/api/settings", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      // In a real application, you would save these settings to the database
      const settings = req.body;
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour des paramètres" });
    }
  });

  // Advanced Statistics Routes (directeur only)
  app.get("/api/admin/stats/revenue-detailed", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const { period = 'month' } = req.query;
      const now = new Date();
      let startDate: string, endDate: string;
      
      switch (period) {
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
          endDate = new Date().toISOString().split('T')[0];
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
          endDate = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
          break;
        default: // month
          startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      }
      
      const stats = await storage.getRevenueStats(startDate, endDate);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques détaillées" });
    }
  });

  app.get("/api/admin/stats/customer-analytics", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const topCustomers = await storage.getTopCustomers(10);
      const customerStats = topCustomers.map(({ customer, totalSpent, totalOrders }) => ({
        name: `${customer.firstName} ${customer.lastName}`,
        totalSpent: parseFloat(totalSpent.toString()),
        totalOrders,
        tier: totalSpent >= 500 ? 'VIP' : totalSpent >= 200 ? 'Fidèle' : totalSpent >= 50 ? 'Régulier' : 'Nouveau'
      }));
      res.json(customerStats);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des analyses clients" });
    }
  });

  app.get("/api/admin/stats/product-analytics", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const db = await getDb();
      const result = await db.query(`
        SELECT 
          mi.name as product_name,
          COUNT(oi.id) as times_ordered,
          SUM(oi.quantity) as total_quantity,
          SUM(oi.price::numeric * oi.quantity) as total_revenue
        FROM menu_items mi
        LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
        GROUP BY mi.id, mi.name
        ORDER BY total_revenue DESC NULLS LAST
        LIMIT 20
      `);
      
      const productStats = result.rows.map(row => ({
        productName: row.product_name,
        timesOrdered: parseInt(row.times_ordered) || 0,
        totalQuantity: parseInt(row.total_quantity) || 0,
        totalRevenue: parseFloat(row.total_revenue) || 0
      }));
      
      res.json(productStats);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des analyses produits" });
    }
  });

  // Admin - Statistiques de fidélité clients
  app.get('/api/admin/stats/loyalty-analytics', authenticateToken, async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      const loyaltyStats = customers.map(customer => ({
        ...customer,
        loyaltyLevel: customer.totalSpent > 500 ? 'VIP' : 
                     customer.totalSpent > 200 ? 'Fidèle' : 
                     customer.totalSpent > 50 ? 'Régulier' : 'Nouveau',
        points: Math.floor(parseFloat(customer.totalSpent || '0') / 10) // 1 point par 10€
      }));
      
      const levelCounts = loyaltyStats.reduce((acc, customer) => {
        acc[customer.loyaltyLevel] = (acc[customer.loyaltyLevel] || 0) + 1;
        return acc;
      }, {});
      
      res.json({
        customers: loyaltyStats,
        levelDistribution: Object.entries(levelCounts).map(([level, count]) => ({
          level,
          count,
          percentage: (count / loyaltyStats.length * 100).toFixed(1)
        }))
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques de fidélité:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  const httpServer = createServer(app);
  
  // Initialiser le WebSocket
  wsManager.initialize(httpServer);
  
  return httpServer;
}
