import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error-handler';
import { createLogger } from '../middleware/logging';
import { authenticateUser, requireRoles } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';

const onlineOrdersRouter = Router();
const logger = createLogger('ONLINE_ORDERS');

// ==========================================
// TYPES ET INTERFACES
// ==========================================

export interface OnlineOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  platform: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  orderType: 'delivery' | 'pickup';
  deliveryAddress?: string;
  paymentMethod: 'card' | 'cash' | 'paypal';
  status: 'new' | 'accepted' | 'preparing' | 'ready' | 'dispatched' | 'delivered' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  estimatedTime?: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  options?: string[];
}

export interface Platform {
  name: string;
  icon: string;
  color: string;
  orderCount: number;
}

// ==========================================
// DONNÉES DE TEST
// ==========================================

const onlineOrders: OnlineOrder[] = [
  {
    id: 1,
    orderNumber: 'OL-001',
    customerName: 'Marie Dubois',
    customerPhone: '+33 6 12 34 56 78',
    customerEmail: 'marie.dubois@email.com',
    platform: 'Uber Eats',
    items: [
      { name: 'Cappuccino', quantity: 2, price: 4.50 },
      { name: 'Croissant', quantity: 1, price: 2.80 }
    ],
    subtotal: 11.80,
    deliveryFee: 2.50,
    serviceFee: 1.18,
    total: 15.48,
    orderType: 'delivery',
    deliveryAddress: '123 Rue de la Paix, Paris',
    paymentMethod: 'card',
    status: 'new',
    createdAt: '2025-01-16T10:30:00Z',
    updatedAt: '2025-01-16T10:30:00Z'
  },
  {
    id: 2,
    orderNumber: 'OL-002',
    customerName: 'Pierre Martin',
    customerPhone: '+33 6 98 76 54 32',
    customerEmail: 'pierre.martin@email.com',
    platform: 'Deliveroo',
    items: [
      { name: 'Espresso', quantity: 1, price: 2.50 },
      { name: 'Pain au chocolat', quantity: 2, price: 2.20 }
    ],
    subtotal: 6.90,
    deliveryFee: 2.00,
    serviceFee: 0.69,
    total: 9.59,
    orderType: 'pickup',
    paymentMethod: 'cash',
    status: 'accepted',
    createdAt: '2025-01-16T11:15:00Z',
    updatedAt: '2025-01-16T11:20:00Z',
    estimatedTime: '2025-01-16T11:45:00Z'
  }
];

const platforms: Platform[] = [
  { name: 'Uber Eats', icon: '🍔', color: '#000000', orderCount: 45 },
  { name: 'Deliveroo', icon: '🛵', color: '#00C300', orderCount: 32 },
  { name: 'Just Eat', icon: '🍕', color: '#FF6600', orderCount: 28 },
  { name: 'Site Web', icon: '🌐', color: '#0066CC', orderCount: 15 }
];

// ==========================================
// SCHÉMAS DE VALIDATION ZOD
// ==========================================

const orderSchema = z.object({
  customerName: z.string().min(1, 'Nom client requis'),
  customerPhone: z.string().min(1, 'Téléphone requis'),
  customerEmail: z.string().email('Email invalide'),
  platform: z.string().min(1, 'Plateforme requise'),
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

// ==========================================
// ROUTES AVEC AUTHENTIFICATION ET VALIDATION
// ==========================================

// Récupérer toutes les commandes en ligne
onlineOrdersRouter.get('/', 
  authenticateUser,
  requireRoles(['admin', 'manager', 'staff']),
  asyncHandler(async (req, res) => {
    const { status, platform } = req.query;
    
    try {
      let filteredOrders = onlineOrders;
      
      if (status) {
        filteredOrders = filteredOrders.filter(order => order.status === status);
      }
      
      if (platform) {
        filteredOrders = filteredOrders.filter(order => order.platform === platform);
      }
      
      res.json({
        success: true,
        data: filteredOrders
      });
    } catch (error) {
      logger.error('Erreur récupération commandes', { 
        status, 
        platform, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      });
      res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la récupération des commandes' 
      });
    }
  })
);

// Récupérer les plateformes
onlineOrdersRouter.get('/platforms', 
  authenticateUser,
  requireRoles(['admin', 'manager']),
  asyncHandler(async (req, res) => {
    try {
      res.json({
        success: true,
        data: platforms
      });
    } catch (error) {
      logger.error('Erreur récupération plateformes', { 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      });
      res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la récupération des plateformes' 
      });
    }
  })
);

// Statistiques des commandes
onlineOrdersRouter.get('/stats', 
  authenticateUser,
  requireRoles(['admin', 'manager']),
  asyncHandler(async (req, res) => {
    try {
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
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Erreur statistiques commandes', { 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      });
      res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la récupération des statistiques' 
      });
    }
  })
);

// Récupérer une commande par ID
onlineOrdersRouter.get('/:id', 
  authenticateUser,
  requireRoles(['admin', 'manager', 'staff']),
  validateParams(z.object({ id: z.string().regex(/^\d+$/) })),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    try {
      const order = onlineOrders.find(o => o.id === parseInt(id));
      
      if (!order) {
        return res.status(404).json({ 
          success: false,
          message: 'Commande non trouvée' 
        });
      }
      
      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      logger.error('Erreur récupération commande', { 
        id, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      });
      res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la récupération de la commande' 
      });
    }
  })
);

// Créer une nouvelle commande
onlineOrdersRouter.post('/', 
  authenticateUser,
  requireRoles(['admin', 'manager', 'staff']),
  validateBody(orderSchema),
  asyncHandler(async (req, res) => {
    try {
      const newOrder: OnlineOrder = {
        id: onlineOrders.length + 1,
        orderNumber: `OL-${(onlineOrders.length + 1).toString().padStart(3, '0')}`,
        ...req.body,
        status: 'new',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      onlineOrders.push(newOrder);
      
      res.status(201).json({
        success: true,
        data: newOrder
      });
    } catch (error) {
      logger.error('Erreur création commande', { 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      )});
      res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la création de la commande' 
      });
    }
  })
);

// Mettre à jour le statut d'une commande
onlineOrdersRouter.patch('/:id/status', 
  authenticateUser,
  requireRoles(['admin', 'manager', 'staff']),
  validateParams(z.object({ id: z.string()}).regex(/^\d+$/) })),
  validateBody(statusUpdateSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, estimatedTime, notes } = req.body;
    
    try {
      const orderIndex = onlineOrders.findIndex(o => o.id === parseInt(id));
      
      if (orderIndex === -1) {
        return res.status(404).json({ 
          success: false,
          message: 'Commande non trouvée' 
        });
      }
      
      onlineOrders[orderIndex] = {
        ...onlineOrders[orderIndex],
        status,
        estimatedTime,
        notes,
        updatedAt: new Date().toISOString()
      };
      
      res.json({
        success: true,
        data: onlineOrders[orderIndex]
      });
    } catch (error) {
      logger.error('Erreur mise à jour statut', { 
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

export default onlineOrdersRouter;
