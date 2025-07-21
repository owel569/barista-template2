import { Router } from 'express';
import { storage } from '../storage';
import { asyncHandler } from '../middleware/error-handler';
import { createLogger } from '../middleware/logging';

const router = Router();
const logger = createLogger('INVENTORY');

// Gestion complète des stocks avec prédictions
router.get('/overview', asyncHandler(async (req, res) => {
  try {
    const inventory = {
      categories: [
        {
          name: 'Café & Thé',
          items: [
            {
              id: 1,
              name: 'Grains café Arabica',
              currentStock: 25,
              minStock: 10,
              maxStock: 50,
              unit: 'kg',
              avgConsumption: 2.5, // kg/jour
              daysRemaining: 10,
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

    res.json(inventory);
  } catch (error) {
    logger.error('Erreur inventory overview', { error: error.message });
    res.status(500).json({ message: 'Erreur serveur' });
  }
}));

// Suivi des mouvements de stock
router.get('/movements', asyncHandler(async (req, res) => {
  const { period = '7d', type = 'all' } = req.query;
  
  try {
    const movements = [
      {
        id: 1,
        date: '2025-01-16T10:30:00Z',
        type: 'in',
        item: 'Grains café Arabica',
        quantity: 20,
        unit: 'kg',
        reason: 'Livraison fournisseur',
        user: 'Marie Martin',
        cost: 250.00,
        supplier: 'Café Premium SAS'
      },
      {
        id: 2,
        date: '2025-01-16T14:15:00Z',
        type: 'out',
        item: 'Farine T55',
        quantity: 2.5,
        unit: 'kg',
        reason: 'Production croissants',
        user: 'Jean Dupont',
        orderId: 'ORD-2025-001'
      },
      {
        id: 3,
        date: '2025-01-15T16:45:00Z',
        type: 'adjustment',
        item: 'Sucre blanc',
        quantity: -0.5,
        unit: 'kg',
        reason: 'Correction inventaire',
        user: 'Marie Martin',
        note: 'Emballage endommagé'
      }
    ];

    const filteredMovements = type === 'all' ? movements : 
      movements.filter(m => m.type === type);

    res.json({
      movements: filteredMovements,
      summary: {
        totalIn: movements.filter(m => m.type === 'in').length,
        totalOut: movements.filter(m => m.type === 'out').length,
        adjustments: movements.filter(m => m.type === 'adjustment').length,
        totalValue: movements.reduce((sum, m) => sum + (m.cost || 0), 0)
      }
    });
  } catch (error) {
    logger.error('Erreur inventory movements', { error: error.message });
    res.status(500).json({ message: 'Erreur serveur' });
  }
}));

// Prédictions de stock intelligentes
router.get('/predictions', asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;
  
  try {
    const predictions = {
      algorithm: 'ML_FORECAST_v2.1',
      accuracy: 89.5,
      lastUpdate: new Date().toISOString(),
      items: [
        {
          itemId: 1,
          name: 'Grains café Arabica',
          currentStock: 25,
          predictions: {
            '7d': { consumption: 17.5, remaining: 7.5, status: 'ok' },
            '14d': { consumption: 35, remaining: -10, status: 'critical' },
            '30d': { consumption: 75, remaining: -50, status: 'critical' }
          },
          recommendations: {
            reorderDate: '2025-01-22',
            reorderQuantity: 30,
            estimatedCost: 375.00,
            urgency: 'medium'
          },
          seasonalFactors: {
            current: 1.1, // 10% augmentation hivernale
            trend: 'increasing',
            specialEvents: ['Semaine du café (01-02)']
          }
        },
        {
          itemId: 3,
          name: 'Farine T55',
          currentStock: 8,
          predictions: {
            '7d': { consumption: 8.4, remaining: -0.4, status: 'critical' },
            '14d': { consumption: 16.8, remaining: -8.8, status: 'critical' },
            '30d': { consumption: 36, remaining: -28, status: 'critical' }
          },
          recommendations: {
            reorderDate: '2025-01-17', // Urgent
            reorderQuantity: 20,
            estimatedCost: 37.00,
            urgency: 'high'
          },
          seasonalFactors: {
            current: 1.0,
            trend: 'stable',
            specialEvents: []
          }
        }
      ],
      automaticOrders: {
        enabled: true,
        scheduled: [
          {
            item: 'Farine T55',
            date: '2025-01-17',
            quantity: 20,
            supplier: 'Minoterie Locale',
            estimated_cost: 37.00,
            status: 'pending_approval'
          }
        ]
      },
      costOptimization: {
        potentialSavings: 125.50,
        recommendations: [
          'Grouper commandes Café Premium SAS pour réduction volume',
          'Commander farine en plus grande quantité pour meilleur prix unitaire'
        ]
      }
    };

    res.json(predictions);
  } catch (error) {
    logger.error('Erreur inventory predictions', { error: error.message });
    res.status(500).json({ message: 'Erreur serveur' });
  }
}));

// Gestion des fournisseurs
router.get('/suppliers', asyncHandler(async (req, res) => {
  try {
    const suppliers = [
      {
        id: 1,
        name: 'Café Premium SAS',
        contact: 'contact@cafepremium.fr',
        phone: '01 23 45 67 89',
        categories: ['Café', 'Thé'],
        rating: 4.8,
        deliveryTime: '24-48h',
        minimumOrder: 100,
        paymentTerms: '30 jours',
        lastOrder: '2025-01-16',
        totalOrders: 48,
        reliability: 96.5,
        priceCompetitiveness: 4.2
      },
      {
        id: 2,
        name: 'Minoterie Locale',
        contact: 'orders@minoterie-locale.fr',
        phone: '01 98 76 54 32',
        categories: ['Farine', 'Céréales'],
        rating: 4.6,
        deliveryTime: '48-72h',
        minimumOrder: 50,
        paymentTerms: '15 jours',
        lastOrder: '2025-01-10',
        totalOrders: 32,
        reliability: 94.2,
        priceCompetitiveness: 4.5
      }
    ];

    res.json({
      suppliers,
      analytics: {
        totalSuppliers: suppliers.length,
        averageRating: 4.7,
        averageReliability: 95.35,
        averageDeliveryTime: '48h',
        topPerformers: suppliers.filter(s => s.rating >= 4.5)
      }
    });
  } catch (error) {
    logger.error('Erreur suppliers', { error: error.message });
    res.status(500).json({ message: 'Erreur serveur' });
  }
}));

// Génération automatique de commandes
router.post('/orders/generate', asyncHandler(async (req, res) => {
  const { 
    itemIds = [], 
    forceGenerate = false,
    approvalRequired = true 
  } = req.body;

  try {
    // Analyser les besoins de stock
    const analysisResults = await analyzeStockNeeds(itemIds);
    
    const generatedOrders = [];
    
    for (const item of analysisResults.criticalItems) {
      const order = {
        id: `AUTO_${Date.now()}_${item.id}`,
        itemId: item.id,
        itemName: item.name,
        supplierId: item.preferredSupplierId,
        supplierName: item.supplierName,
        quantity: item.recommendedQuantity,
        unitPrice: item.unitPrice,
        totalPrice: item.recommendedQuantity * item.unitPrice,
        urgency: item.urgency,
        estimatedDelivery: item.estimatedDelivery,
        generatedAt: new Date().toISOString(),
        status: approvalRequired ? 'pending_approval' : 'auto_approved',
        justification: item.justification
      };

      if (!approvalRequired || forceGenerate) {
        // Envoyer automatiquement la commande
        await sendOrderToSupplier(order);
        order.status = 'sent';
        order.sentAt = new Date().toISOString();
      }

      generatedOrders.push(order);
    }

    // Sauvegarder les commandes
    for (const order of generatedOrders) {
      await storage.createInventoryOrder(order);
    }

    res.json({
      success: true,
      ordersGenerated: generatedOrders.length,
      orders: generatedOrders,
      totalValue: generatedOrders.reduce((sum, order) => sum + order.totalPrice, 0),
      estimatedSavings: analysisResults.estimatedSavings || 0
    });
  } catch (error) {
    logger.error('Erreur génération commandes', { error: error.message });
    res.status(500).json({ message: 'Erreur serveur' });
  }
}));

// Valorisation du stock
router.get('/valuation', asyncHandler(async (req, res) => {
  const { method = 'fifo' } = req.query; // fifo, lifo, average
  
  try {
    const valuation = {
      method,
      lastCalculated: new Date().toISOString(),
      categories: [
        {
          name: 'Café & Thé',
          totalValue: 525.50,
          totalQuantity: 35,
          averageUnitPrice: 15.01,
          items: [
            { name: 'Grains café Arabica', quantity: 25, unitPrice: 12.50, totalValue: 312.50 },
            { name: 'Thé Earl Grey', quantity: 5, unitPrice: 8.90, totalValue: 44.50 }
          ]
        },
        {
          name: 'Pâtisserie',
          totalValue: 180.80,
          totalQuantity: 23,
          averageUnitPrice: 7.86,
          items: [
            { name: 'Farine T55', quantity: 8, unitPrice: 1.85, totalValue: 14.80 },
            { name: 'Sucre blanc', quantity: 15, unitPrice: 2.20, totalValue: 33.00 }
          ]
        }
      ],
      summary: {
        totalStockValue: 706.30,
        totalItems: 58,
        mostValuableCategory: 'Café & Thé',
        stockTurnover: 12.5, // fois par an
        deadStockValue: 25.50,
        deadStockPercentage: 3.6
      },
      trends: {
        monthlyChange: +12.5,
        yearlyChange: +185.30,
        efficiency: 'good'
      }
    };

    res.json(valuation);
  } catch (error) {
    logger.error('Erreur stock valuation', { error: error.message });
    res.status(500).json({ message: 'Erreur serveur' });
  }
}));

// Fonctions utilitaires
async function analyzeStockNeeds(itemIds: number[]) {
  // Simulation d'analyse IA des besoins de stock
  const criticalItems = [
    {
      id: 3,
      name: 'Farine T55',
      currentStock: 8,
      recommendedQuantity: 20,
      preferredSupplierId: 2,
      supplierName: 'Minoterie Locale',
      unitPrice: 1.85,
      urgency: 'high',
      estimatedDelivery: '2025-01-18',
      justification: 'Stock épuisé dans 6 jours selon consommation actuelle'
    }
  ];

  return {
    criticalItems,
    estimatedSavings: 25.50
  };
}

async function sendOrderToSupplier(order: { id: string; itemName: string; quantity: number; supplierName: string; unitPrice: number; totalPrice: number; urgency: string; estimatedDelivery: string; generatedAt: string; status: string; sentAt?: string; justification: string }) {
  // Simulation d'envoi de commande au fournisseur
  logger.info('Commande envoyée', { 
    orderId: order.id, 
    supplier: order.supplierName,
    item: order.itemName,
    quantity: order.quantity 
  });
  
  return true;
}

export { router as inventoryRouter };