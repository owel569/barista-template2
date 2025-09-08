import { Router } from 'express';
import { authenticateUser } from '../../middleware/auth';
import { requireRoleHierarchy } from '../../middleware/security';
import { validateBody } from '../../middleware/security';
import { db } from '../../db';
import { reservations, customers, tables } from '../../../shared/schema';
import { eq, desc, sql, gte, lte } from 'drizzle-orm';
import { z } from 'zod';
import { Request, Response } from 'express';

const router = Router();

const ReservationSchema = z.object({
  customerId: z.number().int().positive().optional(),
  tableId: z.number().int().positive(),
  date: z.string(),
  time: z.string(),
  partySize: z.number().int().positive().min(1).max(20),
  specialRequests: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'seated', 'completed', 'cancelled']).optional()
});

const ReservationUpdateSchema = ReservationSchema.partial();

// GET /api/admin/reservations - Récupérer toutes les réservations
router.get('/', authenticateUser, requireRoleHierarchy('staff'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { date, status } = req.query;

    let query = db
      .select({
        id: reservations.id,
        date: reservations.date,
        time: reservations.time,
        partySize: reservations.partySize,
        status: reservations.status,
        specialRequests: reservations.specialRequests,
        notes: reservations.notes,
        createdAt: reservations.createdAt,
        customerName: sql<string>`COALESCE(${customers.firstName} || ' ' || ${customers.lastName}, 'Client inconnu')`,
        customerEmail: customers.email,
        customerPhone: customers.phone,
        tableNumber: tables.number
      })
      .from(reservations)
      .leftJoin(customers, eq(reservations.customerId, customers.id))
      .leftJoin(tables, eq(reservations.tableId, tables.id));

    if (date) {
      query = query.where(sql`DATE(${reservations.date}) = ${date}`);
    }

    if (status) {
      // For status filtering, it's better to use the same query builder if possible
      // If status is a string, Drizzle might infer it correctly, otherwise casting might be needed.
      // Ensure 'status' from req.query is correctly typed or validated.
      query = query.where(eq(reservations.status, status as any)); // Cast to any to satisfy Drizzle's type checking for status
    }

    const allReservations = await query.orderBy(desc(reservations.date), desc(reservations.time));

    res.json({
      success: true,
      data: allReservations
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des réservations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des réservations'
    });
  }
});

// GET /api/admin/reservations/:id - Récupérer une réservation par ID
router.get('/:id', authenticateUser, requireRoleHierarchy('staff'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [reservation] = await db
      .select()
      .from(reservations)
      .where(eq(reservations.id, parseInt(id || '0')))
      .limit(1);

    if (!reservation) {
      res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
      return;
    }

    res.json({
      success: true,
      data: reservation
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la réservation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la réservation'
    });
  }
});

// POST /api/admin/reservations - Créer une nouvelle réservation
router.post('/', authenticateUser, requireRoleHierarchy('staff'), validateBody(ReservationSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const reservationData = req.body;

    const [newReservation] = await db
      .insert(reservations)
      .values({
        ...reservationData,
        date: new Date(reservationData.date),
        status: reservationData.status || 'pending'
      })
      .returning();

    res.status(201).json({
      success: true,
      data: newReservation,
      message: 'Réservation créée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la création de la réservation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la réservation'
    });
  }
});

// PUT /api/admin/reservations/:id - Mettre à jour une réservation
router.put('/:id', authenticateUser, requireRoleHierarchy('staff'), validateBody(ReservationUpdateSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Vérifier si la réservation existe
    const [existingReservation] = await db
      .select()
      .from(reservations)
      .where(eq(reservations.id, parseInt(id || '0')))
      .limit(1);

    if (!existingReservation) {
      res.status(400).json({
        success: false,
        message: 'Réservation non trouvée'
      });
      return;
    }

    // Update the reservation
    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }

    const [updatedReservation] = await db
      .update(reservations)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(reservations.id, parseInt(id || '0')))
      .returning();

    res.json({
      success: true,
      data: updatedReservation,
      message: 'Réservation mise à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la réservation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la réservation'
    });
  }
});

// PATCH /api/admin/reservations/:id/status - Mettre à jour le statut d'une réservation
router.patch('/:id/status', authenticateUser, requireRoleHierarchy('staff'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'seated', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Statut invalide'
      });
      return;
    }

    const [updatedReservation] = await db
      .update(reservations)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(reservations.id, parseInt(id || '0')))
      .returning();

    if (!updatedReservation) {
      res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
      return;
    }

    res.json({
      success: true,
      data: updatedReservation,
      message: 'Statut mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut'
    });
  }
});

// DELETE /api/admin/reservations/:id - Supprimer une réservation
router.delete('/:id', authenticateUser, requireRoleHierarchy('manager'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [deletedReservation] = await db
      .delete(reservations)
      .where(eq(reservations.id, parseInt(id || '0')))
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
    console.error('Erreur lors de la suppression de la réservation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la réservation'
    });
  }
});

// GET /api/admin/reservations/stats/overview - Statistiques des réservations
router.get('/stats/overview', authenticateUser, requireRoleHierarchy('staff'), async (req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const [
      totalReservationsResult,
      todayReservationsResult,
      confirmedReservationsResult,
      pendingReservationsResult
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)::integer` }).from(reservations),
      db.select({ count: sql<number>`count(*)::integer` })
        .from(reservations)
        .where(sql`DATE(${reservations.date}) = CURRENT_DATE`),
      db.select({ count: sql<number>`count(*)::integer` })
        .from(reservations)
        .where(eq(reservations.status, 'confirmed')),
      db.select({ count: sql<number>`count(*)::integer` })
        .from(reservations)
        .where(eq(reservations.status, 'pending'))
    ]);

    res.json({
      success: true,
      data: {
        total: totalReservationsResult[0].count,
        today: todayReservationsResult[0].count,
        confirmed: confirmedReservationsResult[0].count,
        pending: pendingReservationsResult[0].count
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques de réservation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques de réservation'
    });
  }
});

export default router;