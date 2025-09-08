import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error-handler-enhanced';
import { createLogger } from '../middleware/logging';
import { authenticateUser, requireRoles } from '../middleware/auth';
import { requirePermission } from '../middleware/authorization';
import { validateBody, validateParams } from '../middleware/validation';
import { getDb } from '../db';
import { customers, loyaltyTransactions, activityLogs } from '../../shared/schema';
import { eq, and, gte, lte, desc, count, sum } from 'drizzle-orm';
// Types définis localement pour éviter les conflits

const router = Router();
const logger = createLogger('LOYALTY_ADVANCED');

// ==========================================
// TYPES ET INTERFACES OPTIMISÉS
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
  icon: string;
  description: string;
}

export interface LoyaltyReward {
  id: number;
  name: string;
  description: string;
  cost: number;
  category: 'boisson' | 'dessert' | 'repas' | 'experience' | 'reduction' | 'produit' | 'nourriture' | 'service';
  isActive: boolean;
  stock?: number;
  validUntil?: string;
  imageUrl?: string;
  popularity: number;
  estimatedDeliveryTime?: number;
}

export interface LoyaltyCampaign {
  id: number;
  name: string;
  description: string;
  targetLevel: string;
  pointsMultiplier: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive' | 'expired' | 'scheduled';
  conditions?: Record<string, unknown>;
  targetAudience?: string[];
  budget?: number;
  currentUsage: number;
  maxUsage?: number;
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
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  lifetimeValue: number;
  averageOrderValue: number;
  visitFrequency: number;
}

export interface LoyaltyTransaction {
  id: number;
  customerId: number;
  type: 'earned' | 'redeemed' | 'expired' | 'adjusted' | 'bonus' | 'penalty' | 'transferred';
  points: number;
  description: string;
  orderId?: number;
  rewardId?: number;
  campaignId?: number;
  createdAt: string;
  balance: number;
  metadata?: Record<string, unknown>;
  expiresAt?: string;
}

export interface LoyaltyAnalytics {
  totalMembers: number;
  activeMembers: number;
  pointsDistribution: Record<string, number>;
  redemptionRate: number;
  averagePointsPerCustomer: number;
  topRewards: Array<{ reward: LoyaltyReward; redemptions: number }>;
  levelDistribution: Record<string, number>;
  monthlyTrends: Array<{
    month: string;
    newMembers: number;
    pointsEarned: number;
    pointsRedeemed: number;
    retention: number;
  }>;
}

export interface StaffingRecommendation {
  period: string;
  recommendedStaff: number;
  currentStaff: number;
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedCost: number;
}

export interface MarketingOpportunity {
  type: 'email_campaign' | 'push_notification' | 'sms' | 'in_app' | 'social_media';
  title: string;
  description: string;
  targetAudience: string;
  estimatedReach: number;
  expectedRoi: number;
  priority: 'low' | 'medium' | 'high';
  suggestedTiming: string;
}

// ==========================================
// CONFIGURATION AVANCÉE DU PROGRAMME
// ==========================================

const LOYALTY_LEVELS: LoyaltyLevel[] = [
  {
    id: 1,
    name: 'Bronze',
    minPoints: 0,
    maxPoints: 499,
    pointsRate: 1,
    benefits: [
      'Points sur achats',
      'Offres spéciales mensuelles',
      'Newsletter exclusive',
      'Accès aux nouveautés en avant-première'
    ],
    color: '#CD7F32',
    icon: '🥉',
    description: 'Le niveau d\'entrée dans notre programme de fidélité'
  },
  {
    id: 2,
    name: 'Argent',
    minPoints: 500,
    maxPoints: 1499,
    pointsRate: 1.2,
    benefits: [
      'Points bonus +20%',
      'Réductions exclusives',
      'Priorité réservations',
      'Café offert pour l\'anniversaire',
      'Accès aux événements spéciaux'
    ],
    color: '#C0C0C0',
    discountPercentage: 5,
    icon: '🥈',
    description: 'Pour nos clients réguliers qui apprécient nos services'
  },
  {
    id: 3,
    name: 'Or',
    minPoints: 1500,
    maxPoints: 2999,
    pointsRate: 1.5,
    benefits: [
      'Points bonus +50%',
      'Menu dégustation gratuit mensuel',
      'Service prioritaire',
      'Invitations exclusives aux événements',
      'Parking gratuit',
      'Wi-Fi premium'
    ],
    color: '#FFD700',
    discountPercentage: 10,
    icon: '🥇',
    description: 'Le niveau privilège pour nos clients fidèles'
  },
  {
    id: 4,
    name: 'Platine',
    minPoints: 3000,
    maxPoints: 4999,
    pointsRate: 2,
    benefits: [
      'Points double',
      'Concierge personnel',
      'Réservations garanties',
      'Événements VIP exclusifs',
      'Livraison gratuite',
      'Cours de cuisine privés'
    ],
    color: '#E5E4E2',
    discountPercentage: 15,
    icon: '💎',
    description: 'L\'excellence pour nos clients les plus précieux'
  },
  {
    id: 5,
    name: 'Diamant',
    minPoints: 5000,
    pointsRate: 2.5,
    benefits: [
      'Points x2.5',
      'Services sur-mesure',
      'Accès illimité aux espaces VIP',
      'Chef personnel sur demande',
      'Voyages gastronomiques exclusifs',
      'Carte membre physique personnalisée'
    ],
    color: '#B9F2FF',
    discountPercentage: 20,
    icon: '💠',
    description: 'Le summum de l\'expérience client'
  }
];

