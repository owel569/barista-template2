
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../middleware/error-handler-enhanced';
import { createLogger } from '../../middleware/logging';
import { authenticateUser, requireRoles } from '../../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../../middleware/validation';
import { getDb } from '../../db';
import { notifications } from '../../../shared/schema';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';

const router = Router();
const logger = createLogger('NOTIFICATIONS_ROUTES');

// Schémas de validation
const CreateNotificationSchema = z.object({
  title: z.string().min(1, 'Titre requis').max(200),
  message: z.string().min(1, 'Message requis').max(1000),
  type: z.enum(['info', 'warning', 'error', 'success', 'reservation', 'order', 'system']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  targetUsers: z.array(z.number().int().positive()).optional(),
  targetRoles: z.array(z.enum(['directeur', 'gerant', 'employe', 'customer'])).optional(),
  scheduledFor: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional()
});

const NotificationQuerySchema = z.object({
  type: z.enum(['info', 'warning', 'error', 'success', 'reservation', 'order', 'system']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  isRead: z.coerce.boolean().optional(),
  userId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

// Types TypeScript
interface NotificationWithDetails {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'reservation' | 'order' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  userId: number;
  createdAt: Date;
  readAt: Date | null;
  expiresAt: Date | null;
  metadata: Record<string, unknown> | null;
}

// Routes avec authentification et typage strict
router.get('/',
  authenticateUser,
  validateQuery(NotificationQuerySchema),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const { type, priority, isRead, userId, page, limit } = req.query;
    const currentUserId = req.user!.id;

    let query = db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId ? Number(userId) : currentUserId));

    const conditions = [eq(notifications.userId, userId ? Number(userId) : currentUserId)];
    
    if (type) conditions.push(eq(notifications.type, type));
    if (priority) conditions.push(eq(notifications.priority, priority));
    if (isRead !== undefined) conditions.push(eq(notifications.isRead, isRead));

    if (conditions.length > 1) {
      query = query.where(and(...conditions)) as typeof query;
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;

    const notificationsData = await query
      .orderBy(desc(notifications.createdAt))
      .limit(limitNum)
      .offset(offset);

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(...conditions));

    const total = countResult[0]?.count || 0;

    res.json({
      success: true,
      data: notificationsData,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  })
);

router.post('/',
  authenticateUser,
  requireRoles(['directeur', 'gerant']),
  validateBody(CreateNotificationSchema),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const notificationData = req.body;

    // Si targetUsers est spécifié, créer une notification pour chaque utilisateur
    if (notificationData.targetUsers) {
      const notifications = await Promise.all(
        notificationData.targetUsers.map(async (userId: number) => {
          const [notification] = await db
            .insert(notifications)
            .values({
              ...notificationData,
              userId,
              targetUsers: undefined,
              targetRoles: undefined,
              scheduledFor: notificationData.scheduledFor ? new Date(notificationData.scheduledFor) : undefined,
              expiresAt: notificationData.expiresAt ? new Date(notificationData.expiresAt) : undefined,
              createdAt: new Date()
            })
            .returning();
          return notification;
        })
      );

      res.status(201).json({
        success: true,
        data: notifications,
        message: `${notifications.length} notifications créées`
      });
      return;
    }

    // Notification unique
    const [newNotification] = await db
      .insert(notifications)
      .values({
        ...notificationData,
        userId: req.user!.id,
        scheduledFor: notificationData.scheduledFor ? new Date(notificationData.scheduledFor) : undefined,
        expiresAt: notificationData.expiresAt ? new Date(notificationData.expiresAt) : undefined,
        createdAt: new Date()
      })
      .returning();

    res.status(201).json({
      success: true,
      data: newNotification,
      message: 'Notification créée'
    });
  })
);

router.patch('/:id/read',
  authenticateUser,
  validateParams(z.object({ id: z.coerce.number().int().positive() })),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const { id } = req.params;
    const userId = req.user!.id;

    const [updatedNotification] = await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date()
      })
      .where(and(
        eq(notifications.id, Number(id)),
        eq(notifications.userId, userId)
      ))
      .returning();

    if (!updatedNotification) {
      return res.status(404).json({
        success: false,
        message: 'Notification non trouvée'
      });
    }

    res.json({
      success: true,
      data: updatedNotification,
      message: 'Notification marquée comme lue'
    });
  })
);

router.patch('/read-all',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const db = getDb();
    const userId = req.user!.id;

    const updatedNotifications = await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date()
      })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ))
      .returning();

    res.json({
      success: true,
      data: {
        updatedCount: updatedNotifications.length
      },
      message: `${updatedNotifications.length} notifications marquées comme lues`
    });
  })
);

router.delete('/:id',
  authenticateUser,
  validateParams(z.object({ id: z.coerce.number().int().positive() })),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const { id } = req.params;
    const userId = req.user!.id;

    const [deletedNotification] = await db
      .delete(notifications)
      .where(and(
        eq(notifications.id, Number(id)),
        eq(notifications.userId, userId)
      ))
      .returning();

    if (!deletedNotification) {
      return res.status(404).json({
        success: false,
        message: 'Notification non trouvée'
      });
    }

    res.json({
      success: true,
      message: 'Notification supprimée'
    });
  })
);

// Statistiques des notifications
router.get('/stats',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const db = getDb();
    const userId = req.user!.id;

    const [stats] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        unread: sql<number>`COUNT(CASE WHEN ${notifications.isRead} = false THEN 1 END)`,
        urgent: sql<number>`COUNT(CASE WHEN ${notifications.priority} = 'urgent' THEN 1 END)`,
        high: sql<number>`COUNT(CASE WHEN ${notifications.priority} = 'high' THEN 1 END)`
      })
      .from(notifications)
      .where(eq(notifications.userId, userId));

    res.json({
      success: true,
      data: stats
    });
  })
);

export default router;
