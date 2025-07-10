import { Router } from 'express';

const tablesRouter = Router();

// Mock data for tables
let tables = [
  {
    id: 1,
    number: 'T1',
    capacity: 4,
    location: 'Près de la fenêtre',
    status: 'available',
    features: ['Vue terrasse', 'Prise électrique'],
    shape: 'round',
    x: 20,
    y: 30,
  },
  {
    id: 2,
    number: 'T2',
    capacity: 2,
    location: 'Bar',
    status: 'occupied',
    currentReservation: {
      id: 101,
      customerName: 'Marie Dupont',
      time: '19:30',
      guests: 2,
    },
    features: ['Vue bar', 'Tabourets hauts'],
    shape: 'square',
    x: 60,
    y: 20,
  },
  {
    id: 3,
    number: 'T3',
    capacity: 6,
    location: 'Centre salle',
    status: 'reserved',
    currentReservation: {
      id: 102,
      customerName: 'Famille Martin',
      time: '20:00',
      guests: 6,
    },
    features: ['Grande table', 'Chaise bébé disponible'],
    shape: 'rectangular',
    x: 40,
    y: 60,
  },
  {
    id: 4,
    number: 'T4',
    capacity: 2,
    location: 'Coin cosy',
    status: 'maintenance',
    features: ['Banquette', 'Intimité'],
    shape: 'round',
    x: 80,
    y: 70,
  },
];

// Get all tables
tablesRouter.get('/', (req, res) => {
  res.json(tables);
});

// Get table by ID
tablesRouter.get('/:id', (req, res) => {
  const { id } = req.params;
  const table = tables.find(t => t.id === parseInt(id));
  
  if (!table) {
    return res.status(404).json({ message: 'Table non trouvée' });
  }
  
  res.json(table);
});

// Create new table
tablesRouter.post('/', (req, res) => {
  const newTable = {
    id: tables.length + 1,
    ...req.body,
    status: req.body.status || 'available',
  };
  
  tables.push(newTable);
  res.status(201).json(newTable);
});

// Update table
tablesRouter.patch('/:id', (req, res) => {
  const { id } = req.params;
  const tableIndex = tables.findIndex(t => t.id === parseInt(id));
  
  if (tableIndex === -1) {
    return res.status(404).json({ message: 'Table non trouvée' });
  }
  
  tables[tableIndex] = { ...tables[tableIndex], ...req.body };
  res.json(tables[tableIndex]);
});

// Update table status
tablesRouter.patch('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const table = tables.find(t => t.id === parseInt(id));
  if (!table) {
    return res.status(404).json({ message: 'Table non trouvée' });
  }
  
  table.status = status;
  
  // Clear reservation if setting to available or maintenance
  if (status === 'available' || status === 'maintenance') {
    delete table.currentReservation;
  }
  
  res.json(table);
});

// Delete table
tablesRouter.delete('/:id', (req, res) => {
  const { id } = req.params;
  const tableIndex = tables.findIndex(t => t.id === parseInt(id));
  
  if (tableIndex === -1) {
    return res.status(404).json({ message: 'Table non trouvée' });
  }
  
  tables.splice(tableIndex, 1);
  res.status(204).send();
});

// Get table reservations
tablesRouter.get('/:id/reservations', (req, res) => {
  const { id } = req.params;
  
  // Mock reservations for the table
  const reservations = [
    {
      id: 1,
      tableId: parseInt(id),
      customerName: 'Jean Dupont',
      customerEmail: 'jean.dupont@email.com',
      customerPhone: '+33612345678',
      date: '2024-07-10',
      time: '19:30',
      guests: 4,
      duration: 120,
      status: 'confirmed',
      specialRequests: 'Anniversaire - décoration souhaité',
    },
  ];
  
  res.json(reservations);
});

export { tablesRouter };