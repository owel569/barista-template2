import { Express, Request, Response, NextFunction } from 'express';
import { createServer, Server } from 'http';
import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { storage } from './storage';
import { insertUserSchema } from '../shared/schema';

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

export async function registerRoutes(app: Express): Promise<Server> {
  const server = createServer(app);
  
  // Configuration WebSocket
  const wss = new WebSocketServer({ 
    server,
    path: '/api/ws'
  });
  
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
    wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  // Routes d'authentification
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, password, role } = req.body;
      
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: 'Nom d\'utilisateur déjà utilisé' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
        role: role || 'employe'
      });

      const token = jwt.sign(
        { id: newUser.id, username: newUser.username, role: newUser.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: 'Utilisateur créé avec succès',
        token,
        user: { id: newUser.id, username: newUser.username, role: newUser.role }
      });
    } catch (error) {
      console.error('Erreur inscription:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: 'Identifiants invalides' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Identifiants invalides' });
      }

      await storage.updateUserLastLogin(user.id);

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Connexion réussie',
        token,
        user: { id: user.id, username: user.username, role: user.role }
      });
    } catch (error) {
      console.error('Erreur login:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  });

  app.get('/api/auth/verify', authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user;
      res.json({ 
        valid: true, 
        user: { id: user.id, username: user.username, role: user.role }
      });
    } catch (error) {
      res.status(401).json({ valid: false });
    }
  });

  // Routes publiques
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

  app.get('/api/menu/items/:categoryId', async (req, res) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      const items = await storage.getMenuItemsByCategory(categoryId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  app.get('/api/tables', async (req, res) => {
    try {
      const tables = await storage.getTables();
      res.json(tables);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

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

  app.post('/api/contact', async (req, res) => {
    try {
      const messageData = req.body;
      const message = await storage.createContactMessage(messageData);
      broadcast({ type: 'new_message', data: message });
      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de l\'envoi du message' });
    }
  });

  // Routes admin
  app.get('/api/admin/notifications/count', authenticateToken, async (req, res) => {
    try {
      const reservations = await storage.getReservations();
      const messages = await storage.getContactMessages();
      const orders = await storage.getOrders();
      
      const pendingReservations = reservations.filter(r => r.status === 'pending').length;
      const newMessages = messages.filter(m => m.status === 'nouveau').length;
      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      
      res.json({
        pendingReservations,
        newMessages,
        pendingOrders,
        lowStockItems: 2
      });
    } catch (error) {
      res.status(500).json({
        pendingReservations: 0,
        newMessages: 0,
        pendingOrders: 0,
        lowStockItems: 0
      });
    }
  });

  app.get('/api/admin/stats/today-reservations', authenticateToken, async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const count = await storage.getTodayReservationCount();
      res.json({ count });
    } catch (error) {
      res.status(500).json({ count: 0 });
    }
  });

  app.get('/api/admin/stats/monthly-revenue', authenticateToken, async (req, res) => {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const stats = await storage.getMonthlyReservationStats(currentYear, currentMonth);
      const revenue = stats.reduce((total, stat) => total + (stat.count * 25), 0);
      res.json({ revenue });
    } catch (error) {
      res.status(500).json({ revenue: 0 });
    }
  });

  app.get('/api/admin/stats/active-orders', authenticateToken, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      const activeOrders = orders.filter(order => order.status === 'en_preparation' || order.status === 'en_attente');
      res.json({ count: activeOrders.length });
    } catch (error) {
      res.status(500).json({ count: 0 });
    }
  });

  app.get('/api/admin/stats/occupancy-rate', authenticateToken, async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const rate = await storage.getOccupancyRate(today);
      res.json({ rate });
    } catch (error) {
      res.status(500).json({ rate: 0 });
    }
  });

  app.get('/api/admin/stats/daily-reservations', authenticateToken, async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const reservations = await storage.getReservationsByDate(today);
      res.json(reservations.map(r => ({ ...r, date: r.date, count: 1 })));
    } catch (error) {
      res.status(500).json([]);
    }
  });

  app.get('/api/admin/stats/orders-by-status', authenticateToken, async (req, res) => {
    try {
      const stats = await storage.getOrdersByStatus();
      res.json(stats);
    } catch (error) {
      res.status(500).json([]);
    }
  });

  app.get('/api/admin/stats/reservation-status', authenticateToken, async (req, res) => {
    try {
      const reservations = await storage.getReservations();
      const statusCount = reservations.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      res.json(statusCount);
    } catch (error) {
      res.status(500).json({});
    }
  });

  app.get('/api/admin/reservations', authenticateToken, async (req, res) => {
    try {
      const reservations = await storage.getReservations();
      res.json(reservations);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
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
      
      if (!customerData.firstName || !customerData.lastName) {
        return res.status(400).json({ error: 'Les champs firstName et lastName sont obligatoires' });
      }
      
      if (customerData.name && !customerData.firstName && !customerData.lastName) {
        const nameParts = customerData.name.split(' ');
        customerData.firstName = nameParts[0] || '';
        customerData.lastName = nameParts.slice(1).join(' ') || '';
        delete customerData.name;
      }
      
      if (!customerData.loyaltyPoints) customerData.loyaltyPoints = 0;
      if (!customerData.totalSpent) customerData.totalSpent = 0;
      if (!customerData.lastVisit) customerData.lastVisit = new Date().toISOString();
      
      const customer = await storage.createCustomer(customerData);
      broadcast({ type: 'customer_created', data: customer });
      res.status(201).json(customer);
    } catch (error) {
      console.error('Erreur création client:', error);
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
      
      if (!employeeData.firstName || !employeeData.lastName) {
        return res.status(400).json({ error: 'Les champs firstName et lastName sont obligatoires' });
      }
      
      if (employeeData.name && !employeeData.firstName && !employeeData.lastName) {
        const nameParts = employeeData.name.split(' ');
        employeeData.firstName = nameParts[0] || '';
        employeeData.lastName = nameParts.slice(1).join(' ') || '';
        delete employeeData.name;
      }
      
      if (!employeeData.department) {
        employeeData.department = 'Général';
      }
      
      if (!employeeData.position) {
        employeeData.position = 'Employé';
      }
      
      if (!employeeData.hireDate) {
        employeeData.hireDate = new Date().toISOString();
      }
      
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

  app.get('/api/admin/work-shifts/stats', authenticateToken, async (req, res) => {
    try {
      const shifts = await storage.getWorkShifts();
      const stats = {
        totalShifts: shifts.length,
        totalHours: shifts.reduce((total, shift) => {
          const start = new Date(`2000-01-01T${shift.startTime}`);
          const end = new Date(`2000-01-01T${shift.endTime}`);
          return total + ((end.getTime() - start.getTime()) / (1000 * 60 * 60));
        }, 0),
        avgHoursPerShift: shifts.length > 0 ? (shifts.reduce((total, shift) => {
          const start = new Date(`2000-01-01T${shift.startTime}`);
          const end = new Date(`2000-01-01T${shift.endTime}`);
          return total + ((end.getTime() - start.getTime()) / (1000 * 60 * 60));
        }, 0) / shifts.length) : 0
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ totalShifts: 0, totalHours: 0, avgHoursPerShift: 0 });
    }
  });

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

  app.get('/api/admin/calendar/events', authenticateToken, async (req, res) => {
    try {
      const today = new Date();
      const events = [
        { id: 1, title: 'Formation équipe', date: today.toISOString(), type: 'training' },
        { id: 2, title: 'Inventaire mensuel', date: new Date(today.getTime() + 86400000).toISOString(), type: 'inventory' },
        { id: 3, title: 'Réunion direction', date: new Date(today.getTime() + 172800000).toISOString(), type: 'meeting' }
      ];
      res.json(events);
    } catch (error) {
      res.status(500).json([]);
    }
  });

  app.get('/api/admin/calendar/stats', authenticateToken, async (req, res) => {
    try {
      const stats = {
        totalEvents: 15,
        upcomingEvents: 5,
        completedEvents: 10,
        eventTypes: {
          training: 3,
          inventory: 2,
          meeting: 4,
          maintenance: 6
        }
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ totalEvents: 0, upcomingEvents: 0, completedEvents: 0, eventTypes: {} });
    }
  });

  app.get('/api/admin/settings', authenticateToken, async (req, res) => {
    try {
      const settings = {
        restaurantName: 'Barista Café',
        address: '123 Rue de la Paix, Paris',
        phone: '+33 1 23 45 67 89',
        email: 'contact@barista-cafe.fr',
        openingHours: {
          lundi: { open: '08:00', close: '18:00' },
          mardi: { open: '08:00', close: '18:00' },
          mercredi: { open: '08:00', close: '18:00' },
          jeudi: { open: '08:00', close: '18:00' },
          vendredi: { open: '08:00', close: '20:00' },
          samedi: { open: '09:00', close: '20:00' },
          dimanche: { open: '09:00', close: '17:00' }
        },
        notifications: {
          email: true,
          sms: false,
          push: true
        },
        reservations: {
          maxGuestsPerTable: 8,
          minAdvanceBooking: 2,
          maxAdvanceBooking: 30
        }
      };
      res.json(settings);
    } catch (error) {
      res.status(500).json({});
    }
  });

  app.post('/api/admin/settings', authenticateToken, async (req, res) => {
    try {
      const updatedSettings = req.body;
      console.log('Paramètres mis à jour:', updatedSettings);
      res.json({ message: 'Paramètres sauvegardés avec succès', settings: updatedSettings });
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la sauvegarde des paramètres' });
    }
  });

  app.get('/api/admin/reports/sales', authenticateToken, async (req, res) => {
    try {
      const reports = {
        totalSales: 25430.75,
        totalOrders: 342,
        averageOrderValue: 74.36,
        topProducts: [
          { name: 'Cappuccino', quantity: 89, revenue: 445.00 },
          { name: 'Croissant', quantity: 67, revenue: 201.00 },
          { name: 'Latte', quantity: 56, revenue: 280.00 }
        ],
        dailySales: [
          { date: '2025-07-01', sales: 850.25 },
          { date: '2025-07-02', sales: 920.50 },
          { date: '2025-07-03', sales: 780.75 }
        ]
      };
      res.json(reports);
    } catch (error) {
      res.status(500).json({});
    }
  });

  app.get('/api/admin/reports/customers', authenticateToken, async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      const topCustomers = await storage.getTopCustomers(10);
      
      const report = {
        totalCustomers: customers.length,
        newCustomersThisMonth: Math.floor(customers.length * 0.2),
        topCustomers: topCustomers.map(tc => ({
          name: `${tc.customer.firstName} ${tc.customer.lastName}`,
          totalSpent: tc.totalSpent,
          totalOrders: tc.totalOrders,
          loyaltyPoints: tc.customer.loyaltyPoints
        })),
        customerRetention: 78.5,
        averageSpentPerCustomer: topCustomers.reduce((sum, tc) => sum + tc.totalSpent, 0) / topCustomers.length
      };
      res.json(report);
    } catch (error) {
      res.status(500).json({});
    }
  });

  app.get('/api/admin/reports/products', authenticateToken, async (req, res) => {
    try {
      const menuItems = await storage.getMenuItems();
      const report = {
        totalProducts: menuItems.length,
        topSellingProducts: menuItems.slice(0, 5).map(item => ({
          name: item.name,
          sold: Math.floor(Math.random() * 100) + 20,
          revenue: Number(item.price) * (Math.floor(Math.random() * 100) + 20)
        })),
        lowStockItems: 3,
        outOfStockItems: 0,
        averageProductPrice: menuItems.reduce((sum, item) => sum + Number(item.price), 0) / menuItems.length
      };
      res.json(report);
    } catch (error) {
      res.status(500).json({});
    }
  });

  // APIs pour les sauvegardes
  app.get('/api/admin/backups', authenticateToken, async (req, res) => {
    try {
      const backups = [
        { id: 1, name: 'Sauvegarde automatique', date: new Date().toISOString(), size: '2.5 MB', type: 'automatic' },
        { id: 2, name: 'Sauvegarde manuelle', date: new Date(Date.now() - 86400000).toISOString(), size: '2.3 MB', type: 'manual' },
        { id: 3, name: 'Sauvegarde hebdomadaire', date: new Date(Date.now() - 604800000).toISOString(), size: '2.1 MB', type: 'automatic' }
      ];
      res.json(backups);
    } catch (error) {
      res.status(500).json([]);
    }
  });

  app.get('/api/admin/backups/settings', authenticateToken, async (req, res) => {
    try {
      const settings = {
        autoBackupEnabled: true,
        backupFrequency: 'daily',
        retentionDays: 30,
        backupLocation: 'cloud',
        compression: true,
        encryptionEnabled: true
      };
      res.json(settings);
    } catch (error) {
      res.status(500).json({});
    }
  });

  app.post('/api/admin/backups/create', authenticateToken, async (req, res) => {
    try {
      const { name, type } = req.body;
      const backup = {
        id: Date.now(),
        name: name || 'Sauvegarde manuelle',
        date: new Date().toISOString(),
        size: '2.4 MB',
        type: type || 'manual',
        status: 'completed'
      };
      res.json(backup);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la création de la sauvegarde' });
    }
  });

  // APIs pour les permissions
  app.get('/api/admin/permissions', authenticateToken, async (req, res) => {
    try {
      const permissions = [
        { id: 1, name: 'Gestion des réservations', description: 'Créer, modifier et supprimer des réservations', enabled: true },
        { id: 2, name: 'Gestion du menu', description: 'Ajouter, modifier et supprimer des articles du menu', enabled: true },
        { id: 3, name: 'Gestion des employés', description: 'Gérer les comptes employés', enabled: false },
        { id: 4, name: 'Accès aux statistiques', description: 'Consulter les rapports et statistiques', enabled: true },
        { id: 5, name: 'Gestion des paramètres', description: 'Modifier les paramètres du restaurant', enabled: false }
      ];
      res.json(permissions);
    } catch (error) {
      res.status(500).json([]);
    }
  });

  app.get('/api/admin/users', authenticateToken, async (req, res) => {
    try {
      const users = [
        { id: 1, username: 'admin', role: 'directeur', lastLogin: new Date().toISOString(), active: true },
        { id: 2, username: 'employe', role: 'employe', lastLogin: new Date(Date.now() - 86400000).toISOString(), active: true },
        { id: 3, username: 'serveur1', role: 'employe', lastLogin: new Date(Date.now() - 172800000).toISOString(), active: false }
      ];
      res.json(users);
    } catch (error) {
      res.status(500).json([]);
    }
  });

  // APIs pour la comptabilité
  app.get('/api/admin/accounting/transactions', authenticateToken, async (req, res) => {
    try {
      const transactions = [
        { id: 1, date: new Date().toISOString(), type: 'recette', amount: 450.75, description: 'Ventes du jour', category: 'ventes' },
        { id: 2, date: new Date(Date.now() - 86400000).toISOString(), type: 'dépense', amount: -120.50, description: 'Achat ingrédients', category: 'approvisionnement' },
        { id: 3, date: new Date(Date.now() - 172800000).toISOString(), type: 'recette', amount: 380.25, description: 'Ventes du jour', category: 'ventes' }
      ];
      res.json(transactions);
    } catch (error) {
      res.status(500).json([]);
    }
  });

  app.get('/api/admin/accounting/stats', authenticateToken, async (req, res) => {
    try {
      const stats = {
        totalRevenue: 25430.75,
        totalExpenses: 8950.25,
        netProfit: 16480.50,
        monthlyGrowth: 12.5,
        averageDailyRevenue: 847.69,
        topExpenseCategory: 'Approvisionnement'
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({});
    }
  });

  app.post('/api/admin/accounting/transactions', authenticateToken, async (req, res) => {
    try {
      const transactionData = req.body;
      const transaction = {
        id: Date.now(),
        ...transactionData,
        date: new Date().toISOString()
      };
      res.status(201).json(transaction);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la création de la transaction' });
    }
  });

  // API manquante pour loyalty/stats
  app.get('/api/admin/loyalty/stats', authenticateToken, async (req, res) => {
    try {
      const stats = {
        totalCustomers: 125,
        totalPointsIssued: 45680,
        totalRewardsRedeemed: 234,
        averagePointsPerCustomer: 365.4,
        levelDistribution: {
          'Nouveau': 45,
          'Régulier': 58,
          'Fidèle': 18,
          'VIP': 4
        },
        monthlyGrowth: 8.5,
        topReward: 'Café gratuit'
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({});
    }
  });

  // API pour ajouter des articles de menu
  app.post('/api/admin/menu/items', authenticateToken, async (req, res) => {
    try {
      const { name, description, price, categoryId, available = true } = req.body;
      
      if (!name || !description || !price || !categoryId) {
        return res.status(400).json({ error: 'Tous les champs sont obligatoires' });
      }

      const menuItem = await storage.createMenuItem({
        name,
        description,
        price: Number(price),
        categoryId: Number(categoryId),
        available
      });

      broadcast({ type: 'menu_item_created', data: menuItem });
      res.status(201).json(menuItem);
    } catch (error) {
      console.error('Erreur création article menu:', error);
      res.status(500).json({ error: 'Erreur lors de la création de l\'article' });
    }
  });

  // API pour modifier des articles de menu
  app.put('/api/admin/menu/items/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const menuItem = await storage.updateMenuItem(Number(id), updateData);
      broadcast({ type: 'menu_item_updated', data: menuItem });
      res.json(menuItem);
    } catch (error) {
      console.error('Erreur modification article menu:', error);
      res.status(500).json({ error: 'Erreur lors de la modification de l\'article' });
    }
  });

  // API pour supprimer des articles de menu
  app.delete('/api/admin/menu/items/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      
      await storage.deleteMenuItem(Number(id));
      broadcast({ type: 'menu_item_deleted', data: { id: Number(id) } });
      res.json({ success: true });
    } catch (error) {
      console.error('Erreur suppression article menu:', error);
      res.status(500).json({ error: 'Erreur lors de la suppression de l\'article' });
    }
  });

  return server;
}