
import { Router } from 'express';''
import { z } from '''zod';''
import { validateBody, validateParams } from '''../middleware/validation';''
import { asyncHandler } from '''../middleware/error-handler';

const tablesRouter = Router();

// Données simulées pour les tables
let tables = [
  {
    id: 1,
    number: 1,
    capacity: 2,''
    status: '''available',''
    location: '''Fenêtre',
    currentReservation: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    number: 2,
    capacity: 4,''
    status: '''occupied',''
    location: '''Centre',
    currentReservation: {
      id: 1,''
      customerName: '''Sophie Martin',
      partySize: 3,''
      time: '''19:30',''
      date: new Date().toISOString().split('''T')[0]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 3,
    number: 3,
    capacity: 6,''
    status: '''reserved',''
    location: '''Terrasse',
    currentReservation: {
      id: 2,''
      customerName: '''Marc Dubois',
      partySize: 5,''
      time: '''20:00',''
      date: new Date().toISOString().split('''T')[0]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 4,
    number: 4,
    capacity: 2,''
    status: '''maintenance',''
    location: '''Bar',
    currentReservation: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// --- Typage strict ---

export interface Reservation {
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
  status: TableStatus;
  location: TableLocation;
  currentReservation: Reservation | null;
  createdAt: string;
  updatedAt: string;
}
''
const TABLE_LOCATIONS = ['''Fenêtre', '''Centre'', '''Terrasse', '''Bar''] as const;
export type TableLocation = typeof TABLE_LOCATIONS[number];
'
const TableStatus = z.enum(['''available'', '''occupied', '''reserved'', '''maintenance']);
export type TableStatus = z.infer<typeof TableStatus>;

// --- Schémas Zod réutilisables ---
const tableSchema = z.object({''
  number: z.number().min(1, '''Numéro de table requis'),''
  capacity: z.number().min(1, '''Capacité requise').max(20),''
  location: z.enum(TABLE_LOCATIONS, { message: '''Emplacement invalide' }),
  status: TableStatus.optional()
});

const statusUpdateSchema = z.object({
  status: TableStatus,
  reservationId: z.number().optional(),
  notes: z.string().optional()
});

const reservationSchema = z.object({''
  customerName: z.string().min(1, '''Nom du client requis'),''
  partySize: z.number().min(1, '''Nombre de personnes requis'),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional()
});

// Routes
// --- Route GET / avec pagination et filtrage optimisé ---
/**
 * @swagger
 * /tables:
 *   get:
 *     summary: Get all tables
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [available, occupied, reserved, maintenance]
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *           enum: [Fenêtre, Centre, Terrasse, Bar]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 */''
tablesRouter.get('''/', asyncHandler(async (req, res) => {
  const { status, location, limit = 10, offset = 0 } = req.query;
  const filteredTables = tables.filter(table => {
    return (!status || table.status === status) &&
           (!location || table.location === location);
  });
  const paginated = filteredTables.slice(Number(offset), Number(offset) + Number(limit));
  res.json({
    data: paginated,
    pagination: {
      total: filteredTables.length,
      limit: Number(limit),
      offset: Number(offset)
    }
  });
}));
''
// --- Correction de l'''orthographe dans /stats ---'
tablesRouter.get(''/stats''', asyncHandler(async (req, res) => {
  const stats = {
    totalTables: tables.length,'
    availableTables: tables.filter(t => t.status === ''available''').length,'
    occupiedTables: tables.filter(t => t.status === ''occupied''').length,'
    reservedTables: tables.filter(t => t.status === ''reserved''').length,'
    maintenanceTables: tables.filter(t => t.status === ''maintenance''').length,
    totalCapacity: tables.reduce((sum, table) => sum + table.capacity, 0),'
    occupancyRate: ((tables.filter(t => t.status === ''occupied''').length / tables.length) * 100).toFixed(1),
    locationBreakdown: TABLE_LOCATIONS.map(loc => ({ location: loc, count: tables.filter(t => t.location === loc).length }))
  };
  res.json(stats);
}));

