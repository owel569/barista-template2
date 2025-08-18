import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error-handler';
import { createLogger } from '../middleware/logging';
import { authenticateUser, requireRoles } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { getDb } from '../db';
import { contactMessages, customers, staffMembers } from '../../shared/schema';
import { eq, and, gte, lte, desc, sql, count, avg, isNotNull } from 'drizzle-orm';

const router = Router();
const logger = createLogger('FEEDBACK');

// ==========================================
// TYPES ET INTERFACES
// ==========================================

export interface FeedbackMessage {
  id: number;
  customerName: string;
  customerEmail: string;
  subject: string;
  message: string;
  rating?: number;
  category: 'general' | 'service' | 'food' | 'complaint' | 'suggestion';
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  response?: string;
  responseDate?: string;
  assignedTo?: number;
  assignedToName?: string;
}

export interface FeedbackStats {
  totalMessages: number;
  pendingMessages: number;
  inProgressMessages: number;
  resolvedMessages: number;
  averageRating: number;
  satisfactionRate: number;
  categoryBreakdown: Record<string, number>;
  priorityBreakdown: Record<string, number>;
  responseTimeAvg?: number;
  monthlyTrends?: MonthlyTrend[];
}

interface MonthlyTrend {
  month: string;
  count: number;
  avgRating?: number;
}

// ==========================================
// SCHÉMAS DE VALIDATION ZOD
// ==========================================

const CreateFeedbackSchema = z.object({
  customerName: z.string().min(2, 'Nom requis (min 2 caractères)').max(100, 'Nom trop long'),
  customerEmail: z.string().email('Email invalide'),
  subject: z.string().min(5, 'Sujet requis (min 5 caractères)').max(200, 'Sujet trop long'),
  message: z.string().min(10, 'Message requis (min 10 caractères)').max(2000, 'Message trop long'),
  rating: z.number().min(1).max(5).optional(),
  category: z.enum(['general', 'service', 'food', 'complaint', 'suggestion']).default('general'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional()
});

const UpdateFeedbackSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  response: z.string().min(1, 'Réponse requise').max(1000, 'Réponse trop longue').optional(),
  assignedTo: z.number().positive().optional()
});

