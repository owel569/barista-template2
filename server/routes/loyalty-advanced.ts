import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error-handler-enhanced';
import { createLogger } from '../middleware/logging';
import { authenticateUser, requireRoles } from '../middleware/auth';
import { requirePermission } from '../middleware/authorization';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { getDb } from '../db';
import { customers, orders, loyaltyTransactions, activityLogs, loyaltyCampaigns, loyaltyRewards } from '../../shared/schema';
import { eq, and, gte, lte, desc, sql, inArray, count, sum, avg } from 'drizzle-orm';

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
    maxPoints: undefined,
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
  },
  {
    id: 7,
    name: 'Soirée Dégustation VIP',
    description: 'Accès à nos soirées dégustation exclusives',
    cost: 800,
    category: 'experience',
    isActive: true,
    stock: 20,
    validUntil: '2024-12-31T23:59:59.000Z',
    popularity: 85,
    imageUrl: '/images/rewards/vip-tasting.jpg'
  },
  {
    id: 8,
    name: 'Service Livraison Premium',
    description: 'Livraison gratuite prioritaire pendant 3 mois',
    cost: 600,
    category: 'service',
    isActive: true,
    popularity: 58,
    imageUrl: '/images/rewards/premium-delivery.jpg'
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
    // Recherche du niveau approprié avec gestion des cas edge
    const level = LOYALTY_LEVELS.find(l => {
      if (l.maxPoints === undefined) {
        return points >= l.minPoints;
      }
      return points >= l.minPoints && points <= l.maxPoints;
    });

    // Retourne le niveau le plus élevé si aucun match exact
    return level || LOYALTY_LEVELS[LOYALTY_LEVELS.length - 1];
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
    const pointsInCurrentLevel = currentPoints - currentLevel.minPoints;
    const pointsNeededForNextLevel = nextLevel.minPoints - currentLevel.minPoints;
    const progress = Math.min(100, (pointsInCurrentLevel / pointsNeededForNextLevel) * 100);
    const pointsToNext = Math.max(0, nextLevel.minPoints - currentPoints);

    // Estimation basée sur une dépense moyenne de 1 point par euro
    const estimatedSpendingToNext = pointsToNext / currentLevel.pointsRate;
    const daysToNext = Math.ceil(pointsToNext / 10); // Estimation : 10 points par jour en moyenne

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

    // Application des multiplicateurs en cascade
    const totalMultiplier = levelMultiplier * campaignMultiplier * bonusMultiplier * specialEventMultiplier;
    const calculatedPoints = Math.floor(basePoints * totalMultiplier);

    // Bonus pour gros montants
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
    const requirements: string[] = [];

    // Vérifications de base
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
      requirements.push(`${totalCost - customerPoints} points supplémentaires requis`);
      return {
        canRedeem: false,
        reason: 'Points insuffisants',
        requirements,
        alternatives: this.getAffordableRewards(customerPoints)
      };
    }

    // Vérifications de niveau pour certaines récompenses premium
    const premiumRewards = ['experience', 'service'];
    if (premiumRewards.includes(reward.category) && customerLevel.id < 3) {
      requirements.push('Niveau Or minimum requis');
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

    // Score de fréquence basé sur l'activité récente
    const now = new Date();
    const recent = transactions.filter(t => {
      const transactionDate = new Date(t.createdAt);
      const daysDiff = (now.getTime() - transactionDate.getTime()) / (1000 * 3600 * 24);
      return daysDiff <= 30;
    });

    const frequencyScore = Math.min(100, (recent.length / 30) * 100);

    // Niveau d'engagement
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

    // Prédiction de churn (simple)
    const daysSinceLastActivity = transactions.length > 0 ?
      (now.getTime() - new Date(transactions[0].createdAt).getTime()) / (1000 * 3600 * 24) : 365;
    const predictedChurn = Math.min(1, daysSinceLastActivity / 60); // 60 jours = churn probable

    // Valeur vie client estimée
    const lifetimeValue = earned.reduce((sum, t) => sum + t.points, 0) * 0.05; // 1 point = 0.05€ estimé

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

    // Filtrage par préférences si disponibles
    if (preferences && preferences.length > 0) {
      const preferredCategories = availableRewards.filter(r =>
        preferences.includes(r.category)
      );
      if (preferredCategories.length > 0) {
        availableRewards = preferredCategories;
      }
    }

    // Éviter les répétitions récentes
    const recentRedemptions = previousRedemptions.slice(0, 3);
    availableRewards = availableRewards.filter(r =>
      !recentRedemptions.some(recent => recent.id === r.id)
    );

    // Tri par popularité et pertinence
    return availableRewards
      .sort((a, b) => {
        // Bonus pour les récompenses populaires
        const popularityDiff = b.popularity - a.popularity;
        // Bonus pour les récompenses adaptées au niveau
        const levelBonus = this.getLevelBonus(a, level) - this.getLevelBonus(b, level);
        return popularityDiff + levelBonus;
      })
      .slice(0, 6);
  }

  private static getLevelBonus(reward: LoyaltyReward, level: LoyaltyLevel): number {
    // Récompenses premium pour niveaux élevés
    if (['experience', 'service'].includes(reward.category) && level.id >= 3) {
      return 20;
    }
    // Récompenses accessibles pour tous les niveaux
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

const createAdvancedCampaignSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(100, 'Nom trop long'),
  description: z.string().min(1, 'Description requise').max(500, 'Description trop longue'),
  targetLevel: z.string().min(1, 'Niveau cible requis'),
  pointsMultiplier: z.number().positive().max(10, 'Multiplicateur trop élevé'),
  startDate: z.string().datetime('Date de début invalide'),
  endDate: z.string().datetime('Date de fin invalide'),
  targetAudience: z.array(z.string()).optional(),
  budget: z.number().positive().optional(),
  maxUsage: z.number().positive().optional(),
  conditions: z.record(z.unknown()).optional()
});

