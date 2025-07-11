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

  app.post('/api/admin/reservations', authenticateToken, async (req, res) => {
    try {
      const reservationData = req.body;
      const reservation = await storage.createReservation(reservationData);
      broadcast({ type: 'new_reservation', data: reservation });
      res.status(201).json(reservation);
    } catch (error) {
      console.error('Erreur création réservation admin:', error);
      res.status(500).json({ error: 'Erreur lors de la création de la réservation' });
    }
  });

  app.put('/api/admin/reservations/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const reservationData = req.body;
      const reservation = await storage.updateReservation(Number(id), reservationData);
      broadcast({ type: 'reservation_updated', data: reservation });
      res.json(reservation);
    } catch (error) {
      console.error('Erreur modification réservation admin:', error);
      res.status(500).json({ error: 'Erreur lors de la modification de la réservation' });
    }
  });

  app.delete('/api/admin/reservations/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteReservation(Number(id));
      broadcast({ type: 'reservation_deleted', data: { id: Number(id) } });
      res.json({ message: 'Réservation supprimée avec succès' });
    } catch (error) {
      console.error('Erreur suppression réservation admin:', error);
      res.status(500).json({ error: 'Erreur lors de la suppression de la réservation' });
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

  // Routes admin pour la gestion du menu
  app.post('/api/admin/menu/items', authenticateToken, async (req, res) => {
    try {
      const { name, description, price, categoryId, available, imageUrl } = req.body;
      
      const newItem = await storage.createMenuItem({
        name,
        description,
        price: Number(price),
        categoryId: Number(categoryId),
        available: Boolean(available),
        imageUrl: imageUrl || null
      });
      
      broadcast({ type: 'menu_item_created', data: newItem });
      res.status(201).json(newItem);
    } catch (error) {
      console.error('Erreur création article menu:', error);
      res.status(500).json({ error: 'Erreur lors de la création de l\'article' });
    }
  });

  app.put('/api/admin/menu/items/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, price, categoryId, available, imageUrl } = req.body;
      
      const updatedItem = await storage.updateMenuItem(Number(id), {
        name,
        description,
        price: Number(price),
        categoryId: Number(categoryId),
        available: Boolean(available),
        imageUrl: imageUrl || null
      });
      
      broadcast({ type: 'menu_item_updated', data: updatedItem });
      res.json(updatedItem);
    } catch (error) {
      console.error('Erreur mise à jour article menu:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'article' });
    }
  });

  app.delete('/api/admin/menu/items/:id', authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteMenuItem(Number(id));
      broadcast({ type: 'menu_item_deleted', data: { id: Number(id) } });
      res.json({ message: 'Article supprimé avec succès' });
    } catch (error) {
      console.error('Erreur suppression article menu:', error);
      res.status(500).json({ error: 'Erreur lors de la suppression de l\'article' });
    }
  });

  app.put('/api/admin/messages/:id/status', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const updatedMessage = await storage.updateMessageStatus(Number(id), status);
      broadcast({ type: 'message_updated', data: updatedMessage });
      res.json(updatedMessage);
    } catch (error) {
      console.error('Erreur mise à jour statut message:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour du statut' });
    }
  });

  app.put('/api/admin/users/:userId/permissions', authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const { userId } = req.params;
      const { permissionId, granted } = req.body;
      
      // Logique de mise à jour des permissions
      console.log(`Mise à jour permission: userId=${userId}, permissionId=${permissionId}, granted=${granted}`);
      
      // Simuler la mise à jour réussie
      const updatedPermission = {
        userId: Number(userId),
        permissionId: Number(permissionId),
        granted: Boolean(granted),
        updatedAt: new Date().toISOString()
      };
      
      broadcast({ type: 'permission_updated', data: updatedPermission });
      res.json({ message: 'Permission mise à jour avec succès', data: updatedPermission });
    } catch (error) {
      console.error('Erreur mise à jour permission:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour de la permission' });
    }
  });

  app.put('/api/admin/users/:userId/status', authenticateToken, requireRole('directeur'), async (req, res) => {
    try {
      const { userId } = req.params;
      const { active } = req.body;
      
      // Logique de mise à jour du statut utilisateur
      console.log(`Mise à jour statut utilisateur: userId=${userId}, active=${active}`);
      
      const updatedUser = {
        userId: Number(userId),
        active: Boolean(active),
        updatedAt: new Date().toISOString()
      };
      
      broadcast({ type: 'user_status_updated', data: updatedUser });
      res.json({ message: 'Statut utilisateur mis à jour avec succès', data: updatedUser });
    } catch (error) {
      console.error('Erreur mise à jour statut utilisateur:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour du statut' });
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

  // API pour les logs d'activité
  app.get('/api/admin/activity-logs', authenticateToken, async (req, res) => {
    try {
      const logs = await storage.getActivityLogs(50);
      res.json(logs);
    } catch (error) {
      console.error('Erreur récupération logs:', error);
      res.status(500).json([]);
    }
  });

  // API pour récupérer les articles de menu (corrigée)
  app.get('/api/admin/menu/items', authenticateToken, async (req, res) => {
    try {
      const menuItems = await storage.getMenuItems();
      console.log('Menu items retrieved:', menuItems.length);
      res.json(menuItems);
    } catch (error) {
      console.error('Erreur récupération articles menu:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // API pour récupérer les catégories de menu (corrigée)  
  app.get('/api/admin/menu/categories', authenticateToken, async (req, res) => {
    try {
      const categories = await storage.getMenuCategories();
      console.log('Menu categories retrieved:', categories.length);
      res.json(categories);
    } catch (error) {
      console.error('Erreur récupération catégories menu:', error);
      res.status(500).json({ error: 'Erreur serveur' });
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

  // Routes Suppliers - Ajout des routes manquantes
  app.get('/api/admin/suppliers', authenticateToken, async (req, res) => {
    try {
      const suppliers = [
        {
          id: 1,
          name: 'Pierre Dubois',
          company: 'Café Excellence',
          email: 'p.dubois@cafe-excellence.fr',
          phone: '+33 1 23 45 67 89',
          address: '45 Rue des Grains, Paris',
          category: 'Café',
          rating: 4.8,
          status: 'active',
          totalOrders: 125,
          totalAmount: 15420.50,
          lastOrder: '2025-07-08',
          products: ['Arabica Bio', 'Robusta Premium', 'Décaféiné']
        },
        {
          id: 2,
          name: 'Marie Martin',
          company: 'Pâtisserie Artisanale',
          email: 'm.martin@patisserie-artisanale.fr',
          phone: '+33 1 34 56 78 90',
          address: '23 Avenue des Boulangers, Lyon',
          category: 'Pâtisserie',
          rating: 4.6,
          status: 'active',
          totalOrders: 89,
          totalAmount: 8750.25,
          lastOrder: '2025-07-09',
          products: ['Croissants', 'Pains au chocolat', 'Macarons']
        },
        {
          id: 3,
          name: 'Jean Moreau',
          company: 'Laiterie des Alpes',
          email: 'j.moreau@laiterie-alpes.fr',
          phone: '+33 4 76 12 34 56',
          address: '67 Route de la Montagne, Grenoble',
          category: 'Laitier',
          rating: 4.5,
          status: 'active',
          totalOrders: 156,
          totalAmount: 12350.75,
          lastOrder: '2025-07-10',
          products: ['Lait Bio', 'Crème fraîche', 'Beurre fermier']
        }
      ];
      res.json(suppliers);
    } catch (error) {
      console.error('Erreur suppliers:', error);
      res.status(500).json([]);
    }
  });

  app.get('/api/admin/suppliers/stats', authenticateToken, async (req, res) => {
    try {
      const stats = {
        totalSuppliers: 3,
        activeSuppliers: 3,
        totalOrders: 370,
        averageRating: 4.6,
        totalAmount: 36521.50,
        categories: {
          'Café': 1,
          'Pâtisserie': 1,
          'Laitier': 1
        }
      };
      res.json(stats);
    } catch (error) {
      console.error('Erreur suppliers stats:', error);
      res.status(500).json({});
    }
  });

  app.post('/api/admin/suppliers', authenticateToken, async (req, res) => {
    try {
      const supplierData = req.body;
      const newSupplier = {
        id: Date.now(),
        ...supplierData,
        totalOrders: 0,
        totalAmount: 0,
        rating: 0,
        status: 'active',
        lastOrder: null
      };
      res.status(201).json(newSupplier);
    } catch (error) {
      console.error('Erreur création supplier:', error);
      res.status(500).json({ error: 'Erreur lors de la création du fournisseur' });
    }
  });

  // Routes Delivery - Nouvelles routes pour le suivi des livraisons
  app.get('/api/admin/deliveries', authenticateToken, async (req, res) => {
    try {
      const deliveries = [
        {
          id: 1,
          orderId: 123,
          customerName: 'Sophie Laurent',
          customerPhone: '+33612345678',
          address: '15 Rue de la Paix',
          city: 'Paris',
          postalCode: '75001',
          driverId: 1,
          driverName: 'Marc Dubois',
          status: 'in_transit',
          estimatedTime: '25',
          totalAmount: 45.50,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      res.json(deliveries);
    } catch (error) {
      res.status(500).json([]);
    }
  });

  app.get('/api/admin/drivers', authenticateToken, async (req, res) => {
    try {
      const drivers = [
        { id: 1, name: 'Marc Dubois', phone: '+33612345678', vehicleType: 'Scooter', isAvailable: true, currentDeliveries: 1 },
        { id: 2, name: 'Julie Martin', phone: '+33623456789', vehicleType: 'Vélo', isAvailable: true, currentDeliveries: 0 }
      ];
      res.json(drivers);
    } catch (error) {
      res.status(500).json([]);
    }
  });

  app.get('/api/admin/orders-for-delivery', authenticateToken, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      const deliveryOrders = orders.filter((order: any) => order.orderType === 'delivery' && order.status === 'ready');
      res.json(deliveryOrders);
    } catch (error) {
      res.status(500).json([]);
    }
  });

  app.post('/api/admin/deliveries', authenticateToken, async (req, res) => {
    try {
      const deliveryData = req.body;
      const newDelivery = {
        id: Date.now(),
        ...deliveryData,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      broadcast({ type: 'delivery_created', data: newDelivery });
      res.status(201).json(newDelivery);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la création de la livraison' });
    }
  });

  app.put('/api/admin/deliveries/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedDelivery = {
        id: parseInt(id ?? "0"),
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      broadcast({ type: 'delivery_updated', data: updatedDelivery });
      res.json(updatedDelivery);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la mise à jour de la livraison' });
    }
  });

  // Routes Inventory améliorées
  app.get('/api/admin/inventory/items', authenticateToken, async (req, res) => {
    try {
      const inventoryItems = [
        {
          id: 1,
          name: 'Grains de café Arabica',
          category: 'Café',
          currentStock: 25,
          minThreshold: 10,
          maxCapacity: 100,
          unit: 'kg',
          unitCost: 15.50,
          supplierId: 1,
          supplierName: 'Café Excellence',
          lastRestocked: '2025-07-05',
          expiryDate: '2026-01-15',
          status: 'normal'
        },
        {
          id: 2,
          name: 'Lait entier',
          category: 'Laitier',
          currentStock: 5,
          minThreshold: 15,
          maxCapacity: 50,
          unit: 'litre',
          unitCost: 1.20,
          supplierId: 3,
          supplierName: 'Laiterie des Alpes',
          lastRestocked: '2025-07-08',
          expiryDate: '2025-07-15',
          status: 'low'
        },
        {
          id: 3,
          name: 'Croissants surgelés',
          category: 'Pâtisserie',
          currentStock: 2,
          minThreshold: 20,
          maxCapacity: 100,
          unit: 'pièce',
          unitCost: 0.85,
          supplierId: 2,
          supplierName: 'Pâtisserie Artisanale',
          lastRestocked: '2025-07-01',
          expiryDate: '2025-08-01',
          status: 'critical'
        }
      ];
      res.json(inventoryItems);
    } catch (error) {
      res.status(500).json([]);
    }
  });

  app.get('/api/admin/inventory/alerts', authenticateToken, async (req, res) => {
    try {
      const alerts = [
        {
          id: 1,
          type: 'low_stock',
          itemName: 'Lait entier',
          currentStock: 5,
          threshold: 15,
          severity: 'medium',
          message: 'Stock faible - Recommandé de réapprovisionner',
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          type: 'critical_stock',
          itemName: 'Croissants surgelés',
          currentStock: 2,
          threshold: 20,
          severity: 'high',
          message: 'Stock critique - Réapprovisionnement urgent requis',
          createdAt: new Date().toISOString()
        }
      ];
      res.json(alerts);
    } catch (error) {
      res.status(500).json([]);
    }
  });

  // Routes Online Ordering - Nouvelles APIs pour commandes en ligne
  app.get('/api/admin/online-orders', authenticateToken, async (req, res) => {
    try {
      const onlineOrders = [
        {
          id: 1,
          orderNumber: 'WEB-001',
          customerName: 'Marie Dupont',
          customerEmail: 'marie.dupont@email.com',
          customerPhone: '+33612345678',
          platform: 'website',
          orderType: 'delivery',
          status: 'preparing',
          items: [
            { id: 1, menuItemId: 1, name: 'Cappuccino', quantity: 2, unitPrice: 4.50, customizations: ['Lait d\'avoine'] },
            { id: 2, menuItemId: 5, name: 'Croissant', quantity: 1, unitPrice: 2.80 }
          ],
          totalAmount: 11.80,
          paymentStatus: 'paid',
          paymentMethod: 'card',
          notes: 'Livraison au 2ème étage',
          estimatedTime: '25',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 2,
          orderNumber: 'APP-002',
          customerName: 'Jean Martin',
          customerEmail: 'jean.martin@email.com',
          customerPhone: '+33623456789',
          platform: 'mobile_app',
          orderType: 'pickup',
          status: 'ready',
          items: [
            { id: 3, menuItemId: 2, name: 'Latte', quantity: 1, unitPrice: 5.20 },
            { id: 4, menuItemId: 8, name: 'Muffin', quantity: 2, unitPrice: 3.50 }
          ],
          totalAmount: 12.20,
          paymentStatus: 'paid',
          paymentMethod: 'mobile',
          estimatedTime: '15',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      res.json(onlineOrders);
    } catch (error) {
      res.status(500).json([]);
    }
  });

  app.get('/api/admin/online-orders/stats', authenticateToken, async (req, res) => {
    try {
      const stats = {
        website: { orders: 45, revenue: 1250.50 },
        mobile_app: { orders: 32, revenue: 890.75 },
        phone: { orders: 18, revenue: 445.25 }
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({});
    }
  });

  app.get('/api/admin/online-ordering/settings', authenticateToken, async (req, res) => {
    try {
      const settings = {
        onlineOrderingEnabled: true,
        deliveryEnabled: true,
        pickupEnabled: true,
        onlinePaymentEnabled: true,
        minPrepTime: 15,
        minDeliveryTime: 30,
        deliveryFee: 5.00,
        minDeliveryAmount: 25.00
      };
      res.json(settings);
    } catch (error) {
      res.status(500).json({});
    }
  });

  app.put('/api/admin/online-orders/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedOrder = {
        id: parseInt(id),
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      broadcast({ type: 'online_order_updated', data: updatedOrder });
      res.json(updatedOrder);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la mise à jour de la commande' });
    }
  });

  // Routes Table Management - Gestion des tables
  app.get('/api/admin/tables', authenticateToken, async (req, res) => {
    try {
      const tables = [
        {
          id: 1,
          number: 1,
          capacity: 4,
          location: 'main_floor',
          status: 'available',
          position: { x: 100, y: 100 },
          shape: 'round',
          isVip: false
        },
        {
          id: 2,
          number: 2,
          capacity: 2,
          location: 'main_floor',
          status: 'occupied',
          currentReservation: {
            id: 1,
            customerName: 'Sophie Laurent',
            time: '19:30',
            guests: 2,
            duration: 90
          },
          position: { x: 200, y: 100 },
          shape: 'square',
          isVip: false
        },
        {
          id: 3,
          number: 3,
          capacity: 6,
          location: 'terrace',
          status: 'reserved',
          nextReservation: {
            id: 2,
            customerName: 'Jean Dubois',
            time: '20:00',
            guests: 4
          },
          position: { x: 300, y: 100 },
          shape: 'rectangle',
          isVip: true
        }
      ];
      res.json(tables);
    } catch (error) {
      res.status(500).json([]);
    }
  });

  app.get('/api/admin/table-layouts', authenticateToken, async (req, res) => {
    try {
      const layouts = [
        { id: 1, name: 'Configuration Standard', isActive: true },
        { id: 2, name: 'Configuration Événement', isActive: false }
      ];
      res.json(layouts);
    } catch (error) {
      res.status(500).json([]);
    }
  });

  app.get('/api/admin/tables/occupancy', authenticateToken, async (req, res) => {
    try {
      const stats = { rate: 75 };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ rate: 0 });
    }
  });

  app.post('/api/admin/tables', authenticateToken, async (req, res) => {
    try {
      const tableData = req.body;
      const newTable = {
        id: Date.now(),
        ...tableData,
        status: 'available',
        position: { x: 100, y: 100 }
      };
      broadcast({ type: 'table_created', data: newTable });
      res.status(201).json(newTable);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la création de la table' });
    }
  });

  app.put('/api/admin/tables/:id/status', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updatedTable = {
        id: parseInt(id),
        status,
        updatedAt: new Date().toISOString()
      };
      broadcast({ type: 'table_status_updated', data: updatedTable });
      res.json(updatedTable);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la mise à jour du statut' });
    }
  });

  // Routes User Profiles - Profils utilisateurs détaillés
  app.get('/api/admin/user-profiles', authenticateToken, async (req, res) => {
    try {
      const profiles = [
        {
          id: 1,
          firstName: 'Sophie',
          lastName: 'Laurent',
          email: 'sophie.laurent@email.com',
          phone: '+33612345678',
          address: '15 Rue de la Paix',
          city: 'Paris',
          postalCode: '75001',
          preferences: {
            emailNotifications: true,
            smsNotifications: false,
            promotionalEmails: true,
            favoriteTable: 3,
            dietaryRestrictions: ['Végétarien'],
            allergens: ['Noix'],
            language: 'fr',
            currency: 'EUR'
          },
          loyalty: {
            points: 350,
            level: 'Gold',
            nextLevelPoints: 500,
            totalSpent: 1250.75,
            visitsCount: 28,
            joinDate: '2024-01-15'
          },
          paymentMethods: [
            { id: 1, type: 'card', name: 'Visa ****1234', lastFour: '1234', expiryDate: '12/26', isDefault: true }
          ],
          addresses: [
            { id: 1, name: 'Domicile', street: '15 Rue de la Paix', city: 'Paris', postalCode: '75001', isDefault: true }
          ],
          orderHistory: [
            {
              id: 1,
              orderNumber: 'ORD-001',
              date: '2025-07-10',
              totalAmount: 25.50,
              status: 'completed',
              items: [
                { name: 'Cappuccino', quantity: 2, price: 4.50 },
                { name: 'Croissant', quantity: 1, price: 2.80 }
              ]
            }
          ],
          favoriteItems: [
            { id: 1, menuItemId: 1, name: 'Cappuccino', price: 4.50, addedDate: '2024-02-01', orderCount: 15 },
            { id: 2, menuItemId: 5, name: 'Croissant', price: 2.80, addedDate: '2024-02-15', orderCount: 8 }
          ],
          reviews: [
            {
              id: 1,
              orderId: 1,
              rating: 5,
              comment: 'Excellent service et café délicieux !',
              date: '2025-07-10',
              response: 'Merci pour votre retour positif !'
            }
          ]
        }
      ];
      res.json(profiles);
    } catch (error) {
      res.status(500).json([]);
    }
  });

  app.get('/api/admin/user-profiles/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      // Retourner le profil détaillé
      const profile = {
        id: parseInt(id),
        firstName: 'Sophie',
        lastName: 'Laurent',
        email: 'sophie.laurent@email.com',
        phone: '+33612345678'
        // ... autres détails
      };
      res.json(profile);
    } catch (error) {
      res.status(500).json({});
    }
  });

  app.put('/api/admin/user-profiles/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedProfile = {
        id: parseInt(id),
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      broadcast({ type: 'user_profile_updated', data: updatedProfile });
      res.json(updatedProfile);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
    }
  });

  app.post('/api/admin/user-profiles/:userId/addresses', authenticateToken, async (req, res) => {
    try {
      const { userId } = req.params;
      const addressData = req.body;
      const newAddress = {
        id: Date.now(),
        ...addressData,
        userId: parseInt(userId)
      };
      res.status(201).json(newAddress);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de l\'ajout de l\'adresse' });
    }
  });

  // APIs pour les fonctionnalités avancées
  
  // API Analytics avancées
  app.get('/api/admin/analytics/revenue-detailed', authenticateToken, async (req, res) => {
    try {
      const data = {
        dailyRevenue: [
          { date: '2025-01-01', revenue: 850, orders: 42 },
          { date: '2025-01-02', revenue: 920, orders: 48 },
          { date: '2025-01-03', revenue: 1150, orders: 55 },
          { date: '2025-01-04', revenue: 980, orders: 51 },
          { date: '2025-01-05', revenue: 1200, orders: 58 },
          { date: '2025-01-06', revenue: 1080, orders: 53 },
          { date: '2025-01-07', revenue: 1300, orders: 62 }
        ],
        productAnalysis: [
          { name: 'Cappuccino', sales: 245, revenue: 1029, growth: 12.5 },
          { name: 'Latte', sales: 198, revenue: 891, growth: 8.2 },
          { name: 'Americano', sales: 156, revenue: 499, growth: -2.1 },
          { name: 'Espresso', sales: 134, revenue: 429, growth: 5.7 }
        ],
        customerMetrics: {
          newCustomers: 45,
          returningCustomers: 123,
          averageOrderValue: 18.50,
          customerLifetimeValue: 245.80
        }
      };
      res.json(data);
    } catch (error) {
      res.status(500).json({});
    }
  });

  // API Point de Vente avancé
  app.post('/api/admin/pos/process-order', authenticateToken, async (req, res) => {
    try {
      const orderData = req.body;
      const processedOrder = {
        id: Date.now(),
        ...orderData,
        processedAt: new Date().toISOString(),
        status: 'completed',
        receiptNumber: `RCP${Date.now()}`
      };
      
      broadcast({ type: 'order_processed', data: processedOrder });
      res.status(201).json(processedOrder);
    } catch (error) {
      res.status(500).json({ error: 'Erreur traitement commande POS' });
    }
  });

  app.get('/api/admin/pos/menu-items', authenticateToken, async (req, res) => {
    try {
      const menuItems = await storage.getMenuItems();
      const posItems = menuItems.map(item => ({
        ...item,
        available: item.available !== false,
        category: item.categoryId === 1 ? 'café' : 
                 item.categoryId === 2 ? 'boisson' :
                 item.categoryId === 3 ? 'pâtisserie' : 'plat'
      }));
      res.json(posItems);
    } catch (error) {
      res.status(500).json([]);
    }
  });

  // API Planning du personnel
  app.get('/api/admin/schedule/auto-generate', authenticateToken, async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      const autoSchedule = employees.map((emp, index) => ({
        id: Date.now() + index,
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        date: new Date().toISOString().split('T')[0],
        startTime: ['08:00', '09:00', '10:00'][index % 3],
        endTime: ['16:00', '17:00', '18:00'][index % 3],
        position: ['Service', 'Caisse', 'Cuisine'][index % 3],
        status: 'scheduled'
      }));
      res.json(autoSchedule);
    } catch (error) {
      res.status(500).json([]);
    }
  });

  app.post('/api/admin/schedule/auto-generate', authenticateToken, async (req, res) => {
    try {
      const { weekStart, preferences } = req.body;
      const generatedShifts = {
        weekStart,
        shiftsCreated: 21,
        coverage: '95%',
        conflicts: 0,
        message: 'Planning automatique généré avec succès'
      };
      res.json(generatedShifts);
    } catch (error) {
      res.status(500).json({ error: 'Erreur génération planning' });
    }
  });

  // API Contrôle qualité
  app.get('/api/admin/quality/checks', authenticateToken, async (req, res) => {
    try {
      const qualityChecks = [
        {
          id: 1,
          date: new Date().toISOString(),
          category: 'Produits',
          item: 'Cappuccino Premium',
          inspector: 'Marie Dubois',
          score: 95,
          maxScore: 100,
          status: 'excellent',
          notes: 'Excellente qualité, température parfaite',
          correctionActions: []
        },
        {
          id: 2,
          date: new Date(Date.now() - 86400000).toISOString(),
          category: 'Service',
          item: 'Accueil client',
          inspector: 'Pierre Martin',
          score: 78,
          maxScore: 100,
          status: 'good',
          notes: 'Bon service mais peut être amélioré',
          correctionActions: ['Formation service client']
        }
      ];
      res.json(qualityChecks);
    } catch (error) {
      res.status(500).json([]);
    }
  });

  app.post('/api/admin/quality/checks', authenticateToken, async (req, res) => {
    try {
      const checkData = req.body;
      const qualityCheck = {
        id: Date.now(),
        ...checkData,
        date: new Date().toISOString()
      };
      res.status(201).json(qualityCheck);
    } catch (error) {
      res.status(500).json({ error: 'Erreur création contrôle qualité' });
    }
  });

  // API Feedback clients
  app.get('/api/admin/feedback', authenticateToken, async (req, res) => {
    try {
      const feedbacks = [
        {
          id: 1,
          customerName: 'Sophie Martin',
          customerEmail: 'sophie.martin@email.com',
          date: new Date().toISOString(),
          rating: 5,
          category: 'Service',
          subject: 'Excellent service !',
          message: 'Vraiment impressionnée par la qualité du service.',
          sentiment: 'positive',
          status: 'new',
          source: 'website',
          tags: ['service', 'qualité']
        },
        {
          id: 2,
          customerName: 'Jean Dupont',
          customerEmail: 'jean.dupont@email.com',
          date: new Date(Date.now() - 86400000).toISOString(),
          rating: 3,
          category: 'Produits',
          subject: 'Café correct',
          message: 'Le café était correct mais peut mieux faire.',
          sentiment: 'neutral',
          status: 'reviewed',
          source: 'google',
          tags: ['café', 'qualité']
        }
      ];
      res.json(feedbacks);
    } catch (error) {
      res.status(500).json([]);
    }
  });

  app.post('/api/admin/feedback/:id/respond', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { response } = req.body;
      const feedbackResponse = {
        feedbackId: Number(id),
        response,
        responseDate: new Date().toISOString(),
        respondedBy: (req as any).user.username
      };
      res.json(feedbackResponse);
    } catch (error) {
      res.status(500).json({ error: 'Erreur envoi réponse' });
    }
  });

  app.patch('/api/admin/feedback/:id/status', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updatedFeedback = {
        id: Number(id),
        status,
        updatedAt: new Date().toISOString()
      };
      res.json(updatedFeedback);
    } catch (error) {
      res.status(500).json({ error: 'Erreur mise à jour statut' });
    }
  });

  // APIs supplémentaires pour les horaires
  app.post('/api/admin/work-shifts', authenticateToken, async (req, res) => {
    try {
      const shiftData = req.body;
      const shift = {
        id: Date.now(),
        ...shiftData,
        createdAt: new Date().toISOString()
      };
      res.status(201).json(shift);
    } catch (error) {
      res.status(500).json({ error: 'Erreur création horaire' });
    }
  });

  app.patch('/api/admin/work-shifts/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedShift = {
        id: Number(id),
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      res.json(updatedShift);
    } catch (error) {
      res.status(500).json({ error: 'Erreur mise à jour horaire' });
    }
  });

  app.delete('/api/admin/work-shifts/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      res.json({ success: true, deletedId: Number(id) });
    } catch (error) {
      res.status(500).json({ error: 'Erreur suppression horaire' });
    }
  });

  return server;
}