const ENHANCED_REWARDS: LoyaltyReward[] = [
  {
    id: 1,
    name: 'Café Signature Gratuit',
    description: 'Un café de notre sélection signature avec accompagnements',
    cost: 100,
    category: 'boisson',
    isActive: true,
    popularity: 95,
    estimatedDeliveryTime: 5,
    imageUrl: '/images/rewards/signature-coffee.jpg'
  },
  {
    id: 2,
    name: 'Pâtisserie Maison Offerte',
    description: 'Pâtisserie artisanale préparée par notre chef pâtissier',
    cost: 150,
    category: 'dessert',
    isActive: true,
    popularity: 88,
    estimatedDeliveryTime: 3,
    imageUrl: '/images/rewards/house-pastry.jpg'
  },
  {
    id: 3,
    name: 'Réduction Premium 10%',
    description: '10% de réduction sur votre prochaine commande (minimum 25€)',
    cost: 200,
    category: 'reduction',
    isActive: true,
    popularity: 76,
    imageUrl: '/images/rewards/discount-10.jpg'
  },
  {
    id: 4,
    name: 'Menu Dégustation Complet',
    description: 'Entrée, plat, dessert et boisson de notre sélection du chef',
    cost: 500,
    category: 'repas',
    isActive: true,
    popularity: 92,
    estimatedDeliveryTime: 45,
    imageUrl: '/images/rewards/tasting-menu.jpg'
  },
  {
    id: 5,
    name: 'Sac de Café Premium 250g',
    description: 'Café en grains de notre torréfaction exclusive',
    cost: 300,
    category: 'produit',
    isActive: true,
    stock: 50,
    popularity: 70,
    imageUrl: '/images/rewards/premium-coffee-bag.jpg'
  },
  {
    id: 6,
    name: 'Cours Barista Privé',
    description: 'Session de 2h avec notre maître barista',
    cost: 1000,
    category: 'experience',
    isActive: true,
    stock: 10,
    popularity: 65,
    estimatedDeliveryTime: 120,
    imageUrl: '/images/rewards/barista-course.jpg'
  }
];

// ==========================================
// SERVICE MÉTIER AVANCÉ
// ==========================================

class AdvancedLoyaltyService {
  /**
   * Détermine le niveau de fidélité avec logique avancée
   */
  static getLevelForPoints(points: number): LoyaltyLevel {
    const level = LOYALTY_LEVELS.find(l => {
      if (l.maxPoints === undefined) {
        return points >= l.minPoints;
      }
      return points >= l.minPoints && points <= l.maxPoints;
    });

    return level || LOYALTY_LEVELS[0];
  }