const FeedbackQuerySchema = z.object({
  status: z.enum(['pending', 'in_progress', 'resolved', 'closed']).optional(),
  category: z.enum(['general', 'service', 'food', 'complaint', 'suggestion']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional(),
  search: z.string().max(100).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  sortBy: z.enum(['createdAt', 'updatedAt', 'priority', 'rating']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// ==========================================
// SERVICES MÉTIER
// ==========================================

class FeedbackService {
  /**
   * Calcule les statistiques de feedback
   */
  static async calculateStats(fromDate?: string, toDate?: string): Promise<FeedbackStats> {
    const db = await getDb();

    // Base query with date filtering if provided
    let baseQuery = db.select().from(contactMessages);

    if (fromDate && toDate) {
      baseQuery = baseQuery.where(
        and(
          gte(contactMessages.createdAt, fromDate),
          lte(contactMessages.createdAt, toDate)
        )
      );
    }

    // Total messages
    const totalResult = await baseQuery.select({ count: count() });
    const total = totalResult[0]?.count || 0;

    // Status breakdown
    const statusResults = await db.select({
      status: contactMessages.status,
      count: count()
    })
    .from(contactMessages)
    .groupBy(contactMessages.status);

    const statusCounts = statusResults.reduce((acc, item) => {
      acc[item.status] = item.count;
      return acc;
    }, {} as Record<string, number>);

    // Average rating (only for messages with rating)
    const avgRatingResult = await db.select({ avg: avg(contactMessages.rating) })
      .from(contactMessages)
      .where(isNotNull(contactMessages.rating));

    // Average response time (for resolved messages)
    const responseTimeResult = await db.select({ 
      avg: sql<number>`AVG(EXTRACT(EPOCH FROM (response_date::timestamp - created_at::timestamp))/3600)`
    })
    .from(contactMessages)
    .where(
      and(
        isNotNull(contactMessages.responseDate),
        eq(contactMessages.status, 'resolved')
      )
    );

    // Category breakdown
    const categoryBreakdown = await db.select({
      category: contactMessages.category,
      count: count()
    })
    .from(contactMessages)
    .groupBy(contactMessages.category);

    // Priority breakdown
    const priorityBreakdown = await db.select({
      priority: contactMessages.priority,
      count: count()
    })
    .from(contactMessages)
    .groupBy(contactMessages.priority);

    // Monthly trends
    const monthlyTrends = await db.select({
      month: sql<string>`TO_CHAR(created_at, 'YYYY-MM')`,
      count: count(),
      avgRating: sql<number>`AVG(rating)`
    })
    .from(contactMessages)
    .groupBy(sql`TO_CHAR(created_at, 'YYYY-MM')`)
    .orderBy(sql`TO_CHAR(created_at, 'YYYY-MM')`);

    const avgRating = avgRatingResult[0]?.avg || 0;
    const resolvedCount = statusCounts['resolved'] || 0;
    const satisfactionRate = total > 0 ? (resolvedCount / total) * 100 : 0;

    return {
      totalMessages: total,
      pendingMessages: statusCounts['pending'] || 0,
      inProgressMessages: statusCounts['in_progress'] || 0,
      resolvedMessages: resolvedCount,
      averageRating: Math.round(avgRating * 10) / 10,
      satisfactionRate: Math.round(satisfactionRate * 10) / 10,
      categoryBreakdown: categoryBreakdown.reduce((acc, item) => {
        acc[item.category] = item.count;
        return acc;
      }, {} as Record<string, number>),
      priorityBreakdown: priorityBreakdown.reduce((acc, item) => {
        acc[item.priority] = item.count;
        return acc;
      }, {} as Record<string, number>),
      responseTimeAvg: responseTimeResult[0]?.avg ? Math.round(responseTimeResult[0].avg * 10) / 10 : undefined,
      monthlyTrends: monthlyTrends.map(trend => ({
        month: trend.month,
        count: trend.count,
        avgRating: trend.avgRating ? Math.round(trend.avgRating * 10) / 10 : undefined
      }))
    };
  }

  /**
   * Détermine la priorité automatiquement basée sur le contenu
   */
  static determinePriority(message: string, category: string): 'low' | 'medium' | 'high' | 'urgent' {
    const urgentKeywords = ['urgent', 'urgente', 'immédiat', 'immédiate', 'critique', 'grave', 'danger'];
    const highKeywords = ['problème', 'erreur', 'défaut', 'mauvais', 'terrible', 'pas content', 'insatisfait'];

    const lowerMessage = message.toLowerCase();

    if (urgentKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'urgent';
    }

    if (highKeywords.some(keyword => lowerMessage.includes(keyword)) || category === 'complaint') {
      return 'high';
    }

    if (category === 'suggestion') {
      return 'low';
    }

    return 'medium';
  }

  /**
   * Envoie une notification au client
   */
  static async sendNotification(email: string, subject: string, message: string): Promise<void> {
    // Implémentez ici l'envoi d'email ou de notification
    logger.info(`Notification envoyée à ${email}: ${subject}`);
  }
}

// ==========================================
// ROUTES AVEC AUTHENTIFICATION ET VALIDATION
// ==========================================

// Création d'un nouveau feedback
router.post('/', 
  validateBody(CreateFeedbackSchema), 
  asyncHandler(async (req, res) => {
    const { customerName, customerEmail, subject, message, rating, category, priority } = req.body;

    try {
      const db = await getDb();

      // Déterminer la priorité automatiquement si non fournie
      const finalPriority = priority || FeedbackService.determinePriority(message, category);

      // Créer le message de contact
      const [newMessage] = await db.insert(contactMessages).values({
        customerName,
        customerEmail,
        subject,
        message,
        rating: rating || null,
        category,
        priority: finalPriority,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }).returning();

      logger.info('Nouveau feedback créé', { 
        messageId: newMessage.id, 
        category, 
        priority: finalPriority 
      });

      // Envoyer une confirmation au client
      await FeedbackService.sendNotification(
        customerEmail,
        'Confirmation de réception de votre feedback',
        `Merci pour votre feedback. Nous avons bien reçu votre message concernant "${subject}" et nous le traiterons dans les meilleurs délais.`
      );

      res.status(201).json({
        success: true,
        data: newMessage,
        message: 'Feedback envoyé avec succès'
      });
    } catch (error) {
      logger.error('Erreur création feedback', { 
        customerEmail, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'envoi du feedback'
      });
    }
  }));

// Récupération d'un feedback spécifique
router.get('/:id', 
  authenticateUser, 
  requireRoles(['admin', 'manager', 'staff']), 
  validateParams(z.object({ id: z.string().regex(/^\d+$/, 'ID doit être un nombre') })), 
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
      const db = await getDb();

      // Récupérer le message avec les informations de l'assigné si disponible
      const message = await db.select({
        ...contactMessages,
        assignedToName: sql<string>`COALESCE(${staffMembers.name}, 'Non assigné')`
      })
      .from(contactMessages)
      .leftJoin(staffMembers, eq(contactMessages.assignedTo, staffMembers.id))
      .where(eq(contactMessages.id, parseInt(id)))
      .limit(1);

      if (!message[0]) {
        return res.status(404).json({
          success: false,
          message: 'Feedback non trouvé'
        });
      }

      res.json({
        success: true,
        data: message[0]
      });
    } catch (error) {
      logger.error('Erreur récupération feedback', { 
        id, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du feedback'
      });
    }
  }));

// Récupération des feedbacks (admin seulement)
router.get('/', 
  authenticateUser, 
  requireRoles(['admin', 'manager']), 
  validateQuery(FeedbackQuerySchema), 
  asyncHandler(async (req, res) => {
    const { status, category, priority, fromDate, toDate, search, limit, offset, sortBy, sortOrder } = req.query;

    try {
      const db = await getDb();

      let query = db.select({
        ...contactMessages,
        assignedToName: sql<string>`COALESCE(${staffMembers.name}, 'Non assigné')`
      })
      .from(contactMessages)
      .leftJoin(staffMembers, eq(contactMessages.assignedTo, staffMembers.id));

      // Appliquer les filtres
      if (status) {
        query = query.where(eq(contactMessages.status, status));
      }
      if (category) {
        query = query.where(eq(contactMessages.category, category));
      }
      if (priority) {
        query = query.where(eq(contactMessages.priority, priority));
      }
      if (fromDate && toDate) {
        query = query.where(
          and(
            gte(contactMessages.createdAt, fromDate),
            lte(contactMessages.createdAt, toDate)
          )
        );
      }
      if (search) {
        query = query.where(
          sql`LOWER(${contactMessages.subject}) LIKE LOWER(${'%' + search + '%'}) OR 
              LOWER(${contactMessages.message}) LIKE LOWER(${'%' + search + '%'})`
        );
      }

      // Tri
      const sortColumn = sortBy === 'rating' ? contactMessages.rating : 
                       sortBy === 'priority' ? contactMessages.priority : 
                       sortBy === 'updatedAt' ? contactMessages.updatedAt : 
                       contactMessages.createdAt;

      const sortDirection = sortOrder === 'asc' ? sql`ASC` : sql`DESC`;

      // Pagination et tri
      const messages = await query
        .orderBy(sql`${sortColumn} ${sortDirection}`)
        .limit(limit)
        .offset(offset);

      // Compter le total pour la pagination
      let countQuery = db.select({ count: count() }).from(contactMessages);

      if (status) {
        countQuery = countQuery.where(eq(contactMessages.status, status));
      }
      if (category) {
        countQuery = countQuery.where(eq(contactMessages.category, category));
      }
      if (priority) {
        countQuery = countQuery.where(eq(contactMessages.priority, priority));
      }
      if (fromDate && toDate) {
        countQuery = countQuery.where(
          and(
            gte(contactMessages.createdAt, fromDate),
            lte(contactMessages.createdAt, toDate)
          )
        );
      }
      if (search) {
        countQuery = countQuery.where(
          sql`LOWER(${contactMessages.subject}) LIKE LOWER(${'%' + search + '%'}) OR 
              LOWER(${contactMessages.message}) LIKE LOWER(${'%' + search + '%'})`
        );
      }

      const totalResult = await countQuery;
      const total = totalResult[0]?.count || 0;

      res.json({
        success: true,
        data: {
          messages,
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + limit < total
          }
        }
      });
    } catch (error) {
      logger.error('Erreur récupération feedbacks', { 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des feedbacks'
      });
    }
  }));

