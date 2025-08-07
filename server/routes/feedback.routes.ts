
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error-handler';
import { createLogger } from '../middleware/logging';
import { authenticateUser, requireRoles } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { getDb } from '../db';
import { contactMessages, customers } from '../../shared/schema';
import { eq, and, gte, lte, desc, sql, count, avg } from 'drizzle-orm';

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
}

export interface FeedbackStats {
  totalMessages: number;
  pendingMessages: number;
  resolvedMessages: number;
  averageRating: number;
  satisfactionRate: number;
  categoryBreakdown: Record<string, number>;
  priorityBreakdown: Record<string, number>;
}

// ==========================================
// SCHÉMAS DE VALIDATION ZOD
// ==========================================

const CreateFeedbackSchema = z.object({
  customerName: z.string()}).min(2, 'Nom requis (min 2 caractères)').max(100, 'Nom trop long'),
  customerEmail: z.string().email('Email invalide'),
  subject: z.string().min(5, 'Sujet requis (min 5 caractères)').max(200, 'Sujet trop long'),
  message: z.string().min(10, 'Message requis (min 10 caractères)').max(2000, 'Message trop long'),
  rating: z.number().min(1).max(5).optional(),
  category: z.enum(['general', 'service', 'food', 'complaint', 'suggestion']).default('general'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium')
});

const UpdateFeedbackSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'resolved', 'closed'])}).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  response: z.string().min(1, 'Réponse requise').max(1000, 'Réponse trop longue').optional(),
  assignedTo: z.number().positive().optional()
});

const FeedbackQuerySchema = z.object({
  status: z.enum(['pending', 'in_progress', 'resolved', 'closed'])}).optional(),
  category: z.enum(['general', 'service', 'food', 'complaint', 'suggestion']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0)
});

// ==========================================
// SERVICES MÉTIER
// ==========================================

class FeedbackService {
  /**
   * Calcule les statistiques de feedback
   */
  static async calculateStats(): Promise<FeedbackStats> {
    const db = await getDb();
    
    const totalResult = await db.select({ count: count(}) }).from(contactMessages);
    const pendingResult = await db.select({ count: count()}) })
      .from(contactMessages)
      .where(eq(contactMessages.status, 'pending'));
    const resolvedResult = await db.select({ count: count()}) })
      .from(contactMessages)
      .where(eq(contactMessages.status, 'resolved'));
    const avgRatingResult = await db.select({ avg: avg(contactMessages.rating)}) })
      .from(contactMessages)
      .where(sql`${contactMessages.rating} IS NOT NULL`);
    
    const categoryBreakdown = await db.select({
      category: contactMessages.category,
      count: count()})
    }).from(contactMessages)
      .groupBy(contactMessages.category);
    
    const priorityBreakdown = await db.select({
      priority: contactMessages.priority,
      count: count()})
    }).from(contactMessages)
      .groupBy(contactMessages.priority);
    
    const total = totalResult[0]?.count || 0;
    const pending = pendingResult[0]?.count || 0;
    const resolved = resolvedResult[0]?.count || 0;
    const avgRating = avgRatingResult[0]?.avg || 0;
    const satisfactionRate = total > 0 ? (resolved / total) * 100 : 0;
    
    return {
      totalMessages: total,
      pendingMessages: pending,
      resolvedMessages: resolved,
      averageRating: Math.round(avgRating * 10) / 10,
      satisfactionRate: Math.round(satisfactionRate * 10) / 10,
      categoryBreakdown: categoryBreakdown.reduce((acc, item) => {
        acc[item.category] = item.count;
        return acc;
      }, {} as Record<string, number>),
      priorityBreakdown: priorityBreakdown.reduce((acc, item) => {
        acc[item.priority] = item.count;
        return acc;
      }, {} as Record<string, number>)
    };
  }
  
  /**
   * Détermine la priorité automatiquement basée sur le contenu
   */
  static determinePriority(message: string, category: string): 'low' | 'medium' | 'high' | 'urgent' {
    const urgentKeywords = ['urgent', 'urgente', 'immédiat', 'immédiate', 'critique', 'grave'];
    const highKeywords = ['problème', 'erreur', 'défaut', 'mauvais', 'terrible'];
    
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
}

// ==========================================
// ROUTES AVEC AUTHENTIFICATION ET VALIDATION
// ==========================================

// Création d'un nouveau feedback
router.post('/', validateBody(CreateFeedbackSchema), asyncHandler(async (req, res) => {
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
      createdAt: new Date(}).toISOString(),
      updatedAt: new Date().toISOString()
    }).returning();
    
    logger.info('Nouveau feedback créé', { 
      messageId: newMessage.id, 
      category, 
      priority: finalPriority 
    });
    
    res.status(201).json({
      success: true,
      data: newMessage,
      message: 'Feedback envoyé avec succès'
    });
  } catch (error) {
    logger.error('Erreur création feedback', { 
      customerEmail, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    )});
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi du feedback'
    });
  }
}));

// Récupération des feedbacks (admin seulement)
router.get('/', authenticateUser, requireRoles(['admin', 'manager']), validateQuery(FeedbackQuerySchema), asyncHandler(async (req, res) => {
  const { status, category, priority, limit, offset } = req.query;
  
  try {
    const db = await getDb();
    
    let query = db.select().from(contactMessages);
    
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
    
    // Pagination et tri
    const messages = await query
      .orderBy(desc(contactMessages.createdAt))
      .limit(limit)
      .offset(offset);
    
    // Compter le total pour la pagination
    let countQuery = db.select({ count: count()}) }).from(contactMessages);
    if (status) {
      countQuery = countQuery.where(eq(contactMessages.status, status));
    }
    if (category) {
      countQuery = countQuery.where(eq(contactMessages.category, category));
    }
    if (priority) {
      countQuery = countQuery.where(eq(contactMessages.priority, priority));
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
    )});
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des feedbacks'
    });
  }
}));

// Mise à jour d'un feedback (admin seulement)
router.put('/:id/response', authenticateUser, requireRoles(['admin', 'manager']), validateParams(z.object({
  id: z.string()}).regex(/^\d+$/, 'ID doit être un nombre')
})), validateBody(UpdateFeedbackSchema), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, priority, response, assignedTo } = req.body;
  const messageId = parseInt(id || '0');
  
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
    
    res.json({
      success: true,
      data: updatedMessage,
      message: 'Feedback mis à jour avec succès'
    });
  } catch (error) {
    logger.error('Erreur mise à jour feedback', { 
      messageId, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    )});
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du feedback'
    });
  }
}));

// Statistiques de satisfaction
router.get('/satisfaction-stats', authenticateUser, requireRoles(['admin', 'manager']), asyncHandler(async (req, res) => {
  try {
    const stats = await FeedbackService.calculateStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Erreur statistiques satisfaction', { 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    )});
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
}));

export default router;