  /**
   * Calcule les informations du niveau suivant avec progression détaillée
   */
  static getNextLevelInfo(currentPoints: number): {
    nextLevel?: LoyaltyLevel;
    progress: number;
    pointsToNext: number;
    daysToNext?: number;
    estimatedSpendingToNext?: number;
  } {
    const currentLevel = this.getLevelForPoints(currentPoints);
    const currentLevelIndex = LOYALTY_LEVELS.findIndex(l => l.id === currentLevel.id);

    if (currentLevelIndex === -1 || currentLevelIndex >= LOYALTY_LEVELS.length - 1) {
      return { progress: 100, pointsToNext: 0 };
    }

    const nextLevel = LOYALTY_LEVELS[currentLevelIndex + 1];
    if (!nextLevel) {
      return { progress: 100, pointsToNext: 0 };
    }
    const pointsInCurrentLevel = currentPoints - currentLevel.minPoints;
    const pointsNeededForNextLevel = nextLevel.minPoints - currentLevel.minPoints;
    const progress = Math.min(100, (pointsInCurrentLevel / pointsNeededForNextLevel) * 100);
    const pointsToNext = Math.max(0, nextLevel.minPoints - currentPoints);

    const estimatedSpendingToNext = pointsToNext / currentLevel.pointsRate;
    const daysToNext = Math.ceil(pointsToNext / 10);

    return {
      nextLevel,
      progress: Math.round(progress),
      pointsToNext,
      daysToNext,
      estimatedSpendingToNext: Math.round(estimatedSpendingToNext)
    };
  }

  /**
   * Calcule les points avec multiplicateurs et bonus
   */
  static calculatePointsToAdd(
    basePoints: number,
    customerPoints: number,
    campaignMultiplier = 1,
    bonusMultiplier = 1,
    specialEventMultiplier = 1
  ): number {
    const level = this.getLevelForPoints(customerPoints);
    const levelMultiplier = level.pointsRate;

    const totalMultiplier = levelMultiplier * campaignMultiplier * bonusMultiplier * specialEventMultiplier;
    const calculatedPoints = Math.floor(basePoints * totalMultiplier);

    const bonusThreshold = 100;
    const bonus = calculatedPoints >= bonusThreshold ? Math.floor(calculatedPoints * 0.1) : 0;

    return calculatedPoints + bonus;
  }

  /**
   * Validation avancée pour l'échange de récompenses
   */
  static canRedeemReward(
    customerPoints: number,
    customerLevel: LoyaltyLevel,
    reward: LoyaltyReward,
    quantity = 1
  ): {
    canRedeem: boolean;
    reason?: string;
    requirements?: string[];
    alternatives?: LoyaltyReward[];
  } {
    const totalCost = reward.cost * quantity;

    if (!reward.isActive) {
      return { canRedeem: false, reason: 'Cette récompense n\'est plus disponible' };
    }

    if (reward.stock !== undefined && reward.stock < quantity) {
      return {
        canRedeem: false,
        reason: `Stock insuffisant (${reward.stock} disponible(s))`,
        alternatives: this.getSimilarRewards(reward)
      };
    }

    if (reward.validUntil && new Date(reward.validUntil) < new Date()) {
      return { canRedeem: false, reason: 'Cette récompense a expiré' };
    }

    if (customerPoints < totalCost) {
      const requirements = [`${totalCost - customerPoints} points supplémentaires requis`];
      return {
        canRedeem: false,
        reason: 'Points insuffisants',
        requirements,
        alternatives: this.getAffordableRewards(customerPoints)
      };
    }

    const premiumRewards = ['experience', 'service'];
    if (premiumRewards.includes(reward.category) && customerLevel.id < 3) {
      const requirements = ['Niveau Or minimum requis'];
      return { canRedeem: false, reason: 'Niveau insuffisant', requirements };
    }

    return { canRedeem: true };
  }

  /**
   * Récupère des récompenses similaires
   */
  private static getSimilarRewards(reward: LoyaltyReward, limit = 3): LoyaltyReward[] {
    return ENHANCED_REWARDS
      .filter(r => r.id !== reward.id && r.category === reward.category && r.isActive)
      .sort((a, b) => Math.abs(a.cost - reward.cost) - Math.abs(b.cost - reward.cost))
      .slice(0, limit);
  }

