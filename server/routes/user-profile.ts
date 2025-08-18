import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error-handler';
import { createLogger } from '../middleware/logging';
import { authenticateUser, requireRoles } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { getDb } from '../db';
import { users, customers, orders, addresses, rewards } from '../../shared/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

const userProfileRouter = Router();
const logger = createLogger('USER_PROFILE');

// ==========================================
// TYPES ET INTERFACES AMÉLIORÉS
// ==========================================

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  avatarUrl?: string;
}

export interface LoyaltyData {
  points: number;
  level: string;
  nextLevelPoints: number;
  pointsToNextLevel: number;
  totalSpent: number;
  visitsThisMonth: number;
  favoriteItems: Array<{
    id: number;
    name: string;
    orderCount: number;
    lastOrdered: string;
  }>;
  availableRewards: Array<{
    id: number;
    name: string;
    description: string;
    pointsCost: number;
    expiresAt?: string;
  }>;
  redeemedRewards: Array<{
    id: number;
    rewardId: number;
    name: string;
    redeemedAt: string;
    isUsed: boolean;
  }>;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  currency: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    orderUpdates: boolean;
    promotions: boolean;
    newMenuItems: boolean;
  };
  dietary: {
    vegetarian: boolean;
    vegan: boolean;
    glutenFree: boolean;
    lactoseFree: boolean;
    allergies: string[];
  };
}

export interface OrderHistory {
  id: number;
  orderNumber: string;
  totalAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  items: Array<{
    id: number;
    name: string;
    quantity: number;
    price: number;
    specialRequests?: string;
  }>;
  createdAt: string;
  updatedAt: string;
  deliveryAddress?: Address;
}

export interface Address {
  id: number;
  title: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  notes?: string;
}

export interface PaymentMethod {
  id: number;
  type: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  lastFour?: string;
  expiryDate?: string;
  isDefault: boolean;
}

// ==========================================
// SCHÉMAS DE VALIDATION ZOD AMÉLIORÉS
// ==========================================

const UpdateProfileSchema = z.object({
  firstName: z.string().min(1, 'Prénom requis').max(50, 'Prénom trop long'),
  lastName: z.string().min(1, 'Nom requis').max(50, 'Nom trop long'),
  email: z.string().email('Email invalide'),
  phone: z.string().regex(/^\+?[0-9\s-]{6,}$/, 'Numéro de téléphone invalide').optional(),
  avatarUrl: z.string().url('URL invalide').optional()
});

const RedeemRewardSchema = z.object({
  rewardId: z.number().positive('ID récompense invalide')
});

const PreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().min(2).optional(),
  currency: z.string().length(3).optional(),
  notifications: z.object({
    email: z.boolean().optional(),
    sms: z.boolean().optional(),
    push: z.boolean().optional(),
    orderUpdates: z.boolean().optional(),
    promotions: z.boolean().optional(),
    newMenuItems: z.boolean().optional()
  }).optional(),
  dietary: z.object({
    vegetarian: z.boolean().optional(),
    vegan: z.boolean().optional(),
    glutenFree: z.boolean().optional(),
    lactoseFree: z.boolean().optional(),
    allergies: z.array(z.string()).optional()
  }).optional()
}).strict();

const OrderHistoryQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(10),
  offset: z.coerce.number().min(0).default(0),
  status: z.enum(['pending', 'processing', 'completed', 'cancelled']).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional()
});

const AddressSchema = z.object({
  title: z.string().min(1).max(50),
  street: z.string().min(1).max(100),
  city: z.string().min(1).max(50),
  postalCode: z.string().min(1).max(20),
  country: z.string().min(1).max(50),
  isDefault: z.boolean().optional(),
  notes: z.string().max(200).optional()
});

// ==========================================
// SERVICES MÉTIER AMÉLIORÉS
// ==========================================

