import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error-handler';
import { createLogger } from '../middleware/logging';
import { authenticateUser, requireRoles } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { getDb } from '../db';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

const router = Router();
const logger = createLogger('INVENTORY');

// ==========================================
// TYPES ET INTERFACES
// ==========================================

export interface InventoryItem {
  id: number;
  name: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  avgConsumption: number;
  daysRemaining: number;
  status: 'ok' | 'warning' | 'critical';
  cost: number;
  supplier: string;
}

export interface InventoryCategory {
  name: string;
  items: InventoryItem[];
}

export interface InventoryAlert {
  type: 'low_stock' | 'reorder_soon' | 'expired';
  item: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
}

export interface InventoryStatistics {
  totalValue: number;
  lowStockItems: number;
  pendingOrders: number;
  monthlyConsumption: number;
}

export interface StockMovement {
  id: number;
  date: string;
  type: 'in' | 'out' | 'adjustment';
  item: string;
  quantity: number;
  unit: string;
  reason: string;
  user: string;
  reference?: string;
}

export interface SupplierOrder {
  id: string;
  itemName: string;
  quantity: number;
  supplierName: string;
  unitPrice: number;
  totalPrice: number;
  urgency: 'normal' | 'urgent' | 'critical';
  estimatedDelivery: string;
  generatedAt: string;
  status: 'pending' | 'sent' | 'confirmed' | 'delivered';
  sentAt?: string;
  justification: string;
}

// ==========================================
// SCHÉMAS DE VALIDATION ZOD
// ==========================================

const StockAdjustmentSchema = z.object({
  itemId: z.number()}).positive('ID article invalide'),
  quantity: z.number().not(0, 'Quantité ne peut pas être zéro'),
  reason: z.string().min(1, 'Raison requise').max(200, 'Raison trop longue'),
  type: z.enum(['in', 'out', 'adjustment'], { required_error: 'Type de mouvement requis' })
});

const ReorderSchema = z.object({
  itemId: z.number()}).positive('ID article invalide'),
  quantity: z.number().positive('Quantité doit être positive'),
  urgency: z.enum(['normal', 'urgent', 'critical']).default('normal'),
  supplierId: z.number().positive('ID fournisseur invalide').optional()
});

const PeriodQuerySchema = z.object({
  period: z.enum(['1d', '7d', '30d', '90d'])}).default('7d'),
  type: z.enum(['all', 'in', 'out', 'adjustment']).default('all')
});

// ==========================================
// ROUTES AVEC AUTHENTIFICATION ET VALIDATION
// ==========================================

// Vue d'ensemble de l'inventaire
router.get('/overview', 
  authenticateUser,
  requireRoles(['admin', 'manager', 'staff']),
  asyncHandler(async (req, res) => {
  try {
    const inventory = {
      categories: [
        {
            name: 'Café',
          items: [
            {
              id: 1,
              name: 'Grains café Arabica',
                currentStock: 12,
              minStock: 10,
              maxStock: 50,
              unit: 'kg',
                avgConsumption: 1.5,
                daysRemaining: 8,
              status: 'warning',
              cost: 12.50,
              supplier: 'Café Premium SAS'
              },
            {
              id: 2,
              name: 'Thé Earl Grey',
              currentStock: 5,
              minStock: 3,
              maxStock: 20,
              unit: 'boîtes',
              avgConsumption: 0.3,
              daysRemaining: 16,
              status: 'ok',
              cost: 8.90,
              supplier: 'Thés du Monde'
            }
          ]
        },
        {
          name: 'Pâtisserie',
          items: [
            {
              id: 3,
              name: 'Farine T55',
              currentStock: 8,
              minStock: 5,
              maxStock: 25,
              unit: 'kg',
              avgConsumption: 1.2,
              daysRemaining: 6,
              status: 'critical',
              cost: 1.85,
              supplier: 'Minoterie Locale'
            },
            {
              id: 4,
              name: 'Sucre blanc',
              currentStock: 15,
              minStock: 5,
              maxStock: 30,
              unit: 'kg',
              avgConsumption: 0.8,
              daysRemaining: 18,
              status: 'ok',
              cost: 2.20,
              supplier: 'Sucres & Co'
            }
          ]
        }
      ],
      alerts: [
        {
          type: 'low_stock',
          item: 'Farine T55',
          message: 'Stock critique - 6 jours restants',
          priority: 'high'
        },
        {
          type: 'reorder_soon',
          item: 'Grains café Arabica',
          message: 'Réapprovisionnement recommandé',
          priority: 'medium'
        }
      ],
      statistics: {
        totalValue: 1250.75,
        lowStockItems: 2,
        pendingOrders: 1,
        monthlyConsumption: 2850.50
      }
    };

      res.json({
        success: true,
        data: inventory
      });
  } catch (error) {
      logger.error('Erreur inventory overview', { error: error instanceof Error ? error.message : 'Erreur inconnue' )});
      res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la récupération de l\'inventaire' 
      });
    }
  })
);

