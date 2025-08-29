import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../middleware/error-handler-enhanced';
import { createLogger } from '../../middleware/logging';
import { authenticateUser, requireRoles } from '../../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../../middleware/validation';
import { getDb } from '../../db';
import { tables, reservations, activityLogs } from '../../../shared/schema';
import { eq, and, or, desc, sql, ne, isNull } from 'drizzle-orm';
import { cacheMiddleware, invalidateCache } from '../../middleware/cache-advanced';

const router = Router();
const logger = createLogger('TABLES_ROUTES');

// Schémas de validation
const CreateTableSchema = z.object({
  number: z.number().int().min(1, 'Numéro de table doit être >= 1'),
  capacity: z.number().int().min(1, 'Capacité doit être >= 1').max(20, 'Capacité max 20'),
  location: z.string().min(1, 'Emplacement requis').max(50),
  section: z.string().min(1, 'Section requise').max(50),
  features: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  description: z.string().max(200).optional()
});

const UpdateTableSchema = CreateTableSchema.partial().extend({
  id: z.number().int().positive('ID invalide')
});

const TableStatusSchema = z.object({
  status: z.enum(['available', 'occupied', 'reserved', 'maintenance'], {
    errorMap: () => ({ message: 'Statut doit être: available, occupied, reserved, ou maintenance' })
  }),
  notes: z.string().max(200).optional()
});

// Interface pour le statut des tables
interface TableStatus {
  id: string;
  number: number;
  capacity: number;
  location: string;
  section: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  currentReservation?: {
    id: string;
    customerName: string;
    startTime: Date;
    endTime: Date;
    partySize: number;
  };
  nextReservation?: {
    id: string;
    customerName: string;
    startTime: Date;
    partySize: number;
  };
}

