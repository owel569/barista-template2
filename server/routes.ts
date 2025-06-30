import type { Express } from "express";
import { createServer, type Server } from "http";
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
        role: role || "admin"
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

  app.post("/api/auth/verify", authenticateToken, (req: any, res) => {
    res.json({ user: req.user });
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
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ message: "Données d'article invalides" });
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
      const messageData = insertContactMessageSchema.parse(req.body);
      const message = await storage.createContactMessage(messageData);
      res.status(201).json(message);
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ 
          message: "Données de contact invalides",
          errors: error.errors
        });
      }
      res.status(500).json({ message: "Erreur lors de l'envoi du message" });
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

  // Statistics routes
  app.get("/api/stats/today-reservations", authenticateToken, async (req, res) => {
    try {
      const count = await storage.getTodayReservationCount();
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques" });
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
      if (items && items.length > 0) {
        const order = await storage.createOrderWithItems(validatedOrderData, items);
        res.status(201).json(order);
      } else {
        const order = await storage.createOrder(validatedOrderData);
        res.status(201).json(order);
      }
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

      res.json({ message: "Commande supprimée avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression" });
    }
  });

  // Customers routes
  app.get("/api/customers", authenticateToken, async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des clients" });
    }
  });

  app.post("/api/customers", authenticateToken, async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ 
          message: "Données client invalides",
          errors: error.errors
        });
      }
      res.status(500).json({ message: "Erreur lors de la création du client" });
    }
  });

  app.patch("/api/customers/:id", authenticateToken, async (req, res) => {
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

  // Employees routes
  app.get("/api/employees", authenticateToken, async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des employés" });
    }
  });

  app.post("/api/employees", authenticateToken, async (req, res) => {
    try {
      const employeeData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(employeeData);
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

  app.patch("/api/employees/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employeeData = req.body;
      const employee = await storage.updateEmployee(id, employeeData);
      
      if (!employee) {
        return res.status(404).json({ message: "Employé non trouvé" });
      }

      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour de l'employé" });
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

  const httpServer = createServer(app);
  return httpServer;
}
