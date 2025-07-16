import { Express, Request, Response, NextFunction } from 'express';
import { createServer, Server } from 'http';
import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { storage } from './storage';
import { insertUserSchema } from '../shared/schema';
import { validateBody } from './middleware/validation';
import { errorHandler, asyncHandler } from './middleware/error-handler';
import { loginSchema, registerSchema, reservationSchema, customerSchema, employeeSchema, menuItemSchema } from './validation-schemas';

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
    return next();
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

  // Broadcast function for WebSocket
  const broadcast = (data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  // Routes d'authentification
  app.post('/api/auth/register', validateBody(registerSchema), asyncHandler(async (req: Request, res: Response) => {
    const { username, password, role } = req.body;

    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: "Nom d'utilisateur déjà utilisé" });
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
  }));

  // Route de connexion
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: "Nom d'utilisateur et mot de passe requis"
        });
      }

      // Utilisateur admin par défaut
      if (username === 'admin' && password === 'admin123') {
        const token = jwt.sign(
          { id: 1, username: 'admin', role: 'directeur' },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        return res.json({
          success: true,
          message: 'Connexion admin réussie',
          token,
          user: { id: 1, username: 'admin', role: 'directeur' }
        });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Identifiants invalides'
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Identifiants invalides'
        });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        message: 'Connexion réussie',
        token,
        user: { id: user.id, username: user.username, role: user.role }
      });
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  });

  // Routes API de base
  app.get('/api/menu', async (req, res) => {
    try {
      const categories = await storage.getMenuCategories();
      const items = await storage.getMenuItems();
      
      const menuWithCategories = categories.map(category => ({
        ...category,
        items: items.filter(item => item.categoryId === category.id)
      }));

      res.json(menuWithCategories);
    } catch (error) {
      console.error('Erreur lors de la récupération du menu:', error);
      res.status(500).json([]);
    }
  });

  app.get('/api/menu/categories', async (req, res) => {
    try {
      const categories = await storage.getMenuCategories();
      res.json(categories);
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      res.status(500).json([]);
    }
  });

  app.get('/api/menu/items', async (req, res) => {
    try {
      const items = await storage.getMenuItems();
      res.json(items);
    } catch (error) {
      console.error('Erreur lors de la récupération des éléments du menu:', error);
      res.status(500).json([]);
    }
  });

  app.get('/api/tables', async (req, res) => {
    try {
      const tables = await storage.getTables();
      res.json(tables);
    } catch (error) {
      console.error('Erreur lors de la récupération des tables:', error);
      res.status(500).json([]);
    }
  });

  app.post('/api/reservations', validateBody(reservationSchema), asyncHandler(async (req: Request, res: Response) => {
    const reservationData = req.body;
    const reservation = await storage.createReservation(reservationData);
    broadcast({ type: 'new_reservation', data: reservation });
    res.status(201).json(reservation);
  }));

  app.post('/api/contact', async (req, res) => {
    try {
      const messageData = req.body;
      const message = await storage.createContactMessage(messageData);
      broadcast({ type: 'new_message', data: message });
      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de l'envoi du message" });
    }
  });

  // Route d'initialisation
  app.post('/api/init', async (req, res) => {
    try {
      console.log('🔄 Initialisation de la base de données...');
      
      // Créer les catégories par défaut
      const categories = [
        { name: 'Cafés', slug: 'cafes', description: 'Nos cafés artisanaux' },
        { name: 'Thés', slug: 'thes', description: 'Sélection de thés premium' },
        { name: 'Pâtisseries', slug: 'patisseries', description: 'Pâtisseries fraîches du jour' },
        { name: 'Boissons Froides', slug: 'boissons-froides', description: 'Boissons rafraîchissantes' }
      ];

      for (const category of categories) {
        try {
          await storage.createMenuCategory(category);
        } catch (error) {
          console.log('Catégorie existe déjà:', category.name);
        }
      }

      // Créer des éléments de menu par défaut
      const menuItems = [
        { name: 'Espresso', description: 'Café italien traditionnel', price: 2.50, categoryId: 1, available: true },
        { name: 'Cappuccino', description: 'Espresso avec mousse de lait', price: 3.50, categoryId: 1, available: true },
        { name: 'Latte', description: 'Café au lait crémeux', price: 4.00, categoryId: 1, available: true },
        { name: 'Thé Earl Grey', description: 'Thé noir aromatisé bergamote', price: 3.00, categoryId: 2, available: true },
        { name: 'Croissant', description: 'Viennoiserie française', price: 2.00, categoryId: 3, available: true },
        { name: 'Muffin Myrtille', description: 'Muffin aux myrtilles fraîches', price: 3.50, categoryId: 3, available: true },
        { name: 'Smoothie Mangue', description: 'Smoothie à la mangue', price: 5.00, categoryId: 4, available: true },
        { name: 'Limonade', description: 'Limonade artisanale', price: 3.50, categoryId: 4, available: true }
      ];

      for (const item of menuItems) {
        try {
          await storage.createMenuItem(item);
        } catch (error) {
          console.log('Élément existe déjà:', item.name);
        }
      }

      // Créer des tables par défaut
      const tables = [
        { number: 1, capacity: 2, status: 'available', location: 'Terrasse' },
        { number: 2, capacity: 4, status: 'available', location: 'Intérieur' },
        { number: 3, capacity: 6, status: 'available', location: 'Salon' },
        { number: 4, capacity: 2, status: 'available', location: 'Bar' }
      ];

      for (const table of tables) {
        try {
          await storage.createTable(table);
        } catch (error) {
          console.log('Table existe déjà:', table.number);
        }
      }

      // Créer un utilisateur admin par défaut
      try {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const adminUser = {
          username: 'admin',
          email: 'admin@barista-cafe.com',
          password: hashedPassword,
          role: 'directeur',
          isActive: true
        };
        await storage.createUser(adminUser);
      } catch (error) {
        console.log('Utilisateur admin existe déjà');
      }

      console.log('✅ Base de données initialisée avec succès');
      res.json({ message: 'Base de données initialisée avec succès', status: 'success' });
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation:', error);
      res.status(500).json({ error: 'Erreur lors de l\'initialisation', details: error.message });
    }
  });

  // Routes admin
  app.get('/api/admin/notifications/count', authenticateToken, async (req, res) => {
    try {
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 2000)
      );

      const dataPromise = Promise.allSettled([
        storage.getReservations(),
        storage.getContactMessages(),
        storage.getOrders()
      ]);

      const results = await Promise.race([dataPromise, timeout]);
      
      const reservations = results[0].status === 'fulfilled' ? results[0].value : [];
      const messages = results[1].status === 'fulfilled' ? results[1].value : [];
      const orders = results[2].status === 'fulfilled' ? results[2].value : [];

      const pendingReservations = reservations.filter(r => r.status === 'pending' || r.status === 'en_attente').length;
      const newMessages = messages.filter(m => m.status === 'nouveau').length;
      const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'en_attente').length;

      res.json({
        pendingReservations,
        newMessages,
        pendingOrders,
        total: pendingReservations + newMessages + pendingOrders
      });
    } catch (error) {
      console.error('Erreur notifications:', error);
      res.json({ pendingReservations: 0, newMessages: 0, pendingOrders: 0, total: 0 });
    }
  });

  app.get('/api/admin/reservations', authenticateToken, async (req, res) => {
    try {
      const reservations = await storage.getReservations();
      res.json(reservations);
    } catch (error) {
      console.error('Erreur lors de la récupération des réservations:', error);
      res.status(500).json([]);
    }
  });

  app.get('/api/admin/menu/items', authenticateToken, async (req, res) => {
    try {
      const items = await storage.getMenuItems();
      res.json(items);
    } catch (error) {
      console.error('Erreur lors de la récupération des éléments du menu:', error);
      res.status(500).json([]);
    }
  });

  app.post('/api/admin/menu/items', authenticateToken, validateBody(menuItemSchema), asyncHandler(async (req: Request, res: Response) => {
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
  }));

  app.put('/api/admin/menu/items/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
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
  }));

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

  // Middleware de gestion d'erreurs
  app.use(errorHandler);

  return server;
}