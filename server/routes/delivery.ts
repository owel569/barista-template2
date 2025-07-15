
import { Router } from 'express';
import { z } from 'zod';
import { validateBody, validateParams } from '../middleware/validation';
import { asyncHandler } from '../middleware/error-handler';

const deliveryRouter = Router();

// Données simulées pour les livraisons
const deliveries = [
  {
    id: 1,
    orderNumber: 'DEL-001',
    orderId: 1,
    customerName: 'Sophie Laurent',
    customerPhone: '+33123456789',
    address: '15 Rue de la Paix, 75001 Paris',
    items: [
      { name: 'Cappuccino', quantity: 2, price: 7.00 },
      { name: 'Croissant', quantity: 1, price: 2.80 }
    ],
    total: 9.80,
    status: 'pending',
    progress: 10,
    estimatedTime: '25 min',
    driver: null,
    driverId: null,
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    orderNumber: 'DEL-002',
    orderId: 2,
    customerName: 'Marc Dubois',
    customerPhone: '+33987654321',
    address: '42 Avenue des Champs, 75008 Paris',
    items: [
      { name: 'Latte', quantity: 1, price: 4.50 },
      { name: 'Sandwich Club', quantity: 1, price: 8.50 }
    ],
    total: 13.00,
    status: 'in_transit',
    progress: 75,
    estimatedTime: '10 min',
    driver: 'Jean Livreur',
    driverId: 1,
    notes: '2ème étage, interphone B',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const drivers = [
  {
    id: 1,
    name: 'Jean Livreur',
    phone: '+33123456789',
    vehicleType: 'Vélo',
    isAvailable: false,
    currentDeliveries: 1,
    location: { lat: 48.8566, lng: 2.3522 }
  },
  {
    id: 2,
    name: 'Marie Transport',
    phone: '+33987654321',
    vehicleType: 'Scooter',
    isAvailable: true,
    currentDeliveries: 0,
    location: { lat: 48.8606, lng: 2.3376 }
  }
];

// Schémas de validation
const deliverySchema = z.object({
  orderId: z.number().min(1, 'ID de commande requis'),
  customerName: z.string().min(1, 'Nom du client requis'),
  customerPhone: z.string().min(8, 'Téléphone du client requis'),
  address: z.string().min(5, 'Adresse complète requise'),
  items: z.array(z.object({
    name: z.string().min(1, 'Nom de l\'article requis'),
    quantity: z.number().min(1, 'Quantité requise'),
    price: z.number().min(0, 'Prix requis')
  })),
  total: z.number().min(0, 'Total requis'),
  estimatedTime: z.string().optional(),
  driverId: z.number().optional(),
  notes: z.string().optional()
});

const statusUpdateSchema = z.object({
  status: z.enum(['pending', 'preparing', 'ready', 'dispatched', 'in_transit', 'delivered', 'cancelled']),
  driverId: z.number().optional(),
  notes: z.string().optional()
});

// Routes
deliveryRouter.get('/', asyncHandler(async (req, res) => {
  res.json(deliveries);
}));

deliveryRouter.get('/drivers', asyncHandler(async (req, res) => {
  res.json(drivers);
}));

deliveryRouter.get('/stats', asyncHandler(async (req, res) => {
  const stats = {
    totalDeliveries: deliveries.length,
    pendingDeliveries: deliveries.filter(d => d.status === 'pending').length,
    activeDeliveries: deliveries.filter(d => ['preparing', 'ready', 'dispatched', 'in_transit'].includes(d.status)).length,
    completedDeliveries: deliveries.filter(d => d.status === 'delivered').length,
    cancelledDeliveries: deliveries.filter(d => d.status === 'cancelled').length,
    availableDrivers: drivers.filter(d => d.isAvailable).length,
    totalDrivers: drivers.length
  };
  res.json(stats);
}));

deliveryRouter.get('/:id', validateParams(z.object({ id: z.string().regex(/^\d+$/) })), asyncHandler(async (req, res) => {
  const delivery = deliveries.find(d => d.id === parseInt(req.params.id));
  if (!delivery) {
    return res.status(404).json({ message: 'Livraison non trouvée' });
  }
  res.json(delivery);
}));

deliveryRouter.post('/', validateBody(deliverySchema), asyncHandler(async (req, res) => {
  const newDelivery = {
    id: deliveries.length + 1,
    orderNumber: `DEL-${(deliveries.length + 1).toString().padStart(3, '0')}`,
    ...req.body,
    status: 'pending',
    progress: 10,
    driver: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  deliveries.push(newDelivery);
  res.status(201).json(newDelivery);
}));

deliveryRouter.patch('/:id/status', validateParams(z.object({ id: z.string().regex(/^\d+$/) })), validateBody(statusUpdateSchema), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, driverId, notes } = req.body;
  
  const delivery = deliveries.find(d => d.id === parseInt(id));
  if (!delivery) {
    return res.status(404).json({ message: 'Livraison non trouvée' });
  }
  
  delivery.status = status;
  delivery.updatedAt = new Date().toISOString();
  
  if (driverId) {
    const driver = drivers.find(d => d.id === driverId);
    if (driver) {
      delivery.driver = driver.name;
      delivery.driverId = driverId;
    }
  }
  
  if (notes) {
    delivery.notes = notes;
  }
  
  // Mise à jour du progrès basé sur le statut
  switch (status) {
    case 'pending': delivery.progress = 10; break;
    case 'preparing': delivery.progress = 30; break;
    case 'ready': delivery.progress = 60; break;
    case 'dispatched': delivery.progress = 75; break;
    case 'in_transit': delivery.progress = 85; break;
    case 'delivered': delivery.progress = 100; break;
    case 'cancelled': delivery.progress = 0; break;
  }
  
  res.json(delivery);
}));

deliveryRouter.put('/:id', validateParams(z.object({ id: z.string().regex(/^\d+$/) })), validateBody(deliverySchema), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const delivery = deliveries.find(d => d.id === parseInt(id));
  
  if (!delivery) {
    return res.status(404).json({ message: 'Livraison non trouvée' });
  }
  
  Object.assign(delivery, req.body, { updatedAt: new Date().toISOString() });
  res.json(delivery);
}));

deliveryRouter.delete('/:id', validateParams(z.object({ id: z.string().regex(/^\d+$/) })), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const index = deliveries.findIndex(d => d.id === parseInt(id));
  
  if (index === -1) {
    return res.status(404).json({ message: 'Livraison non trouvée' });
  }
  
  deliveries.splice(index, 1);
  res.json({ message: 'Livraison supprimée avec succès' });
}));

export { deliveryRouter };