class UserProfileService {
  /**
   * Récupère le profil utilisateur complet
   */
  static async getUserProfile(userId: number): Promise<UserProfile | null> {
    try {
      const db = await getDb();

      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) return null;

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone ?? undefined,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        avatarUrl: user.avatarUrl ?? undefined
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
      .where(eq(orders.customerId, userId));

      // Calculer les statistiques
      const totalSpent = customerOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const visitsThisMonth = customerOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate.getMonth() === currentMonth && 
               orderDate.getFullYear() === currentYear;
      }).length;

      // Calcul des points et niveau
      const points = Math.floor(totalSpent);
      const level = points < 100 ? 'Bronze' : 
                   points < 500 ? 'Silver' : 
                   points < 1000 ? 'Gold' : 'Platinum';
      const nextLevelPoints = level === 'Bronze' ? 100 : 
                            level === 'Silver' ? 500 : 
                            level === 'Gold' ? 1000 : 2000;
      const pointsToNextLevel = Math.max(0, nextLevelPoints - points);

      // Articles favoris (analyse réelle des commandes)
      const itemCounts: Record<string, {id: number, count: number, lastOrdered: Date}> = {};

      customerOrders.forEach(order => {
        const items = order.items as Array<{id: number, name: string}> || [];
        items.forEach(item => {
          if (!itemCounts[item.id]) {
            itemCounts[item.id] = {id: item.id, count: 0, lastOrdered: new Date(order.createdAt)};
          }
          itemCounts[item.id].count++;
          if (new Date(order.createdAt) > itemCounts[item.id].lastOrdered) {
            itemCounts[item.id].lastOrdered = new Date(order.createdAt);
          }
        });
      });

      const favoriteItems = Object.values(itemCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(item => ({
          id: item.id,
          name: `Item ${item.id}`, // À remplacer par les noms réels
          orderCount: item.count,
          lastOrdered: item.lastOrdered.toISOString()
        }));

      // Récompenses disponibles et déjà échangées
      const [availableRewards, redeemedRewards] = await Promise.all([
        db.select().from(rewards).where(eq(rewards.isActive, true)),
        db.select()
          .from(rewards)
          .innerJoin(customers, eq(customers.id, userId))
          .where(eq(customers.id, userId))
      ]);

      return {
        points,
        level,
        nextLevelPoints,
        pointsToNextLevel,
        totalSpent,
        visitsThisMonth,
        favoriteItems,
        availableRewards: availableRewards.map(reward => ({
          id: reward.id,
          name: reward.name,
          description: reward.description,
          pointsCost: reward.pointsCost,
          expiresAt: reward.expiresAt?.toISOString()
        })),
        redeemedRewards: redeemedRewards.map(reward => ({
          id: reward.id,
          rewardId: reward.rewardId,
          name: reward.name,
          redeemedAt: reward.redeemedAt.toISOString(),
          isUsed: reward.isUsed
        }))
      };
    } catch (error) {
      logger.error('Erreur calcul données fidélité', { 
        userId, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      });

      return {
        points: 0,
        level: 'Bronze',
        nextLevelPoints: 100,
        pointsToNextLevel: 100,
        totalSpent: 0,
        visitsThisMonth: 0,
        favoriteItems: [],
        availableRewards: [],
        redeemedRewards: []
      };
    }
  }

  /**
   * Récupère l'historique des commandes
   */
  static async getOrderHistory(
    userId: number, 
    limit: number, 
    offset: number,
    filters?: { status?: string, from?: string, to?: string }
  ): Promise<{orders: OrderHistory[], total: number}> {
    try {
      const db = await getDb();

      // Construction de la requête de base
      let query = db.select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        totalAmount: orders.totalAmount,
        status: orders.status,
        items: orders.items,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt
      })
      .from(orders)
      .where(eq(orders.customerId, userId))
      .orderBy(desc(orders.createdAt));

      // Application des filtres
      if (filters?.status) {
        query = query.where(eq(orders.status, filters.status));
      }

      if (filters?.from) {
        query = query.where(gte(orders.createdAt, new Date(filters.from)));
      }

      if (filters?.to) {
        query = query.where(lte(orders.createdAt, new Date(filters.to)));
      }

      // Requête pour le total (pour la pagination)
      const totalQuery = query.$dynamic();
      const total = await totalQuery.execute().then(res => res.length);

      // Requête pour les données paginées
      const paginatedQuery = query.limit(limit).offset(offset);
      const userOrders = await paginatedQuery.execute();

      // Récupération des adresses associées
      const ordersWithAddresses = await Promise.all(
        userOrders.map(async order => {
          const [address] = await db.select()
            .from(addresses)
            .where(eq(addresses.orderId, order.id))
            .limit(1);

          return {
            ...order,
            deliveryAddress: address ? {
              id: address.id,
              title: address.title,
              street: address.street,
              city: address.city,
              postalCode: address.postalCode,
              country: address.country
            } : undefined
          };
        })
      );

      return {
        orders: ordersWithAddresses.map(order => ({
          id: order.id,
          orderNumber: order.orderNumber,
          totalAmount: Number(order.totalAmount),
          status: order.status,
          items: order.items as Array<{
            id: number;
            name: string;
            quantity: number;
            price: number;
            specialRequests?: string;
          }>,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
          deliveryAddress: order.deliveryAddress
        })),
        total
      };
    } catch (error) {
      logger.error('Erreur récupération historique commandes', { 
        userId, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      });
      return { orders: [], total: 0 };
    }
  }

  /**
   * Récupère les adresses de l'utilisateur
   */
  static async getUserAddresses(userId: number): Promise<Address[]> {
    try {
      const db = await getDb();

      const userAddresses = await db.select()
        .from(addresses)
        .where(eq(addresses.userId, userId))
        .orderBy(desc(addresses.isDefault), desc(addresses.createdAt));

      return userAddresses.map(address => ({
        id: address.id,
        title: address.title,
        street: address.street,
        city: address.city,
        postalCode: address.postalCode,
        country: address.country,
        isDefault: address.isDefault,
        notes: address.notes ?? undefined
      }));
    } catch (error) {
      logger.error('Erreur récupération adresses', { 
        userId, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      });
      return [];
    }
  }

  /**
   * Ajoute ou met à jour une adresse
   */
  static async saveAddress(userId: number, addressData: Omit<Address, 'id'>, addressId?: number): Promise<Address | null> {
    try {
      const db = await getDb();

      // Si c'est une nouvelle adresse par défaut, désactiver les autres par défaut
      if (addressData.isDefault) {
        await db.update(addresses)
          .set({ isDefault: false })
          .where(and(
            eq(addresses.userId, userId),
            sql`${addresses.id} != ${addressId ?? -1}`
          ));
      }

      let address: Address;

      if (addressId) {
        // Mise à jour
        const [updated] = await db.update(addresses)
          .set({
            ...addressData,
            updatedAt: new Date()
          })
          .where(and(
            eq(addresses.id, addressId),
            eq(addresses.userId, userId)
          ))
          .returning();

        if (!updated) return null;
        address = updated;
      } else {
        // Création
        const [created] = await db.insert(addresses)
          .values({
            ...addressData,
            userId,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();

        address = created;
      }

      return {
        id: address.id,
        title: address.title,
        street: address.street,
        city: address.city,
        postalCode: address.postalCode,
        country: address.country,
        isDefault: address.isDefault,
        notes: address.notes ?? undefined
      };
    } catch (error) {
      logger.error('Erreur sauvegarde adresse', { 
        userId, 
        addressId,
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      });
      return null;
    }
  }
}

// ==========================================
// ROUTES AMÉLIORÉES AVEC NOUVELLES FONCTIONNALITÉS
// ==========================================

// Récupérer le profil utilisateur
userProfileRouter.get('/profile', 
  authenticateUser,
  asyncHandler(async (req, res) => {
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
  })
);

// Mettre à jour le profil utilisateur
userProfileRouter.put('/profile', 
  authenticateUser,
  validateBody(UpdateProfileSchema),
  asyncHandler(async (req, res) => {
    const { firstName, lastName, email, phone, avatarUrl } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'Utilisateur non authentifié' 
      });
    }

    const db = await getDb();

    // Vérifier si l'email est déjà utilisé
    const [existingUser] = await db.select()
      .from(users)
      .where(and(
        eq(users.email, email),
        sql`${users.id} != ${userId}`
      ))
      .limit(1);

    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        message: 'Email déjà utilisé' 
      });
    }

    // Mettre à jour le profil
    const [updatedUser] = await db.update(users)
      .set({
        firstName,
        lastName,
        email,
        phone: phone ?? null,
        avatarUrl: avatarUrl ?? null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }

    logger.info('Profil utilisateur mis à jour', { userId });
    res.json({
      success: true,
      data: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        phone: updatedUser.phone ?? undefined,
        avatarUrl: updatedUser.avatarUrl ?? undefined
      }
    });
  })
);

