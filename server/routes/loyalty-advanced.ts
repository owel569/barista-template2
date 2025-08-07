import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error-handler';
import { createLogger } from '../middleware/logging';
import { authenticateUser, requireRoles } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { getDb } from '../db';
import { customers, orders } from '../../shared/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

const router = Router();
const logger = createLogger('LOYALTY');

// ==========================================
// TYPES ET INTERFACES
// ==========================================

export interface LoyaltyLevel {
  id: number;
  name: string;
  minPoints: number;
  maxPoints?: number;
  pointsRate: number;
  benefits: string[];
  color: string;
  discountPercentage?: number;
}

export interface LoyaltyReward {
  id: number;
  name: string;
  description: string;
  cost: number;
  category: 'boisson' | 'dessert' | 'repas' | 'experience' | 'reduction';
  isActive: boolean;
  stock?: number;
  validUntil?: string;
}

export interface LoyaltyCampaign {
  id: number;
  name: string;
  description: string;
  targetLevel: string;
  pointsMultiplier: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive' | 'expired';
  conditions?: Record<string, unknown>;
}

export interface CustomerLoyaltyData {
  customerId: number;
  currentPoints: number;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  currentLevel: LoyaltyLevel;
  nextLevel?: LoyaltyLevel;
  progressToNextLevel: number;
  pointsToNextLevel: number;
  joinDate: string;
  lastActivity: string;
}

export interface LoyaltyTransaction {
  id: number;
  customerId: number;
  type: 'earn' | 'redeem' | 'expire' | 'adjust';
  points: number;
  reason: string;
  orderId?: number;
  rewardId?: number;
  campaignId?: number;
  timestamp: string;
  balance: number;
}

// ==========================================
// SCHÉMAS DE VALIDATION ZOD
// ==========================================

const AddPointsSchema = z.object({
  customerId: z.number()}).positive('ID client invalide'),
  points: z.number().positive('Points doivent être positifs').max(10000, 'Points maximum dépassés'),
  reason: z.string().min(1, 'Raison requise').max(200, 'Raison trop longue'),
  orderId: z.number().positive().optional(),
  campaignId: z.number().positive().optional()
});

const RedeemRewardSchema = z.object({
  customerId: z.number()}).positive('ID client invalide'),
  rewardId: z.number().positive('ID récompense invalide'),
  quantity: z.number().positive().default(1)
});

const CreateCampaignSchema = z.object({
  name: z.string()}).min(1, 'Nom requis').max(100, 'Nom trop long'),
  description: z.string().min(1, 'Description requise').max(500, 'Description trop longue'),
  targetLevel: z.string().min(1, 'Niveau cible requis'),
  pointsMultiplier: z.number().positive().max(10, 'Multiplicateur trop élevé'),
  startDate: z.string().datetime('Date de début invalide'),
  endDate: z.string().datetime('Date de fin invalide'),
  conditions: z.record(z.unknown()).optional()
});

const CustomerIdParamSchema = z.object({
  customerId: z.string()}).regex(/^\d+$/, 'ID client doit être un nombre')
});

const PeriodQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'quarter', 'year'])}).default('month')
});

// ==========================================
// CONFIGURATION DU PROGRAMME DE FIDÉLITÉ
// ==========================================

const LOYALTY_LEVELS: LoyaltyLevel[] = [
  {
    id: 1,
          name: 'Bronze',
          minPoints: 0,
    maxPoints: 499,
    pointsRate: 1,
          benefits: ['Points sur achats', 'Offres spéciales'],
          color: '#CD7F32'
        },
        {
    id: 2,
          name: 'Argent',
          minPoints: 500,
    maxPoints: 1499,
    pointsRate: 2,
          benefits: ['Points doublés', 'Café gratuit mensuel', 'Réservation prioritaire'],
    color: '#C0C0C0',
    discountPercentage: 5
        },
        {
    id: 3,
          name: 'Or',
          minPoints: 1500,
    maxPoints: 2999,
    pointsRate: 3,
          benefits: ['Points triplés', 'Menu dégustation gratuit', 'Invitations exclusives'],
    color: '#FFD700',
    discountPercentage: 10
        },
        {
    id: 4,
          name: 'Platinum',
          minPoints: 3000,
    maxPoints: undefined,
    pointsRate: 4,
          benefits: ['Points x4', 'Service personnalisé', 'Événements VIP'],
    color: '#E5E4E2',
    discountPercentage: 15
  }
];