// Suivi des mouvements de stock
router.get('/movements', 
  authenticateUser,
  requireRoles(['admin', 'manager']),
  validateQuery(PeriodQuerySchema),
  asyncHandler(async (req, res) => {
    const { period, type } = req.query;
    
    try {
      const movements: StockMovement[] = [
      {
        id: 1,
        date: '2025-01-16T10:30:00Z',
        type: 'in',
        item: 'Grains café Arabica',
        quantity: 20,
        unit: 'kg',
        reason: 'Livraison fournisseur',
        user: 'Marie Martin',
          reference: 'LIV-2025-001'
      },
      {
        id: 2,
        date: '2025-01-16T14:15:00Z',
        type: 'out',
        item: 'Farine T55',
          quantity: 2,
        unit: 'kg',
          reason: 'Préparation pâtisseries',
          user: 'Pierre Dubois'
        }
      ];

    res.json({
        success: true,
        data: movements
    });
  } catch (error) {
      logger.error('Erreur mouvements stock', { 
        period, 
        type, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      )});
      res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la récupération des mouvements' 
      });
    }
  })
);

// Ajustement de stock
router.post('/adjust',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  validateBody(StockAdjustmentSchema),
  asyncHandler(async (req, res) => {
    const { itemId, quantity, reason, type } = req.body;
    
    try {
      // TODO: Implémenter la logique d'ajustement de stock
      const adjustment = {
        id: Date.now(),
        itemId,
        quantity,
        reason,
        type,
        timestamp: new Date().toISOString(),
        userId: req.user?.id
      };

    res.json({
        success: true,
        data: adjustment
    });
  } catch (error) {
      logger.error('Erreur ajustement stock', { 
        itemId, 
        quantity, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      )});
      res.status(500).json({ 
        success: false,
        message: 'Erreur lors de l\'ajustement de stock' 
      });
    }
  })
);

// Génération de commandes fournisseurs
router.post('/reorder',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  validateBody(ReorderSchema),
  asyncHandler(async (req, res) => {
    const { itemId, quantity, urgency, supplierId } = req.body;
    
    try {
      const order: SupplierOrder = {
        id: `CMD-${Date.now()}`,
        itemName: 'Article à commander',
        quantity,
        supplierName: 'Fournisseur par défaut',
        unitPrice: 10.00,
        totalPrice: quantity * 10.00,
        urgency,
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        generatedAt: new Date().toISOString(),
        status: 'pending',
        justification: 'Commande automatique - stock faible'
      };

    res.json({
      success: true,
        data: order
    });
  } catch (error) {
      logger.error('Erreur génération commande', { 
        itemId, 
        quantity, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      )});
      res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la génération de la commande' 
      });
    }
  })
);

// Analyse des besoins en stock
router.get('/analysis',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  asyncHandler(async (req, res) => {
    try {
      const analysis = {
        items: [
          {
            id: 1,
            name: 'Grains café Arabica',
            currentStock: 12,
            recommendedOrder: 20,
            urgency: 'medium',
            reason: 'Consommation élevée'
          },
          {
            id: 3,
            name: 'Farine T55',
            currentStock: 8,
            recommendedOrder: 15,
            urgency: 'high',
            reason: 'Stock critique'
        }
      ],
      summary: {
          totalItems: 2,
          urgentOrders: 1,
          estimatedCost: 350.00
        }
      };

      res.json({
        success: true,
        data: analysis
      });
  } catch (error) {
      logger.error('Erreur analyse stock', { 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      )});
      res.status(500).json({ 
        success: false,
        message: 'Erreur lors de l\'analyse des stocks' 
      });
    }
  })
);

export default router;