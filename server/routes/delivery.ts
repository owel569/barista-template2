
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error-handler';
import { createLogger } from '../middleware/logging';
import { authenticateUser, requireRoles } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { getDb } from '../db';
import { orders, customers } from '../../shared/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

const deliveryRouter = Router();
const logger = createLogger('DELIVERY');

// ==========================================
// TYPES ET INTERFACES
// ==========================================

export interface DeliveryOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  address: string;
  items: DeliveryItem[];
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'dispatched' | 'in_transit' | 'delivered' | 'cancelled';
  progress: number;
  driver?: DeliveryDriver;
  estimatedTime?: string;
  actualDeliveryTime?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface DeliveryItem {
  name: string;
  quantity: number;
  price: number;
}

export interface DeliveryDriver {
  id: number;
  name: string;
  phone: string;
  vehicle: string;
  isAvailable: boolean;
  currentLocation?: {
    lat: number;
    lng: number;
  };
  rating: number;
  totalDeliveries: number;
}

export interface DeliveryStats {
  totalDeliveries: number;
  pendingDeliveries: number;
  activeDeliveries: number;
  completedDeliveries: number;
  cancelledDeliveries: number;
  availableDrivers: number;
  totalDrivers: number;
  averageDeliveryTime: number;
  onTimeDeliveryRate: number;
}

// ==========================================
// DONNÉES DE TEST
// ==========================================

const deliveries: DeliveryOrder[] = [
  {
    id: 1,
    orderNumber: 'DEL-001',
    customerName: 'Marie Dubois',
    customerPhone: '+33 6 12 34 56 78',
    address: '123 Rue de la Paix, 75001 Paris',
    items: [
      { name: 'Cappuccino', quantity: 2, price: 4.50 },
      { name: 'Croissant', quantity: 1, price: 2.80 }
    ],
    total: 11.80,
    status: 'in_transit',
    progress: 75,
    driver: {
      id: 1,
      name: 'Pierre Martin',
      phone: '+33 6 98 76 54 32',
      vehicle: 'Scooter Yamaha',
      isAvailable: false,
      rating: 4.8,
      totalDeliveries: 156
    },
    estimatedTime: '2025-01-16T12:30:00Z',
    createdAt: '2025-01-16T11:00:00Z',
    updatedAt: '2025-01-16T12:15:00Z'
  },
  {
    id: 2,
    orderNumber: 'DEL-002',
    customerName: 'Jean Dupont',
    customerPhone: '+33 6 11 22 33 44',
    address: '456 Avenue des Champs, 75008 Paris',
    items: [
      { name: 'Espresso', quantity: 1, price: 2.50 },
      { name: 'Pain au chocolat', quantity: 2, price: 2.20 }
    ],
    total: 6.90,
    status: 'ready',
    progress: 50,
    createdAt: '2025-01-16T11:30:00Z',
    updatedAt: '2025-01-16T12:00:00Z'
  }
];

const drivers: DeliveryDriver[] = [
  {
    id: 1,
    name: 'Pierre Martin',
    phone: '+33 6 98 76 54 32',
    vehicle: 'Scooter Yamaha',
    isAvailable: false,
    rating: 4.8,
    totalDeliveries: 156
  },
  {
    id: 2,
    name: 'Sophie Bernard',
    phone: '+33 6 55 44 33 22',
    vehicle: 'Vélo électrique',
    isAvailable: true,
    rating: 4.9,
    totalDeliveries: 203
  },
  {
    id: 3,
    name: 'Lucas Moreau',
    phone: '+33 6 77 88 99 00',
    vehicle: 'Scooter Honda',
    isAvailable: true,
    rating: 4.6,
    totalDeliveries: 89
  }
];

// ==========================================
// SCHÉMAS DE VALIDATION ZOD
// ==========================================

const deliverySchema = z.object({
  customerName: z.string()}).min(1, 'Nom du client requis'),
  customerPhone: z.string().min(8, 'Téléphone du client requis'),
  address: z.string().min(5, 'Adresse complète requise'),
  items: z.array(z.object({
    name: z.string()}).min(1, 'Nom de l\'article requis'),
    quantity: z.number().min(1, 'Quantité requise'),
    price: z.number().min(0, 'Prix requis')
  })),
  total: z.number().min(0, 'Total requis'),
  estimatedTime: z.string().optional(),
  driverId: z.number().optional(),
  notes: z.string().optional()
});

const statusUpdateSchema = z.object({
  status: z.enum(['pending', 'preparing', 'ready', 'dispatched', 'in_transit', 'delivered', 'cancelled'])}),
  driverId: z.number().optional(),
  notes: z.string().optional()
});

const driverLocationSchema = z.object({
  lat: z.number()}).min(-90).max(90),
  lng: z.number().min(-180).max(180)
});

// ==========================================
// ROUTES AVEC AUTHENTIFICATION ET VALIDATION
// ==========================================

// Récupérer toutes les livraisons
deliveryRouter.get('/', 
  authenticateUser,
  requireRoles(['admin', 'manager', 'staff']),
  asyncHandler(async (req, res) => {
    try {
  res.json({
        success: true,
        data: deliveries
      )});
    } catch (error) {
      logger.error('Erreur récupération livraisons', { 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      )});
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la récupération des livraisons' 
      });
    }
  })
);

