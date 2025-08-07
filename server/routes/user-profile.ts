
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error-handler';
import { createLogger } from '../middleware/logging';
import { authenticateUser, requireRoles } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { getDb } from '../db';
import { users, customers, orders } from '../../shared/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

const userProfileRouter = Router();
const logger = createLogger('USER_PROFILE');

// ==========================================
// TYPES ET INTERFACES
// ==========================================

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyData {
  points: number;
  level: string;
  nextLevelPoints: number;
  pointsToNextLevel: number;
  totalSpent: number;
  visitsThisMonth: number;
  favoriteItems: Array<{
    name: string;
    orderCount: number;
  }>;
  availableRewards: Array<{
    id: number;
    name: string;
    pointsCost: number;
  }>;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  language: string;
  currency: string;
  notifications: {
    orderUpdates: boolean;
    promotions: boolean;
    newMenuItems: boolean;
  };
  dietary: {
    vegetarian: boolean;
    vegan: boolean;
    glutenFree: boolean;
    lactoseFree: boolean;
  };
}

export interface OrderHistory {
  id: number;
  orderNumber: string;
  totalAmount: number;
  status: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  createdAt: string;
}

// ==========================================
// SCHÉMAS DE VALIDATION ZOD
// ==========================================

const UpdateProfileSchema = z.object({
  firstName: z.string().min(1, 'Prénom requis').max(50, 'Prénom trop long'),
  lastName: z.string().min(1, 'Nom requis').max(50, 'Nom trop long'),
  email: z.string().email('Email invalide'),
  phone: z.string().optional()
});

const RedeemRewardSchema = z.object({
  rewardId: z.number().positive('ID récompense invalide')
});

const PreferencesSchema = z.object({
  theme: z.enum(['light', 'dark']).optional(),
  language: z.string().optional(),
  currency: z.string().optional(),
  notifications: z.object({
    orderUpdates: z.boolean(),
    promotions: z.boolean(),
    newMenuItems: z.boolean()
  }).optional(),
  dietary: z.object({
    vegetarian: z.boolean(),
    vegan: z.boolean(),
    glutenFree: z.boolean(),
    lactoseFree: z.boolean()
  }).optional()
});

const OrderHistoryQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(10),
  offset: z.coerce.number().min(0).default(0),
  status: z.string().optional()
});

// ==========================================
// SERVICES MÉTIER
// ==========================================

