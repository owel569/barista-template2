import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../middleware/error-handler-enhanced';
import { createLogger } from '../../middleware/logging';
import { authenticateUser, requireRoles } from '../../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../../middleware/validation';
import { getDb } from '../../db';
import { customers, orders, activityLogs, contactMessages, feedback } from '../../../shared/schema';
import { eq, and, or, desc, sql, ilike, gte, lte } from 'drizzle-orm';
import { cacheMiddleware, invalidateCache } from '../../middleware/cache-advanced';

const router = Router();
const logger = createLogger('FEEDBACK_ROUTES');

// Schémas de validation
const CreateFeedbackSchema = z.object({
  customerId: z.string().uuid('ID client invalide').optional(),
  orderId: z.string().uuid('ID commande invalide').optional(),
  rating: z.number().int().min(1, 'Note minimum: 1').max(5, 'Note maximum: 5'),
  category: z.enum(['food', 'service', 'ambiance', 'cleanliness', 'value', 'overall'], {
    errorMap: () => ({ message: 'Catégorie doit être: food, service, ambiance, cleanliness, value, ou overall' })
  }),
  title: z.string().min(5, 'Titre trop court (min 5 caractères)').max(100, 'Titre trop long (max 100 caractères)'),
  comment: z.string().min(10, 'Commentaire trop court (min 10 caractères)').max(1000, 'Commentaire trop long (max 1000 caractères)'),
  isAnonymous: z.boolean().default(false),
  contactEmail: z.string().email('Email invalide').optional(),
  suggestions: z.string().max(500).optional()
});

const UpdateFeedbackStatusSchema = z.object({
  status: z.enum(['pending', 'reviewed', 'responded', 'resolved'], {
    errorMap: () => ({ message: 'Statut doit être: pending, reviewed, responded, ou resolved' })
  }),
  response: z.string().max(1000).optional(),
  internalNotes: z.string().max(500).optional()
});

const FeedbackResponseSchema = z.object({
  response: z.string().min(10, 'Réponse trop courte (min 10 caractères)').max(1000, 'Réponse trop longue (max 1000 caractères)'),
  isPublic: z.boolean().default(true)
});

// Interface pour les statistiques de feedback
interface FeedbackStats {
  total: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  categoryStats: Array<{
    category: string;
    averageRating: number;
    count: number;
  }>;
  statusDistribution: Record<string, number>;
  recentTrend: Array<{
    date: string;
    count: number;
    averageRating: number;
  }>;
}

