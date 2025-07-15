
import { Router } from 'express';
import { z } from 'zod';
import { validateBody, validateParams } from '../middleware/validation';
import { asyncHandler } from '../middleware/error-handler';

const onlineOrdersRouter = Router();

// Données simulées pour les commandes en ligne
const onlineOrders = [
  {
    id: 1,
    orderNumber: 'OL-001',
    platform: 'Uber Eats',
    customerName: 'Alice Martin',
    customerPhone: '+33123456789',
    customerEmail: 'alice.martin@email.com',
    items: [
      { name: 'Cappuccino', quantity: 2, price: 7.00, options: ['Lait d\'amande'] },
      { name: 'Croissant', quantity: 1, price: 2.80, options: [] }
    ],
    subtotal: 9.80,
    deliveryFee: 2.50,
    serviceFee: 1.20,
    total: 13.50,
    status: 'new',
    orderType: 'delivery',
    deliveryAddress: '15 Rue de la Paix, 75001 Paris',
    estimatedTime: '25 min',
    paymentMethod: 'card',
    paymentStatus: 'paid',
    notes: 'Sonnette au nom de Martin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    orderNumber: 'OL-002',
    platform: 'Deliveroo',
    customerName: 'Marc Dubois',
    customerPhone: '+33987654321',
    customerEmail: 'marc.dubois@email.com',
    items: [
      { name: 'Latte', quantity: 1, price: 4.50, options: ['Sirop vanille'] },
      { name: 'Sandwich Club', quantity: 1, price: 8.50, options: ['Sans tomate'] }
    ],
    subtotal: 13.00,
    deliveryFee: 2.00,
    serviceFee: 1.00,
    total: 16.00,
    status: 'preparing',
    orderType: 'delivery',
    deliveryAddress: '42 Avenue des Champs, 75008 Paris',
    estimatedTime: '20 min',
    paymentMethod: 'card',
    paymentStatus: 'paid',
    notes: '',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const platforms = [
  { id: 1, name: 'Uber Eats', isActive: true, commissionRate: 0.25 },
  { id: 2, name: 'Deliveroo', isActive: true, commissionRate: 0.22 },
  { id: 3, name: 'Just Eat', isActive: false, commissionRate: 0.20 }
];

// Schémas de validation
const orderSchema = z.object({
  platform: z.string().min(1, 'Plateforme requise'),
  customerName: z.string().min(1, 'Nom du client requis'),
  customerPhone: z.string().min(8, 'Téléphone du client requis'),
  customerEmail: z.string().email('Email invalide'),
  items: z.array(z.object({
    name: z.string().min(1, 'Nom de l\'article requis'),
    quantity: z.number().min(1, 'Quantité requise'),
    price: z.number().min(0, 'Prix requis'),
    options: z.array(z.string()).optional()
  })),
  subtotal: z.number().min(0, 'Sous-total requis'),
  deliveryFee: z.number().min(0, 'Frais de livraison requis'),
  serviceFee: z.number().min(0, 'Frais de service requis'),
  total: z.number().min(0, 'Total requis'),
  orderType: z.enum(['delivery', 'pickup']),
  deliveryAddress: z.string().optional(),
  paymentMethod: z.enum(['card', 'cash', 'paypal']),
  notes: z.string().optional()
});

const statusUpdateSchema = z.object({
  status: z.enum(['new', 'accepted', 'preparing', 'ready', 'dispatched', 'delivered', 'cancelled']),
  estimatedTime: z.string().optional(),
  notes: z.string().optional()
});

// Routes
onlineOrdersRouter.get('/', asyncHandler(async (req, res) => {
  const { status, platform } = req.query;
  let filteredOrders = onlineOrders;
  
  if (status) {
    filteredOrders = filteredOrders.filter(order => order.status === status);
  }
  
  if (platform) {
    filteredOrders = filteredOrders.filter(order => order.platform === platform);
  }
  
  res.json(filteredOrders);
}));

onlineOrdersRouter.get('/platforms', asyncHandler(async (req, res) => {
  res.json(platforms);
}));

onlineOrdersRouter.get('/stats', asyncHandler(async (req, res) => {
  const stats = {
    totalOrders: onlineOrders.length,
    newOrders: onlineOrders.filter(o => o.status === 'new').length,
    acceptedOrders: onlineOrders.filter(o => o.status === 'accepted').length,
    preparingOrders: onlineOrders.filter(o => o.status === 'preparing').length,
    readyOrders: onlineOrders.filter(o => o.status === 'ready').length,
    deliveredOrders: onlineOrders.filter(o => o.status === 'delivered').length,
    cancelledOrders: onlineOrders.filter(o => o.status === 'cancelled').length,
    totalRevenue: onlineOrders.reduce((sum, order) => sum + order.total, 0),
    averageOrderValue: onlineOrders.length > 0 ? onlineOrders.reduce((sum, order) => sum + order.total, 0) / onlineOrders.length : 0,
    platformBreakdown: platforms.map(platform => ({
      platform: platform.name,
      orders: onlineOrders.filter(o => o.platform === platform.name).length,
      revenue: onlineOrders.filter(o => o.platform === platform.name).reduce((sum, order) => sum + order.total, 0)
    }))
  };
  res.json(stats);
}));

onlineOrdersRouter.get('/:id', validateParams(z.object({ id: z.string().regex(/^\d+$/) })), asyncHandler(async (req, res) => {
  const order = onlineOrders.find(o => o.id === parseInt(req.params.id));
  if (!order) {
    return res.status(404).json({ message: 'Commande non trouvée' });
  }
  res.json(order);
}));

onlineOrdersRouter.post('/', validateBody(orderSchema), asyncHandler(async (req, res) => {
  const newOrder = {
    id: onlineOrders.length + 1,
    orderNumber: `OL-${(onlineOrders.length + 1).toString().padStart(3, '0')}`,
    ...req.body,
    status: 'new',
    paymentStatus: 'pending',
    estimatedTime: '25 min',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  onlineOrders.push(newOrder);
  res.status(201).json(newOrder);
}));

onlineOrdersRouter.patch('/:id/status', validateParams(z.object({ id: z.string().regex(/^\d+$/) })), validateBody(statusUpdateSchema), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, estimatedTime, notes } = req.body;
  
  const order = onlineOrders.find(o => o.id === parseInt(id));
  if (!order) {
    return res.status(404).json({ message: 'Commande non trouvée' });
  }
  
  order.status = status;
  order.updatedAt = new Date().toISOString();
  
  if (estimatedTime) {
    order.estimatedTime = estimatedTime;
  }
  
  if (notes) {
    order.notes = notes;
  }
  
  res.json(order);
}));

onlineOrdersRouter.put('/:id', validateParams(z.object({ id: z.string().regex(/^\d+$/) })), validateBody(orderSchema), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = onlineOrders.find(o => o.id === parseInt(id));
  
  if (!order) {
    return res.status(404).json({ message: 'Commande non trouvée' });
  }
  
  Object.assign(order, req.body, { updatedAt: new Date().toISOString() });
  res.json(order);
}));

onlineOrdersRouter.delete('/:id', validateParams(z.object({ id: z.string().regex(/^\d+$/) })), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const index = onlineOrders.findIndex(o => o.id === parseInt(id));
  
  if (index === -1) {
    return res.status(404).json({ message: 'Commande non trouvée' });
  }
  
  onlineOrders.splice(index, 1);
  res.json({ message: 'Commande supprimée avec succès' });
}));

export { onlineOrdersRouter };