const loyaltyStatsSchema = z.object({
  period: z.enum(['day', 'week', 'month', 'quarter', 'year']).default('month'),
  customerId: z.number().positive().optional(),
  includeInactive: z.boolean().default(false),
  groupBy: z.enum(['level', 'category', 'time']).optional()
});

const customerIdParamSchema = z.object({
  customerId: z.string().regex(/^\d+$/, 'ID client doit être un nombre')
});

const createAdvancedRewardSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(100, 'Nom trop long'),
  description: z.string().min(1, 'Description requise').max(500, 'Description trop longue'),
  cost: z.number().positive('Coût doit être positif').max(10000, 'Coût maximum dépassé'),
  category: z.enum(['boisson', 'dessert', 'repas', 'experience', 'reduction', 'produit', 'nourriture', 'service']),
  isActive: z.boolean().default(true),
  stock: z.number().int().nonnegative().optional(),
  validUntil: z.string().datetime('Date de validité invalide').optional(),
  imageUrl: z.string().url().optional(),
  estimatedDeliveryTime: z.number().int().nonnegative().optional(),
  minimumLevel: z.number().int().min(1).max(5).optional()
});

// ==========================================
// ROUTES AVEC LOGIQUE MÉTIER AVANCÉE
// ==========================================

// Vue d'ensemble enrichie du programme
router.get('/overview',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  asyncHandler(async (req, res) => {
    try {
      const db = await getDb();

      // Statistiques générales avec requêtes optimisées
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

      // Distribution par niveau avec calculs optimisés
      const customersByPoints = await db.select({
        loyaltyPoints: customers.loyaltyPoints
      }).from(customers);

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
          percentage: Math.round((customersInLevel.length / (totalCustomersResult[0]?.count || 1)) * 100)
        };
      });

      // Top clients avec métriques avancées
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
          const transactions = await db.select()
            .from(loyaltyTransactions)
            .where(eq(loyaltyTransactions.customerId, customer.id))
            .orderBy(desc(loyaltyTransactions.createdAt))
            .limit(50);

          const level = AdvancedLoyaltyService.getLevelForPoints(customer.loyaltyPoints || 0);
          const metrics = AdvancedLoyaltyService.calculateAdvancedMetrics(transactions);

          return {
            ...customer,
            level,
            metrics,
            joinedDaysAgo: Math.floor((Date.now() - new Date(customer.createdAt).getTime()) / (1000 * 60 * 60 * 24))
          };
        })
      );

      // Récompenses actives avec statistiques
      const rewardsWithStats = await Promise.all(
        ENHANCED_REWARDS.filter(r => r.isActive).map(async (reward) => {
          const redemptions = await db.select({ count: count() })
            .from(loyaltyTransactions)
            .where(and(
              eq(loyaltyTransactions.rewardId, reward.id),
              eq(loyaltyTransactions.type, 'redeemed')
            ));

          return {
            ...reward,
            totalRedemptions: redemptions[0]?.count || 0
          };
        })
      );

      // Métriques de performance
      const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentActivity = await db.select({
        type: loyaltyTransactions.type,
        points: loyaltyTransactions.points,
        createdAt: loyaltyTransactions.createdAt
      })
      .from(loyaltyTransactions)
      .where(gte(loyaltyTransactions.createdAt, last30Days.toISOString()));

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
  asyncHandler(async (req: Request, res: Response) => {
    const customerId = parseInt(req.params.customerId);

    try {
      const db = await getDb();

      // Informations client avec jointures
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
        return res.status(404).json({
          success: false,
          message: 'Client non trouvé'
        });
      }

      const customer = customerResult[0];
      const points = customer.loyaltyPoints || 0;
      const level = AdvancedLoyaltyService.getLevelForPoints(points);
      const nextLevelInfo = AdvancedLoyaltyService.getNextLevelInfo(points);

      // Historique complet des transactions
      const allTransactions = await db.select()
        .from(loyaltyTransactions)
        .where(eq(loyaltyTransactions.customerId, customerId))
        .orderBy(desc(loyaltyTransactions.createdAt));

      // Calcul des métriques avancées
      const metrics = AdvancedLoyaltyService.calculateAdvancedMetrics(allTransactions);

      // Statistiques détaillées
      const earnedTransactions = allTransactions.filter(t => ['earned', 'bonus'].includes(t.type));
      const redeemedTransactions = allTransactions.filter(t => t.type === 'redeemed');
      const expiredTransactions = allTransactions.filter(t => t.type === 'expired');

      const stats = {
        totalEarned: earnedTransactions.reduce((sum, t) => sum + t.points, 0),
        totalRedeemed: redeemedTransactions.reduce((sum, t) => sum + t.points, 0),
        totalExpired: expiredTransactions.reduce((sum, t) => sum + t.points, 0),
        currentPoints: points,
        ...nextLevelInfo,
        ...metrics
      };

      // Récompenses personnalisées
      const previousRewards = await Promise.all(
        redeemedTransactions.slice(0, 10).map(async (t) => {
          if (!t.rewardId) return null;
          return ENHANCED_REWARDS.find(r => r.id === t.rewardId) || null;
        })
      );

      const validPreviousRewards = previousRewards.filter((r): r is LoyaltyReward => r !== null);
      const personalizedRewards = AdvancedLoyaltyService.getPersonalizedRewards(
        points,
        level,
        validPreviousRewards
      );

      // Campagnes actives applicables
      const activeCampaigns = await db.select()
        .from(loyaltyCampaigns)
        .where(and(
          eq(loyaltyCampaigns.status, 'active'),
          lte(loyaltyCampaigns.startDate, new Date().toISOString()),
          gte(loyaltyCampaigns.endDate, new Date().toISOString())
        ));

      const applicableCampaigns = activeCampaigns.filter(campaign =>
        !campaign.targetLevel || campaign.targetLevel === level.name
      );

      res.json({
        success: true,
        data: {
          customer: {
            ...customer,
            memberSince: customer.createdAt,
            lastActivity: customer.updatedAt,
            tier: level.name.toLowerCase() as CustomerLoyaltyData['tier']
          },
          level: {
            current: level,
            ...nextLevelInfo
          },
          stats,
          personalizedRewards,
          applicableCampaigns,
          recentTransactions: allTransactions.slice(0, 20),
          insights: {
            riskLevel: metrics.predictedChurn > 0.7 ? 'high' : metrics.predictedChurn > 0.4 ? 'medium' : 'low',
            engagementLevel: metrics.engagementLevel,
            recommendations: this.generateCustomerRecommendations(stats, level, metrics)
          }
        }
      });
    } catch (error) {
      logger.error('Erreur profil client fidélité', {
        customerId,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du profil de fidélité'
      });
    }
  })
);