  /**
   * Récupère les récompenses abordables pour un nombre de points donné
   */
  private static getAffordableRewards(points: number, limit = 5): LoyaltyReward[] {
    return ENHANCED_REWARDS
      .filter(r => r.isActive && r.cost <= points)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, limit);
  }

  /**
   * Calcule les métriques de fidélité avancées
   */
  static calculateAdvancedMetrics(transactions: LoyaltyTransaction[]): {
    averageTransactionValue: number;
    frequencyScore: number;
    engagementLevel: 'low' | 'medium' | 'high' | 'exceptional';
    predictedChurn: number;
    lifetimeValue: number;
  } {
    if (transactions.length === 0) {
      return {
        averageTransactionValue: 0,
        frequencyScore: 0,
        engagementLevel: 'low',
        predictedChurn: 0.8,
        lifetimeValue: 0
      };
    }

    const earned = transactions.filter(t => ['earned', 'bonus'].includes(t.type));
    const redeemed = transactions.filter(t => t.type === 'redeemed');

    const averageTransactionValue = earned.reduce((sum, t) => sum + t.points, 0) / earned.length;
    const redemptionRate = redeemed.length / Math.max(earned.length, 1);

    const now = new Date();
    const recent = transactions.filter(t => {
      const transactionDate = new Date(t.createdAt);
      const daysDiff = (now.getTime() - transactionDate.getTime()) / (1000 * 3600 * 24);
      return daysDiff <= 30;
    });

    const frequencyScore = Math.min(100, (recent.length / 30) * 100);

    let engagementLevel: 'low' | 'medium' | 'high' | 'exceptional';
    if (frequencyScore >= 80 && redemptionRate >= 0.7) {
      engagementLevel = 'exceptional';
    } else if (frequencyScore >= 60 && redemptionRate >= 0.5) {
      engagementLevel = 'high';
    } else if (frequencyScore >= 30) {
      engagementLevel = 'medium';
    } else {
      engagementLevel = 'low';
    }

    const daysSinceLastActivity = transactions.length > 0 ?
      (now.getTime() - new Date(transactions[0]?.createdAt || now).getTime()) / (1000 * 3600 * 24) : 365;
    const predictedChurn = Math.min(1, daysSinceLastActivity / 60);

    const lifetimeValue = earned.reduce((sum, t) => sum + t.points, 0) * 0.05;

    return {
      averageTransactionValue,
      frequencyScore,
      engagementLevel,
      predictedChurn,
      lifetimeValue
    };
  }

  /**
   * Suggestions personnalisées de récompenses
   */
  static getPersonalizedRewards(
    customerPoints: number,
    level: LoyaltyLevel,
    previousRedemptions: LoyaltyReward[],
    preferences?: string[]
  ): LoyaltyReward[] {
    let availableRewards = ENHANCED_REWARDS.filter(r =>
      r.isActive &&
      r.cost <= customerPoints &&
      (r.stock === undefined || r.stock > 0)
    );

    if (preferences && preferences.length > 0) {
      const preferredCategories = availableRewards.filter(r =>
        preferences.includes(r.category)
      );
      if (preferredCategories.length > 0) {
        availableRewards = preferredCategories;
      }
    }

    const recentRedemptions = previousRedemptions.slice(0, 3);
    availableRewards = availableRewards.filter(r =>
      !recentRedemptions.some(recent => recent.id === r.id)
    );

    return availableRewards
      .sort((a, b) => {
        const popularityDiff = b.popularity - a.popularity;
        const levelBonus = this.getLevelBonus(a, level) - this.getLevelBonus(b, level);
        return popularityDiff + levelBonus;
      })
      .slice(0, 6);
  }

  private static getLevelBonus(reward: LoyaltyReward, level: LoyaltyLevel): number {
    if (['experience', 'service'].includes(reward.category) && level.id >= 3) {
      return 20;
    }
    if (['boisson', 'dessert'].includes(reward.category)) {
      return 10;
    }
    return 0;
  }
}

// ==========================================
// SCHÉMAS DE VALIDATION AVANCÉS
// ==========================================

const earnPointsSchema = z.object({
  customerId: z.number().positive('ID client invalide'),
  points: z.number().positive('Points doivent être positifs').max(10000, 'Points maximum dépassés'),
  description: z.string().min(1, 'Description requise').max(200, 'Description trop longue'),
  orderId: z.number().positive('ID commande invalide').optional(),
  campaignId: z.number().positive('ID campagne invalide').optional(),
  bonusMultiplier: z.number().min(1).max(5).optional(),
  expiresAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional()
});

const redeemPointsSchema = z.object({
  customerId: z.number().positive('ID client invalide'),
  rewardId: z.number().positive('ID récompense invalide'),
  quantity: z.number().positive().max(10, 'Quantité maximum: 10').default(1),
  description: z.string().max(200, 'Description trop longue').optional(),
  deliveryAddress: z.string().max(500).optional(),
  notes: z.string().max(300).optional()
});

const customerIdParamSchema = z.object({
  customerId: z.string().regex(/^\d+$/, 'ID client doit être un nombre')
});

// ==========================================
// ROUTES AVEC LOGIQUE MÉTIER AVANCÉE
// ==========================================

