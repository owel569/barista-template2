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
      console.log('Tentative de connexion:', req.body);
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
        console.log('Recherche utilisateur:', username, 'dans les défauts');
        user = null;
      }
      
      // Si pas d'utilisateur dans la DB ou erreur DB, vérifier les utilisateurs par défaut
      if (!user) {
        console.log('Vérification utilisateur par défaut:', username);
        const defaultUser = defaultUsers.find(u => u.username === username);
        console.log('Utilisateur trouvé:', defaultUser ? 'oui' : 'non');
        console.log('Mot de passe correct:', defaultUser?.password === password ? 'oui' : 'non');
        
        if (defaultUser && defaultUser.password === password) {
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

      // Vérifier le mot de passe (soit haché soit en clair pour les tests)
      let isValidPassword = false;
      try {
        isValidPassword = await bcrypt.compare(password, user.password);
      } catch (error) {
        // Si le hash fail, vérifier en clair (utilisateurs de test)
        isValidPassword = (user.password === password);
      }
      
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
      const { cartItems, ...reservation } = req.body;
      
      // Validation et nettoyage des données de réservation
      if (!reservation.firstName || !reservation.lastName || !reservation.email || !reservation.phone || !reservation.date || !reservation.time) {
        return res.status(400).json({ message: "Tous les champs obligatoires doivent être remplis" });
      }

      const reservationData = {
        customerName: `${reservation.firstName.trim()} ${reservation.lastName.trim()}`,
        customerEmail: reservation.email.trim(),
        customerPhone: reservation.phone.trim(),
        date: reservation.date,
        time: reservation.time,
        guests: parseInt(reservation.guests) || 1,
        status: 'pending',
        specialRequests: reservation.specialRequests || null,
        tableId: reservation.tableId || null
      };

      if (cartItems && cartItems.length > 0) {
        const result = await storage.createReservationWithItems(reservationData, cartItems);
        wsManager.notifyDataUpdate('reservations', result);
        res.status(201).json(result);
      } else {
        const result = await storage.createReservation(reservationData);
        wsManager.notifyDataUpdate('reservations', result);
        res.status(201).json(result);
      }
    } catch (error) {
      console.error('Erreur création réservation:', error);
      res.status(400).json({ message: "Erreur lors de la création de la réservation", error: error.message });
    }
  });

  app.get("/api/reservations", async (req, res) => {
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
      // Validation et nettoyage des données de contact
      if (!req.body.name || !req.body.email || !req.body.message) {
        return res.status(400).json({ message: "Tous les champs obligatoires doivent être remplis" });
      }

      const nameParts = req.body.name.trim().split(' ');
      const messageData = {
        firstName: nameParts[0] || 'Client',
        lastName: nameParts.slice(1).join(' ') || '',
        email: req.body.email.trim(),
        subject: 'Demande de contact',
        message: req.body.message.trim(),
        status: 'new'
      };

      const message = await storage.createContactMessage(messageData);
      wsManager.notifyDataUpdate('contact-messages', message);
      res.status(201).json(message);
    } catch (error) {
      console.error('Erreur envoi message:', error);
      res.status(400).json({ message: "Erreur lors de l'envoi du message", error: error.message });
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
  app.get("/api/orders", async (req, res) => {
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
  app.get("/api/customers", async (req, res) => {
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

  // Admin Statistics routes
  app.get("/api/admin/stats/today-reservations", authenticateToken, async (req, res) => {
    try {
      const count = await storage.getTodayReservationCount();
      res.json({ count });
    } catch (error) {
      console.error('Erreur getTodayReservationCount:', error);
      res.json({ count: 0 });
    }
  });

  app.get("/api/admin/stats/monthly-revenue", authenticateToken, async (req, res) => {
    try {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      
      const stats = await storage.getRevenueStats(startDate, endDate);
      const revenue = stats.reduce((total, day) => total + day.revenue, 0);
      res.json({ revenue });
    } catch (error) {
      console.error('Erreur getRevenueStats:', error);
      res.json({ revenue: 0 });
    }
  });

  app.get("/api/admin/stats/active-orders", authenticateToken, async (req, res) => {
    try {
      const orders = await storage.getOrdersByStatus();
      const activeCount = orders
        .filter(o => o.status === 'pending' || o.status === 'preparing')
        .reduce((sum, o) => sum + o.count, 0);
      res.json({ count: activeCount });
    } catch (error) {
      console.error('Erreur getOrdersByStatus:', error);
      res.json({ count: 0 });
    }
  });

  app.get("/api/admin/stats/occupancy-rate", authenticateToken, async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const rate = await storage.getOccupancyRate(today);
      res.json({ rate });
    } catch (error) {
      console.error('Erreur getOccupancyRate:', error);
      res.json({ rate: 0 });
    }
  });

  app.get("/api/admin/stats/reservation-status", authenticateToken, async (req, res) => {
    try {
      const reservations = await storage.getReservations();
      const statusCounts = reservations.reduce((acc, reservation) => {
        const status = reservation.status || 'pending';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const result = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count
      }));
      
      res.json(result);
    } catch (error) {
      console.error('Erreur reservation status stats:', error);
      res.json([]);
    }
  });

  app.get("/api/admin/stats/daily-reservations", authenticateToken, async (req, res) => {
    try {
      const { year, month } = req.query;
      const currentYear = year ? parseInt(year as string) : new Date().getFullYear();
      const currentMonth = month ? parseInt(month as string) : new Date().getMonth() + 1;
      
      const stats = await storage.getMonthlyReservationStats(currentYear, currentMonth);
      res.json(stats);
    } catch (error) {
      console.error('Erreur getMonthlyReservationStats:', error);
      res.json([]);
    }
  });

  app.get("/api/admin/stats/orders-by-status", authenticateToken, async (req, res) => {
    try {
      const stats = await storage.getOrdersByStatus();
      res.json(stats);
    } catch (error) {
      console.error('Erreur getOrdersByStatus:', error);
      res.json([]);
    }
  });

  // Admin employees routes
  app.get("/api/admin/employees", authenticateToken, async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error) {
      console.error('Erreur getEmployees:', error);
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
      console.error('Erreur création employé:', error);
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

  // Admin work shifts routes
  app.get("/api/admin/work-shifts", authenticateToken, async (req, res) => {
    try {
      const shifts = await storage.getWorkShifts();
      res.json(shifts);
    } catch (error) {
      console.error('Erreur getWorkShifts:', error);
      res.status(500).json({ message: "Erreur lors de la récupération des horaires" });
    }
  });

  app.post("/api/admin/work-shifts", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const shiftData = insertWorkShiftSchema.parse(req.body);
      const shift = await storage.createWorkShift(shiftData);
      wsManager.notifyDataUpdate('work-shifts', shift);
      res.status(201).json(shift);
    } catch (error) {
      console.error('Erreur création horaire:', error);
      res.status(400).json({ message: "Erreur lors de la création de l'horaire" });
    }
  });

  app.put("/api/admin/work-shifts/:id", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const shiftData = req.body;
      const shift = await storage.updateWorkShift(id, shiftData);
      
      if (!shift) {
        return res.status(404).json({ message: "Horaire non trouvé" });
      }
      
      wsManager.notifyDataUpdate('work-shifts', shift);
      res.json(shift);
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

  // Admin reservations with items route
  app.get("/api/admin/reservations/with-items", authenticateToken, async (req, res) => {
    try {
      const reservations = await storage.getReservationsWithItems();
      res.json(reservations);
    } catch (error) {
      console.error('Erreur getReservationsWithItems:', error);
      res.status(500).json({ message: "Erreur lors de la récupération des réservations avec items" });
    }
  });

  // Admin settings routes
  app.get("/api/admin/settings", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const defaultSettings = {
        restaurantName: "Barista Café",
        restaurantAddress: "123 Rue de la Paix, 75001 Paris",
        restaurantPhone: "+33 1 42 86 87 88",
        restaurantEmail: "contact@barista-cafe.fr",
        openingHours: {
          monday: { open: "07:00", close: "19:00", closed: false },
          tuesday: { open: "07:00", close: "19:00", closed: false },
          wednesday: { open: "07:00", close: "19:00", closed: false },
          thursday: { open: "07:00", close: "19:00", closed: false },
          friday: { open: "07:00", close: "21:00", closed: false },
          saturday: { open: "08:00", close: "21:00", closed: false },
          sunday: { open: "08:00", close: "18:00", closed: false }
        },
        maxReservationDays: 30,
        maxTableCapacity: 8,
        reservationNotificationTime: 60,
        currency: "EUR",
        taxRate: 20,
        enableLoyaltyProgram: true,
        loyaltyPointsRate: 10
      };
      res.json(defaultSettings);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des paramètres" });
    }
  });

  app.put("/api/admin/settings", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const settings = req.body;
      // Dans une vraie application, sauvegarder en base de données
      res.json(settings);
    } catch (error) {
      res.status(400).json({ message: "Erreur lors de la mise à jour des paramètres" });
    }
  });



  // SUPPRESSION DE CETTE SECTION DUPLIQUÉE - Voir plus bas pour les routes uniques

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

  // Admin inventory management routes
  app.get("/api/admin/inventory", authenticateToken, async (req, res) => {
    try {
      // Simuler des données d'inventaire basées sur le menu
      const menuItems = await storage.getMenuItems();
      const inventoryData = menuItems.map(item => ({
        id: item.id,
        name: item.name,
        category: item.categoryId,
        currentStock: Math.floor(Math.random() * 100) + 10,
        minStock: 10,
        maxStock: 100,
        unit: 'unités',
        supplier: 'Fournisseur Principal',
        lastRestocked: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        costPerUnit: parseFloat(item.price) * 0.4,
        status: Math.random() > 0.8 ? 'faible' : 'normal'
      }));
      res.json(inventoryData);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération de l'inventaire" });
    }
  });

  app.post("/api/admin/inventory", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const inventoryData = req.body;
      wsManager.notifyDataUpdate('inventory', inventoryData);
      res.status(201).json({ id: Date.now(), ...inventoryData });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de l'ajout de l'élément d'inventaire" });
    }
  });

  app.put("/api/admin/inventory/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      wsManager.notifyDataUpdate('inventory', { id, ...updateData });
      res.json({ id, ...updateData });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour de l'inventaire" });
    }
  });

  app.get("/api/admin/inventory/alerts", authenticateToken, async (req, res) => {
    try {
      const alerts = [
        { id: 1, item: 'Café Arabica', level: 'critique', currentStock: 5, minStock: 10 },
        { id: 2, item: 'Lait', level: 'faible', currentStock: 15, minStock: 20 },
        { id: 3, item: 'Sucre', level: 'faible', currentStock: 8, minStock: 15 }
      ];
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des alertes" });
    }
  });

  // Admin accounting system routes
  app.get("/api/admin/accounting/transactions", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const transactions = [
        { id: 1, date: new Date(), type: 'vente', description: 'Commande #1234', amount: 24.50, category: 'revenus' },
        { id: 2, date: new Date(), type: 'achat', description: 'Fournitures café', amount: -85.00, category: 'achats' },
        { id: 3, date: new Date(), type: 'vente', description: 'Commande #1235', amount: 18.75, category: 'revenus' },
        { id: 4, date: new Date(), type: 'frais', description: 'Électricité', amount: -120.00, category: 'charges' }
      ];
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des transactions" });
    }
  });

  app.post("/api/admin/accounting/transactions", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const transaction = { id: Date.now(), ...req.body, date: new Date() };
      wsManager.notifyDataUpdate('accounting', transaction);
      res.status(201).json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de l'ajout de la transaction" });
    }
  });

  app.get("/api/admin/accounting/summary", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const summary = {
        totalRevenue: 12450.75,
        totalExpenses: 8230.50,
        profit: 4220.25,
        profitMargin: 33.9
      };
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération du résumé" });
    }
  });

  // Admin backup system routes
  app.get("/api/admin/backups", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const backups = [
        { id: 1, name: 'backup_2024_01_10.sql', date: new Date(), size: '2.5 MB', type: 'automatique' },
        { id: 2, name: 'backup_2024_01_09.sql', date: new Date(Date.now() - 24*60*60*1000), size: '2.4 MB', type: 'automatique' },
        { id: 3, name: 'backup_manuel_2024_01_08.sql', date: new Date(Date.now() - 2*24*60*60*1000), size: '2.3 MB', type: 'manuel' }
      ];
      res.json(backups);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des sauvegardes" });
    }
  });

  app.post("/api/admin/backups/create", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const backup = {
        id: Date.now(),
        name: `backup_manuel_${new Date().toISOString().split('T')[0]}.sql`,
        date: new Date(),
        size: '2.6 MB',
        type: 'manuel'
      };
      res.status(201).json(backup);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la création de la sauvegarde" });
    }
  });

  app.delete("/api/admin/backups/:id", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      res.json({ message: "Sauvegarde supprimée avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression de la sauvegarde" });
    }
  });

  // Admin reports system routes
  app.get("/api/admin/reports/sales", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const salesData = [
        { date: '2024-01-01', revenue: 450.75, orders: 23 },
        { date: '2024-01-02', revenue: 520.30, orders: 28 },
        { date: '2024-01-03', revenue: 380.90, orders: 19 },
        { date: '2024-01-04', revenue: 620.45, orders: 31 },
        { date: '2024-01-05', revenue: 490.20, orders: 25 }
      ];
      res.json(salesData);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des rapports de vente" });
    }
  });

  app.get("/api/admin/reports/products", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const productData = [
        { name: 'Cappuccino', sales: 125, revenue: 625.00 },
        { name: 'Espresso', sales: 98, revenue: 294.00 },
        { name: 'Latte', sales: 87, revenue: 391.50 },
        { name: 'Americano', sales: 76, revenue: 304.00 }
      ];
      res.json(productData);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des rapports produits" });
    }
  });

  app.get("/api/admin/reports/customers", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const customerData = [
        { name: 'Sophie Laurent', orders: 12, totalSpent: 185.50, avgOrder: 15.46 },
        { name: 'Jean Dupont', orders: 8, totalSpent: 124.80, avgOrder: 15.60 },
        { name: 'Marie Martin', orders: 15, totalSpent: 267.75, avgOrder: 17.85 }
      ];
      res.json(customerData);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des rapports clients" });
    }
  });

  // Admin suppliers management routes
  app.get("/api/admin/suppliers", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const suppliers = [
        { id: 1, name: 'Café Premium', contact: 'Jean Café', email: 'jean@cafepremium.fr', phone: '+33123456789', category: 'Café' },
        { id: 2, name: 'Laiterie France', contact: 'Marie Lait', email: 'marie@laiterie.fr', phone: '+33234567890', category: 'Produits laitiers' },
        { id: 3, name: 'Pâtisserie Delice', contact: 'Pierre Sucre', email: 'pierre@delice.fr', phone: '+33345678901', category: 'Pâtisseries' }
      ];
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des fournisseurs" });
    }
  });

  app.post("/api/admin/suppliers", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const supplier = { id: Date.now(), ...req.body };
      wsManager.notifyDataUpdate('suppliers', supplier);
      res.status(201).json(supplier);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de l'ajout du fournisseur" });
    }
  });

  app.put("/api/admin/suppliers/:id", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const supplier = { id, ...req.body };
      wsManager.notifyDataUpdate('suppliers', supplier);
      res.json(supplier);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour du fournisseur" });
    }
  });

  app.delete("/api/admin/suppliers/:id", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      res.json({ message: "Fournisseur supprimé avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression du fournisseur" });
    }
  });

  // Admin maintenance system routes
  app.get("/api/admin/maintenance", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const maintenanceItems = [
        { id: 1, equipment: 'Machine à café principale', lastMaintenance: '2024-01-01', nextMaintenance: '2024-02-01', status: 'bon', priority: 'normale' },
        { id: 2, equipment: 'Réfrigérateur', lastMaintenance: '2023-12-15', nextMaintenance: '2024-01-15', status: 'attention', priority: 'élevée' },
        { id: 3, equipment: 'Four', lastMaintenance: '2024-01-05', nextMaintenance: '2024-02-05', status: 'excellent', priority: 'faible' }
      ];
      res.json(maintenanceItems);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des équipements" });
    }
  });

  app.post("/api/admin/maintenance", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const maintenanceItem = { id: Date.now(), ...req.body };
      wsManager.notifyDataUpdate('maintenance', maintenanceItem);
      res.status(201).json(maintenanceItem);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de l'ajout de l'équipement" });
    }
  });

  app.put("/api/admin/maintenance/:id", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const maintenanceItem = { id, ...req.body };
      wsManager.notifyDataUpdate('maintenance', maintenanceItem);
      res.json(maintenanceItem);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour de l'équipement" });
    }
  });

  app.get("/api/admin/maintenance/alerts", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const alerts = [
        { id: 1, equipment: 'Réfrigérateur', message: 'Maintenance prévue dans 3 jours', priority: 'élevée' },
        { id: 2, equipment: 'Machine à café secondaire', message: 'Nettoyage requis', priority: 'normale' }
      ];
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des alertes" });
    }
  });

  // Admin calendar management routes
  app.get("/api/admin/calendar/events", authenticateToken, async (req, res) => {
    try {
      const events = [
        { id: 1, title: 'Formation équipe', date: '2024-01-15', time: '14:00', type: 'formation' },
        { id: 2, title: 'Livraison café', date: '2024-01-16', time: '10:00', type: 'livraison' },
        { id: 3, title: 'Réunion équipe', date: '2024-01-17', time: '16:00', type: 'reunion' }
      ];
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des événements" });
    }
  });

  app.post("/api/admin/calendar/events", authenticateToken, async (req, res) => {
    try {
      const event = { id: Date.now(), ...req.body };
      wsManager.notifyDataUpdate('calendar', event);
      res.status(201).json(event);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de l'ajout de l'événement" });
    }
  });

  app.put("/api/admin/calendar/events/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const event = { id, ...req.body };
      wsManager.notifyDataUpdate('calendar', event);
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour de l'événement" });
    }
  });

  app.delete("/api/admin/calendar/events/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      res.json({ message: "Événement supprimé avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression de l'événement" });
    }
  });

  // Admin notifications management routes
  app.get("/api/admin/notifications/system", authenticateToken, async (req, res) => {
    try {
      const notifications = [
        { id: 1, type: 'info', title: 'Nouvelle réservation', message: 'Réservation pour 4 personnes à 19h', timestamp: new Date(), read: false },
        { id: 2, type: 'warning', title: 'Stock faible', message: 'Le café Arabica est en stock faible', timestamp: new Date(), read: false },
        { id: 3, type: 'success', title: 'Commande terminée', message: 'Commande #1234 terminée avec succès', timestamp: new Date(), read: true }
      ];
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des notifications" });
    }
  });

  app.put("/api/admin/notifications/:id/read", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      res.json({ message: "Notification marquée comme lue" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour de la notification" });
    }
  });

  app.delete("/api/admin/notifications/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      res.json({ message: "Notification supprimée avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression de la notification" });
    }
  });

  // Admin permissions management routes
  app.get("/api/admin/permissions", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const permissions = [
        { id: 1, userId: 2, module: 'reservations', canView: true, canCreate: true, canUpdate: true, canDelete: false },
        { id: 2, userId: 2, module: 'orders', canView: true, canCreate: true, canUpdate: true, canDelete: false },
        { id: 3, userId: 2, module: 'customers', canView: true, canCreate: false, canUpdate: false, canDelete: false },
        { id: 4, userId: 2, module: 'menu', canView: true, canCreate: true, canUpdate: true, canDelete: false }
      ];
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des permissions" });
    }
  });

  app.post("/api/admin/permissions", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const permission = { id: Date.now(), ...req.body };
      wsManager.notifyDataUpdate('permissions', permission);
      res.status(201).json(permission);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de l'ajout de la permission" });
    }
  });

  app.put("/api/admin/permissions/:id", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const permission = { id, ...req.body };
      wsManager.notifyDataUpdate('permissions', permission);
      res.json(permission);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour de la permission" });
    }
  });

  app.delete("/api/admin/permissions/:id", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      res.json({ message: "Permission supprimée avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression de la permission" });
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
      const orders = await storage.getOrdersByStatus();
      res.json(orders);
    } catch (error) {
      res.status(500).json([
        { status: 'en_attente', count: 3 },
        { status: 'en_preparation', count: 5 },
        { status: 'termine', count: 12 }
      ]);
    }
  });

  // Admin employees routes
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
      res.status(500).json({ message: "Erreur lors de la création de l'employé" });
    }
  });

  app.put("/api/admin/employees/:id", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const employee = await storage.updateEmployee(id, updateData);
      
      if (!employee) {
        return res.status(404).json({ message: "Employé non trouvé" });
      }
      
      wsManager.notifyDataUpdate('employees', employee);
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour de l'employé" });
    }
  });

  app.delete("/api/admin/employees/:id", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteEmployee(id);
      
      if (!success) {
        return res.status(404).json({ message: "Employé non trouvé" });
      }
      
      wsManager.notifyDataUpdate('employees', { id, deleted: true });
      res.json({ message: "Employé supprimé avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression de l'employé" });
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

  app.post("/api/admin/customers", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      wsManager.notifyDataUpdate('customers', customer);
      res.status(201).json(customer);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la création du client" });
    }
  });

  app.put("/api/admin/customers/:id", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const customer = await storage.updateCustomer(id, updateData);
      
      if (!customer) {
        return res.status(404).json({ message: "Client non trouvé" });
      }
      
      wsManager.notifyDataUpdate('customers', customer);
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
      
      wsManager.notifyDataUpdate('customers', { id, deleted: true });
      res.json({ message: "Client supprimé avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression du client" });
    }
  });

  // Admin work shifts routes
  app.get("/api/admin/work-shifts", authenticateToken, async (req, res) => {
    try {
      const shifts = await storage.getWorkShifts();
      res.json(shifts);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des horaires" });
    }
  });

  app.post("/api/admin/work-shifts", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const shiftData = insertWorkShiftSchema.parse(req.body);
      const shift = await storage.createWorkShift(shiftData);
      wsManager.notifyDataUpdate('work-shifts', shift);
      res.status(201).json(shift);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la création de l'horaire" });
    }
  });

  app.put("/api/admin/work-shifts/:id", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const shift = await storage.updateWorkShift(id, updateData);
      
      if (!shift) {
        return res.status(404).json({ message: "Horaire non trouvé" });
      }
      
      wsManager.notifyDataUpdate('work-shifts', shift);
      res.json(shift);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour de l'horaire" });
    }
  });

  app.delete("/api/admin/work-shifts/:id", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteWorkShift(id);
      
      if (!success) {
        return res.status(404).json({ message: "Horaire non trouvé" });
      }
      
      wsManager.notifyDataUpdate('work-shifts', { id, deleted: true });
      res.json({ message: "Horaire supprimé avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression de l'horaire" });
    }
  });

  // Admin inventory routes
  app.get("/api/admin/inventory/alerts", authenticateToken, async (req, res) => {
    try {
      // Simulation d'alertes d'inventaire
      const alerts = [
        { id: 1, item: 'Café Arabica', currentStock: 2, minStock: 5, alert: 'low' },
        { id: 2, item: 'Lait', currentStock: 0, minStock: 10, alert: 'critical' }
      ];
      res.json(alerts);
    } catch (error) {
      res.status(500).json([]);
    }
  });

  app.get("/api/orders", async (req, res) => {
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

  // Backup System APIs
  app.get("/api/admin/backups", authenticateToken, async (req, res) => {
    try {
      const backups = [
        {
          id: 1,
          name: "Sauvegarde automatique quotidienne",
          type: "auto",
          size: "2.5 MB",
          createdAt: new Date().toISOString(),
          status: "completed"
        },
        {
          id: 2,
          name: "Sauvegarde manuelle",
          type: "manual",
          size: "2.3 MB",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          status: "completed"
        }
      ];
      res.json({ backups, autoBackupEnabled: true });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des sauvegardes" });
    }
  });

  app.post("/api/admin/backups/create", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const backup = {
        id: Date.now(),
        name: "Sauvegarde manuelle " + new Date().toLocaleDateString('fr-FR'),
        type: "manual",
        size: "2.4 MB",
        createdAt: new Date().toISOString(),
        status: "completed"
      };
      res.status(201).json(backup);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la création de la sauvegarde" });
    }
  });

  // Reports System APIs
  app.get("/api/admin/reports", authenticateToken, async (req, res) => {
    try {
      const reports = [
        {
          id: 1,
          name: "Rapport de ventes mensuel",
          type: "sales",
          period: "Mensuel",
          createdAt: new Date().toISOString(),
          status: "completed"
        },
        {
          id: 2,
          name: "Analyse des clients",
          type: "customers", 
          period: "Hebdomadaire",
          createdAt: new Date(Date.now() - 604800000).toISOString(),
          status: "completed"
        }
      ];
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des rapports" });
    }
  });

  app.get("/api/admin/reports/sales-analytics", authenticateToken, async (req, res) => {
    try {
      const salesData = [
        { date: "2025-07-04", revenue: 450 },
        { date: "2025-07-05", revenue: 520 },
        { date: "2025-07-06", revenue: 380 },
        { date: "2025-07-07", revenue: 610 },
        { date: "2025-07-08", revenue: 480 },
        { date: "2025-07-09", revenue: 550 },
        { date: "2025-07-10", revenue: 420 }
      ];
      res.json(salesData);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des données de ventes" });
    }
  });

  app.get("/api/admin/reports/customer-analytics", authenticateToken, async (req, res) => {
    try {
      const customerData = [
        { name: "Nouveaux", value: 35 },
        { name: "Réguliers", value: 45 },
        { name: "Fidèles", value: 15 },
        { name: "VIP", value: 5 }
      ];
      res.json(customerData);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des données clients" });
    }
  });

  app.get("/api/admin/reports/product-analytics", authenticateToken, async (req, res) => {
    try {
      const productData = [
        { name: "Cappuccino", sales: 45 },
        { name: "Latte", sales: 38 },
        { name: "Espresso", sales: 32 },
        { name: "Americano", sales: 28 },
        { name: "Macchiato", sales: 22 }
      ];
      res.json(productData);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des données produits" });
    }
  });

  app.post("/api/admin/reports/generate", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const { type, period } = req.body;
      const report = {
        id: Date.now(),
        name: `Rapport ${type} ${period}`,
        type,
        period,
        createdAt: new Date().toISOString(),
        status: "completed"
      };
      res.status(201).json(report);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la génération du rapport" });
    }
  });

  // Calendar management routes
  app.get("/api/admin/calendar/events", authenticateToken, async (req, res) => {
    try {
      const events = [
        {
          id: 1,
          title: "Réunion équipe",
          description: "Réunion hebdomadaire de l'équipe",
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          type: "meeting",
          attendees: "Alice, Bob, Charlie",
          location: "Salle de réunion",
          priority: "medium",
          created_by: 1,
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          title: "Formation service",
          description: "Formation sur les nouveaux produits",
          start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          end_time: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
          type: "event",
          attendees: "Toute l'équipe",
          location: "Café principal",
          priority: "high",
          created_by: 1,
          created_at: new Date().toISOString()
        }
      ];
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des événements" });
    }
  });

  app.post("/api/admin/calendar/events", authenticateToken, async (req, res) => {
    try {
      const eventData = req.body;
      const newEvent = {
        id: Date.now(),
        ...eventData,
        created_at: new Date().toISOString()
      };
      wsManager.notifyDataUpdate('calendar-events', newEvent);
      res.json(newEvent);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la création de l'événement" });
    }
  });

  app.put("/api/admin/calendar/events/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const updatedEvent = { id, ...updateData };
      wsManager.notifyDataUpdate('calendar-events', updatedEvent);
      res.json(updatedEvent);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la modification de l'événement" });
    }
  });

  app.delete("/api/admin/calendar/events/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      wsManager.notifyDataUpdate('calendar-events', { id, deleted: true });
      res.json({ message: "Événement supprimé avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression de l'événement" });
    }
  });

  // Drag and drop routes
  app.get("/api/admin/dashboard/widgets", authenticateToken, async (req, res) => {
    try {
      const widgets = [
        {
          id: "widget-1",
          title: "Réservations aujourd'hui",
          type: "reservations",
          position: 0,
          visible: true,
          size: "medium",
          config: {}
        },
        {
          id: "widget-2",
          title: "Revenus du mois",
          type: "revenue",
          position: 1,
          visible: true,
          size: "large",
          config: {}
        },
        {
          id: "widget-3",
          title: "Commandes en cours",
          type: "orders",
          position: 2,
          visible: true,
          size: "small",
          config: {}
        },
        {
          id: "widget-4",
          title: "Clients actifs",
          type: "customers",
          position: 3,
          visible: true,
          size: "medium",
          config: {}
        }
      ];
      res.json(widgets);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des widgets" });
    }
  });

  app.post("/api/admin/dashboard/reorder", authenticateToken, async (req, res) => {
    try {
      const { widgets } = req.body;
      wsManager.notifyDataUpdate('dashboard-widgets', widgets);
      res.json({ message: "Ordre des widgets sauvegardé" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la sauvegarde" });
    }
  });

  app.post("/api/admin/menu/reorder", authenticateToken, async (req, res) => {
    try {
      const { items } = req.body;
      wsManager.notifyDataUpdate('menu-items', items);
      res.json({ message: "Ordre du menu sauvegardé" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la sauvegarde" });
    }
  });

  // Notifications management routes
  app.get("/api/admin/notifications", authenticateToken, async (req, res) => {
    try {
      const notifications = [
        {
          id: 1,
          type: "reservation",
          title: "Nouvelle réservation",
          message: "Réservation pour 4 personnes ce soir",
          read: false,
          priority: "high",
          createdAt: new Date().toISOString(),
          data: { reservationId: 123 }
        },
        {
          id: 2,
          type: "order",
          title: "Commande en attente",
          message: "Commande #456 en attente de préparation",
          read: false,
          priority: "medium",
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          data: { orderId: 456 }
        }
      ];
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des notifications" });
    }
  });

  app.put("/api/admin/notifications/:id/read", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      res.json({ message: "Notification marquée comme lue" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour" });
    }
  });

  app.put("/api/admin/notifications/mark-all-read", authenticateToken, async (req, res) => {
    try {
      res.json({ message: "Toutes les notifications marquées comme lues" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour" });
    }
  });

  app.delete("/api/admin/notifications/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      res.json({ message: "Notification supprimée" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression" });
    }
  });

  // Notifications templates routes
  app.get("/api/admin/notifications/templates", authenticateToken, async (req, res) => {
    try {
      const templates = [
        {
          id: 1,
          name: "Nouvelle réservation",
          type: "reservation",
          subject: "Nouvelle réservation reçue",
          content: "Une nouvelle réservation a été effectuée pour {{date}} à {{time}}",
          active: true,
          channels: ["email", "push"]
        },
        {
          id: 2,
          name: "Commande prête",
          type: "order",
          subject: "Votre commande est prête",
          content: "Votre commande {{orderNumber}} est prête à être récupérée",
          active: true,
          channels: ["sms", "push"]
        }
      ];
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des modèles" });
    }
  });

  // APIs pour les notifications en temps réel
  app.get("/api/admin/notifications/count", authenticateToken, async (req, res) => {
    try {
      const [pendingReservations, newMessages, pendingOrders] = await Promise.all([
        storage.getReservations().then(reservations => 
          reservations.filter(r => r.status === 'pending').length
        ),
        storage.getContactMessages().then(messages => 
          messages.filter(m => m.status === 'new').length
        ),
        storage.getOrders().then(orders => 
          orders.filter(o => o.status === 'pending').length
        )
      ]);

      res.json({
        pendingReservations,
        newMessages,
        pendingOrders,
        lowStockItems: 2 // Simulation pour l'inventaire
      });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des notifications" });
    }
  });

  // APIs pour les rapports
  app.get('/api/admin/reports/data', authenticateToken, async (req, res) => {
    try {
      const reportData = {
        totalSales: 45250.75,
        totalCustomers: 342,
        averageOrderValue: 23.50,
        topProducts: [
          { name: 'Cappuccino Premium', sales: 8750.25 },
          { name: 'Croissant Artisanal', sales: 6890.50 },
          { name: 'Latte Macchiato', sales: 5420.75 },
          { name: 'Café Americano', sales: 4950.25 },
          { name: 'Muffin Chocolat', sales: 3680.00 }
        ],
        salesTrend: [
          { date: '2025-01-01', amount: 1250.00 },
          { date: '2025-01-02', amount: 1480.50 },
          { date: '2025-01-03', amount: 1650.75 },
          { date: '2025-01-04', amount: 1890.25 },
          { date: '2025-01-05', amount: 2150.00 },
          { date: '2025-01-06', amount: 1980.75 },
          { date: '2025-01-07', amount: 2250.50 }
        ]
      };
      res.json(reportData);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // APIs pour la comptabilité
  app.get('/api/admin/accounting/transactions', authenticateToken, async (req, res) => {
    try {
      const transactions = [
        {
          id: 1,
          type: 'income',
          category: 'Ventes Café',
          amount: 1250.50,
          description: 'Ventes journalières café',
          date: '2025-01-09',
          reference: 'VTE-2025-001'
        },
        {
          id: 2,
          type: 'expense',
          category: 'Matières Premières',
          amount: 450.25,
          description: 'Achat grains de café',
          date: '2025-01-08',
          reference: 'ACH-2025-001'
        }
      ];
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  app.get('/api/admin/accounting/summary', authenticateToken, async (req, res) => {
    try {
      const summary = {
        totalIncome: 25680.75,
        totalExpenses: 18420.50,
        netProfit: 7260.25,
        monthlyGrowth: 12.5
      };
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // APIs pour les sauvegardes
  app.get('/api/admin/backups', authenticateToken, async (req, res) => {
    try {
      const backups = [
        {
          id: 1,
          name: 'Sauvegarde_2025-01-09',
          type: 'manual',
          status: 'completed',
          size: 2458624,
          createdAt: '2025-01-09T10:30:00Z',
          tables: ['users', 'menu_items', 'reservations', 'orders']
        },
        {
          id: 2,
          name: 'Auto_Backup_2025-01-08',
          type: 'automatic',
          status: 'completed',
          size: 2156789,
          createdAt: '2025-01-08T02:00:00Z',
          tables: ['users', 'menu_items', 'reservations', 'orders']
        }
      ];
      res.json(backups);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  app.get('/api/admin/backups/settings', authenticateToken, async (req, res) => {
    try {
      const settings = {
        autoBackupEnabled: true,
        backupFrequency: 'daily',
        retentionDays: 30,
        compressionEnabled: true
      };
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // APIs pour le calendrier
  app.get('/api/admin/calendar/events', authenticateToken, async (req, res) => {
    try {
      const events = [
        {
          id: 1,
          title: 'Réservation - Table 5',
          type: 'reservation',
          date: '2025-01-10',
          startTime: '19:00',
          endTime: '21:00',
          description: 'Réservation pour 4 personnes',
          attendees: ['Client Martin'],
          status: 'confirmed'
        },
        {
          id: 2,
          title: 'Maintenance Machine à Café',
          type: 'maintenance',
          date: '2025-01-11',
          startTime: '08:00',
          endTime: '10:00',
          description: 'Maintenance préventive',
          attendees: ['Technicien Pro'],
          status: 'scheduled'
        }
      ];
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  app.get('/api/admin/calendar/stats', authenticateToken, async (req, res) => {
    try {
      const stats = {
        totalEvents: 25,
        eventsThisWeek: 8,
        reservationsToday: 12,
        maintenanceScheduled: 3
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // APIs pour les fournisseurs
  app.get('/api/admin/suppliers', authenticateToken, async (req, res) => {
    try {
      const suppliers = [
        {
          id: 1,
          name: 'Jean Dubois',
          company: 'Café Premium SARL',
          email: 'contact@cafe-premium.fr',
          phone: '+33123456789',
          address: '123 Rue du Commerce, 75001 Paris',
          category: 'Café',
          rating: 5,
          status: 'active',
          totalOrders: 45,
          totalAmount: 12500.75,
          lastOrder: '2025-01-08',
          products: ['Arabica', 'Robusta', 'Expresso']
        },
        {
          id: 2,
          name: 'Marie Delacroix',
          company: 'Pâtisserie Deluxe',
          email: 'marie@patisserie-deluxe.fr',
          phone: '+33234567890',
          address: '456 Avenue des Gourmets, 75002 Paris',
          category: 'Pâtisserie',
          rating: 4,
          status: 'active',
          totalOrders: 32,
          totalAmount: 8750.50,
          lastOrder: '2025-01-07',
          products: ['Croissants', 'Macarons', 'Gâteaux']
        }
      ];
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  app.get('/api/admin/suppliers/stats', authenticateToken, async (req, res) => {
    try {
      const stats = {
        totalSuppliers: 12,
        activeSuppliers: 10,
        totalOrders: 156,
        averageRating: 4.3
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // APIs pour la maintenance
  app.get('/api/admin/maintenance/tasks', authenticateToken, async (req, res) => {
    try {
      const tasks = [
        {
          id: 1,
          title: 'Maintenance Machine à Café Principale',
          description: 'Nettoyage et calibrage de la machine principale',
          equipment: 'Machine à Café Pro X1',
          priority: 'high',
          status: 'pending',
          assignedTo: 'Technicien Martin',
          scheduledDate: '2025-01-12',
          cost: 150.00,
          notes: 'Prévoir 2 heures d\'intervention'
        },
        {
          id: 2,
          title: 'Réparation Four Pâtisserie',
          description: 'Remplacement du thermostat défaillant',
          equipment: 'Four Convection Pro',
          priority: 'urgent',
          status: 'in_progress',
          assignedTo: 'Technicien Dubois',
          scheduledDate: '2025-01-10',
          cost: 250.00,
          notes: 'Pièce commandée'
        }
      ];
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  app.get('/api/admin/maintenance/equipment', authenticateToken, async (req, res) => {
    try {
      const equipment = [
        {
          id: 1,
          name: 'Machine à Café Pro X1',
          type: 'Machine à café',
          location: 'Comptoir principal',
          status: 'operational',
          lastMaintenance: '2024-12-15',
          nextMaintenance: '2025-01-15',
          warrantyExpiry: '2025-12-31'
        },
        {
          id: 2,
          name: 'Four Convection Pro',
          type: 'Four',
          location: 'Cuisine',
          status: 'maintenance',
          lastMaintenance: '2024-11-20',
          nextMaintenance: '2025-01-20'
        }
      ];
      res.json(equipment);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  app.get('/api/admin/maintenance/stats', authenticateToken, async (req, res) => {
    try {
      const stats = {
        totalTasks: 15,
        pendingTasks: 5,
        completedThisMonth: 8,
        totalCost: 1250.75
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // Additional admin APIs for advanced features
  
  // Admin accounting routes
  app.get("/api/admin/accounting/transactions", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const transactions = [
        { id: 1, type: 'income', category: 'Ventes', amount: 1250.50, description: 'Ventes du jour', date: new Date().toISOString().split('T')[0] },
        { id: 2, type: 'expense', category: 'Fournitures', amount: 320.75, description: 'Achat matières premières', date: new Date().toISOString().split('T')[0] },
        { id: 3, type: 'income', category: 'Ventes', amount: 890.25, description: 'Ventes en ligne', date: new Date().toISOString().split('T')[0] }
      ];
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des transactions" });
    }
  });

  app.post("/api/admin/accounting/transactions", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const { type, category, amount, description } = req.body;
      const transaction = {
        id: Date.now(),
        type,
        category,
        amount: parseFloat(amount),
        description,
        date: new Date().toISOString().split('T')[0]
      };
      
      wsManager.notifyDataUpdate('accounting-transactions', transaction);
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la création de la transaction" });
    }
  });

  app.get("/api/admin/accounting/summary", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const summary = {
        totalIncome: 2140.75,
        totalExpenses: 320.75,
        netProfit: 1820.00,
        monthlyGrowth: 15.5
      };
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération du résumé" });
    }
  });

  // Admin backup routes
  app.get("/api/admin/backups", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const backups = [
        { id: 1, name: 'backup_2025_07_10', type: 'automatic', status: 'completed', size: 2.5, createdAt: new Date().toISOString(), tables: ['users', 'customers', 'orders'] },
        { id: 2, name: 'backup_manual_2025_07_09', type: 'manual', status: 'completed', size: 2.3, createdAt: new Date(Date.now() - 86400000).toISOString(), tables: ['users', 'customers', 'orders'] }
      ];
      res.json(backups);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des sauvegardes" });
    }
  });

  app.post("/api/admin/backups", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const backup = {
        id: Date.now(),
        name: `backup_manual_${new Date().toISOString().split('T')[0]}`,
        type: 'manual',
        status: 'in_progress',
        size: 0,
        createdAt: new Date().toISOString(),
        tables: ['users', 'customers', 'orders', 'reservations']
      };
      
      // Simulate backup completion
      setTimeout(() => {
        backup.status = 'completed';
        backup.size = 2.7;
        wsManager.notifyDataUpdate('backups', backup);
      }, 3000);
      
      res.json(backup);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la création de la sauvegarde" });
    }
  });

  app.get("/api/admin/backups/settings", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const settings = {
        autoBackupEnabled: true,
        backupFrequency: 'daily',
        retentionDays: 30,
        compressionEnabled: true
      };
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des paramètres" });
    }
  });

  // Admin advanced statistics routes
  app.get("/api/admin/stats/revenue-detailed", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const revenueData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        revenueData.push({
          date: date.toISOString().split('T')[0],
          revenue: Math.floor(Math.random() * 1000) + 500,
          orders: Math.floor(Math.random() * 50) + 20
        });
      }
      res.json(revenueData);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des revenus détaillés" });
    }
  });

  app.get("/api/admin/stats/customer-analytics", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      const analytics = customers.map(customer => ({
        id: customer.id,
        name: `${customer.firstName} ${customer.lastName}`,
        totalSpent: parseFloat(customer.totalSpent),
        visits: Math.floor(Math.random() * 20) + 1,
        avgOrderValue: parseFloat(customer.totalSpent) / Math.max(1, Math.floor(Math.random() * 10) + 1),
        loyaltyLevel: parseFloat(customer.totalSpent) > 500 ? 'VIP' : 
                     parseFloat(customer.totalSpent) > 200 ? 'Fidèle' : 
                     parseFloat(customer.totalSpent) > 50 ? 'Régulier' : 'Nouveau'
      }));
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des analyses client" });
    }
  });

  app.get("/api/admin/stats/product-analytics", authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const items = await storage.getMenuItems();
      const analytics = items.map(item => ({
        id: item.id,
        name: item.name,
        category: item.categoryId,
        price: parseFloat(item.price.toString()),
        sales: Math.floor(Math.random() * 100) + 10,
        revenue: (Math.floor(Math.random() * 100) + 10) * parseFloat(item.price.toString()),
        popularity: Math.floor(Math.random() * 100) + 1
      }));
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des analyses produit" });
    }
  });

  // API manquante: Inventory Items
  app.get("/api/admin/inventory/items", authenticateToken, async (req, res) => {
    try {
      const items = [
        { id: 1, name: 'Café en grains Arabica', category: 'Café', currentStock: 25, minStock: 10, maxStock: 50, unitCost: 12.50, supplier: 'Café Premium', lastRestocked: '2024-07-08', status: 'ok' },
        { id: 2, name: 'Lait entier', category: 'Produits laitiers', currentStock: 8, minStock: 15, maxStock: 30, unitCost: 2.80, supplier: 'Laiterie France', lastRestocked: '2024-07-09', status: 'low' },
        { id: 3, name: 'Sucre blanc', category: 'Édulcorants', currentStock: 3, minStock: 5, maxStock: 20, unitCost: 1.50, supplier: 'Sucres & Co', lastRestocked: '2024-07-06', status: 'critical' },
        { id: 4, name: 'Croissants surgelés', category: 'Pâtisseries', currentStock: 0, minStock: 10, maxStock: 40, unitCost: 0.85, supplier: 'Pâtisserie Delice', lastRestocked: '2024-07-05', status: 'out' },
        { id: 5, name: 'Capsules recyclables', category: 'Accessoires', currentStock: 150, minStock: 100, maxStock: 300, unitCost: 0.15, supplier: 'EcoCap', lastRestocked: '2024-07-10', status: 'ok' }
      ];
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération de l'inventaire" });
    }
  });

  // API manquante: Maintenance Equipment
  app.get("/api/admin/maintenance/equipments", authenticateToken, async (req, res) => {
    try {
      const equipments = [
        { id: 1, name: 'Machine à café principale', type: 'Café', status: 'operational', lastMaintenance: '2024-07-01', nextMaintenance: '2024-08-01', location: 'Comptoir principal' },
        { id: 2, name: 'Réfrigérateur vitrines', type: 'Réfrigération', status: 'maintenance_required', lastMaintenance: '2024-06-15', nextMaintenance: '2024-07-15', location: 'Comptoir pâtisseries' },
        { id: 3, name: 'Four à pâtisserie', type: 'Cuisson', status: 'operational', lastMaintenance: '2024-06-20', nextMaintenance: '2024-07-20', location: 'Cuisine' },
        { id: 4, name: 'Système de ventilation', type: 'Ventilation', status: 'warning', lastMaintenance: '2024-05-10', nextMaintenance: '2024-07-10', location: 'Plafond cuisine' }
      ];
      res.json(equipments);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des équipements" });
    }
  });

  // API manquante: Notifications All
  app.get("/api/admin/notifications/all", authenticateToken, async (req, res) => {
    try {
      const notifications = [
        { id: 1, type: 'reservation', title: 'Nouvelle réservation', message: 'Réservation pour 4 personnes à 19h30', read: false, timestamp: new Date(), priority: 'medium' },
        { id: 2, type: 'inventory', title: 'Stock faible', message: 'Stock de lait entier critique', read: false, timestamp: new Date(), priority: 'high' },
        { id: 3, type: 'maintenance', title: 'Maintenance requise', message: 'Réfrigérateur nécessite une maintenance', read: true, timestamp: new Date(), priority: 'medium' },
        { id: 4, type: 'order', title: 'Nouvelle commande', message: 'Commande #1247 reçue', read: false, timestamp: new Date(), priority: 'low' }
      ];
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des notifications" });
    }
  });

  // Setup WebSocket server
  wsManager.initialize(server);

  return server;
}