// Données de fidélité
userProfileRouter.get('/loyalty', 
  authenticateUser,
  asyncHandler(async (req, res) => {
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
  })
);

// Échanger une récompense
userProfileRouter.post('/loyalty/redeem', 
  authenticateUser,
  validateBody(RedeemRewardSchema),
  asyncHandler(async (req, res) => {
    const { rewardId } = req.body;
    const userId = req.user?.id;

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

    const db = await getDb();

    try {
      // Enregistrer la récompense échangée
      await db.insert(customers)
        .values({
          userId,
          rewardId,
          redeemedAt: new Date(),
          isUsed: false
        });

      logger.info('Récompense échangée', { userId, rewardId });

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
      });
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
    const { limit, offset, status, from, to } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'Utilisateur non authentifié' 
      });
    }

    const { orders, total } = await UserProfileService.getOrderHistory(
      userId, 
      limit, 
      offset,
      { status, from, to }
    );

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      }
    });
  })
);

// Gestion des adresses
userProfileRouter.get('/addresses', 
  authenticateUser,
  asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'Utilisateur non authentifié' 
      });
    }

    const addresses = await UserProfileService.getUserAddresses(userId);
    res.json({
      success: true,
      data: addresses
    });
  })
);

userProfileRouter.post('/addresses', 
  authenticateUser,
  validateBody(AddressSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'Utilisateur non authentifié' 
      });
    }

    const newAddress = await UserProfileService.saveAddress(userId, req.body);
    if (!newAddress) {
      return res.status(400).json({ 
        success: false,
        message: 'Erreur lors de la création de l\'adresse' 
      });
    }

    res.status(201).json({
      success: true,
      data: newAddress
    });
  })
);