class UserProfileService {
  /**
   * Récupère le profil utilisateur complet
   */
  static async getUserProfile(userId: number): Promise<UserProfile | null> {
    try {
      const db = await getDb();
      
      const user = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user.length === 0) {
        return null;
      }

      return {
        id: user[0].id,
        username: user[0].username,
        email: user[0].email,
        firstName: user[0].firstName,
        lastName: user[0].lastName,
        role: user[0].role,
        isActive: user[0].isActive,
        createdAt: user[0].createdAt.toISOString(),
        updatedAt: user[0].updatedAt.toISOString()
      };
    } catch (error) {
      logger.error('Erreur récupération profil utilisateur', { 
        userId, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      });
      return null;
    }
  }

  /**
   * Calcule les données de fidélité
   */
  static async calculateLoyaltyData(userId: number): Promise<LoyaltyData> {
    try {
      const db = await getDb();
      
      // Récupérer les commandes du client
      const customerOrders = await db.select({
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
        items: orders.items
      })
      .from(orders)
      .where(eq(orders.customerId, userId))
      .orderBy(desc(orders.createdAt));

      const totalSpent = customerOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
      const visitsThisMonth = customerOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        const now = new Date();
        return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
      }).length;

      // Calculer les points (1€ = 1 point)
      const points = Math.floor(totalSpent);
      const level = points < 100 ? 'Bronze' : points < 500 ? 'Silver' : points < 1000 ? 'Gold' : 'Platinum';
      const nextLevelPoints = level === 'Bronze' ? 100 : level === 'Silver' ? 500 : level === 'Gold' ? 1000 : 2000;
      const pointsToNextLevel = Math.max(0, nextLevelPoints - points);

      // Articles favoris (simplifié)
      const favoriteItems = [
        { name: 'Cappuccino', orderCount: 15 },
        { name: 'Croissant', orderCount: 8 }
      ];

      // Récompenses disponibles
      const availableRewards = [
        { id: 1, name: 'Café gratuit', pointsCost: 100 },
        { id: 2, name: 'Réduction 20%', pointsCost: 200 },
        { id: 3, name: 'Dessert gratuit', pointsCost: 150 }
      ];

      return {
        points,
        level,
        nextLevelPoints,
        pointsToNextLevel,
        totalSpent,
        visitsThisMonth,
        favoriteItems,
        availableRewards
      };
    } catch (error) {
      logger.error('Erreur calcul données fidélité', { 
        userId, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      )});
      
      // Retourner des données par défaut en cas d'erreur
      return {
        points: 0,
        level: 'Bronze',
        nextLevelPoints: 100,
        pointsToNextLevel: 100,
        totalSpent: 0,
        visitsThisMonth: 0,
        favoriteItems: [,],
        availableRewards: []
      };
    }
  }

  /**
   * Récupère l'historique des commandes
   */
  static async getOrderHistory(userId: number, limit: number, offset: number): Promise<OrderHistory[]> {
    try {
      const db = await getDb();
      
      const userOrders = await db.select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        totalAmount: orders.totalAmount,
        status: orders.status,
        items: orders.items,
        createdAt: orders.createdAt
      })
      .from(orders)
      .where(eq(orders.customerId, userId))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

      return userOrders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: Number(order.totalAmount)}),
        status: order.status,
        items: order.items as any[] || [,],
        createdAt: order.createdAt.toISOString()
      });
    } catch (error) {
      logger.error('Erreur récupération historique commandes', { 
        userId, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      )});
      return [];
    }
  }
}

// ==========================================
// ROUTES AVEC AUTHENTIFICATION ET VALIDATION
// ==========================================

// Récupérer le profil utilisateur
userProfileRouter.get('/profile', 
  authenticateUser,
  asyncHandler(async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'Utilisateur non authentifié' 
        });
      }

      const profile = await UserProfileService.getUserProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ 
          success: false,
          message: 'Profil utilisateur non trouvé' 
        });
      }
  
  res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      logger.error('Erreur récupération profil', { 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      )});
      res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la récupération du profil' 
      });
    }
  })
);

// Mettre à jour le profil utilisateur
userProfileRouter.put('/profile', 
  authenticateUser,
  validateBody(UpdateProfileSchema),
  asyncHandler(async (req, res) => {
    const { firstName, lastName, email, phone } = req.body;
    const userId = req.user?.id;
    
    try {
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'Utilisateur non authentifié' 
        });
      }

      const db = await getDb();
      
      // Vérifier si l'email est déjà utilisé par un autre utilisateur
      const existingUser = await db.select()
        .from(users)
        .where(and(
          eq(users.email, email),
          sql`${users.id} != ${userId}`
        ))
        .limit(1);

      if (existingUser.length > 0) {
        return res.status(409).json({ 
          success: false,
          message: 'Email déjà utilisé' 
        });
      }

      // Mettre à jour le profil
      await db.update(users)
        .set({
          firstName,
          lastName,
          email,
          updatedAt: new Date()})
        })
        .where(eq(users.id, userId));

      logger.info('Profil utilisateur mis à jour', { 
        userId,
        firstName,
        lastName,
        email
      });
  
  res.json({
        success: true,
        message: 'Profil mis à jour avec succès'
      });
    } catch (error) {
      logger.error('Erreur mise à jour profil', { 
        userId, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      )});
      res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la mise à jour du profil' 
      });
    }
  })
);

// Données de fidélité
userProfileRouter.get('/loyalty', 
  authenticateUser,
  asyncHandler(async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'Utilisateur non authentifié' 
        });
      }

      const loyaltyData = await UserProfileService.calculateLoyaltyData(userId);
  
  res.json({
        success: true,
        data: loyaltyData
      });
    } catch (error) {
      logger.error('Erreur récupération données fidélité', { 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      )});
      res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la récupération des données de fidélité' 
      });
    }
  })
);