// Mise à jour d'un feedback (admin seulement)
router.put('/:id', 
  authenticateUser, 
  requireRoles(['admin', 'manager']), 
  validateParams(z.object({ id: z.string().regex(/^\d+$/, 'ID doit être un nombre') })), 
  validateBody(UpdateFeedbackSchema), 
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, priority, response, assignedTo } = req.body;
    const messageId = parseInt(id);

    try {
      const db = await getDb();

      // Vérifier que le message existe
      const existingMessage = await db.select()
        .from(contactMessages)
        .where(eq(contactMessages.id, messageId))
        .limit(1);

      if (existingMessage.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Message non trouvé'
        });
      }

      // Préparer les données de mise à jour
      const updateData: any = {
        updatedAt: new Date().toISOString()
      };

      if (status) updateData.status = status;
      if (priority) updateData.priority = priority;
      if (response) {
        updateData.response = response;
        updateData.responseDate = new Date().toISOString();
      }
      if (assignedTo) updateData.assignedTo = assignedTo;

      // Mettre à jour le message
      const [updatedMessage] = await db.update(contactMessages)
        .set(updateData)
        .where(eq(contactMessages.id, messageId))
        .returning();

      logger.info('Feedback mis à jour', { 
        messageId, 
        status: updateData.status, 
        updatedBy: req.user?.id 
      });

      // Envoyer une notification si le statut a changé
      if (status && status !== existingMessage[0].status) {
        await FeedbackService.sendNotification(
          existingMessage[0].customerEmail,
          `Mise à jour de votre feedback: ${existingMessage[0].subject}`,
          `Le statut de votre feedback a été mis à jour à "${status}".` + 
          (response ? `\n\nNotre réponse:\n${response}` : '')
        );
      }

      res.json({
        success: true,
        data: updatedMessage,
        message: 'Feedback mis à jour avec succès'
      });
    } catch (error) {
      logger.error('Erreur mise à jour feedback', { 
        messageId, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du feedback'
      });
    }
  }));

