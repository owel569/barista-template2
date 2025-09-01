import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error-handler';
import { createLogger } from '../middleware/logging';
import { authenticateUser, requireRoles } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { getDb } from '../db';
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { customers, orders } from '../../shared/schema';

const router = Router();
const logger = createLogger('DELIVERY_ROUTES');

// ==========================================
// TYPES ET INTERFACES
// ==========================================

interface DeliveryOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  address: string;
  items: DeliveryItem[];
  total: number;
  status: DeliveryStatus;
  progress: number;
  driver?: DeliveryDriver;
  estimatedTime?: string;
  actualDeliveryTime?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

interface DeliveryItem {
  name: string;
  quantity: number;
  price: number;
}

interface DeliveryDriver {
  id: number;
  name: string;
  phone: string;
  vehicle: string;
  isAvailable: boolean;
  currentLocation?: GeoLocation;
  rating: number;
  totalDeliveries: number;
}

interface GeoLocation {
  lat: number;
  lng: number;
}

interface DeliveryStats {
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

type DeliveryStatus = 
  | 'pending' 
  | 'preparing' 
  | 'ready' 
  | 'dispatched' 
  | 'in_transit' 
  | 'delivered' 
  | 'cancelled';

// ==========================================
// SCHÉMAS DE VALIDATION
// ==========================================

const DeliverySchema = z.object({
  customerName: z.string().min(1, 'Nom du client requis'),
  customerPhone: z.string().min(8, 'Téléphone du client requis'),
  address: z.string().min(5, 'Adresse complète requise'),
  items: z.array(
    z.object({
      name: z.string().min(1, 'Nom de l\'article requis'),
      quantity: z.number().min(1, 'Quantité requise'),
      price: z.number().min(0, 'Prix requis')
    })
  ).min(1, 'Au moins un article requis'),
  total: z.number().min(0, 'Total requis'),
  estimatedTime: z.string().datetime().optional(),
  driverId: z.number().optional(),
  notes: z.string().optional()
});

const StatusUpdateSchema = z.object({
  status: z.enum([
    'pending', 
    'preparing', 
    'ready', 
    'dispatched', 
    'in_transit', 
    'delivered', 
    'cancelled'
  ]),
  driverId: z.number().optional(),
  notes: z.string().optional()
});

const DriverLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180)
});

const IdParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID doit être un nombre')
});

// ==========================================
// DONNÉES DE TEST (À REMPLACER PAR LA BDD)
// ==========================================

let deliveries: DeliveryOrder[] = [
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
    estimatedTime: new Date(Date.now() + 3600000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

let drivers: DeliveryDriver[] = [
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
  }
];

// ==========================================
// UTILITAIRES
// ==========================================

const calculateProgress = (status: DeliveryStatus): number => {
  const progressMap: Record<DeliveryStatus, number> = {
    pending: 10,
    preparing: 25,
    ready: 50,
    dispatched: 75,
    in_transit: 90,
    delivered: 100,
    cancelled: 0
  };
  return progressMap[status];
};

const generateOrderNumber = (): string => {
  const count = deliveries.length + 1;
  return `DEL-${count.toString().padStart(3, '0')}`;
};

// ==========================================
// ROUTES
// ==========================================

/**
 * @openapi
 * /delivery:
 *   get:
 *     summary: Récupère toutes les livraisons
 *     tags: [Delivery]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des livraisons
 */
router.get('/', 
  authenticateUser,
  requireRoles(['admin', 'manager', 'staff']),
  asyncHandler(async (req, res) => {
    try {
      // Dans une vraie implémentation, utiliser la base de données:
      // const deliveries = await db.select().from(deliveryTable);

      res.json({
        success: true,
        data: deliveries
      });
    } catch (error) {
      logger.error('Erreur récupération livraisons', { 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      });

      res.status(500).json({ 
        success: false, 
        error: 'DELIVERY_FETCH_ERROR',
        message: 'Erreur lors de la récupération des livraisons' 
      });
    }
  })
);

/**
 * @openapi
 * /delivery/drivers:
 *   get:
 *     summary: Récupère tous les chauffeurs
 *     tags: [Delivery]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des chauffeurs
 */
router.get('/drivers', 
  authenticateUser,
  requireRoles(['admin', 'manager']),
  asyncHandler(async (req, res) => {
    try {
      res.json({
        success: true,
        data: drivers
      });
    } catch (error) {
      logger.error('Erreur récupération chauffeurs', { 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      });

      res.status(500).json({ 
        success: false,
        error: 'DRIVERS_FETCH_ERROR', 
        message: 'Erreur lors de la récupération des chauffeurs' 
      });
    }
  })
);

/**
 * @openapi
 * /delivery/stats:
 *   get:
 *     summary: Récupère les statistiques de livraison
 *     tags: [Delivery]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques de livraison
 */
router.get('/stats', 
  authenticateUser,
  requireRoles(['admin', 'manager']),
  asyncHandler(async (req, res) => {
    try {
      const stats: DeliveryStats = {
        totalDeliveries: deliveries.length,
        pendingDeliveries: deliveries.filter(d => d.status === 'pending').length,
        activeDeliveries: deliveries.filter(d => 
          ['preparing', 'ready', 'dispatched', 'in_transit'].includes(d.status)
        ).length,
        completedDeliveries: deliveries.filter(d => d.status === 'delivered').length,
        cancelledDeliveries: deliveries.filter(d => d.status === 'cancelled').length,
        availableDrivers: drivers.filter(d => d.isAvailable).length,
        totalDrivers: drivers.length,
        averageDeliveryTime: 25,
        onTimeDeliveryRate: 0.92
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Erreur statistiques livraison', { 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      });

      res.status(500).json({ 
        success: false,
        error: 'DELIVERY_STATS_ERROR', 
        message: 'Erreur lors de la récupération des statistiques' 
      });
    }
  })
);

/**
 * @openapi
 * /delivery/{id}:
 *   get:
 *     summary: Récupère une livraison par ID
 *     tags: [Delivery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Détails de la livraison
 *       404:
 *         description: Livraison non trouvée
 */
router.get('/:id', 
  authenticateUser,
  requireRoles(['admin', 'manager', 'staff']),
  validateParams(IdParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
      const delivery = deliveries.find(d => d.id === parseInt(id || '0'));

      if (!delivery) {
        return res.status(404).json({ 
          success: false,
          error: 'DELIVERY_NOT_FOUND',
          message: 'Livraison non trouvée' 
        });
      }

      return res.json({
        success: true,
        data: delivery
      });
    } catch (error) {
      logger.error('Erreur récupération livraison', { 
        id, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      });

      return res.status(500).json({ 
        success: false,
        error: 'DELIVERY_FETCH_ERROR', 
        message: 'Erreur lors de la récupération de la livraison' 
      });
    }
  })
);

