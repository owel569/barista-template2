
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../middleware/error-handler-enhanced';
import { createLogger } from '../../middleware/logging';
import { authenticateUser, requireRoles } from '../../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../../middleware/validation';
import { getDb } from '../../db';
import { reservations, customers, tables } from '../../../shared/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import type { Request, Response } from 'express';

const router = Router();
const logger = createLogger('RESERVATIONS_ROUTES');

// Schémas de validation avec types stricts
const ReservationQuerySchema = z.object({
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']).optional(),
  tableId: z.coerce.number().int().positive().optional(),
  customerId: z.coerce.number().int().positive().optional(),
  date: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

const CreateReservationSchema = z.object({
  customerId: z.number().int().positive().optional(),
  tableId: z.number().int().positive(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Date invalide'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Format d\'heure invalide (HH:MM)'),
  partySize: z.number().int().min(1).max(20),
  specialRequests: z.string().max(500).optional(),
  guestName: z.string().min(1).max(100),
  guestPhone: z.string().min(10).max(20),
  guestEmail: z.string().email().optional(),
  notes: z.string().max(1000).optional()
});

const UpdateReservationSchema = z.object({
  tableId: z.number().int().positive().optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Date invalide').optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Format d\'heure invalide (HH:MM)').optional(),
  partySize: z.number().int().min(1).max(20).optional(),
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']).optional(),
  specialRequests: z.string().max(500).optional(),
  notes: z.string().max(1000).optional()
});

const ReservationParamsSchema = z.object({
  id: z.coerce.number().int().positive()
});

const AvailabilityQuerySchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Date invalide'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Format d\'heure invalide (HH:MM)'),
  partySize: z.coerce.number().int().min(1).max(20),
  tableId: z.coerce.number().int().positive().optional()
});

