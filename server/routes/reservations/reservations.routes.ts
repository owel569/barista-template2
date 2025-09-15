
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../middleware/error-handler-enhanced';
import { createLogger } from '../../middleware/logging';
import { authenticateUser, requireRoles } from '../../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../../middleware/validation';
import { getDb } from '../../db';
import { reservations, customers, tables } from '../../../shared/schema';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';

const router = Router();
const logger = createLogger('RESERVATIONS_ROUTES');

// Schémas de validation avec typage précis
const CreateReservationSchema = z.object({
  customerId: z.number().int().positive().optional(),
  tableId: z.number().int().positive(),
  guestName: z.string().min(2, 'Nom requis').max(100),
  guestEmail: z.string().email('Email invalide'),
  guestPhone: z.string().min(8, 'Téléphone requis'),
  date: z.string().datetime('Date invalide'),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format heure invalide'),
  partySize: z.number().int().min(1, 'Min 1 personne').max(20, 'Max 20 personnes'),
  specialRequests: z.string().max(500).optional(),
  notes: z.string().max(500).optional()
});

const UpdateReservationSchema = CreateReservationSchema.partial().extend({
  status: z.enum(['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show']).optional()
});

const ReservationQuerySchema = z.object({
  status: z.enum(['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show']).optional(),
  date: z.string().optional(),
  tableId: z.coerce.number().int().positive().optional(),
  customerId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

// Types TypeScript précis
interface ReservationWithDetails {
  id: number;
  customerId: number | null;
  tableId: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  date: Date;
  time: string;
  partySize: number;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';
  specialRequests: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  customerName?: string;
  tableNumber?: number;
}

// Routes avec typage strict
router.get('/',
  authenticateUser,
  requireRoles(['directeur', 'gerant', 'employe']),
  validateQuery(ReservationQuerySchema),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const { status, date, tableId, customerId, page, limit } = req.query;

    let query = db
      .select({
        id: reservations.id,
        customerId: reservations.customerId,
        tableId: reservations.tableId,
        guestName: reservations.guestName,
        guestEmail: reservations.guestEmail,
        guestPhone: reservations.guestPhone,
        date: reservations.date,
        time: reservations.time,
        partySize: reservations.partySize,
        status: reservations.status,
        specialRequests: reservations.specialRequests,
        notes: reservations.notes,
        createdAt: reservations.createdAt,
        updatedAt: reservations.updatedAt,
        customerName: sql<string>`COALESCE(${customers.firstName} || ' ' || ${customers.lastName}, ${reservations.guestName})`,
        tableNumber: tables.number
      })
      .from(reservations)
      .leftJoin(customers, eq(reservations.customerId, customers.id))
      .leftJoin(tables, eq(reservations.tableId, tables.id));

    const conditions = [];
    
    if (status) conditions.push(eq(reservations.status, status));
    if (date) conditions.push(sql`DATE(${reservations.date}) = ${date}`);
    if (tableId) conditions.push(eq(reservations.tableId, tableId));
    if (customerId) conditions.push(eq(reservations.customerId, customerId));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;

    const reservationsData = await query
      .orderBy(desc(reservations.createdAt))
      .limit(limitNum)
      .offset(offset);

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(reservations)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

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
  })
);

router.post('/',
  validateBody(CreateReservationSchema),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const reservationData = req.body;

    // Vérifier disponibilité de la table
    const existingReservation = await db
      .select()
      .from(reservations)
      .where(and(
        eq(reservations.tableId, reservationData.tableId),
        eq(reservations.date, new Date(reservationData.date)),
        eq(reservations.time, reservationData.time),
        sql`${reservations.status} NOT IN ('cancelled', 'completed')`
      ));

    if (existingReservation.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Table déjà réservée à cette heure'
      });
    }

    const [newReservation] = await db
      .insert(reservations)
      .values({
        ...reservationData,
        date: new Date(reservationData.date),
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    logger.info('Nouvelle réservation créée', {
      reservationId: newReservation.id,
      guestName: reservationData.guestName
    });

    res.status(201).json({
      success: true,
      data: newReservation,
      message: 'Réservation créée avec succès'
    });
  })
);

router.get('/:id',
  authenticateUser,
  requireRoles(['directeur', 'gerant', 'employe']),
  validateParams(z.object({ id: z.coerce.number().int().positive() })),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const { id } = req.params;

    const [reservation] = await db
      .select()
      .from(reservations)
      .where(eq(reservations.id, Number(id)));

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    res.json({
      success: true,
      data: reservation
    });
  })
);

router.put('/:id',
  authenticateUser,
  requireRoles(['directeur', 'gerant', 'employe']),
  validateParams(z.object({ id: z.coerce.number().int().positive() })),
  validateBody(UpdateReservationSchema),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const { id } = req.params;
    const updateData = req.body;

    const [updatedReservation] = await db
      .update(reservations)
      .set({
        ...updateData,
        date: updateData.date ? new Date(updateData.date) : undefined,
        updatedAt: new Date()
      })
      .where(eq(reservations.id, Number(id)))
      .returning();

    if (!updatedReservation) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    res.json({
      success: true,
      data: updatedReservation,
      message: 'Réservation mise à jour'
    });
  })
);

router.delete('/:id',
  authenticateUser,
  requireRoles(['directeur', 'gerant']),
  validateParams(z.object({ id: z.coerce.number().int().positive() })),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const { id } = req.params;

    const [deletedReservation] = await db
      .delete(reservations)
      .where(eq(reservations.id, Number(id)))
      .returning();

    if (!deletedReservation) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    res.json({
      success: true,
      message: 'Réservation supprimée'
    });
  })
);

// Route pour vérifier la disponibilité
router.get('/availability/check',
  validateQuery(z.object({
    date: z.string().datetime(),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    partySize: z.coerce.number().int().min(1).max(20),
    tableId: z.coerce.number().int().positive().optional()
  })),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const { date, time, partySize, tableId } = req.query;

    let availableTables = await db
      .select()
      .from(tables)
      .where(and(
        eq(tables.isActive, true),
        gte(tables.capacity, Number(partySize))
      ));

    if (tableId) {
      availableTables = availableTables.filter(table => table.id === Number(tableId));
    }

    // Vérifier les réservations existantes
    const existingReservations = await db
      .select({ tableId: reservations.tableId })
      .from(reservations)
      .where(and(
        sql`DATE(${reservations.date}) = DATE(${date})`,
        eq(reservations.time, String(time)),
        sql`${reservations.status} NOT IN ('cancelled', 'completed')`
      ));

    const reservedTableIds = existingReservations.map(r => r.tableId);
    const available = availableTables.filter(table => !reservedTableIds.includes(table.id));

    res.json({
      success: true,
      data: {
        available: available.length > 0,
        availableTables: available,
        suggestedTimes: available.length === 0 ? [
          '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'
        ].filter(t => t !== time) : []
      }
    });
  })
);

export default router;