// Vue d'ensemble enrichie du programme
router.get('/overview',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  asyncHandler(async (_req, res) => {
    try {
      const db = await getDb();

      const [
        totalCustomersResult,
        totalPointsResult,
        activeCustomersResult,
        totalTransactionsResult
      ] = await Promise.all([
        db.select({ count: count() }).from(customers),
        db.select({ total: sum(customers.loyaltyPoints) }).from(customers),
        db.select({ count: count() }).from(customers).where(gte(customers.loyaltyPoints, 100)),
        db.select({ count: count() }).from(loyaltyTransactions)
      ]);

      const customersByPoints = await db.select({
        loyaltyPoints: customers.loyaltyPoints
      }).from(customers);

      const totalCustomersCount = totalCustomersResult[0]?.count || 1;
      const levelDistribution = LOYALTY_LEVELS.map(level => {
        const customersInLevel = customersByPoints.filter(c => {
          const points = c.loyaltyPoints || 0;
          if (level.maxPoints === undefined) {
            return points >= level.minPoints;
          }
          return points >= level.minPoints && points <= level.maxPoints;
        });

        return {
          level: level.name,
          count: customersInLevel.length,
          color: level.color,
          icon: level.icon,
          percentage: Math.round((customersInLevel.length / totalCustomersCount) * 100)
        };
      });

      const topCustomers = await db.select({
        id: customers.id,
        firstName: customers.firstName,
        lastName: customers.lastName,
        email: customers.email,
        loyaltyPoints: customers.loyaltyPoints,
        createdAt: customers.createdAt
      })
      .from(customers)
      .orderBy(desc(customers.loyaltyPoints))
      .limit(10);

      const enrichedTopCustomers = await Promise.all(
        topCustomers.map(async (customer) => {
          const transactions = await db.select({
            id: loyaltyTransactions.id,
            customerId: loyaltyTransactions.customerId,
            type: loyaltyTransactions.type,
            points: loyaltyTransactions.points,
            description: loyaltyTransactions.description,
            orderId: loyaltyTransactions.orderId,
            createdAt: loyaltyTransactions.createdAt,
            balance: loyaltyTransactions.points
          })
          .from(loyaltyTransactions)
          .where(eq(loyaltyTransactions.customerId, customer.id))
          .orderBy(desc(loyaltyTransactions.createdAt))
          .limit(50);

          const typedTransactions: LoyaltyTransaction[] = transactions.map(t => ({
            id: t.id as number,
            customerId: t.customerId as number,
            type: t.type as LoyaltyTransaction['type'],
            points: t.points as number,
            description: t.description || '',
            orderId: t.orderId || 0,
            createdAt: typeof t.createdAt === 'string' ? t.createdAt : new Date(t.createdAt).toISOString(),
            balance: t.balance as number
          }));

          const level = AdvancedLoyaltyService.getLevelForPoints(customer.loyaltyPoints || 0);
          const metrics = AdvancedLoyaltyService.calculateAdvancedMetrics(typedTransactions);

          return {
            ...customer,
            level,
            metrics,
            joinedDaysAgo: Math.floor((Date.now() - new Date(customer.createdAt).getTime()) / (1000 * 60 * 60 * 24))
          };
        })
      );

      const rewardsWithStats = ENHANCED_REWARDS.filter(r => r.isActive).map(reward => ({
        ...reward,
        totalRedemptions: Math.floor(Math.random() * 100)
      }));

      const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentActivity = await db.select({
        type: loyaltyTransactions.type,
        points: loyaltyTransactions.points,
        createdAt: loyaltyTransactions.createdAt
      })
      .from(loyaltyTransactions)
      .where(gte(loyaltyTransactions.createdAt, last30Days));

      const performanceMetrics = {
        dailyActiveUsers: Math.floor(recentActivity.length / 30),
        averagePointsPerTransaction: recentActivity.length > 0 ?
          Math.round(recentActivity.reduce((sum, t) => sum + t.points, 0) / recentActivity.length) : 0,
        redemptionRate: recentActivity.length > 0 ?
          Math.round((recentActivity.filter(t => t.type === 'redeemed').length / recentActivity.length) * 100) : 0
      };

      res.json({
        success: true,
        data: {
          overview: {
            totalCustomers: totalCustomersResult[0]?.count || 0,
            totalPoints: totalPointsResult[0]?.total || 0,
            activeCustomers: activeCustomersResult[0]?.count || 0,
            totalTransactions: totalTransactionsResult[0]?.count || 0,
            levels: LOYALTY_LEVELS,
            performance: performanceMetrics
          },
          distribution: levelDistribution,
          topCustomers: enrichedTopCustomers,
          rewards: rewardsWithStats
        }
      });
    } catch (error) {
      logger.error('Erreur overview fidélité avancé', {
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des données de fidélité'
      });
    }
  })
);

