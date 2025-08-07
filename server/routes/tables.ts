
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error-handler';
import { createLogger } from '../middleware/logging';
import { authenticateUser, requireRoles } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { getDb } from '../db';
import { tables as dbTables, reservations } from '../../shared/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

const tablesRouter = Router();
const logger = createLogger('TABLES');

// ==========================================
// TYPES ET INTERFACES
// ==========================================

export interface TableReservation {
  id: number;
  customerName: string;
  partySize: number;
  time: string;
  date: string;
  notes?: string;
}

export interface Table {
  id: number;
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  location: string;
  currentReservation: TableReservation | null;
  createdAt: string;
  updatedAt: string;
}

export interface TableStats {
  totalTables: number;
  availableTables: number;
  occupiedTables: number;
  reservedTables: number;
  maintenanceTables: number;
  totalCapacity: number;
  occupancyRate: string;
  locationBreakdown: Array<{
    location: string;
    count: number;
  }>;
}

export interface TableAvailability {
  id: number;
  number: number;
  capacity: number;
  location: string;
  available: boolean;
  nextAvailableTime?: string;
}

// ==========================================
// CONSTANTES
// ==========================================

const TABLE_LOCATIONS = ['Terrasse', 'Intérieur', 'Bar', 'Salle privée'] as const;

// ==========================================
// SCHÉMAS DE VALIDATION ZOD
// ==========================================

const TableStatusSchema = z.enum(['available', 'occupied', 'reserved', 'maintenance']);

const tableSchema = z.object({
  number: z.number()}).positive('Numéro de table doit être positif'),
  capacity: z.number().min(1, 'Capacité minimum 1').max(20, 'Capacité maximum 20'),
  status: TableStatusSchema.default('available'),
  location: z.string().min(1, 'Emplacement requis')
});

const statusUpdateSchema = z.object({
  status: TableStatusSchema,
  reservationId: z.number()}).optional(),
  notes: z.string().optional()
});

const reservationSchema = z.object({
  customerName: z.string()}).min(1, 'Nom du client requis'),
  partySize: z.number().min(1, 'Taille du groupe minimum 1').max(20, 'Taille du groupe maximum 20'),
  date: z.string().datetime('Date invalide'),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format heure invalide (HH:MM)'),
  notes: z.string().optional()
});

const TableQuerySchema = z.object({
  status: TableStatusSchema.optional()}),
  location: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(10),
  offset: z.coerce.number().min(0).default(0)
});

const AvailabilityQuerySchema = z.object({
  capacity: z.coerce.number()}).min(1).optional(),
  date: z.string().datetime().optional(),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional()
});

// ==========================================
// DONNÉES DE TEST
// ==========================================

const tables: Table[] = [
  {
    id: 1,
    number: 1,
    capacity: 4,
    status: 'available',
    location: 'Terrasse',
    currentReservation: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 2,
    number: 2,
    capacity: 6,
    status: 'occupied',
    location: 'Intérieur',
    currentReservation: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-16T12:00:00Z'
  },
  {
    id: 3,
    number: 3,
    capacity: 2,
    status: 'reserved',
    location: 'Bar',
    currentReservation: {
      id: 1,
      customerName: 'Marie Dubois',
      partySize: 2,
      time: '19:00',
      date: '2025-01-16T00:00:00Z',
      notes: 'Anniversaire'
    },
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-16T10:00:00Z'
  }
];

// ==========================================
// SERVICES MÉTIER
// ==========================================

class TableService {
  /**
   * Vérifie la disponibilité d'une table pour une date/heure donnée
   */
  static async checkTableAvailability(
    tableId: number, 
    date: string, 
    time: string
  ): Promise<boolean> {
    try {
      const db = await getDb();
      
      const existingReservations = await db.select()
        .from(reservations)
        .where(and(
          eq(reservations.tableId, tableId),
          eq(reservations.date, new Date(date)),
          eq(reservations.time, time)
        ))
        .limit(1);

      return existingReservations.length === 0;
    } catch (error) {
      logger.error('Erreur vérification disponibilité table', { 
        tableId, 
        date, 
        time, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      )});
      return false;
    }
  }

  /**
   * Calcule les statistiques des tables
   */
  static calculateTableStats(tables: Table[]): TableStats {
    const totalTables = tables.length;
    const availableTables = tables.filter(t => t.status === 'available').length;
    const occupiedTables = tables.filter(t => t.status === 'occupied').length;
    const reservedTables = tables.filter(t => t.status === 'reserved').length;
    const maintenanceTables = tables.filter(t => t.status === 'maintenance').length;
    const totalCapacity = tables.reduce((sum, table) => sum + table.capacity, 0);
    const occupancyRate = totalTables > 0 ? ((occupiedTables / totalTables) * 100).toFixed(1) : '0.0';

    const locationBreakdown = TABLE_LOCATIONS.map(location => ({
      location,
      count: tables.filter(t => t.location === location}).length
    });

    return {
      totalTables,
      availableTables,
      occupiedTables,
      reservedTables,
      maintenanceTables,
      totalCapacity,
      occupancyRate,
      locationBreakdown
    };
  }
}