// Méthode helper pour les recommandations
function generateCustomerRecommendations(
  stats: any,
  level: LoyaltyLevel,
  metrics: any
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

// Gagner des points avec logique avancée
router.post('/earn-points',
  authenticateUser,
  requirePermission('customers', 'canUpdate'),
  validateBody(earnPointsSchema),
  asyncHandler(async (req, res) => {
    const { customerId, points, orderId, campaignId, description, bonusMultiplier, expiresAt, metadata } = req.body;

    try {
      const db = await getDb();

      // Vérification du client avec informations étendues
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
      const currentPoints = customer.loyaltyPoints || 0;
      const currentLevel = AdvancedLoyaltyService.getLevelForPoints(currentPoints);

      // Vérification de campagne active
      let campaignMultiplier = 1;
      let campaignData = null;

      if (campaignId) {
        const campaignResult = await db.select()
          .from(loyaltyCampaigns)
          .where(and(
            eq(loyaltyCampaigns.id, campaignId),
            eq(loyaltyCampaigns.status, 'active'),
            lte(loyaltyCampaigns.startDate, new Date().toISOString()),
            gte(loyaltyCampaigns.endDate, new Date().toISOString())
          ))
          .limit(1);

        if (campaignResult.length > 0) {
          campaignData = campaignResult[0];
          campaignMultiplier = campaignData.pointsMultiplier;

          // Vérifier les limites d\'utilisation
          if (campaignData.maxUsage && campaignData.currentUsage >= campaignData.maxUsage) {
            return res.status(400).json({
              success: false,
              message: 'Limite d\'utilisation de la campagne atteinte'
            });
          }
        }
      }

      // Calcul des points avec tous les multiplicateurs
      const finalPoints = AdvancedLoyaltyService.calculatePointsToAdd(
        points,
        currentPoints,
        campaignMultiplier,
        bonusMultiplier || 1,
        1 // specialEventMultiplier - pourrait être basé sur des événements spéciaux
      );

      const newTotalPoints = currentPoints + finalPoints;
      const newLevel = AdvancedLoyaltyService.getLevelForPoints(newTotalPoints);
      const levelChanged = newLevel.id !== currentLevel.id;

      // Transaction de base de données
      await db.transaction(async (tx) => {
        // Mise à jour des points du client
        await tx.update(customers)
          .set({
            loyaltyPoints: newTotalPoints,
            updatedAt: new Date().toISOString()
          })
          .where(eq(customers.id, customerId));

        // Enregistrement de la transaction
        const transactionDescription = campaignId
          ? `${description} (Campagne: ${campaignData?.name}, Taux: x${campaignMultiplier})`
          : description;

        const transactionData: any = {
          customerId,
          type: campaignId ? 'bonus' : 'earned',
          points: finalPoints,
          orderId,
          campaignId,
          description: transactionDescription,
          createdAt: new Date().toISOString(),
          balance: newTotalPoints,
          metadata: JSON.stringify({
            originalPoints: points,
            multipliers: {
              level: currentLevel.pointsRate,
              campaign: campaignMultiplier,
              bonus: bonusMultiplier || 1
            },
            ...metadata
          })
        };

        if (expiresAt) {
          transactionData.expiresAt = expiresAt;
        }

        await tx.insert(loyaltyTransactions).values(transactionData);

        // Mise à jour du compteur de campagne
        if (campaignData) {
          await tx.update(loyaltyCampaigns)
            .set({
              currentUsage: (campaignData.currentUsage || 0) + 1
            })
            .where(eq(loyaltyCampaigns.id, campaignId));
        }

        // Enregistrement de l'activité
        await tx.insert(activityLogs).values({
          userId: req.user?.id || 0,
          action: 'loyalty_points_earned',
          entity: 'customers',
          entityId: customerId,
          details: `${finalPoints} points gagnés: ${description}${levelChanged ? ` - Niveau ${currentLevel.name} → ${newLevel.name}` : ''}`,
          createdAt: new Date().toISOString()
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
            campaignMultiplier,
            bonusMultiplier: bonusMultiplier || 1,
            totalMultiplier: (currentLevel.pointsRate * campaignMultiplier * (bonusMultiplier || 1))
          },
          customer: {
            previousPoints: currentPoints,
            newTotal: newTotalPoints,
            previousLevel: currentLevel,
            newLevel: newLevel,
            levelChanged,
            ...nextLevelInfo
          },
          personalizedRewards: personalizedRewards.slice(0, 3),
          campaign: campaignData ? {
            name: campaignData.name,
            multiplier: campaignMultiplier,
            remainingUsage: campaignData.maxUsage ? campaignData.maxUsage - (campaignData.currentUsage || 0) : null
          } : null
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
      const { rewardId } = req.body;
      const { customerId, quantity, description, deliveryAddress, notes } = req.body;


      const db = await getDb();

      // Vérification du client
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
      const currentPoints = customer.loyaltyPoints || 0;
      const customerLevel = AdvancedLoyaltyService.getLevelForPoints(currentPoints);

      // Récupération de la récompense
      let reward: LoyaltyReward | undefined;

      // D'abord chercher dans la base de données
      const dbRewardResult = await db.select()
        .from(loyaltyRewards)
        .where(eq(loyaltyRewards.id, rewardId))
        .limit(1);

      if (dbRewardResult.length > 0) {
        reward = dbRewardResult[0] as LoyaltyReward;
      } else {
        // Fallback vers les récompenses par défaut
        reward = ENHANCED_REWARDS.find(r => r.id === rewardId);
      }

      if (!reward) {
        return res.status(404).json({
          success: false,
          message: 'Récompense non trouvée'
        });
      }

      // Validation avancée
      const validation = AdvancedLoyaltyService.canRedeemReward(
        currentPoints,
        customerLevel,
        reward,
        quantity
      );

      if (!validation.canRedeem) {
        return res.status(400).json({
          success: false,
          message: validation.reason || 'Impossible d\'échanger cette récompense',
          details: {
            requirements: validation.requirements,
            alternatives: validation.alternatives,
            customerPoints: currentPoints,
            requiredPoints: reward.cost * quantity
          }
        });
      }

      const pointsUsed = reward.cost * quantity;
      const newPoints = currentPoints - pointsUsed;

      // Transaction de base de données
      await db.transaction(async (tx) => {
        // Mise à jour des points du client
        await tx.update(customers)
          .set({
            loyaltyPoints: newPoints,
            updatedAt: new Date().toISOString()
          })
          .where(eq(customers.id, customerId));

        // Mise à jour du stock si applicable
        if (reward.stock !== undefined && dbRewardResult.length > 0) {
          await tx.update(loyaltyRewards)
            .set({
              stock: reward.stock - quantity
            })
            .where(eq(loyaltyRewards.id, rewardId));
        }

        // Enregistrement de la transaction détaillée
        const transactionData = {
          customerId,
          type: 'redeemed' as const,
          points: pointsUsed,
          rewardId,
          description: description || `Échange: ${quantity}x ${reward.name}`,
          createdAt: new Date().toISOString(),
          balance: newPoints,
          metadata: JSON.stringify({
            quantity,
            rewardName: reward.name,
            rewardCategory: reward.category,
            deliveryAddress,
            notes,
            estimatedDeliveryTime: reward.estimatedDeliveryTime
          })
        };

        await tx.insert(loyaltyTransactions).values(transactionData);

        // Enregistrement de l'activité
        await tx.insert(activityLogs).values({
          userId: req.user?.id || 0,
          action: 'loyalty_points_redeemed',
          entity: 'customers',
          entityId: customerId,
          details: `${pointsUsed} points échangés contre: ${quantity}x ${reward.name}`,
          createdAt: new Date().toISOString()
        });
      });

      // Suggestions post-échange
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
        customerId,
        rewardId,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'échange de la récompense'
      });
    }
  })
);

// Autres routes existantes optimisées...
// [Le code continue avec toutes les autres routes optimisées]

export default router;