// Types pour la logique métier
interface ReservationWithDetails {
  id: number;
  customerId: number | null;
  tableId: number;
  date: Date;
  time: string;
  partySize: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  specialRequests: string | null;
  guestName: string;
  guestPhone: string;
  guestEmail: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface TableAvailability {
  id: number;
  number: number;
  capacity: number;
  status: string;
  location: string | null;
  isActive: boolean;
}

// Route GET - Lister les réservations
router.get('/',
  authenticateUser,
  validateQuery(ReservationQuerySchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const db = getDb();
    const query = req.query as z.infer<typeof ReservationQuerySchema>;
    const { status, tableId, customerId, date, page, limit } = query;

    try {
      let baseQuery = db
        .select({
          id: reservations.id,
          customerId: reservations.customerId,
          tableId: reservations.tableId,
          date: reservations.date,
          time: reservations.time,
          partySize: reservations.partySize,
          status: reservations.status,
          specialRequests: reservations.specialRequests,
          guestName: reservations.guestName,
          guestPhone: reservations.guestPhone,
          notes: reservations.notes,
          createdAt: reservations.createdAt,
          updatedAt: reservations.updatedAt
        })
        .from(reservations);

      const conditions = [];

      // Validation et conversion sécurisée des types
      if (status && ['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
        conditions.push(eq(reservations.status, status as 'pending' | 'confirmed' | 'completed' | 'cancelled'));
      }
      if (tableId) {
        conditions.push(eq(reservations.tableId, Number(tableId)));
      }
      if (customerId) {
        conditions.push(eq(reservations.customerId, Number(customerId)));
      }
      if (date) {
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
        
        conditions.push(gte(reservations.date, startOfDay));
        conditions.push(lte(reservations.date, endOfDay));
      }

      if (conditions.length > 0) {
        baseQuery = baseQuery.where(and(...conditions)) as typeof baseQuery;
      }

      const pageNum = Number(page);
      const limitNum = Number(limit);
      const offset = (pageNum - 1) * limitNum;

      const reservationsData = await baseQuery
        .orderBy(desc(reservations.createdAt))
        .limit(limitNum)
        .offset(offset);

      const countConditions = conditions.length > 0 ? and(...conditions) : undefined;
      const countQuery = countConditions 
        ? db.select({ count: sql<number>`count(*)` }).from(reservations).where(countConditions)
        : db.select({ count: sql<number>`count(*)` }).from(reservations);
      
      const countResult = await countQuery;
      const total = countResult[0]?.count || 0;

      res.json({
        success: true,
        data: reservationsData,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      logger.error('Erreur récupération réservations', {
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des réservations'
      });
    }
  })
);

// Route POST - Créer une réservation
router.post('/',
  authenticateUser,
  validateBody(CreateReservationSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const db = getDb();
    const reservationData = req.body as z.infer<typeof CreateReservationSchema>;

    try {
      // Vérification de disponibilité
      const reservationDateTime = new Date(`${reservationData.date}T${reservationData.time}:00`);
      
      // Vérifier que la table existe et est active
      const [tableExists] = await db
        .select()
        .from(tables)
        .where(and(
          eq(tables.id, reservationData.tableId),
          eq(tables.isActive, true)
        ))
        .limit(1);

      if (!tableExists) {
        res.status(400).json({
          success: false,
          message: 'Table non disponible ou inexistante'
        });
        return;
      }

      // Vérifier les conflits de réservation (2h avant et après)
      const startTime = new Date(reservationDateTime.getTime() - 2 * 60 * 60 * 1000);
      const endTime = new Date(reservationDateTime.getTime() + 2 * 60 * 60 * 1000);

      const conflictingReservations = await db
        .select()
        .from(reservations)
        .where(and(
          eq(reservations.tableId, reservationData.tableId),
          gte(reservations.date, startTime),
          lte(reservations.date, endTime),
          eq(reservations.status, 'confirmed')
        ));

      if (conflictingReservations.length > 0) {
        res.status(409).json({
          success: false,
          message: 'Créneau non disponible pour cette table'
        });
        return;
      }

      // Créer la réservation
      const [newReservation] = await db
        .insert(reservations)
        .values({
          customerId: reservationData.customerId || null,
          tableId: reservationData.tableId,
          date: reservationDateTime,
          time: reservationData.time,
          partySize: reservationData.partySize,
          status: 'pending',
          specialRequests: reservationData.specialRequests || null,
          guestName: reservationData.guestName,
          guestPhone: reservationData.guestPhone,
          notes: reservationData.notes || null,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      res.status(201).json({
        success: true,
        data: newReservation,
        message: 'Réservation créée avec succès'
      });
    } catch (error) {
      logger.error('Erreur création réservation', {
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la réservation'
      });
    }
  })
);

// Route PUT - Mettre à jour une réservation
router.put('/:id',
  authenticateUser,
  validateParams(ReservationParamsSchema),
  validateBody(UpdateReservationSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const db = getDb();
    const { id } = req.params;
    const updateData = req.body as z.infer<typeof UpdateReservationSchema>;

    try {
      // Vérifier que la réservation existe
      const [existingReservation] = await db
        .select()
        .from(reservations)
        .where(eq(reservations.id, Number(id)))
        .limit(1);

      if (!existingReservation) {
        res.status(404).json({
          success: false,
          message: 'Réservation non trouvée'
        });
        return;
      }

      // Construire l'objet de mise à jour
      const updateObject: any = {
        updatedAt: new Date()
      };

      if (updateData.tableId) updateObject.tableId = updateData.tableId;
      if (updateData.date && updateData.time) {
        updateObject.date = new Date(`${updateData.date}T${updateData.time}:00`);
        updateObject.time = updateData.time;
      }
      if (updateData.partySize) updateObject.partySize = updateData.partySize;
      if (updateData.status) updateObject.status = updateData.status;
      if (updateData.specialRequests !== undefined) updateObject.specialRequests = updateData.specialRequests;
      if (updateData.notes !== undefined) updateObject.notes = updateData.notes;

      const [updatedReservation] = await db
        .update(reservations)
        .set(updateObject)
        .where(eq(reservations.id, Number(id)))
        .returning();

      res.json({
        success: true,
        data: updatedReservation,
        message: 'Réservation mise à jour avec succès'
      });
    } catch (error) {
      logger.error('Erreur mise à jour réservation', {
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la réservation'
      });
    }
  })
);

// Route DELETE - Supprimer une réservation
router.delete('/:id',
  authenticateUser,
  validateParams(ReservationParamsSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const db = getDb();
    const { id } = req.params;

    try {
      const [deletedReservation] = await db
        .delete(reservations)
        .where(eq(reservations.id, Number(id)))
        .returning();

      if (!deletedReservation) {
        res.status(404).json({
          success: false,
          message: 'Réservation non trouvée'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Réservation supprimée avec succès'
      });
    } catch (error) {
      logger.error('Erreur suppression réservation', {
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de la réservation'
      });
    }
  })
);

// Route GET - Vérifier disponibilité
router.get('/availability',
  authenticateUser,
  validateQuery(AvailabilityQuerySchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const db = getDb();
    const query = req.query as z.infer<typeof AvailabilityQuerySchema>;
    const { date, time, partySize, tableId } = query;

    try {
      // Récupérer toutes les tables actives
      let availableTables = await db
        .select({
          id: tables.id,
          number: tables.number,
          capacity: tables.capacity,
          status: tables.status,
          location: tables.location,
          isActive: tables.isActive
        })
        .from(tables)
        .where(and(
          eq(tables.isActive, true),
          gte(tables.capacity, Number(partySize))
        ));

      // Filtrer par table spécifique si demandé
      if (tableId) {
        availableTables = availableTables.filter((table: TableAvailability) => table.id === Number(tableId));
      }

      // Vérifier les réservations existantes pour cette date/heure
      const requestedDateTime = new Date(`${date}T${time}:00`);
      const startTime = new Date(requestedDateTime.getTime() - 2 * 60 * 60 * 1000);
      const endTime = new Date(requestedDateTime.getTime() + 2 * 60 * 60 * 1000);

      const existingReservations = await db
        .select({
          tableId: reservations.tableId
        })
        .from(reservations)
        .where(and(
          gte(reservations.date, startTime),
          lte(reservations.date, endTime),
          eq(reservations.status, 'confirmed')
        ));

      const reservedTableIds = existingReservations.map((r: { tableId: number }) => r.tableId);
      const available = availableTables.filter((table: TableAvailability) => !reservedTableIds.includes(table.id));

      res.json({
        success: true,
        data: {
          available: available.length > 0,
          tables: available,
          requestedDateTime: requestedDateTime.toISOString(),
          totalAvailable: available.length
        }
      });
    } catch (error) {
      logger.error('Erreur vérification disponibilité', {
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification de disponibilité'
      });
    }
  })
);

export default router;