/**
 * @openapi
 * /delivery:
 *   post:
 *     summary: Crée une nouvelle livraison
 *     tags: [Delivery]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Delivery'
 *     responses:
 *       201:
 *         description: Livraison créée
 */
router.post('/', 
  authenticateUser,
  requireRoles(['admin', 'manager', 'staff']),
  validateBody(DeliverySchema),
  asyncHandler(async (req, res) => {
    try {
      const newDelivery: DeliveryOrder = {
        id: deliveries.length + 1,
        orderNumber: generateOrderNumber(),
        ...req.body,
        status: 'pending',
        progress: calculateProgress('pending'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      deliveries.push(newDelivery);

      logger.info('Nouvelle livraison créée', { 
        orderNumber: newDelivery.orderNumber,
        customerName: newDelivery.customerName
      });

      return res.status(201).json({
        success: true,
        data: newDelivery
      });
    } catch (error) {
      logger.error('Erreur création livraison', { 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      });

      return res.status(500).json({ 
        success: false,
        error: 'DELIVERY_CREATE_ERROR', 
        message: 'Erreur lors de la création de la livraison' 
      });
    }
  })
);

/**
 * @openapi
 * /delivery/{id}/status:
 *   patch:
 *     summary: Met à jour le statut d'une livraison
 *     tags: [Delivery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StatusUpdate'
 *     responses:
 *       200:
 *         description: Statut mis à jour
 *       404:
 *         description: Livraison non trouvée
 */
router.patch('/:id/status', 
  authenticateUser,
  requireRoles(['admin', 'manager', 'staff']),
  validateParams(IdParamsSchema),
  validateBody(StatusUpdateSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, driverId, notes } = req.body;

    try {
      const delivery = deliveries.find(d => d.id === parseInt(id || '0'));

      if (!delivery) {
        return res.status(404).json({ 
          success: false,
          error: 'DELIVERY_NOT_FOUND',
          message: 'Livraison non trouvée' 
        });
      }

      // Mettre à jour le statut
      delivery.status = status;
      delivery.updatedAt = new Date().toISOString();
      delivery.progress = calculateProgress(status);

      // Assigner un chauffeur si fourni
      if (driverId) {
        const driver = drivers.find(d => d.id === driverId);
        if (driver) {
          delivery.driver = driver;
          driver.isAvailable = false;
        }
      }

      // Ajouter des notes si fournies
      if (notes) {
        delivery.notes = notes;
      }

      logger.info('Statut livraison mis à jour', { 
        orderNumber: delivery.orderNumber,
        status,
        driverId
      });

      return res.json({
        success: true,
        data: delivery
      });
    } catch (error) {
      logger.error('Erreur mise à jour statut', { 
        id, 
        status, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      });

      return res.status(500).json({ 
        success: false,
        error: 'DELIVERY_STATUS_UPDATE_ERROR', 
        message: 'Erreur lors de la mise à jour du statut' 
      });
    }
  })
);

/**
 * @openapi
 * /delivery/drivers/{id}/location:
 *   patch:
 *     summary: Met à jour la localisation d'un chauffeur
 *     tags: [Delivery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DriverLocation'
 *     responses:
 *       200:
 *         description: Localisation mise à jour
 *       404:
 *         description: Chauffeur non trouvé
 */
router.patch('/drivers/:id/location', 
  authenticateUser,
  requireRoles(['admin', 'manager']),
  validateParams(IdParamsSchema),
  validateBody(DriverLocationSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { lat, lng } = req.body;

    try {
      const driver = drivers.find(d => d.id === parseInt(id || '0'));

      if (!driver) {
        return res.status(404).json({ 
          success: false,
          error: 'DRIVER_NOT_FOUND',
          message: 'Chauffeur non trouvé' 
        });
      }

      driver.currentLocation = { lat, lng };

      logger.info('Localisation chauffeur mise à jour', { 
        driverId: driver.id,
        location: { lat, lng }
      });

      return res.json({
        success: true,
        data: driver
      });
    } catch (error) {
      logger.error('Erreur mise à jour localisation', { 
        id, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      });

      return res.status(500).json({ 
        success: false,
        error: 'DRIVER_LOCATION_UPDATE_ERROR', 
        message: 'Erreur lors de la mise à jour de la localisation' 
      });
    }
  })
);

export default router;