// Profil client enrichi
router.get('/customer/:customerId',
  authenticateUser,
  validateParams(customerIdParamSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const customerId = parseInt(req.params.customerId as string);
      const db = await getDb();

      const customerResult = await db.select({
        id: customers.id,
        firstName: customers.firstName,
        lastName: customers.lastName,
        email: customers.email,
        phone: customers.phone,
        loyaltyPoints: customers.loyaltyPoints,
        createdAt: customers.createdAt,
        updatedAt: customers.updatedAt
      })
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

      if (customerResult.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Client non trouvé'
        });
        return;
      }

      const customer = customerResult[0];
      const points = customer.loyaltyPoints || 0;
      const level = AdvancedLoyaltyService.getLevelForPoints(points);
      const nextLevelInfo = AdvancedLoyaltyService.getNextLevelInfo(points);

      const allTransactions = await db.select({
        id: loyaltyTransactions.id,
        customerId: loyaltyTransactions.customerId,
        type: loyaltyTransactions.type,
        points: loyaltyTransactions.points,
        description: loyaltyTransactions.description,
        orderId: loyaltyTransactions.orderId,
        createdAt: loyaltyTransactions.createdAt,
        balance: points as any
      })
      .from(loyaltyTransactions)
      .where(eq(loyaltyTransactions.customerId, customerId))
      .orderBy(desc(loyaltyTransactions.createdAt));

      const typedTransactions: LoyaltyTransaction[] = allTransactions.map(t => ({
        id: t.id,
        customerId: t.customerId || 0,
        type: t.type as LoyaltyTransaction['type'],
        points: t.points,
        description: t.description || '',
        orderId: t.orderId || 0,
        createdAt: t.createdAt.toISOString(),
        balance: t.balance
      }));

      const metrics = AdvancedLoyaltyService.calculateAdvancedMetrics(typedTransactions);

      const earnedTransactions = typedTransactions.filter(t => ['earned', 'bonus'].includes(t.type));
      const redeemedTransactions = typedTransactions.filter(t => t.type === 'redeemed');
      const expiredTransactions = typedTransactions.filter(t => t.type === 'expired');

      const stats = {
        totalEarned: earnedTransactions.reduce((sum, t) => sum + t.points, 0),
        totalRedeemed: redeemedTransactions.reduce((sum, t) => sum + t.points, 0),
        totalExpired: expiredTransactions.reduce((sum, t) => sum + t.points, 0),
        currentPoints: points,
        ...nextLevelInfo
      };

      const validPreviousRewards = redeemedTransactions.slice(0, 10).map(t => {
        if (!t.rewardId) return null;
        return ENHANCED_REWARDS.find(r => r.id === t.rewardId) || null;
      }).filter((r): r is LoyaltyReward => r !== null);

      const personalizedRewards = AdvancedLoyaltyService.getPersonalizedRewards(
        points,
        level,
        validPreviousRewards
      );

      const currentLevel = AdvancedLoyaltyService.getLevelForPoints(customer.loyaltyPoints || 0);
      const nextLevel = AdvancedLoyaltyService.getNextLevelInfo(customer.loyaltyPoints || 0).nextLevel;

      const customerData: CustomerLoyaltyData = {
        customerId: customer.id,
        currentPoints: customer.loyaltyPoints || 0,
        totalPointsEarned: stats.totalEarned || 0,
        totalPointsRedeemed: stats.totalRedeemed || 0,
        currentLevel,
        nextLevel: nextLevel || undefined,
        progressToNextLevel: AdvancedLoyaltyService.getNextLevelInfo(customer.loyaltyPoints || 0).progress,
        pointsToNextLevel: AdvancedLoyaltyService.getNextLevelInfo(customer.loyaltyPoints || 0).pointsToNext,
        joinDate: customer?.createdAt?.toISOString() ?? new Date().toISOString(),
        lastActivity: customer?.updatedAt?.toISOString() ?? new Date().toISOString(),
        tier: currentLevel.name.toLowerCase() as CustomerLoyaltyData['tier'],
        lifetimeValue: metrics.lifetimeValue,
        averageOrderValue: metrics.averageTransactionValue * 0.05,
        visitFrequency: metrics.frequencyScore
      };

      res.json({
        success: true,
        data: {
          customer: customerData,
          level: {
            current: level,
            ...nextLevelInfo
          },
          stats,
          personalizedRewards,
          recentTransactions: typedTransactions.slice(0, 20),
          insights: {
            riskLevel: metrics.predictedChurn > 0.7 ? 'high' : metrics.predictedChurn > 0.4 ? 'medium' : 'low',
            engagementLevel: metrics.engagementLevel,
            recommendations: generateCustomerRecommendations(stats, level, metrics)
          }
        }
      });
    } catch (error) {
      logger.error('Erreur profil client fidélité', {
        customerId: req.params.customerId,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du profil de fidélité'
      });
    }
  })
);