userProfileRouter.put('/addresses/:id', 
  authenticateUser,
  validateBody(AddressSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const addressId = Number(req.params.id);

    if (!userId || isNaN(addressId)) {
      return res.status(401).json({ 
        success: false,
        message: 'Requête invalide' 
      });
    }

    const updatedAddress = await UserProfileService.saveAddress(userId, req.body, addressId);
    if (!updatedAddress) {
      return res.status(404).json({ 
        success: false,
        message: 'Adresse non trouvée' 
      });
    }

    res.json({
      success: true,
      data: updatedAddress
    });
  })
);

userProfileRouter.delete('/addresses/:id', 
  authenticateUser,
  asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const addressId = Number(req.params.id);

    if (!userId || isNaN(addressId)) {
      return res.status(401).json({ 
        success: false,
        message: 'Requête invalide' 
      });
    }

    const db = await getDb();
    const [address] = await db.select()
      .from(addresses)
      .where(and(
        eq(addresses.id, addressId),
        eq(addresses.userId, userId)
      ))
      .limit(1);

    if (!address) {
      return res.status(404).json({ 
        success: false,
        message: 'Adresse non trouvée' 
      });
    }

    if (address.isDefault) {
      return res.status(400).json({ 
        success: false,
        message: 'Impossible de supprimer l\'adresse par défaut' 
      });
    }

    await db.delete(addresses)
      .where(and(
        eq(addresses.id, addressId),
        eq(addresses.userId, userId)
      ));

    res.json({
      success: true,
      message: 'Adresse supprimée avec succès'
    });
  })
);

// Préférences utilisateur
userProfileRouter.get('/preferences', 
  authenticateUser,
  asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'Utilisateur non authentifié' 
      });
    }

    const db = await getDb();
    const [prefs] = await db.select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    const defaultPrefs: UserPreferences = {
      theme: 'light',
      language: 'fr',
      currency: 'EUR',
      notifications: {
        email: true,
        sms: false,
        push: true,
        orderUpdates: true,
        promotions: false,
        newMenuItems: true
      },
      dietary: {
        vegetarian: false,
        vegan: false,
        glutenFree: false,
        lactoseFree: false,
        allergies: []
      }
    };

    res.json({
      success: true,
      data: prefs ? { ...defaultPrefs, ...prefs } : defaultPrefs
    });
  })
);

userProfileRouter.put('/preferences', 
  authenticateUser,
  validateBody(PreferencesSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'Utilisateur non authentifié' 
      });
    }

    const db = await getDb();

    // Vérifier si des préférences existent déjà
    const [existingPrefs] = await db.select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    let result;

    if (existingPrefs) {
      // Mise à jour
      [result] = await db.update(userPreferences)
        .set({
          ...req.body,
          updatedAt: new Date()
        })
        .where(eq(userPreferences.userId, userId))
        .returning();
    } else {
      // Création
      [result] = await db.insert(userPreferences)
        .values({
          userId,
          ...req.body,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
    }

    logger.info('Préférences utilisateur mises à jour', { userId });
    res.json({
      success: true,
      data: result
    });
  })
);

export default userProfileRouter;