// Fonction utilitaire pour enregistrer une activité
async function logFeedbackActivity(
  userId: string,
  action: string,
  details: string,
  req: any,
  feedbackId?: string
): Promise<void> {
  try {
    const db = getDb();
    await db.insert(activityLogs).values({
      id: crypto.randomUUID(),
      userId,
      action,
      details: feedbackId ? `${details} (Feedback: ${feedbackId})` : details,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      createdAt: new Date()
    });
  } catch (error) {
    logger.error('Erreur enregistrement activité feedback', {
      userId,
      action,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
}

// Liste des commentaires avec filtres
router.get('/',
  authenticateUser,
  requireRoles(['admin', 'manager', 'staff']),
  validateQuery(z.object({
    category: z.enum(['food', 'service', 'ambiance', 'cleanliness', 'value', 'overall']).optional(),
    rating: z.coerce.number().int().min(1).max(5).optional(),
    minRating: z.coerce.number().int().min(1).max(5).optional(),
    status: z.enum(['pending', 'reviewed', 'responded', 'resolved']).optional(),
    search: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.enum(['rating', 'createdAt', 'status', 'category']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  })),
  cacheMiddleware({ ttl: 2 * 60 * 1000, tags: ['feedback'] }),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const {
      category,
      rating,
      minRating,
      status,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let query = db
      .select({
        id: feedback.id,
        customerId: feedback.customerId,
        customerName: sql<string>`CASE 
          WHEN ${feedback.isAnonymous} = true THEN 'Client anonyme'
          ELSE CONCAT(${customers.firstName}, ' ', ${customers.lastName})
        END`,
        orderId: feedback.orderId,
        rating: feedback.rating,
        category: feedback.category,
        title: feedback.title,
        comment: feedback.comment,
        status: feedback.status,
        isAnonymous: feedback.isAnonymous,
        hasResponse: sql<boolean>`${feedback.response} IS NOT NULL`,
        createdAt: feedback.createdAt,
        respondedAt: feedback.respondedAt
      })
      .from(feedback)
      .leftJoin(customers, eq(feedback.customerId, customers.id));

    // Construire les conditions
    const conditions = [];

    if (category) {
      conditions.push(eq(feedback.category, category));
    }

    if (rating) {
      conditions.push(eq(feedback.rating, rating));
    }

    if (minRating) {
      conditions.push(gte(feedback.rating, minRating));
    }

    if (status) {
      conditions.push(eq(feedback.status, status));
    }

    if (search) {
      conditions.push(
        or(
          ilike(feedback.title, `%${search}%`),
          ilike(feedback.comment, `%${search}%`),
          ilike(customers.firstName, `%${search}%`),
          ilike(customers.lastName, `%${search}%`)
        )
      );
    }

    if (startDate) {
      conditions.push(gte(feedback.createdAt, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(feedback.createdAt, new Date(endDate)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Tri
    const orderColumn = sortBy === 'rating' ? feedback.rating :
                       sortBy === 'status' ? feedback.status :
                       sortBy === 'category' ? feedback.category :
                       feedback.createdAt;

    query = sortOrder === 'desc' ?
      query.orderBy(desc(orderColumn)) :
      query.orderBy(orderColumn);

    // Pagination
    const offset = (page - 1) * limit;
    const feedbackData = await query.limit(limit).offset(offset);

    // Compte total
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(feedback)
      .leftJoin(customers, eq(feedback.customerId, customers.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    logger.info('Commentaires récupérés', {
      count: feedbackData.length,
      total: count,
      filters: { category, rating, minRating, status, search }
    });

    res.json({
      success: true,
      data: feedbackData,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  })
);

// Détails d'un commentaire
router.get('/:id',
  authenticateUser,
  requireRoles(['admin', 'manager', 'staff']),
  validateParams(z.object({ id: z.string().uuid() })),
  cacheMiddleware({ ttl: 5 * 60 * 1000, tags: ['feedback'] }),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const { id } = req.params;

    const [feedbackItem] = await db
      .select({
        id: feedback.id,
        customerId: feedback.customerId,
        customerName: sql<string>`CASE 
          WHEN ${feedback.isAnonymous} = true THEN 'Client anonyme'
          ELSE CONCAT(${customers.firstName}, ' ', ${customers.lastName})
        END`,
        customerEmail: sql<string>`CASE 
          WHEN ${feedback.isAnonymous} = true THEN ${feedback.contactEmail}
          ELSE ${customers.email}
        END`,
        orderId: feedback.orderId,
        rating: feedback.rating,
        category: feedback.category,
        title: feedback.title,
        comment: feedback.comment,
        suggestions: feedback.suggestions,
        status: feedback.status,
        response: feedback.response,
        responseBy: feedback.responseBy,
        respondedAt: feedback.respondedAt,
        internalNotes: feedback.internalNotes,
        isAnonymous: feedback.isAnonymous,
        createdAt: feedback.createdAt,
        updatedAt: feedback.updatedAt
      })
      .from(feedback)
      .leftJoin(customers, eq(feedback.customerId, customers.id))
      .where(eq(feedback.id, id));

    if (!feedbackItem) {
      return res.status(404).json({
        success: false,
        message: 'Commentaire non trouvé'
      });
    }

    // Récupérer les informations de la commande si applicable
    let orderInfo = null;
    if (feedbackItem.orderId) {
      const [order] = await db
        .select({
          id: orders.id,
          totalAmount: orders.totalAmount,
          status: orders.status,
          createdAt: orders.createdAt
        })
        .from(orders)
        .where(eq(orders.id, feedbackItem.orderId));
      orderInfo = order;
    }

    const result = {
      ...feedbackItem,
      orderInfo
    };

    logger.info('Commentaire récupéré', { feedbackId: id });

    res.json({
      success: true,
      data: result
    });
  })
);

// Créer un commentaire (public - pas d'authentification requise)
router.post('/public',
  validateBody(CreateFeedbackSchema),
  asyncHandler(async (req, res) => {
    const db = getDb();

    // Vérifier si la commande existe (si fournie)
    if (req.body.orderId) {
      const [order] = await db
        .select({ id: orders.id, customerId: orders.customerId })
        .from(orders)
        .where(eq(orders.id, req.body.orderId));

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Commande non trouvée'
        });
      }

      // Si un client est fourni, vérifier qu'il correspond à la commande
      if (req.body.customerId && req.body.customerId !== order.customerId) {
        return res.status(400).json({
          success: false,
          message: 'Le client ne correspond pas à la commande'
        });
      }
    }

    // Créer le commentaire
    const feedbackId = crypto.randomUUID();
    const [newFeedback] = await db
      .insert(feedback)
      .values({
        id: feedbackId,
        ...req.body,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning({
        id: feedback.id,
        rating: feedback.rating,
        category: feedback.category,
        title: feedback.title,
        status: feedback.status,
        createdAt: feedback.createdAt
      });

    logger.info('Commentaire public créé', {
      feedbackId,
      rating: req.body.rating,
      category: req.body.category,
      isAnonymous: req.body.isAnonymous
    });

    res.status(201).json({
      success: true,
      data: newFeedback,
      message: 'Merci pour votre commentaire ! Il sera examiné par notre équipe.'
    });
  })
);

// Mettre à jour le statut d'un commentaire
router.patch('/:id/status',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  validateParams(z.object({ id: z.string().uuid() })),
  validateBody(UpdateFeedbackStatusSchema),
  invalidateCache(['feedback']),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const currentUser = (req as any).user;
    const { id } = req.params;

    // Vérifier que le commentaire existe
    const [existingFeedback] = await db
      .select()
      .from(feedback)
      .where(eq(feedback.id, id));

    if (!existingFeedback) {
      return res.status(404).json({
        success: false,
        message: 'Commentaire non trouvé'
      });
    }

    // Mettre à jour le commentaire
    const updateData: any = {
      ...req.body,
      updatedAt: new Date()
    };

    if (req.body.status === 'responded' && req.body.response) {
      updateData.responseBy = currentUser.id;
      updateData.respondedAt = new Date();
    }

    const [updatedFeedback] = await db
      .update(feedback)
      .set({
        ...updateData
      })
      .where(eq(feedback.id, id))
      .returning();

    // Enregistrer l'activité
    await logFeedbackActivity(
      currentUser.id,
      'UPDATE_FEEDBACK_STATUS',
      `Statut commentaire mis à jour: ${existingFeedback.status} → ${req.body.status}`,
      req,
      id
    );

    logger.info('Statut commentaire mis à jour', {
      feedbackId: id,
      previousStatus: existingFeedback.status,
      newStatus: req.body.status,
      updatedBy: currentUser.id
    });

    res.json({
      success: true,
      data: updatedFeedback,
      message: 'Statut du commentaire mis à jour avec succès'
    });
  })
);

// Répondre à un commentaire
router.post('/:id/response',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  validateParams(z.object({ id: z.string().uuid() })),
  validateBody(FeedbackResponseSchema),
  invalidateCache(['feedback']),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const currentUser = (req as any).user;
    const { id } = req.params;
    const { response, isPublic } = req.body;

    // Vérifier que le commentaire existe
    const [existingFeedback] = await db
      .select()
      .from(feedback)
      .where(eq(feedback.id, id));

    if (!existingFeedback) {
      return res.status(404).json({
        success: false,
        message: 'Commentaire non trouvé'
      });
    }

    // Mettre à jour avec la réponse
    const [updatedFeedback] = await db
      .update(feedback)
      .set({
        response,
        responseBy: currentUser.id,
        respondedAt: new Date(),
        status: 'responded',
        isPublic,
        updatedAt: new Date()
      })
      .where(eq(feedback.id, id))
      .returning();

    // Enregistrer l'activité
    await logFeedbackActivity(
      currentUser.id,
      'RESPOND_TO_FEEDBACK',
      `Réponse ajoutée au commentaire (${isPublic ? 'publique' : 'privée'})`,
      req,
      id
    );

    logger.info('Réponse ajoutée au commentaire', {
      feedbackId: id,
      isPublic,
      respondedBy: currentUser.id
    });

    res.json({
      success: true,
      data: updatedFeedback,
      message: 'Réponse ajoutée avec succès'
    });
  })
);

// Statistiques des commentaires
router.get('/stats/overview',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  validateQuery(z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional()
  })),
  cacheMiddleware({ ttl: 5 * 60 * 1000, tags: ['feedback', 'stats'] }),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const { startDate, endDate } = req.query;

    const conditions = [];
    if (startDate) {
      conditions.push(gte(feedback.createdAt, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(feedback.createdAt, new Date(endDate)));
    }

    // Statistiques générales
    const [generalStats] = await db
      .select({
        total: sql<number>`count(*)`,
        averageRating: sql<number>`avg(${feedback.rating})`,
        totalResponded: sql<number>`count(*) filter (where ${feedback.status} = 'responded')`,
        totalPending: sql<number>`count(*) filter (where ${feedback.status} = 'pending')`
      })
      .from(feedback)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Distribution des notes
    const ratingDistribution = await db
      .select({
        rating: feedback.rating,
        count: sql<number>`count(*)`
      })
      .from(feedback)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(feedback.rating)
      .orderBy(feedback.rating);

    // Statistiques par catégorie
    const categoryStats = await db
      .select({
        category: feedback.category,
        averageRating: sql<number>`avg(${feedback.rating})`,
        count: sql<number>`count(*)`
      })
      .from(feedback)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(feedback.category);

    // Distribution des statuts
    const statusDistribution = await db
      .select({
        status: feedback.status,
        count: sql<number>`count(*)`
      })
      .from(feedback)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(feedback.status);

    // Tendance récente (30 derniers jours)
    const recentTrend = await db
      .select({
        date: sql<string>`date(${feedback.createdAt})`,
        count: sql<number>`count(*)`,
        averageRating: sql<number>`avg(${feedback.rating})`
      })
      .from(feedback)
      .where(gte(feedback.createdAt, sql`NOW() - INTERVAL '30 days'`))
      .groupBy(sql`date(${feedback.createdAt})`)
      .orderBy(sql`date(${feedback.createdAt})`);

    const stats: FeedbackStats = {
      total: generalStats.total,
      averageRating: Number(generalStats.averageRating?.toFixed(2)) || 0,
      ratingDistribution: ratingDistribution.reduce((acc, item) => {
        acc[item.rating] = item.count;
        return acc;
      }, {} as Record<number, number>),
      categoryStats,
      statusDistribution: statusDistribution.reduce((acc, item) => {
        acc[item.status] = item.count;
        return acc;
      }, {} as Record<string, number>),
      recentTrend
    };

    logger.info('Statistiques commentaires récupérées', {
      total: stats.total,
      averageRating: stats.averageRating
    });

    res.json({
      success: true,
      data: stats
    });
  })
);

export default router;