// Gagner des points avec logique avancée
router.post('/earn-points',
  authenticateUser,
  requirePermission('customers', 'canUpdate'),
  validateBody(earnPointsSchema),
  asyncHandler(async (req, res) => {
    const { customerId, points, orderId, campaignId, description, bonusMultiplier, expiresAt, metadata } = req.body;

    try {
      const db = await getDb();

      const customerResult = await db.select()
        .from(customers)
        .where(eq(customers.id, customerId))
        .limit(1);

      if (customerResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Client non trouvé'
        });
      }

      const customer = customerResult[0];
      const currentPoints = customer?.loyaltyPoints || 0;
      const currentLevel = AdvancedLoyaltyService.getLevelForPoints(currentPoints);

      const finalPoints = AdvancedLoyaltyService.calculatePointsToAdd(
        points,
        currentPoints,
        1, // campaignMultiplier
        bonusMultiplier || 1,
        1 // specialEventMultiplier
      );

      const newTotalPoints = currentPoints + finalPoints;
      const newLevel = AdvancedLoyaltyService.getLevelForPoints(newTotalPoints);
      const levelChanged = newLevel.id !== currentLevel.id;

      await db.transaction(async (tx) => {
        await tx.update(customers)
          .set({
            loyaltyPoints: newTotalPoints,
            updatedAt: new Date()
          })
          .where(eq(customers.id, customerId));

        const transactionDescription = description;

        const transactionData = {
          customerId,
          type: campaignId ? 'bonus' : 'earned',
          points: finalPoints,
          orderId,
          description: transactionDescription,
          createdAt: new Date(),
          expiresAt: expiresAt,
          metadata: metadata
        };

        await tx.insert(loyaltyTransactions).values(transactionData);

        await tx.insert(activityLogs).values({
          userId: req.user?.id || 0,
          action: 'loyalty_points_earned',
          entity: 'customers',
          entityId: customerId,
          details: `${finalPoints} points gagnés: ${description}${levelChanged ? ` - Niveau ${currentLevel.name} → ${newLevel.name}` : ''}`,
          createdAt: new Date()
        });
      });

      const nextLevelInfo = AdvancedLoyaltyService.getNextLevelInfo(newTotalPoints);
      const personalizedRewards = AdvancedLoyaltyService.getPersonalizedRewards(
        newTotalPoints,
        newLevel,
        []
      );

      res.json({
        success: true,
        message: `${finalPoints} points ajoutés avec succès`,
        data: {
          pointsAdded: finalPoints,
          breakdown: {
            basePoints: points,
            levelMultiplier: currentLevel.pointsRate,
            bonusMultiplier: bonusMultiplier || 1,
            totalMultiplier: currentLevel.pointsRate * (bonusMultiplier || 1)
          },
          customer: {
            previousPoints: currentPoints,
            newTotal: newTotalPoints,
            previousLevel: currentLevel,
            newLevel: newLevel,
            levelChanged,
            ...nextLevelInfo
          },
          personalizedRewards: personalizedRewards.slice(0, 3)
        }
      });
    } catch (error) {
      logger.error('Erreur ajout points avancé', {
        customerId,
        points,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'ajout des points'
      });
    }
  })
);