// ==========================================
// ROUTES AVEC AUTHENTIFICATION ET VALIDATION
// ==========================================

// Récupérer toutes les tables
tablesRouter.get('/', 
  authenticateUser,
  requireRoles(['admin', 'manager', 'staff']),
  validateQuery(TableQuerySchema),
  asyncHandler(async (req, res) => {
    const { status, location, limit, offset } = req.query;
    
    try {
      let filteredTables = tables;

      if (status) {
        filteredTables = filteredTables.filter(table => table.status === status);
      }

      if (location) {
        filteredTables = filteredTables.filter(table => table.location === location);
      }

      const paginated = filteredTables.slice(offset, offset + limit);

  res.json({
        success: true,
        data: {
          tables: paginated,
    pagination: {
      total: filteredTables.length,
            limit,
            offset,
            hasMore: offset + limit < filteredTables.length
          }
        }
      });
    } catch (error) {
      logger.error('Erreur récupération tables', { 
        status, 
        location, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      )});
      res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la récupération des tables' 
      });
    }
  })
);

// Statistiques des tables
tablesRouter.get('/stats', 
  authenticateUser,
  requireRoles(['admin', 'manager']),
  asyncHandler(async (req, res) => {
    try {
      const stats = TableService.calculateTableStats(tables);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Erreur statistiques tables', { 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      )});
      res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la récupération des statistiques' 
      });
    }
  })
);

// Tables disponibles
tablesRouter.get('/available', 
  authenticateUser,
  requireRoles(['admin', 'manager', 'staff']),
  validateQuery(AvailabilityQuerySchema),
  asyncHandler(async (req, res) => {
    const { capacity, date, time } = req.query;
    
    try {
      let availableTables = tables.filter(table => table.status === 'available');

      if (capacity) {
        availableTables = availableTables.filter(table => table.capacity >= capacity);
      }

      // Vérifier la disponibilité pour la date/heure si fournie
      if (date && time) {
        const availabilityPromises = availableTables.map(async (table) => {
          const isAvailable = await TableService.checkTableAvailability(table.id, date as string, time as string);
          return isAvailable ? table : null;
        });

        const availabilityResults = await Promise.all(availabilityPromises);
        availableTables = availabilityResults.filter((table): table is Table => table !== null);
      }

      res.json({
        success: true,
        data: availableTables
      });
    } catch (error) {
      logger.error('Erreur tables disponibles', { 
        capacity, 
        date, 
        time, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      )});
      res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la récupération des tables disponibles' 
      });
    }
  })
);

// Récupérer une table par ID
tablesRouter.get('/:id', 
  authenticateUser,
  requireRoles(['admin', 'manager', 'staff']),
  validateParams(z.object({ id: z.string()}).regex(/^\d+$/) })),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const idNum = parseInt(id);
    
    try {
  const table = tables.find(t => t.id === idNum);
      
  if (!table) {
        return res.status(404).json({ 
          success: false,
          message: 'Table non trouvée' 
        });
      }

      res.json({
        success: true,
        data: table
      });
    } catch (error) {
      logger.error('Erreur récupération table', { 
        id, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      )});
      res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la récupération de la table' 
      });
    }
  })
);

// Créer une nouvelle table
tablesRouter.post('/', 
  authenticateUser,
  requireRoles(['admin', 'manager']),
  validateBody(tableSchema),
  asyncHandler(async (req, res) => {
    const { number, capacity, status, location } = req.body;
    
    try {
      // Vérifier l'unicité du numéro de table
      const exists = tables.some(t => t.number === number);
      if (exists) {
        return res.status(409).json({ 
          success: false,
          message: 'Numéro de table déjà utilisé' 
        });
      }

  const newTable: Table = {
    id: tables.length + 1,
        number,
        capacity,
        status: status || 'available',
        location,
    currentReservation: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  tables.push(newTable);

      logger.info('Nouvelle table créée', { 
        tableId: newTable.id,
        tableNumber: newTable.number,
        userId: req.user?.id
      });

      res.status(201).json({
        success: true,
        data: newTable
      });
    } catch (error) {
      logger.error('Erreur création table', { 
        number, 
        capacity, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      )});
      res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la création de la table' 
      });
    }
  })
);