const AVAILABLE_REWARDS: LoyaltyReward[] = [
  { id: 1, name: 'Café gratuit', description: 'Café de votre choix', cost: 100, category: 'boisson', isActive: true },
  { id: 2, name: 'Dessert gratuit', description: 'Dessert maison', cost: 150, category: 'dessert', isActive: true },
  { id: 3, name: 'Menu complet', description: 'Entrée + Plat + Dessert', cost: 500, category: 'repas', isActive: true },
  { id: 4, name: 'Soirée dégustation', description: 'Événement exclusif', cost: 1000, category: 'experience', isActive: true, stock: 20 }
];

// ==========================================
// SERVICES MÉTIER
// ==========================================

class LoyaltyService {
  /**
   * Détermine le niveau de fidélité basé sur les points
   */
  static getLevelForPoints(points: number): LoyaltyLevel {
    const level = LOYALTY_LEVELS.find(l => 
      points >= l.minPoints && (!l.maxPoints || points <= l.maxPoints)
    );
    
    if (!level) {
      throw new Error(`Niveau non trouvé pour ${points} points`);
    }
    
    return level;
  }

  /**
   * Calcule le prochain niveau et la progression
   */
  static getNextLevelInfo(currentPoints: number): { nextLevel?: LoyaltyLevel; progress: number; pointsToNext: number } {
    const currentLevel = this.getLevelForPoints(currentPoints);
    const nextLevel = LOYALTY_LEVELS.find(l => l.minPoints > currentPoints);
    
    if (!nextLevel) {
      return { progress: 100, pointsToNext: 0 };
    }
    
    const progress = Math.min(100, ((currentPoints - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100);
    const pointsToNext = nextLevel.minPoints - currentPoints;
    
    return { nextLevel, progress: Math.round(progress), pointsToNext };
  }

  /**
   * Calcule les points à ajouter avec le multiplicateur du niveau
   */
  static calculatePointsToAdd(basePoints: number, customerPoints: number, campaignMultiplier = 1): number {
    const level = this.getLevelForPoints(customerPoints);
    return Math.floor(basePoints * level.pointsRate * campaignMultiplier);
  }

  /**
   * Vérifie si une récompense peut être échangée
   */
  static canRedeemReward(customerPoints: number, reward: LoyaltyReward, quantity = 1): { canRedeem: boolean; reason?: string } {
    const totalCost = reward.cost * quantity;
    
    if (!reward.isActive) {
      return { canRedeem: false, reason: 'Récompense non disponible' };
    }
    
    if (reward.stock !== undefined && reward.stock < quantity) {
      return { canRedeem: false, reason: 'Stock insuffisant' };
    }
    
    if (reward.validUntil && new Date(reward.validUntil) < new Date()) {
      return { canRedeem: false, reason: 'Récompense expirée' };
    }
    
    if (customerPoints < totalCost) {
      return { canRedeem: false, reason: 'Points insuffisants' };
    }
    
    return { canRedeem: true };
  }
}

// ==========================================
// ROUTES AVEC AUTHENTIFICATION ET VALIDATION
// ==========================================

// Vue d'ensemble du programme de fidélité
router.get('/program/overview', 
  authenticateUser,
  requireRoles(['admin', 'manager']),
  asyncHandler(async (req, res) => {
    try {
      const db = await getDb();
      // Récupérer les statistiques depuis la base de données
      const totalCustomers = await db.select({ count: sql<number>`count(*})` }).from(customers);
      const activeCustomers = await db.select({ count: sql<number>`count(*)})` })
        .from(customers)
        .where(gte(customers.loyaltyPoints, 100));
      
      const totalOrders = await db.select({ count: sql<number>`count(*)})` }).from(orders);
      
      const program = {
        levels: LOYALTY_LEVELS,
        rewards: AVAILABLE_REWARDS.filter(r => r.isActive),
        statistics: {
          totalMembers: totalCustomers[0]?.count || 0,
          activeMembers: activeCustomers[0]?.count || 0,
          totalOrders: totalOrders[0]?.count || 0,
          averageLifetimeValue: 380 // À calculer depuis les commandes
        }
      };

      res.json({
        success: true,
        data: program
      });
  } catch (error) {
    logger.error('Erreur loyalty overview', { error: error instanceof Error ? error.message : 'Erreur inconnue' )});
      res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la récupération du programme de fidélité' 
      });
    }
  })
);

