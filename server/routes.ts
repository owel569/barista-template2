import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertReservationSchema, 
  insertContactMessageSchema, 
  loginSchema,
  insertMenuItemSchema,
  insertMenuCategorySchema
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

  app.post("/api/auth/verify", authenticateToken, (req: any, res) => {
    res.json({ user: req.user });
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
      const reservations = await storage.getReservations();
      res.json(reservations);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des réservations" });
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
      const reservationData = insertReservationSchema.parse(req.body);
      
      // Check for conflicts
      const hasConflict = await storage.checkReservationConflict(
        reservationData.date,
        reservationData.time,
        reservationData.tableId
      );

      if (hasConflict) {
        return res.status(409).json({ 
          message: "Cette table est déjà réservée pour cette date et heure" 
        });
      }

      const reservation = await storage.createReservation({
        ...reservationData,
        status: "confirmed"
      });

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

  const httpServer = createServer(app);
  return httpServer;
}