// Mettre à jour le statut d'une table
tablesRouter.patch('/:id/status', 
  authenticateUser,
  requireRoles(['admin', 'manager', 'staff']),
  validateParams(z.object({ id: z.string()}).regex(/^\d+$/) })),
  validateBody(statusUpdateSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
  const { status, reservationId, notes } = req.body;
    const idNum = parseInt(id);
  
    try {
  const table = tables.find(t => t.id === idNum);
      
  if (!table) {
        return res.status(404).json({ 
          success: false,
          message: 'Table non trouvée' 
        });
  }

      const previousStatus = table.status;
      table.status = status;
      table.updatedAt = new Date().toISOString();
  
  // Gérer les réservations selon le statut
  if (status === 'available') {
    table.currentReservation = null;
  } else if (status === 'reserved' && reservationId) {
    table.currentReservation = {
      id: reservationId,
      customerName: 'Client Réservé',
      partySize: 2,
      time: '19:00',
          date: new Date().toISOString(),
          notes
        };
      }

      logger.info('Statut table mis à jour', { 
        tableId: table.id,
        previousStatus,
        newStatus: status,
        userId: req.user?.id
      });

      res.json({
        success: true,
        data: table
      });
    } catch (error) {
      logger.error('Erreur mise à jour statut table', { 
        id, 
        status, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      )});
      res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la mise à jour du statut' 
      });
    }
  })
);

// Réserver une table
tablesRouter.post('/:id/reserve', 
  authenticateUser,
  requireRoles(['admin', 'manager', 'staff']),
  validateParams(z.object({ id: z.string()}).regex(/^\d+$/) })),
  validateBody(reservationSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { customerName, partySize, date, time, notes } = req.body;
    const idNum = parseInt(id);
    
    try {
  const table = tables.find(t => t.id === idNum);
  
  if (!table) {
        return res.status(404).json({ 
          success: false,
          message: 'Table non trouvée' 
        });
  }
  
  if (table.status !== 'available') {
        return res.status(400).json({ 
          success: false,
          message: 'Table non disponible' 
        });
      }

      // Vérifier la disponibilité
      const isAvailable = await TableService.checkTableAvailability(idNum, date, time);
      if (!isAvailable) {
        return res.status(409).json({ 
          success: false,
          message: 'Table déjà réservée pour cette date/heure' 
        });
      }

      // Créer la réservation
      const reservation: TableReservation = {
    id: Date.now(),
        customerName,
        partySize,
        date,
        time,
        notes
      };

      table.currentReservation = reservation;
      table.status = 'reserved';
  table.updatedAt = new Date().toISOString();
  
      logger.info('Table réservée', { 
        tableId: table.id,
        customerName,
        date,
        time,
        userId: req.user?.id
      });

      res.json({
        success: true,
        data: {
          table,
          reservation
        }
      });
    } catch (error) {
      logger.error('Erreur réservation table', { 
        id, 
        customerName, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      )});
      res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la réservation' 
      });
    }
  })
);

// Mettre à jour une table
tablesRouter.put('/:id', 
  authenticateUser,
  requireRoles(['admin', 'manager']),
  validateParams(z.object({ id: z.string()}).regex(/^\d+$/) })),
  validateBody(tableSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { number, capacity, status, location } = req.body;
    const idNum = parseInt(id);
    
    try {
  const table = tables.find(t => t.id === idNum);
  
  if (!table) {
        return res.status(404).json({ 
          success: false,
          message: 'Table non trouvée' 
        });
      }

      // Vérifier l'unicité du numéro si modifié
      if (number !== table.number) {
        const exists = tables.some(t => t.number === number && t.id !== idNum);
        if (exists) {
          return res.status(409).json({ 
            success: false,
            message: 'Numéro de table déjà utilisé' 
          });
        }
      }

      table.number = number;
      table.capacity = capacity;
      table.status = status;
      table.location = location;
      table.updatedAt = new Date().toISOString();

      logger.info('Table mise à jour', { 
        tableId: table.id,
        userId: req.user?.id
      });

      res.json({
        success: true,
        data: table
      });
    } catch (error) {
      logger.error('Erreur mise à jour table', { 
        id, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      )});
      res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la mise à jour de la table' 
      });
    }
  })
);

// Supprimer une table
tablesRouter.delete('/:id', 
  authenticateUser,
  requireRoles(['admin']),
  validateParams(z.object({ id: z.string()}).regex(/^\d+$/) })),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const idNum = parseInt(id);
    
    try {
      const tableIndex = tables.findIndex(t => t.id === idNum);
      
      if (tableIndex === -1) {
        return res.status(404).json({ 
          success: false,
          message: 'Table non trouvée' 
        });
      }

      const deletedTable = tables.splice(tableIndex, 1)[0];

      logger.info('Table supprimée', { 
        tableId: deletedTable.id,
        tableNumber: deletedTable.number,
        userId: req.user?.id
      });

      res.json({
        success: true,
        message: 'Table supprimée avec succès'
      });
    } catch (error) {
      logger.error('Erreur suppression table', { 
        id, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      )});
      res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la suppression de la table' 
      });
    }
  })
);

export default tablesRouter;