// Échanger une récompense
userProfileRouter.post('/loyalty/redeem', 
  authenticateUser,
  validateBody(RedeemRewardSchema),
  asyncHandler(async (req, res) => {
  const { rewardId } = req.body;
    const userId = req.user?.id;
    
    try {
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'Utilisateur non authentifié' 
        });
      }

      // Vérifier les points disponibles
      const loyaltyData = await UserProfileService.calculateLoyaltyData(userId);
      const reward = loyaltyData.availableRewards.find(r => r.id === rewardId);
      
      if (!reward) {
        return res.status(404).json({ 
          success: false,
          message: 'Récompense non trouvée' 
        });
      }

      if (loyaltyData.points < reward.pointsCost) {
        return res.status(400).json({ 
          success: false,
          message: 'Points insuffisants' 
        });
      }

      // TODO: Implémenter la logique d'échange de récompense
      // Pour l'instant, on simule

      logger.info('Récompense échangée', { 
        userId,
        rewardId,
        pointsUsed: reward.pointsCost,
        remainingPoints: loyaltyData.points - reward.pointsCost
      });

  res.json({
        success: true,
        data: { 
    message: 'Récompense récupérée avec succès',
    rewardId,
          pointsUsed: reward.pointsCost,
          remainingPoints: loyaltyData.points - reward.pointsCost
        }
      });
    } catch (error) {
      logger.error('Erreur échange récompense', { 
        userId, 
        rewardId, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      )});
      res.status(500).json({ 
        success: false,
        message: 'Erreur lors de l\'échange de la récompense' 
      });
    }
  })
);

// Historique des commandes
userProfileRouter.get('/orders', 
  authenticateUser,
  validateQuery(OrderHistoryQuerySchema),
  asyncHandler(async (req, res) => {
    const { limit, offset, status } = req.query;
    const userId = req.user?.id;
    
    try {
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'Utilisateur non authentifié' 
        });
      }

      const orderHistory = await UserProfileService.getOrderHistory(userId, limit, offset);

      // Filtrer par statut si fourni
      const filteredOrders = status 
        ? orderHistory.filter(order => order.status === status)
        : orderHistory;

      res.json({
        success: true,
        data: {
          orders: filteredOrders,
          pagination: {
            total: filteredOrders.length,
            limit,
            offset,
            hasMore: offset + limit < filteredOrders.length
          }
        }
      });
    } catch (error) {
      logger.error('Erreur récupération historique commandes', { 
        userId, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      )});
      res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la récupération de l\'historique' 
      });
    }
  })
);

// Préférences utilisateur
userProfileRouter.get('/preferences', 
  authenticateUser,
  asyncHandler(async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'Utilisateur non authentifié' 
        });
      }

      // TODO: Récupérer les vraies préférences depuis la base de données
      // Pour l'instant, on simule
      const preferences: UserPreferences = {
    theme: 'light',
    language: 'fr',
    currency: 'EUR',
    notifications: {
      orderUpdates: true,
      promotions: false,
      newMenuItems: true
    },
    dietary: {
      vegetarian: false,
      vegan: false,
      glutenFree: false,
      lactoseFree: false
    }
  };
  
  res.json({
        success: true,
        data: preferences
      });
    } catch (error) {
      logger.error('Erreur récupération préférences', { 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      )});
      res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la récupération des préférences' 
      });
    }
  })
);

// Mettre à jour les préférences
userProfileRouter.put('/preferences', 
  authenticateUser,
  validateBody(PreferencesSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    
    try {
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'Utilisateur non authentifié' 
        });
      }

      // TODO: Sauvegarder les vraies préférences dans la base de données
      // Pour l'instant, on simule

      logger.info('Préférences utilisateur mises à jour', { 
        userId,
        preferences: req.body
      });

  res.json({
        success: true,
        data: { 
    message: 'Préférences mises à jour avec succès',
    preferences: req.body
  }
      });
    } catch (error) {
      logger.error('Erreur mise à jour préférences', { 
        userId, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      )});
      res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la mise à jour des préférences' 
      });
    }
  })
);

export default userProfileRouter;