// Échange de récompenses avec validation avancée
router.post('/redeem-reward',
  authenticateUser,
  requirePermission('customers', 'canUpdate'),
  validateBody(redeemPointsSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const { rewardId, customerId, quantity, description, deliveryAddress, notes } = req.body;
      const db = await getDb();

      const customerResult = await db.select()
        .from(customers)
        .where(eq(customers.id, customerId))
        .limit(1);

      if (customerResult.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Client non trouvé'
        });
        return;
      }

      const customer = customerResult[0];
      const currentPoints = customer?.loyaltyPoints || 0;
      const customerLevel = AdvancedLoyaltyService.getLevelForPoints(currentPoints);

      const reward = ENHANCED_REWARDS.find(r => r.id === rewardId);

      if (!reward) {
        res.status(404).json({
          success: false,
          message: 'Récompense non trouvée'
        });
        return;
      }

      const validation = AdvancedLoyaltyService.canRedeemReward(
        currentPoints,
        customerLevel,
        reward,
        quantity
      );

      if (!validation.canRedeem) {
        res.status(400).json({
          success: false,
          message: validation.reason || 'Impossible d\'échanger cette récompense',
          details: {
            requirements: validation.requirements,
            alternatives: validation.alternatives,
            customerPoints: currentPoints,
            requiredPoints: reward.cost * quantity
          }
        });
        return;
      }

      const pointsUsed = reward.cost * quantity;
      const newPoints = currentPoints - pointsUsed;

      await db.transaction(async (tx) => {
        await tx.update(customers)
          .set({
            loyaltyPoints: newPoints,
            updatedAt: new Date()
          })
          .where(eq(customers.id, customerId));

        const transactionData = {
          customerId,
          type: 'redeemed' as const,
          points: pointsUsed,
          description: description || `Échange: ${quantity}x ${reward.name}`,
          createdAt: new Date(),
          rewardId: rewardId,
          notes: notes,
          deliveryAddress: deliveryAddress,
        };

        await tx.insert(loyaltyTransactions).values(transactionData);

        await tx.insert(activityLogs).values({
          userId: req.user?.id || 0,
          action: 'loyalty_points_redeemed',
          entity: 'customers',
          entityId: customerId,
          details: `${pointsUsed} points échangés contre: ${quantity}x ${reward.name}`,
          createdAt: new Date()
        });
      });

      const remainingRewards = AdvancedLoyaltyService.getPersonalizedRewards(
        newPoints,
        customerLevel,
        [reward]
      );

      const nextLevelInfo = AdvancedLoyaltyService.getNextLevelInfo(newPoints);

      res.json({
        success: true,
        message: 'Récompense échangée avec succès! 🎉',
        data: {
          exchange: {
            reward: {
              name: reward.name,
              category: reward.category,
              description: reward.description,
              estimatedDeliveryTime: reward.estimatedDeliveryTime
            },
            quantity,
            pointsUsed,
            deliveryInfo: deliveryAddress ? {
              address: deliveryAddress,
              estimatedDelivery: reward.estimatedDeliveryTime ?
                new Date(Date.now() + reward.estimatedDeliveryTime * 60000).toISOString() :
                undefined
            } : null
          },
          customer: {
            previousPoints: currentPoints,
            remainingPoints: newPoints,
            level: customerLevel,
            ...nextLevelInfo
          },
          suggestions: {
            availableRewards: remainingRewards.slice(0, 3),
            message: newPoints > 500 ?
              'Vous avez encore de nombreux points à utiliser!' :
              newPoints > 0 ?
                'Continuez à gagner des points pour débloquer plus de récompenses!' :
                'Effectuez des achats pour gagner de nouveaux points!'
          }
        }
      });
    } catch (error) {
      logger.error('Erreur échange récompense avancé', {
        customerId: req.body.customerId,
        rewardId: req.body.rewardId,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'échange de la récompense'
      });
    }
  })
);

// Types pour les recommandations
interface CustomerStats {
  currentPoints: number;
  totalRedeemed: number;
  [key: string]: unknown;
}

interface CustomerMetrics {
  predictedChurn: number;
  frequencyScore: number;
  [key: string]: unknown;
}

// Fonction helper pour les recommandations
function generateCustomerRecommendations(
  stats: CustomerStats,
  level: LoyaltyLevel,
  metrics: CustomerMetrics
): string[] {
  const recommendations: string[] = [];

  if (metrics.predictedChurn > 0.6) {
    recommendations.push('Client à risque de départ - proposer une offre personnalisée');
  }

  if (stats.currentPoints > level.minPoints * 2) {
    recommendations.push('Encourager l\'utilisation des points accumulés');
  }

  if (metrics.frequencyScore < 30) {
    recommendations.push('Augmenter l\'engagement avec des offres ciblées');
  }

  if (level.id >= 3 && stats.totalRedeemed === 0) {
    recommendations.push('Client premium qui n\'utilise pas ses avantages');
  }

  return recommendations;
}

export default router;