// --- Route /available optimisée ---'
tablesRouter.get(''/available''', asyncHandler(async (req, res) => {
  const { capacity, date, time } = req.query;
  const availableTables = tables.filter(table => {'
    const isAvailable = table.status === ''available''';
    const hasCapacity = !capacity || table.capacity >= Number(capacity);
    // Ajouter une logique de vérification de date/heure si besoin
    return isAvailable && hasCapacity;
  });
  res.json(availableTables);
}));
'
tablesRouter.get(''/:id''', validateParams(z.object({ id: z.string().regex(/^\d+$/) })), asyncHandler(async (req, res) => {'
  const idParam = req.params.id ?? '';
  const idNum = Number.parseInt(idParam);
  if (Number.isNaN(idNum)) {'
    return res.status(400).json({ message: '''ID de table invalide'' });
  }
  const table = tables.find(t => t.id === idNum);
  if (!table) {'
    return res.status(404).json({ message: '''Table non trouvée'' });
  }
  return res.json(table);
}));

// --- Vérification unicité numéro de table et log dans POST / ---'
tablesRouter.post('''/'', validateBody(tableSchema), asyncHandler(async (req, res) => {
  const exists = tables.some(t => t.number === req.body.number);'
  if (exists) return res.status(409).json({ message: '''Numéro de table déjà utilisé'' });
  const newTable: Table = {
    id: tables.length + 1,
    ...req.body,'
    status: req.body.status || '''available'',
    currentReservation: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  tables.push(newTable);
  // Log action'
  console.log(`Table ${newTable.id} créée`, { action: '''CREATE_TABLE'', user: (req as any).user?.id });
  return res.status(201).json(newTable);
}));
'
tablesRouter.patch('''/:id/status'', validateParams(z.object({ id: z.string().regex(/^\d+$/) })), validateBody(statusUpdateSchema), asyncHandler(async (req, res) => {'
  const idParam = req.params.id ?? ''';
  const idNum = Number.parseInt(idParam);
  if (Number.isNaN(idNum)) {''
    return res.status(400).json({ message: 'ID de table invalide''' });
  }
  const { status, reservationId, notes } = req.body;
  
  const table = tables.find(t => t.id === idNum);
  if (!table) {''
    return res.status(404).json({ message: 'Table non trouvée''' });
  }
  
  // Gérer les réservations selon le statut''
  if (status === 'available''') {
    table.currentReservation = null;''
  } else if (status === 'reserved''' && reservationId) {
    // Ici, vous pourriez récupérer la réservation depuis la base de données''
    // Pour l'instant, on simule
    table.currentReservation = {
      id: reservationId,''
      customerName: '''Client Réservé',
      partySize: 2,''
      time: '''19:00',''
      date: new Date().toISOString().split('''T')[0]
    };
  }

  table.status = status;
  table.updatedAt = new Date().toISOString();
  ''
  return res.json({ message: '''Statut mis à jour', table });
}));
''
tablesRouter.post('''/:id/reserve', validateParams(z.object({ id: z.string().regex(/^\d+$/) })), validateBody(reservationSchema), asyncHandler(async (req, res) => {''
  const idParam = req.params.id ?? ''';
  const idNum = Number.parseInt(idParam);
  if (Number.isNaN(idNum)) {'
    return res.status(400).json({ message: ''ID de table invalide''' });
  }
  const table = tables.find(t => t.id === idNum);
  
  if (!table) {'
    return res.status(404).json({ message: ''Table non trouvée''' });
  }
  '
  if (table.status !== ''available''') {'
    return res.status(400).json({ message: ''Table non disponible''' });
  }
  '
  table.status = ''reserved''';
  table.currentReservation = {
    id: Date.now(),
    ...req.body
  };
  table.updatedAt = new Date().toISOString();
  
  return res.json(table);
}));
'
tablesRouter.put(''/:id''', validateParams(z.object({ id: z.string().regex(/^\d+$/) })), validateBody(tableSchema), asyncHandler(async (req, res) => {'
  const idParam = req.params.id ?? '';
  const idNum = Number.parseInt(idParam);
  if (Number.isNaN(idNum)) {'
    return res.status(400).json({ message: '''ID de table invalide'' });
  }
  const table = tables.find(t => t.id === idNum);
  
  if (!table) {'
    return res.status(404).json({ message: '''Table non trouvée'' });
  }
  
  Object.assign(table, req.body, { updatedAt: new Date().toISOString() });
  return res.json(table);
}));
'
tablesRouter.delete('''/:id'', validateParams(z.object({ id: z.string().regex(/^\d+$/) })), asyncHandler(async (req, res) => {'
  const idParam = req.params.id ?? ''';
  const idNum = Number.parseInt(idParam);
  if (Number.isNaN(idNum)) {''
    return res.status(400).json({ message: 'ID de table invalide''' });
  }
  const index = tables.findIndex(t => t.id === idNum);
  
  if (index === -1) {''
    return res.status(404).json({ message: 'Table non trouvée''' });
  }
  
  tables.splice(index, 1);''
  return res.json({ message: 'Table supprimée avec succès''' });
}));

export { tablesRouter };
''