// Ajout de points de fidélité
router.post('/points/add',
  authenticateUser,
  requireRoles(['admin', 'manager', 'staff']),
  validateBody(AddPointsSchema),
  asyncHandler(async (req, res) => {
    const { customerId, points, reason, orderId, campaignId } = req.body;
    
    try {
      const db = await getDb();
      // Vérifier que le client existe
      const customer = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);
      
      if (customer.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Client non trouvé'
        });
      }

      const currentCustomer = customer[0];
      if (!currentCustomer) {
        return res.status(404).json({
          success: false,
          message: 'Client non trouvé'
        });
      }
      
      const currentLevel = LoyaltyService.getLevelForPoints(currentCustomer.loyaltyPoints);
      const finalPoints = LoyaltyService.calculatePointsToAdd(points, currentCustomer.loyaltyPoints);
      const newTotalPoints = currentCustomer.loyaltyPoints + finalPoints;
      const newLevel = LoyaltyService.getLevelForPoints(newTotalPoints);
      const levelUp = newLevel.id !== currentLevel.id;

      // Mettre à jour les points du client
      await db.update(customers)
        .set({ loyaltyPoints: newTotalPoints })
        .where(eq(customers.id, customerId));

      // TODO: Enregistrer la transaction dans une table dédiée
      // await db.insert(loyaltyTransactions).values({
      //   customerId,
      //   type: 'earn',
      //   points: finalPoints,
      //   reason,
      //   orderId,
      //   campaignId,
      //   timestamp: new Date()}).toISOString(),
      //   balance: newTotalPoints
      // });

      const { nextLevel, progress, pointsToNext } = LoyaltyService.getNextLevelInfo(newTotalPoints);

    res.json({
      success: true,
        data: {
      pointsAdded: finalPoints,
      totalPoints: newTotalPoints,
          previousLevel: currentLevel.name,
      currentLevel: newLevel.name,
      levelUp,
          nextLevel: nextLevel?.name,
          progressToNextLevel: progress,
          pointsToNextLevel: pointsToNext
        }
    });
  } catch (error) {
      logger.error('Erreur ajout points', { 
        customerId, 
        points, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      )});
      res.status(500).json({ 
        success: false,
        message: 'Erreur lors de l\'ajout des points' 
      });
    }
  })
);

// Échange de récompenses
router.post('/rewards/redeem',
  authenticateUser,
  requireRoles(['admin', 'manager', 'staff']),
  validateBody(RedeemRewardSchema),
  asyncHandler(async (req, res) => {
    const { customerId, rewardId, quantity } = req.body;
    
    try {
      const db = await getDb();
      // Vérifier que le client existe
      const customer = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);
      
      if (customer.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Client non trouvé'
        });
      }

      const currentCustomer = customer[0];
      if (!currentCustomer) {
        return res.status(404).json({
          success: false,
          message: 'Client non trouvé'
        });
      }
      
      const reward = AVAILABLE_REWARDS.find(r => r.id === rewardId);
      
      if (!reward) {
        return res.status(404).json({
          success: false,
          message: 'Récompense non trouvée'
        });
      }

      const { canRedeem, reason } = LoyaltyService.canRedeemReward(currentCustomer.loyaltyPoints, reward, quantity);
      
      if (!canRedeem) {
      return res.status(400).json({ 
          success: false,
          message: reason || 'Impossible d\'échanger cette récompense',
          required: reward.cost * quantity,
          available: currentCustomer.loyaltyPoints
        });
      }

      const pointsUsed = reward.cost * quantity;
      const remainingPoints = currentCustomer.loyaltyPoints - pointsUsed;

      // Mettre à jour les points du client
      await db.update(customers)
        .set({ loyaltyPoints: remainingPoints })
        .where(eq(customers.id, customerId));

      // TODO: Mettre à jour le stock de la récompense si applicable
      // TODO: Enregistrer la transaction

    res.json({
      success: true,
        data: {
      reward: reward.name,
          quantity,
          pointsUsed,
          remainingPoints,
          newBalance: remainingPoints
        }
    });
  } catch (error) {
      logger.error('Erreur échange récompense', { 
        customerId, 
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

// Création de campagnes de fidélité
router.post('/campaigns/create',
  authenticateUser,
  requireRoles(['admin']),
  validateBody(CreateCampaignSchema),
  asyncHandler(async (req, res) => {
    const { name, description, targetLevel, pointsMultiplier, startDate, endDate, conditions } = req.body;
    
    try {
      // Vérifier que le niveau cible existe
      const levelExists = LOYALTY_LEVELS.some(l => l.name === targetLevel);
      if (!levelExists) {
        return res.status(400).json({
          success: false,
          message: 'Niveau cible invalide'
        });
      }

      // Vérifier que les dates sont cohérentes
      if (new Date(startDate) >= new Date(endDate)) {
        return res.status(400).json({
          success: false,
          message: 'La date de fin doit être postérieure à la date de début'
        });
      }

      // TODO: Sauvegarder la campagne en base de données
      const campaign: LoyaltyCampaign = {
        id: Date.now(), // Temporaire, à remplacer par l'ID de la base
      name,
      description,
      targetLevel,
      pointsMultiplier,
        startDate,
        endDate,
      status: 'active',
        conditions
    };

    res.json({
      success: true,
        data: campaign
    });
  } catch (error) {
      logger.error('Erreur création campagne', { 
        name, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      )});
      res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la création de la campagne' 
      });
    }
  })
);

