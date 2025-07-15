
import { Router } from 'express';
import { z } from 'zod';
import { validateBody, validateParams } from '../middleware/validation';
import { asyncHandler } from '../middleware/error-handler';

const tablesRouter = Router();

// Données simulées pour les tables
let tables = [
  {
    id: 1,
    number: 1,
    capacity: 2,
    status: 'available',
    location: 'Fenêtre',
    currentReservation: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    number: 2,
    capacity: 4,
    status: 'occupied',
    location: 'Centre',
    currentReservation: {
      id: 1,
      customerName: 'Sophie Martin',
      partySize: 3,
      time: '19:30',
      date: new Date().toISOString().split('T')[0]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 3,
    number: 3,
    capacity: 6,
    status: 'reserved',
    location: 'Terrasse',
    currentReservation: {
      id: 2,
      customerName: 'Marc Dubois',
      partySize: 5,
      time: '20:00',
      date: new Date().toISOString().split('T')[0]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 4,
    number: 4,
    capacity: 2,
    status: 'maintenance',
    location: 'Bar',
    currentReservation: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Schémas de validation
const tableSchema = z.object({
  number: z.number().min(1, 'Numéro de table requis'),
  capacity: z.number().min(1, 'Capacité requise'),
  location: z.string().min(1, 'Emplacement requis'),
  status: z.enum(['available', 'occupied', 'reserved', 'maintenance']).optional()
});

const statusUpdateSchema = z.object({
  status: z.enum(['available', 'occupied', 'reserved', 'maintenance']),
  reservationId: z.number().optional(),
  notes: z.string().optional()
});

const reservationSchema = z.object({
  customerName: z.string().min(1, 'Nom du client requis'),
  partySize: z.number().min(1, 'Nombre de personnes requis'),
  time: z.string().min(1, 'Heure requise'),
  date: z.string().min(1, 'Date requise'),
  notes: z.string().optional()
});

// Routes
tablesRouter.get('/', asyncHandler(async (req, res) => {
  const { status, location } = req.query;
  let filteredTables = tables;
  
  if (status) {
    filteredTables = filteredTables.filter(table => table.status === status);
  }
  
  if (location) {
    filteredTables = filteredTables.filter(table => table.location === location);
  }
  
  res.json(filteredTables);
}));

tablesRouter.get('/stats', asyncHandler(async (req, res) => {
  const stats = {
    totalTables: tables.length,
    availableTables: tables.filter(t => t.status === 'available').length,
    occupiedTables: tables.filter(t => t.status === 'occupied').length,
    reservedTables: tables.filter(t => t.status === 'reserved').length,
    maintenanceTables: tables.filter(t => t.status === 'maintenance').length,
    totalCapacity: tables.reduce((sum, table) => sum + table.capacity, 0),
    occupancyRate: ((tables.filter(t => t.status === 'occupied').length / tables.length) * 100).toFixed(1),
    locationBreakdown: [
      { location: 'Fenêtre', count: tables.filter(t => t.location === 'Fenêtre').length },
      { location: 'Centre', count: tables.filter(t => t.location === 'Centre').length },
      { location: 'Terrasse', count: tables.filter(t => t.location === 'Terrasse').length },
      { location: 'Bar', count: tables.filter(t => t.location === 'Bar').length }
    ]
  };
  res.json(stats);
}));

tablesRouter.get('/available', asyncHandler(async (req, res) => {
  const { capacity, date, time } = req.query;
  let availableTables = tables.filter(t => t.status === 'available');
  
  if (capacity) {
    availableTables = availableTables.filter(t => t.capacity >= parseInt(capacity as string));
  }
  
  res.json(availableTables);
}));

tablesRouter.get('/:id', validateParams(z.object({ id: z.string().regex(/^\d+$/) })), asyncHandler(async (req, res) => {
  const table = tables.find(t => t.id === parseInt(req.params.id));
  if (!table) {
    return res.status(404).json({ message: 'Table non trouvée' });
  }
  res.json(table);
}));

tablesRouter.post('/', validateBody(tableSchema), asyncHandler(async (req, res) => {
  const newTable = {
    id: tables.length + 1,
    ...req.body,
    status: req.body.status || 'available',
    currentReservation: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  tables.push(newTable);
  res.status(201).json(newTable);
}));

tablesRouter.patch('/:id/status', validateParams(z.object({ id: z.string().regex(/^\d+$/) })), validateBody(statusUpdateSchema), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, reservationId, notes } = req.body;
  
  const table = tables.find(t => t.id === parseInt(id));
  if (!table) {
    return res.status(404).json({ message: 'Table non trouvée' });
  }
  
  table.status = status;
  table.updatedAt = new Date().toISOString();
  
  // Gérer les réservations selon le statut
  if (status === 'available') {
    table.currentReservation = null;
  } else if (status === 'reserved' && reservationId) {
    // Ici, vous pourriez récupérer la réservation depuis la base de données
    // Pour l'instant, on simule
    table.currentReservation = {
      id: reservationId,
      customerName: 'Client Réservé',
      partySize: 2,
      time: '19:00',
      date: new Date().toISOString().split('T')[0]
    };
  }
  
  res.json(table);
}));

tablesRouter.post('/:id/reserve', validateParams(z.object({ id: z.string().regex(/^\d+$/) })), validateBody(reservationSchema), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const table = tables.find(t => t.id === parseInt(id));
  
  if (!table) {
    return res.status(404).json({ message: 'Table non trouvée' });
  }
  
  if (table.status !== 'available') {
    return res.status(400).json({ message: 'Table non disponible' });
  }
  
  table.status = 'reserved';
  table.currentReservation = {
    id: Date.now(),
    ...req.body
  };
  table.updatedAt = new Date().toISOString();
  
  res.json(table);
}));

tablesRouter.put('/:id', validateParams(z.object({ id: z.string().regex(/^\d+$/) })), validateBody(tableSchema), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const table = tables.find(t => t.id === parseInt(id));
  
  if (!table) {
    return res.status(404).json({ message: 'Table non trouvée' });
  }
  
  Object.assign(table, req.body, { updatedAt: new Date().toISOString() });
  res.json(table);
}));

tablesRouter.delete('/:id', validateParams(z.object({ id: z.string().regex(/^\d+$/) })), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const index = tables.findIndex(t => t.id === parseInt(id));
  
  if (index === -1) {
    return res.status(404).json({ message: 'Table non trouvée' });
  }
  
  tables.splice(index, 1);
  res.json({ message: 'Table supprimée avec succès' });
}));

export { tablesRouter };