// Statistiques de satisfaction
router.get('/stats/satisfaction', 
  authenticateUser, 
  requireRoles(['admin', 'manager']), 
  asyncHandler(async (req, res) => {
    try {
      const { from, to } = req.query;
      const stats = await FeedbackService.calculateStats(
        typeof from === 'string' ? from : undefined,
        typeof to === 'string' ? to : undefined
      );

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Erreur statistiques satisfaction', { 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques'
      });
    }
  }));

// Feedback d'un client spécifique
router.get('/customer/:email', 
  authenticateUser, 
  validateParams(z.object({ email: z.string().email() })), 
  asyncHandler(async (req, res) => {
    const { email } = req.params;

    try {
      const db = await getDb();

      // Vérifier que l'utilisateur a le droit d'accéder à ces données
      if (req.user?.role !== 'admin' && req.user?.email !== email) {
        return res.status(403).json({
          success: false,
          message: 'Non autorisé'
        });
      }

      const messages = await db.select()
        .from(contactMessages)
        .where(eq(contactMessages.customerEmail, email))
        .orderBy(desc(contactMessages.createdAt));

      res.json({
        success: true,
        data: messages
      });
    } catch (error) {
      logger.error('Erreur récupération feedback client', { 
        email, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des feedbacks'
      });
    }
  }));

export default router;