// Analytics de fidélité
router.get('/analytics/:period',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  validateParams(CustomerIdParamSchema),
  validateQuery(PeriodQuerySchema),
  asyncHandler(async (req, res) => {
    const { period } = req.query;
    
    try {
      // TODO: Calculer les vraies métriques depuis la base de données
    const analytics = {
      period,
      metrics: {
        totalMembers: 1250,
        activeMembers: 890,
        averagePoints: 450,
        redemptionRate: 0.75,
        retentionRate: 0.85
      },
      trends: [
        { month: 'Jan', members: 1200, points: 42000 },
        { month: 'Fév', members: 1220, points: 45000 },
        { month: 'Mar', members: 1250, points: 48000 }
      ]
    };

      res.json({
        success: true,
        data: analytics
      });
  } catch (error) {
      logger.error('Erreur loyalty analytics', { 
        period, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      )});
      res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la récupération des analytics' 
      });
    }
  })
);

// Carte de fidélité d'un client
router.get('/card/:customerId',
  authenticateUser,
  requireRoles(['admin', 'manager', 'staff']),
  validateParams(CustomerIdParamSchema),
  asyncHandler(async (req, res) => {
  const { customerId } = req.params;
    const customerIdNum = parseInt(customerId || '0');
    
    try {
      const db = await getDb();
      // Récupérer les données du client
      const customer = await db.select().from(customers).where(eq(customers.id, customerIdNum)).limit(1);
      
      if (customer.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Client non trouvé'
        });
      }

      const currentCustomer = customer[0];
      if (!currentCustomer) {
        return res.status(404).json({
          success: false,
          message: 'Client non trouvé'
        });
      }
      
      const currentLevel = LoyaltyService.getLevelForPoints(currentCustomer.loyaltyPoints);
      const { nextLevel, progress, pointsToNext } = LoyaltyService.getNextLevelInfo(currentCustomer.loyaltyPoints);

      // TODO: Récupérer l'historique des transactions
      const recentActivity: LoyaltyTransaction[] = [
        { 
          id: 1, 
          customerId: customerIdNum, 
          type: 'earn', 
          points: 50, 
          reason: 'Achat', 
          timestamp: '2024-01-15T10:00:00Z', 
          balance: currentCustomer.loyaltyPoints 
        }
      ];

      // Filtrer les récompenses disponibles
      const availableRewards = AVAILABLE_REWARDS.filter(reward => {
        const { canRedeem } = LoyaltyService.canRedeemReward(currentCustomer.loyaltyPoints, reward);
        return canRedeem;
      });

    const card = {
        customer: {
          id: currentCustomer.id,
          firstName: currentCustomer.firstName,
          lastName: currentCustomer.lastName,
          email: currentCustomer.email,
          loyaltyPoints: currentCustomer.loyaltyPoints
        },
        level: currentLevel.name,
        progress: progress,
        nextLevel: nextLevel?.name,
        pointsToNextLevel: pointsToNext,
        recentActivity,
        availableRewards,
      qrCode: `loyalty-${customerId}`,
      expiringRewards: []
    };

      res.json({
        success: true,
        data: card
      });
  } catch (error) {
      logger.error('Erreur carte fidélité', { 
        customerId, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      )});
      res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la récupération de la carte de fidélité' 
      });
    }
  })
);

export default router;