// Fonction utilitaire pour enregistrer une activité
async function logTableActivity(
  userId: string,
  action: string,
  details: string,
  req: any,
  tableId?: string
): Promise<void> {
  try {
    const db = getDb();
    await db.insert(activityLogs).values({
      id: crypto.randomUUID(),
      userId,
      action,
      details: tableId ? `${details} (Table: ${tableId})` : details,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      createdAt: new Date()
    });
  } catch (error) {
    logger.error('Erreur enregistrement activité table', {
      userId,
      action,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
}

// Liste des tables avec filtres
router.get('/',
  authenticateUser,
  requireRoles(['admin', 'manager', 'waiter']),
  validateQuery(z.object({
    location: z.enum(['inside', 'outside', 'terrace', 'private_room']).optional(),
    section: z.string().optional(),
    capacity: z.coerce.number().int().min(1).optional(),
    isActive: z.boolean().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    sortBy: z.enum(['number', 'capacity', 'location', 'section', 'createdAt']).default('number'),
    sortOrder: z.enum(['asc', 'desc']).default('asc')
  })),
  cacheMiddleware({ ttl: 1 * 60 * 1000, tags: ['tables'] }),
  asyncHandler(async (req, res): Promise<void> => {
    const db = getDb();
    const {
      location,
      section,
      capacity,
      isActive,
      page = 1,
      limit = 50,
      sortBy = 'number',
      sortOrder = 'asc'
    } = req.query;

    let query = db
      .select()
      .from(tables);

    // Construire les conditions
    const conditions = [];

    if (location) {
      conditions.push(eq(tables.location, location));
    }

    if (section) {
      conditions.push(eq(tables.section, section));
    }

    if (capacity) {
      conditions.push(eq(tables.capacity, capacity));
    }

    if (isActive !== undefined) {
      conditions.push(eq(tables.isActive, isActive));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Tri
    const orderColumn = sortBy === 'number' ? tables.number :
                       sortBy === 'capacity' ? tables.capacity :
                       sortBy === 'location' ? tables.location :
                       sortBy === 'section' ? tables.section :
                       tables.createdAt;

    query = sortOrder === 'desc' ?
      query.orderBy(desc(orderColumn)) :
      query.orderBy(orderColumn);

    // Pagination
    const offset = (page - 1) * limit;
    const tablesData = await query.limit(limit).offset(offset);

    // Compte total
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(tables)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    logger.info('Tables récupérées', {
      count: tablesData.length,
      total: count,
      filters: { location, section, capacity, isActive }
    });

    res.json({
      success: true,
      data: tablesData,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  })
);

// Statut en temps réel des tables
router.get('/status',
  authenticateUser,
  requireRoles(['admin', 'manager', 'waiter']),
  cacheMiddleware({ ttl: 30 * 1000, tags: ['tables', 'reservations'] }), // Cache très court pour temps réel
  asyncHandler(async (req, res): Promise<void> => {
    const db = getDb();
    const now = new Date();

    // Récupérer toutes les tables actives
    const allTables = await db
      .select()
      .from(tables)
      .where(eq(tables.isActive, true))
      .orderBy(tables.number);

    // Récupérer les réservations actuelles et futures
    const currentReservations = await db
      .select({
        id: reservations.id,
        tableId: reservations.tableId,
        customerName: reservations.guestName,
        startTime: reservations.reservationTime,
        endTime: sql<Date>`${reservations.reservationTime} + INTERVAL '2 hours'`, // Durée par défaut
        partySize: reservations.partySize,
        status: reservations.status
      })
      .from(reservations)
      .where(
        and(
          sql`${reservations.reservationTime} <= ${now}`,
          sql`${reservations.reservationTime} + INTERVAL '2 hours' > ${now}`,
          eq(reservations.status, 'confirmed')
        )
      );

    const nextReservations = await db
      .select({
        id: reservations.id,
        tableId: reservations.tableId,
        customerName: reservations.guestName,
        startTime: reservations.reservationTime,
        partySize: reservations.partySize
      })
      .from(reservations)
      .where(
        and(
          sql`${reservations.reservationTime} > ${now}`,
          sql`${reservations.reservationTime} <= ${now} + INTERVAL '4 hours'`,
          eq(reservations.status, 'confirmed')
        )
      )
      .orderBy(reservations.reservationTime);

    // Créer un map des réservations par table
    const currentReservationMap = new Map();
    currentReservations.forEach(res => {
      currentReservationMap.set(res.tableId, res);
    });

    const nextReservationMap = new Map();
    nextReservations.forEach(res => {
      if (!nextReservationMap.has(res.tableId)) {
        nextReservationMap.set(res.tableId, res);
      }
    });

    // Construire le statut de chaque table
    const tableStatuses: TableStatus[] = allTables.map(table => {
      const currentRes = currentReservationMap.get(table.id);
      const nextRes = nextReservationMap.get(table.id);

      let status: 'available' | 'occupied' | 'reserved' | 'maintenance' = 'available';

      if (table.status === 'maintenance') {
        status = 'maintenance';
      } else if (currentRes) {
        status = 'occupied';
      } else if (nextRes && new Date(nextRes.startTime).getTime() - now.getTime() < 60 * 60 * 1000) {
        // Table réservée dans l'heure qui vient
        status = 'reserved';
      }

      return {
        id: table.id,
        number: table.number,
        capacity: table.capacity,
        location: table.location,
        section: table.section,
        status,
        currentReservation: currentRes ? {
          id: currentRes.id,
          customerName: currentRes.customerName,
          startTime: currentRes.startTime,
          endTime: currentRes.endTime,
          partySize: currentRes.partySize
        } : undefined,
        nextReservation: nextRes ? {
          id: nextRes.id,
          customerName: nextRes.customerName,
          startTime: nextRes.startTime,
          partySize: nextRes.partySize
        } : undefined
      };
    });

    // Statistiques rapides
    const stats = {
      total: tableStatuses.length,
      available: tableStatuses.filter(t => t.status === 'available').length,
      occupied: tableStatuses.filter(t => t.status === 'occupied').length,
      reserved: tableStatuses.filter(t => t.status === 'reserved').length,
      maintenance: tableStatuses.filter(t => t.status === 'maintenance').length
    };

    logger.info('Statut des tables récupéré', stats);

    res.json({
      success: true,
      data: {
        tables: tableStatuses,
        stats
      }
    });
  })
);

// Créer une table
router.post('/',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  validateBody(CreateTableSchema),
  invalidateCache(['tables']),
  asyncHandler(async (req, res): Promise<void> => {
    const db = getDb();
    const currentUser = (req as any).user;

    // Vérifier que le numéro de table n'existe pas déjà
    const [existingTable] = await db
      .select({ id: tables.id })
      .from(tables)
      .where(eq(tables.number, req.body.number));

    if (existingTable) {
      return res.status(409).json({
        success: false,
        message: 'Une table avec ce numéro existe déjà'
      });
    }

    // Créer la table
    const tableId = crypto.randomUUID();
    const [newTable] = await db
      .insert(tables)
      .values({
        id: tableId,
        ...req.body,
        status: 'available',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    // Enregistrer l'activité
    await logTableActivity(
      currentUser.id,
      'CREATE_TABLE',
      `Table créée: #${req.body.number} (${req.body.capacity} places, ${req.body.location})`,
      req,
      tableId
    );

    logger.info('Table créée', {
      tableId,
      number: req.body.number,
      capacity: req.body.capacity,
      location: req.body.location,
      createdBy: currentUser.id
    });

    res.status(201).json({
      success: true,
      data: newTable,
      message: 'Table créée avec succès'
    });
  })
);

// Mettre à jour une table
router.put('/:id',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  validateParams(z.object({ id: z.string().uuid() })),
  validateBody(UpdateTableSchema.omit({ id: true })),
  invalidateCache(['tables']),
  asyncHandler(async (req, res): Promise<void> => {
    const db = getDb();
    const currentUser = (req as any).user;
    const { id } = req.params;

    // Vérifier que la table existe
    const [existingTable] = await db
      .select()
      .from(tables)
      .where(eq(tables.id, id));

    if (!existingTable) {
      return res.status(404).json({
        success: false,
        message: 'Table non trouvée'
      });
    }

    // Vérifier le numéro de table en cas de modification
    if (req.body.number && req.body.number !== existingTable.number) {
      const [numberExists] = await db
        .select({ id: tables.id })
        .from(tables)
        .where(and(
          eq(tables.number, req.body.number),
          ne(tables.id, id)
        ));

      if (numberExists) {
        return res.status(409).json({
          success: false,
          message: 'Une table avec ce numéro existe déjà'
        });
      }
    }

    // Mettre à jour la table
    const [updatedTable] = await db
      .update(tables)
      .set({
        ...req.body,
        updatedAt: new Date()
      })
      .where(eq(tables.id, id))
      .returning();

    // Enregistrer l'activité
    await logTableActivity(
      currentUser.id,
      'UPDATE_TABLE',
      `Table mise à jour: #${updatedTable.number} - ${Object.keys(req.body).join(', ')}`,
      req,
      id
    );

    logger.info('Table mise à jour', {
      tableId: id,
      changes: Object.keys(req.body),
      updatedBy: currentUser.id
    });

    res.json({
      success: true,
      data: updatedTable,
      message: 'Table mise à jour avec succès'
    });
  })
);

// Changer le statut d'une table
router.patch('/:id/status',
  authenticateUser,
  requireRoles(['admin', 'manager', 'waiter']),
  validateParams(z.object({ id: z.string().uuid() })),
  validateBody(TableStatusSchema),
  invalidateCache(['tables']),
  asyncHandler(async (req, res): Promise<void> => {
    const db = getDb();
    const currentUser = (req as any).user;
    const { id } = req.params;
    const { status, notes } = req.body;

    // Vérifier que la table existe
    const [existingTable] = await db
      .select()
      .from(tables)
      .where(eq(tables.id, id));

    if (!existingTable) {
      return res.status(404).json({
        success: false,
        message: 'Table non trouvée'
      });
    }

    // Mettre à jour le statut
    const [updatedTable] = await db
      .update(tables)
      .set({
        status,
        notes,
        updatedAt: new Date()
      })
      .where(eq(tables.id, id))
      .returning();

    // Enregistrer l'activité
    await logTableActivity(
      currentUser.id,
      'UPDATE_TABLE_STATUS',
      `Statut table #${existingTable.number} changé: ${existingTable.status} → ${status}${notes ? ` (${notes})` : ''}`,
      req,
      id
    );

    logger.info('Statut table mis à jour', {
      tableId: id,
      number: existingTable.number,
      previousStatus: existingTable.status,
      newStatus: status,
      notes,
      updatedBy: currentUser.id
    });

    res.json({
      success: true,
      data: updatedTable,
      message: 'Statut de la table mis à jour avec succès'
    });
  })
);

// Supprimer une table (désactivation)
router.delete('/:id',
  authenticateUser,
  requireRoles(['admin']),
  validateParams(z.object({ id: z.string().uuid() })),
  invalidateCache(['tables']),
  asyncHandler(async (req, res): Promise<void> => {
    const db = getDb();
    const currentUser = (req as any).user;
    const { id } = req.params;

    // Vérifier s'il y a des réservations futures
    const [futureReservations] = await db
      .select({ count: sql<number>`count(*)` })
      .from(reservations)
      .where(
        and(
          eq(reservations.tableId, id),
          sql`${reservations.reservationTime} > NOW()`,
          eq(reservations.status, 'confirmed')
        )
      );

    if (futureReservations.count > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer la table: ${futureReservations.count} réservation(s) future(s)`
      });
    }

    // Désactiver la table au lieu de la supprimer
    const [deactivatedTable] = await db
      .update(tables)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(tables.id, id))
      .returning();

    if (!deactivatedTable) {
      return res.status(404).json({
        success: false,
        message: 'Table non trouvée'
      });
    }

    // Enregistrer l'activité
    await logTableActivity(
      currentUser.id,
      'DEACTIVATE_TABLE',
      `Table désactivée: #${deactivatedTable.number}`,
      req,
      id
    );

    logger.info('Table désactivée', {
      tableId: id,
      number: deactivatedTable.number,
      deactivatedBy: currentUser.id
    });

    res.json({
      success: true,
      message: 'Table désactivée avec succès'
    });
  })
);

// Statistiques des tables
router.get('/stats',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  cacheMiddleware({ ttl: 5 * 60 * 1000, tags: ['tables', 'stats'] }),
  asyncHandler(async (req, res): Promise<void> => {
    const db = getDb();

    // Statistiques générales
    const [stats] = await db
      .select({
        totalTables: sql<number>`count(*)`,
        activeTables: sql<number>`count(*) filter (where ${tables.isActive} = true)`,
        totalCapacity: sql<number>`sum(${tables.capacity})`,
        avgCapacity: sql<number>`avg(${tables.capacity})`
      })
      .from(tables);

    // Répartition par emplacement
    const locationStats = await db
      .select({
        location: tables.location,
        count: sql<number>`count(*)`,
        totalCapacity: sql<number>`sum(${tables.capacity})`
      })
      .from(tables)
      .where(eq(tables.isActive, true))
      .groupBy(tables.location);

    // Répartition par section
    const sectionStats = await db
      .select({
        section: tables.section,
        count: sql<number>`count(*)`,
        totalCapacity: sql<number>`sum(${tables.capacity})`
      })
      .from(tables)
      .where(eq(tables.isActive, true))
      .groupBy(tables.section);

    logger.info('Statistiques tables récupérées', stats);

    res.json({
      success: true,
      data: {
        overview: stats,
        byLocation: locationStats,
        bySection: sectionStats
      }
    });
  })
);

export default router;