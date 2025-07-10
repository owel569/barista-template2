import { Express, Request, Response, NextFunction, Router } from 'express';
import { createServer, Server } from 'http';
import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { storage } from './storage';
import { insertUserSchema } from '../shared/schema';
// Routes supplémentaires (optionnelles)
// import deliveryRouter from './routes/delivery';
// import onlineOrdersRouter from './routes/online-orders';
// import userProfileRouter from './routes/user-profile';
// import tablesRouter from './routes/tables';

const JWT_SECRET = process.env.JWT_SECRET || 'barista-secret-key-ultra-secure-2025';

const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token manquant' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      console.log('Token verification failed:', err.message);
      return res.status(403).json({ message: 'Token invalide' });
    }
    (req as any).user = user;
    next();
  });
};

const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || user.role !== role) {
      return res.status(403).json({ message: 'Accès refusé - rôle insuffisant' });
    }
    next();
  };
};

function getStatusColor(status: string): string {
  switch (status) {
    case 'confirmé': return 'bg-green-500';
    case 'en_attente': return 'bg-yellow-500';
    case 'annulé': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const server = createServer(app);
  
  // Configuration WebSocket
  const wss = new WebSocketServer({ server });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket connecté');
    
    ws.on('message', (message) => {
      console.log('Message WebSocket reçu:', message.toString());
    });
    
    ws.on('close', () => {
      console.log('WebSocket déconnecté');
    });
  });

  // Fonction pour broadcaster aux clients WebSocket
  const broadcast = (data: any) => {
    wss.clients.forEach(client => {
      if (client.readyState === client.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  // Routes d'authentification
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const users = await storage.getUsers();
      const user = users.find(u => u.username === username);
      
      if (!user) {
        return res.status(401).json({ message: 'Utilisateur non trouvé' });
      }
      
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: 'Mot de passe incorrect' });
      }
      
      const token = jwt.sign({ 
        id: user.id, 
        username: user.username, 
        role: user.role 
      }, JWT_SECRET, { expiresIn: '24h' });
      
      res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const users = await storage.getUsers();
      
      if (users.some(u => u.username === userData.username)) {
        return res.status(400).json({ message: 'Nom d\'utilisateur déjà utilisé' });
      }
      
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const newUser = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      
      res.status(201).json({ message: 'Utilisateur créé avec succès', userId: newUser.id });
    } catch (error) {
      res.status(400).json({ message: 'Erreur lors de la création de l\'utilisateur' });
    }
  });

  app.get('/api/auth/verify', authenticateToken, (req, res) => {
    res.json({ valid: true, user: (req as any).user });
  });

  // Routes publiques pour le menu
  app.get('/api/menu/categories', async (req, res) => {
    try {
      const categories = await storage.getMenuCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  app.get('/api/menu/items', async (req, res) => {
    try {
      const items = await storage.getMenuItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // Routes publiques pour les réservations
  app.post('/api/reservations', async (req, res) => {
    try {
      const reservationData = req.body;
      const reservation = await storage.createReservation(reservationData);
      broadcast({ type: 'new_reservation', data: reservation });
      res.status(201).json(reservation);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la création de la réservation' });
    }
  });

  app.get('/api/reservations', async (req, res) => {
    try {
      const reservations = await storage.getReservations();
      res.json(reservations);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // Routes publiques pour les clients
  app.post('/api/customers', async (req, res) => {
    try {
      const customerData = req.body;
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la création du client' });
    }
  });

  app.get('/api/customers', async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // Routes publiques pour les commandes
  app.post('/api/orders', async (req, res) => {
    try {
      const orderData = req.body;
      const order = await storage.createOrder(orderData);
      broadcast({ type: 'new_order', data: order });
      res.status(201).json(order);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la création de la commande' });
    }
  });

  app.get('/api/orders', async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // Routes publiques pour les messages de contact
  app.post('/api/messages', async (req, res) => {
    try {
      const messageData = req.body;
      const message = await storage.createMessage(messageData);
      broadcast({ type: 'new_message', data: message });
      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de l\'envoi du message' });
    }
  });

  // Routes admin protégées pour le dashboard
  app.get('/api/admin/reservations/today', authenticateToken, async (req, res) => {
    try {
      const reservations = await storage.getReservations();
      const today = new Date().toISOString().split('T')[0];
      const todayReservations = reservations.filter(r => 
        r.date && r.date.split('T')[0] === today
      );
      res.json({ count: todayReservations.length, reservations: todayReservations });
    } catch (error) {
      res.status(500).json({ count: 0, reservations: [] });
    }
  });

  app.get('/api/admin/revenue/monthly', authenticateToken, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      const currentMonth = new Date().getMonth();
      const monthlyOrders = orders.filter(o => 
        o.createdAt && new Date(o.createdAt).getMonth() === currentMonth
      );
      const revenue = monthlyOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      res.json({ revenue, orderCount: monthlyOrders.length });
    } catch (error) {
      res.status(500).json({ revenue: 0, orderCount: 0 });
    }
  });

  app.get('/api/admin/occupancy-rate', authenticateToken, async (req, res) => {
    try {
      const reservations = await storage.getReservations();
      const totalTables = 20; // Nombre total de tables
      const today = new Date().toISOString().split('T')[0];
      const todayReservations = reservations.filter(r => 
        r.date && r.date.split('T')[0] === today && r.status === 'confirmed'
      );
      const occupancyRate = Math.round((todayReservations.length / totalTables) * 100);
      res.json({ rate: occupancyRate, occupied: todayReservations.length, total: totalTables });
    } catch (error) {
      res.status(500).json({ rate: 0, occupied: 0, total: 20 });
    }
  });

  app.get('/api/admin/active-orders', authenticateToken, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      const activeOrders = orders.filter(o => 
        o.status === 'pending' || o.status === 'preparing' || o.status === 'ready'
      );
      res.json({ count: activeOrders.length, orders: activeOrders });
    } catch (error) {
      res.status(500).json({ count: 0, orders: [] });
    }
  });

  app.get('/api/admin/reservation-status', authenticateToken, async (req, res) => {
    try {
      const reservations = await storage.getReservations();
      const statusCounts = {
        confirmed: reservations.filter(r => r.status === 'confirmed').length,
        pending: reservations.filter(r => r.status === 'pending').length,
        cancelled: reservations.filter(r => r.status === 'cancelled').length
      };
      res.json(statusCounts);
    } catch (error) {
      res.status(500).json({ confirmed: 0, pending: 0, cancelled: 0 });
    }
  });

  // Routes spécifiques pour le dashboard (sans doublons)
  app.get("/api/admin/orders-by-status", authenticateToken, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      const statusCounts = {
        pending: orders.filter(o => o.status === 'pending').length,
        preparing: orders.filter(o => o.status === 'preparing').length,
        ready: orders.filter(o => o.status === 'ready').length,
        completed: orders.filter(o => o.status === 'completed').length,
        cancelled: orders.filter(o => o.status === 'cancelled').length
      };
      res.json(statusCounts);
    } catch (error) {
      res.status(500).json({ pending: 0, preparing: 0, ready: 0, completed: 0, cancelled: 0 });
    }
  });

  app.get("/api/admin/daily-reservations", authenticateToken, async (req, res) => {
    try {
      const reservations = await storage.getReservations();
      const last7Days = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayReservations = reservations.filter(r => 
          r.date && r.date.split('T')[0] === dateStr
        ).length;
        
        last7Days.push({
          date: dateStr,
          count: dayReservations
        });
      }
      
      res.json(last7Days);
    } catch (error) {
      res.status(500).json([]);
    }
  });

  // Routes admin pour la gestion
  app.get('/api/admin/reservations', authenticateToken, async (req, res) => {
    try {
      const reservations = await storage.getReservations();
      res.json(reservations);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  app.post('/api/admin/reservations', authenticateToken, async (req, res) => {
    try {
      const reservationData = req.body;
      const reservation = await storage.createReservation(reservationData);
      broadcast({ type: 'new_reservation', data: reservation });
      res.status(201).json(reservation);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la création de la réservation' });
    }
  });

  app.get('/api/admin/orders', authenticateToken, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  app.get('/api/admin/customers', authenticateToken, async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  app.post('/api/admin/customers', authenticateToken, async (req, res) => {
    try {
      const customerData = req.body;
      const customer = await storage.createCustomer(customerData);
      broadcast({ type: 'customer_created', data: customer });
      res.status(201).json(customer);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la création du client' });
    }
  });

  app.get('/api/admin/employees', authenticateToken, async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  app.post('/api/admin/employees', authenticateToken, async (req, res) => {
    try {
      const employeeData = req.body;
      const employee = await storage.createEmployee(employeeData);
      broadcast({ type: 'employee_created', data: employee });
      res.status(201).json(employee);
    } catch (error) {
      console.error('Erreur création employé:', error);
      res.status(500).json({ message: 'Erreur lors de la création de l\'employé' });
    }
  });

  app.get('/api/admin/messages', authenticateToken, async (req, res) => {
    try {
      const messages = await storage.getMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  app.get('/api/admin/work-shifts', authenticateToken, async (req, res) => {
    try {
      const shifts = await storage.getWorkShifts();
      res.json(shifts);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // Routes pour l'inventaire
  app.get('/api/admin/inventory/items', authenticateToken, async (req, res) => {
    try {
      const items = [
        { id: 1, name: 'Grains de café Arabica', quantity: 50, unit: 'kg', minThreshold: 10, cost: 12.50 },
        { id: 2, name: 'Lait entier', quantity: 25, unit: 'litres', minThreshold: 15, cost: 1.20 },
        { id: 3, name: 'Sucre blanc', quantity: 8, unit: 'kg', minThreshold: 5, cost: 2.30 }
      ];
      res.json(items);
    } catch (error) {
      res.status(500).json([]);
    }
  });

  app.get('/api/admin/inventory/alerts', authenticateToken, async (req, res) => {
    try {
      const alerts = [
        { id: 1, item: 'Lait entier', currentStock: 25, minThreshold: 15, alertLevel: 'warning' },
        { id: 2, item: 'Sucre blanc', currentStock: 8, minThreshold: 5, alertLevel: 'critical' }
      ];
      res.json(alerts);
    } catch (error) {
      res.status(500).json([]);
    }
  });

  // Routes pour la fidélité
  app.get('/api/admin/loyalty/stats', authenticateToken, async (req, res) => {
    try {
      const stats = {
        totalMembers: 156,
        activeMembers: 89,
        averagePoints: 245,
        totalPointsIssued: 38450
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ totalMembers: 0, activeMembers: 0, averagePoints: 0, totalPointsIssued: 0 });
    }
  });

  app.get('/api/admin/loyalty/customers', authenticateToken, async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      const loyaltyCustomers = customers.map(c => ({
        ...c,
        loyaltyPoints: c.loyaltyPoints || 0,
        level: c.loyaltyPoints >= 500 ? 'VIP' : c.loyaltyPoints >= 200 ? 'Fidèle' : 'Standard'
      }));
      res.json(loyaltyCustomers);
    } catch (error) {
      res.status(500).json([]);
    }
  });

  app.get('/api/admin/loyalty/rewards', authenticateToken, async (req, res) => {
    try {
      const rewards = [
        { id: 1, name: 'Café gratuit', pointsCost: 100, description: 'Un café au choix offert' },
        { id: 2, name: 'Réduction 20%', pointsCost: 200, description: '20% de réduction sur votre commande' },
        { id: 3, name: 'Menu VIP', pointsCost: 500, description: 'Accès au menu exclusif VIP' }
      ];
      res.json(rewards);
    } catch (error) {
      res.status(500).json([]);
    }
  });

  // Routes pour les statistiques
  app.get('/api/admin/stats/revenue-detailed', authenticateToken, async (req, res) => {
    try {
      const revenue = {
        daily: [
          { date: '2025-07-04', amount: 450.25 },
          { date: '2025-07-05', amount: 520.80 },
          { date: '2025-07-06', amount: 380.45 }
        ],
        monthly: 15420.75,
        yearly: 185000.00
      };
      res.json(revenue);
    } catch (error) {
      res.status(500).json({ daily: [], monthly: 0, yearly: 0 });
    }
  });

  app.get('/api/admin/stats/customer-analytics', authenticateToken, async (req, res) => {
    try {
      const analytics = {
        newCustomers: 45,
        returningCustomers: 234,
        averageOrderValue: 28.50,
        customerRetentionRate: 78
      };
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ newCustomers: 0, returningCustomers: 0, averageOrderValue: 0, customerRetentionRate: 0 });
    }
  });

  // Routes pour les notifications
  app.get('/api/admin/notifications/pending-reservations', authenticateToken, async (req, res) => {
    try {
      const reservations = await storage.getReservations();
      const pendingReservations = reservations.filter(r => r.status === 'pending');
      res.json({ count: pendingReservations.length, items: pendingReservations });
    } catch (error) {
      res.status(500).json({ count: 0, items: [] });
    }
  });

  app.get('/api/admin/notifications/new-messages', authenticateToken, async (req, res) => {
    try {
      const messages = await storage.getMessages();
      const newMessages = messages.filter(m => m.status === 'nouveau');
      res.json({ count: newMessages.length, items: newMessages });
    } catch (error) {
      res.status(500).json({ count: 0, items: [] });
    }
  });

  app.get('/api/admin/notifications/pending-orders', authenticateToken, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      const pendingOrders = orders.filter(o => o.status === 'pending');
      res.json({ count: pendingOrders.length, items: pendingOrders });
    } catch (error) {
      res.status(500).json({ count: 0, items: [] });
    }
  });

  app.get('/api/admin/notifications', authenticateToken, async (req, res) => {
    try {
      const notifications = [
        { id: 1, type: 'reservation', message: 'Nouvelle réservation en attente', time: '10:30', read: false },
        { id: 2, type: 'order', message: 'Commande #123 prête', time: '10:15', read: false },
        { id: 3, type: 'message', message: 'Nouveau message de contact', time: '09:45', read: true }
      ];
      res.json(notifications);
    } catch (error) {
      res.status(500).json([]);
    }
  });

  // Routes pour la comptabilité
  app.get('/api/admin/accounting/transactions', authenticateToken, async (req, res) => {
    try {
      const transactions = [
        { id: 1, date: '2025-07-10', type: 'vente', amount: 450.25, description: 'Ventes restaurant' },
        { id: 2, date: '2025-07-10', type: 'achat', amount: -120.50, description: 'Achat matières premières' },
        { id: 3, date: '2025-07-09', type: 'vente', amount: 520.80, description: 'Ventes restaurant' }
      ];
      res.json(transactions);
    } catch (error) {
      res.status(500).json([]);
    }
  });

  app.post('/api/admin/accounting/transactions', authenticateToken, async (req, res) => {
    try {
      const transactionData = req.body;
      const transaction = {
        id: Date.now(),
        date: transactionData.date || new Date().toISOString(),
        type: transactionData.type,
        amount: parseFloat(transactionData.amount),
        description: transactionData.description
      };
      res.status(201).json(transaction);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la création de la transaction' });
    }
  });

  // Routes pour les logs d'activité
  app.get('/api/admin/activity-logs', authenticateToken, async (req, res) => {
    try {
      const logs = [
        { id: 1, user: 'admin', action: 'Création réservation', timestamp: '2025-07-10T10:30:00Z', details: 'Table 5, 4 personnes' },
        { id: 2, user: 'employe', action: 'Modification commande', timestamp: '2025-07-10T10:15:00Z', details: 'Commande #123' },
        { id: 3, user: 'admin', action: 'Création employé', timestamp: '2025-07-10T09:45:00Z', details: 'Nouvel employé: Jean Dupont' }
      ];
      res.json(logs);
    } catch (error) {
      res.status(500).json([]);
    }
  });

  // Routes pour le calendrier
  app.get("/api/admin/calendar/events", authenticateToken, async (req, res) => {
    try {
      const events = [
        {
          id: 1,
          title: 'Formation équipe',
          start_time: '2025-07-15T10:00:00Z',
          end_time: '2025-07-15T12:00:00Z',
          description: 'Formation sur les nouvelles méthodes de service',
          type: 'formation'
        },
        {
          id: 2,
          title: 'Dégustation café',
          start_time: '2025-07-18T14:00:00Z',
          end_time: '2025-07-18T16:00:00Z',
          description: 'Dégustation de nouveaux cafés avec les clients',
          type: 'événement'
        },
        {
          id: 3,
          title: 'Maintenance équipements',
          start_time: '2025-07-20T08:00:00Z',
          end_time: '2025-07-20T10:00:00Z',
          description: 'Maintenance préventive des machines à café',
          type: 'maintenance'
        }
      ];
      res.json(events);
    } catch (error) {
      res.status(500).json([]);
    }
  });

  app.get("/api/admin/calendar/stats", authenticateToken, async (req, res) => {
    try {
      const stats = {
        totalEvents: 3,
        upcomingEvents: 2,
        completedEvents: 1,
        eventsThisMonth: 3
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ totalEvents: 0, upcomingEvents: 0, completedEvents: 0, eventsThisMonth: 0 });
    }
  });

  // Routes avancées (commentées pour éviter les erreurs d'import)
  // app.use('/api/deliveries', authenticateToken, deliveryRouter);
  // app.use('/api/orders/online', authenticateToken, onlineOrdersRouter);
  // app.use('/api/user', authenticateToken, userProfileRouter);
  // app.use('/api/tables', authenticateToken, tablesRouter);

  return server;
}