// Récupérer tous les chauffeurs
deliveryRouter.get('/drivers', 
  authenticateUser,
  requireRoles(['admin', 'manager']),
  asyncHandler(async (req, res) => {
    try {
  res.json({
        success: true,
        data: drivers
      )});
    } catch (error) {
      logger.error('Erreur récupération chauffeurs', { 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      )});
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la récupération des chauffeurs' 
      });
    }
  })
);

// Statistiques de livraison
deliveryRouter.get('/stats', 
  authenticateUser,
  requireRoles(['admin', 'manager']),
  asyncHandler(async (req, res) => {
    try {
      const stats: DeliveryStats = {
    totalDeliveries: deliveries.length,
    pendingDeliveries: deliveries.filter(d => d.status === 'pending').length,
    activeDeliveries: deliveries.filter(d => ['preparing', 'ready', 'dispatched', 'in_transit'].includes(d.status)).length,
    completedDeliveries: deliveries.filter(d => d.status === 'delivered').length,
    cancelledDeliveries: deliveries.filter(d => d.status === 'cancelled').length,
    availableDrivers: drivers.filter(d => d.isAvailable).length,
        totalDrivers: drivers.length,
        averageDeliveryTime: 25, // minutes
        onTimeDeliveryRate: 0.92 // 92%
      };
  
  res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Erreur statistiques livraison', { 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      )});
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la récupération des statistiques' 
      });
    }
  })
);

// Récupérer une livraison par ID
deliveryRouter.get('/:id', 
  authenticateUser,
  requireRoles(['admin', 'manager', 'staff']),
  validateParams(z.object({ id: z.string()}).regex(/^\d+$/) })),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    try {
      const delivery = deliveries.find(d => d.id === parseInt(id));
      
  if (!delivery) {
        return res.status(404).json({ 
          success: false,
          message: 'Livraison non trouvée' 
  });
  }
      
  res.json({
        success: true,
        data: delivery
      });
    } catch (error) {
      logger.error('Erreur récupération livraison', { 
        id, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      )});
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la récupération de la livraison' 
      });
    }
  })
);

// Créer une nouvelle livraison
deliveryRouter.post('/', 
  authenticateUser,
  requireRoles(['admin', 'manager', 'staff']),
  validateBody(deliverySchema),
  asyncHandler(async (req, res) => {
    try {
      const newDelivery: DeliveryOrder = {
    id: deliveries.length + 1,
        orderNumber: `DEL-${(deliveries.length + 1).toString().padStart(3, '0')}`,
    ...req.body,
    status: 'pending',
    progress: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  deliveries.push(newDelivery);
      
      logger.info('Nouvelle livraison créée', { 
        orderNumber: newDelivery.orderNumber,
        customerName: newDelivery.customerName
      });

      res.status(201).json({
        success: true,
        data: newDelivery
      });
    } catch (error) {
      logger.error('Erreur création livraison', { 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      )});
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la création de la livraison' 
      });
    }
  })
);

// Mettre à jour le statut d'une livraison
deliveryRouter.patch('/:id/status', 
  authenticateUser,
  requireRoles(['admin', 'manager', 'staff']),
  validateParams(z.object({ id: z.string()}).regex(/^\d+$/) })),
  validateBody(statusUpdateSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
  const { status, driverId, notes } = req.body;
  
    try {
  const delivery = deliveries.find(d => d.id === parseInt(id));
      
  if (!delivery) {
        return res.status(404).json({ 
          success: false,
          message: 'Livraison non trouvée' 
        });
  }
  
  delivery.status = status;
  delivery.updatedAt = new Date().toISOString();
  
  if (driverId) {
    const driver = drivers.find(d => d.id === driverId);
    if (driver) {
          delivery.driver = driver;
          driver.isAvailable = false;
    }
  }
  
  if (notes) {
    delivery.notes = notes;
  }
  
      // Mettre à jour la progression basée sur le statut
      const progressMap: Record<string, number> = {
        pending: 10,
        preparing: 25,
        ready: 50,
        dispatched: 75,
        in_transit: 90,
        delivered: 100,
        cancelled: 0
      };
      
      delivery.progress = progressMap[status] || delivery.progress;
      
      logger.info('Statut livraison mis à jour', { 
        orderNumber: delivery.orderNumber,
        status,
        driverId
      });
  
  res.json({
        success: true,
        data: delivery
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

// Mettre à jour la localisation d'un chauffeur
deliveryRouter.patch('/drivers/:id/location', 
  authenticateUser,
  requireRoles(['admin', 'manager']),
  validateParams(z.object({ id: z.string()}).regex(/^\d+$/) })),
  validateBody(driverLocationSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { lat, lng } = req.body;
    
    try {
      const driver = drivers.find(d => d.id === parseInt(id));
      
      if (!driver) {
        return res.status(404).json({ 
          success: false,
          message: 'Chauffeur non trouvé' 
        });
      }
      
      driver.currentLocation = { lat, lng };
      
      logger.info('Localisation chauffeur mise à jour', { 
        driverId: driver.id,
        location: { lat, lng }
      });

  res.json({
        success: true,
        data: driver
      });
    } catch (error) {
      logger.error('Erreur mise à jour localisation', { 
        id, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      )});
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la mise à jour de la localisation' 
      });
    }
  })
);

export default deliveryRouter;
