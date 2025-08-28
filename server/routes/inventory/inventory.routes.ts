
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../middleware/error-handler-enhanced';
import { createLogger } from '../../middleware/logging';
import { authenticateUser, requireRoles } from '../../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../../middleware/validation';
import { getDb } from '../../db';
import { menuItems, inventory, suppliers, activityLogs } from '../../../shared/schema';
import { eq, and, or, desc, sql, ilike, gte, lte } from 'drizzle-orm';
import { cacheMiddleware, invalidateCache } from '../../middleware/cache-advanced';

const router = Router();
const logger = createLogger('INVENTORY_ROUTES');

// Schémas de validation
const BaseInventoryItemSchema = z.object({
  menuItemId: z.number().int().positive('ID d\'article de menu invalide'),
  currentStock: z.number().min(0, 'Stock actuel doit être >= 0'),
  minStock: z.number().min(0, 'Stock minimum doit être >= 0'),
  maxStock: z.number().min(1, 'Stock maximum doit être >= 1'),
  unit: z.string().min(1, 'Unité requise').max(20),
  cost: z.number().min(0, 'Coût doit être >= 0'),
  supplierId: z.number().int().positive('ID fournisseur invalide').optional(),
  expiryDate: z.string().datetime('Date d\'expiration invalide').optional(),
  location: z.string().min(1, 'Emplacement requis').max(100),
  batchNumber: z.string().max(50).optional()
});

const CreateInventoryItemSchema = BaseInventoryItemSchema.refine(data => data.maxStock > data.minStock, {
  message: 'Stock maximum doit être supérieur au stock minimum'
});

const UpdateInventoryItemSchema = BaseInventoryItemSchema.partial().extend({
  id: z.number().int().positive('ID invalide')
});

const StockMovementSchema = z.object({
  inventoryId: z.number().int().positive('ID inventaire invalide'),
  type: z.enum(['in', 'out', 'adjustment'], {
    errorMap: () => ({ message: 'Type doit être: in, out, ou adjustment' })
  }),
  quantity: z.number().min(0.01, 'Quantité doit être > 0'),
  reason: z.string().min(1, 'Raison requise').max(200),
  reference: z.string().max(100).optional(),
  cost: z.number().min(0).optional()
});

// Type pour les mouvements de stock
type MovementType = 'in' | 'out' | 'adjustment';

// Interface pour les alertes de stock
interface StockAlert {
  id: number;
  itemName: string | null;
  currentStock: number;
  minStock: number;
  alertType: 'low_stock' | 'out_of_stock' | 'expired' | 'expiring_soon';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}

// Fonction utilitaire pour enregistrer une activité
async function logInventoryActivity(
  userId: number,
  action: string,
  details: string,
  req: any,
  inventoryId?: number
): Promise<void> {
  try {
    const db = getDb();
    await db.insert(activityLogs).values({
      userId,
      action,
      entity: 'inventory',
      entityId: inventoryId,
      details: inventoryId ? `${details} (Inventaire: ${inventoryId})` : details,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });
  } catch (error) {
    logger.error('Erreur enregistrement activité inventaire', {
      userId,
      action,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
}

// Liste des articles d'inventaire avec filtres
router.get('/',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  validateQuery(z.object({
    category: z.string().optional(),
    lowStock: z.boolean().optional(),
    expired: z.boolean().optional(),
    supplierId: z.coerce.number().int().positive().optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.enum(['name', 'currentStock', 'minStock', 'cost', 'expiryDate', 'createdAt']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  })),
  cacheMiddleware({ ttl: 2 * 60 * 1000, tags: ['inventory'] }),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const {
      category,
      lowStock,
      expired,
      supplierId,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let query = db
      .select({
        id: inventory.id,
        menuItemId: inventory.menuItemId,
        itemName: menuItems.name,
        itemCategory: menuItems.categoryId,
        currentStock: inventory.currentStock,
        minStock: inventory.minStock,
        maxStock: inventory.maxStock,
        unit: inventory.unit,
        cost: inventory.cost,
        supplierId: inventory.supplierId,
        supplierName: suppliers.name,
        expiryDate: inventory.expiryDate,
        location: inventory.location,
        batchNumber: inventory.batchNumber,
        lastUpdated: inventory.updatedAt,
        stockStatus: sql<string>`
          CASE 
            WHEN ${inventory.currentStock} = 0 THEN 'out_of_stock'
            WHEN ${inventory.currentStock} <= ${inventory.minStock} THEN 'low_stock'
            WHEN ${inventory.expiryDate} < NOW() THEN 'expired'
            WHEN ${inventory.expiryDate} < NOW() + INTERVAL '7 days' THEN 'expiring_soon'
            ELSE 'normal'
          END
        `
      })
      .from(inventory)
      .leftJoin(menuItems, eq(inventory.menuItemId, menuItems.id))
      .leftJoin(suppliers, eq(inventory.supplierId, suppliers.id));

    // Construire les conditions
    const conditions = [];

    if (category) {
      const categoryId = parseInt(category as string);
      if (!isNaN(categoryId)) {
        conditions.push(eq(menuItems.categoryId, categoryId));
      }
    }

    if (lowStock) {
      conditions.push(sql`${inventory.currentStock} <= ${inventory.minStock}`);
    }

    if (expired) {
      conditions.push(sql`${inventory.expiryDate} < NOW()`);
    }

    if (supplierId !== undefined) {
      conditions.push(eq(inventory.supplierId, supplierId));
    }

    if (search) {
      conditions.push(
        or(
          ilike(menuItems.name, `%${search}%`),
          ilike(inventory.location, `%${search}%`),
          ilike(inventory.batchNumber, `%${search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Tri
    const orderColumn = sortBy === 'name' ? menuItems.name :
                       sortBy === 'currentStock' ? inventory.currentStock :
                       sortBy === 'minStock' ? inventory.minStock :
                       sortBy === 'cost' ? inventory.cost :
                       sortBy === 'expiryDate' ? inventory.expiryDate :
                       inventory.createdAt;

    query = sortOrder === 'desc' ?
      query.orderBy(desc(orderColumn)) :
      query.orderBy(orderColumn);

    // Pagination
    const pageNum = typeof page === 'number' ? page : 1;
    const limitNum = typeof limit === 'number' ? limit : 20;
    const offset = (pageNum - 1) * limitNum;
    const inventoryData = await query.limit(limitNum).offset(offset);

    // Compte total
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(inventory)
      .leftJoin(menuItems, eq(inventory.menuItemId, menuItems.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    const count = countResult[0]?.count || 0;

    logger.info('Inventaire récupéré', {
      count: inventoryData.length,
      total: count,
      filters: { category, lowStock, expired, supplierId, search }
    });

    res.json({
      success: true,
      data: inventoryData,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        totalPages: Math.ceil(count / limitNum)
      }
    });
  })
);

// Alertes de stock
router.get('/alerts',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  cacheMiddleware({ ttl: 1 * 60 * 1000, tags: ['inventory', 'alerts'] }),
  asyncHandler(async (req, res) => {
    const db = getDb();

    const alertsData = await db
      .select({
        id: inventory.id,
        itemName: menuItems.name,
        currentStock: inventory.currentStock,
        minStock: inventory.minStock,
        expiryDate: inventory.expiryDate,
        location: inventory.location
      })
      .from(inventory)
      .leftJoin(menuItems, eq(inventory.menuItemId, menuItems.id))
      .where(
        or(
          sql`${inventory.currentStock} <= ${inventory.minStock}`,
          sql`${inventory.expiryDate} < NOW() + INTERVAL '7 days'`
        )
      )
      .orderBy(desc(inventory.currentStock));

    const alerts: StockAlert[] = alertsData.map(item => {
      if (item.currentStock === 0) {
        return {
          id: item.id,
          itemName: item.itemName || 'Article inconnu',
          currentStock: item.currentStock,
          minStock: item.minStock,
          alertType: 'out_of_stock',
          severity: 'critical',
          message: `${item.itemName} est en rupture de stock (${item.location})`
        };
      } else if (item.currentStock <= item.minStock) {
        return {
          id: item.id,
          itemName: item.itemName || 'Article inconnu',
          currentStock: item.currentStock,
          minStock: item.minStock,
          alertType: 'low_stock',
          severity: 'high',
          message: `${item.itemName} a un stock faible: ${item.currentStock}/${item.minStock} (${item.location})`
        };
      } else if (item.expiryDate && new Date(item.expiryDate) < new Date()) {
        return {
          id: item.id,
          itemName: item.itemName || 'Article inconnu',
          currentStock: item.currentStock,
          minStock: item.minStock,
          alertType: 'expired',
          severity: 'critical',
          message: `${item.itemName} a expiré le ${new Date(item.expiryDate).toLocaleDateString()}`
        };
      } else {
        return {
          id: item.id,
          itemName: item.itemName || 'Article inconnu',
          currentStock: item.currentStock,
          minStock: item.minStock,
          alertType: 'expiring_soon',
          severity: 'medium',
          message: `${item.itemName} expire bientôt: ${new Date(item.expiryDate!).toLocaleDateString()}`
        };
      }
    });

    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
    const highAlerts = alerts.filter(a => a.severity === 'high').length;

    logger.info('Alertes inventaire récupérées', {
      totalAlerts: alerts.length,
      critical: criticalAlerts,
      high: highAlerts
    });

    res.json({
      success: true,
      data: {
        alerts,
        summary: {
          total: alerts.length,
          critical: criticalAlerts,
          high: highAlerts,
          medium: alerts.filter(a => a.severity === 'medium').length,
          low: alerts.filter(a => a.severity === 'low').length
        }
      }
    });
  })
);

// Créer un article d'inventaire
router.post('/',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  validateBody(CreateInventoryItemSchema),
  invalidateCache(['inventory']),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const currentUser = (req as any).user;

    // Vérifier que l'article de menu existe
    const [menuItem] = await db
      .select({ name: menuItems.name })
      .from(menuItems)
      .where(eq(menuItems.id, req.body.menuItemId));

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Article de menu non trouvé'
      });
    }

    // Vérifier si l'article existe déjà en inventaire
    const [existingItem] = await db
      .select({ id: inventory.id })
      .from(inventory)
      .where(eq(inventory.menuItemId, req.body.menuItemId));

    if (existingItem) {
      return res.status(409).json({
        success: false,
        message: 'Cet article existe déjà en inventaire'
      });
    }

    // Créer l'article d'inventaire
    const [newItem] = await db
      .insert(inventory)
      .values({
        ...req.body,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    if (!newItem) {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de l\'article'
      });
    }

    // Enregistrer l'activité
    await logInventoryActivity(
      currentUser.id,
      'CREATE_INVENTORY_ITEM',
      `Article d'inventaire créé: ${menuItem.name}`,
      req,
      newItem.id
    );

    logger.info('Article d\'inventaire créé', {
      inventoryId: newItem.id,
      menuItemId: req.body.menuItemId,
      itemName: menuItem.name,
      createdBy: currentUser.id
    });

    res.status(201).json({
      success: true,
      data: newItem,
      message: 'Article d\'inventaire créé avec succès'
    });
  })
);

// Mettre à jour un article d'inventaire
router.put('/:id',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  validateParams(z.object({ id: z.coerce.number().int().positive() })),
  validateBody(UpdateInventoryItemSchema.omit({ id: true })),
  invalidateCache(['inventory']),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const currentUser = (req as any).user;
    const { id } = req.params;

    // Vérifier que l'article existe
    const [existingItem] = await db
      .select()
      .from(inventory)
      .where(eq(inventory.id, parseInt(id || '0')));

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: 'Article d\'inventaire non trouvé'
      });
    }

    // Mettre à jour l'article
    const [updatedItem] = await db
      .update(inventory)
      .set({
        ...req.body,
        updatedAt: new Date()
      })
      .where(eq(inventory.id, parseInt(id)))
      .returning();

    // Enregistrer l'activité
    await logInventoryActivity(
      currentUser.id,
      'UPDATE_INVENTORY_ITEM',
      `Article d'inventaire mis à jour: ${Object.keys(req.body).join(', ')}`,
      req,
      parseInt(id || '0')
    );

    logger.info('Article d\'inventaire mis à jour', {
      inventoryId: id,
      changes: Object.keys(req.body),
      updatedBy: currentUser.id
    });

    res.json({
      success: true,
      data: updatedItem,
      message: 'Article d\'inventaire mis à jour avec succès'
    });
  })
);

// Mouvement de stock
router.post('/movement',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  validateBody(StockMovementSchema),
  invalidateCache(['inventory']),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const currentUser = (req as any).user;
    const { inventoryId, type, quantity, reason, reference, cost } = req.body;

    // Vérifier que l'article existe
    const [item] = await db
      .select()
      .from(inventory)
      .where(eq(inventory.id, inventoryId));

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Article d\'inventaire non trouvé'
      });
    }

    // Calculer le nouveau stock
    let newStock = item.currentStock;
    switch (type) {
      case 'in':
        newStock += quantity;
        break;
      case 'out':
        newStock -= quantity;
        break;
      case 'adjustment':
        newStock = quantity; // Pour les ajustements, quantity est le nouveau stock
        break;
    }

    // Vérifier que le stock ne devient pas négatif
    if (newStock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock insuffisant pour cette opération'
      });
    }

    // Mettre à jour le stock
    await db
      .update(inventory)
      .set({
        currentStock: newStock,
        updatedAt: new Date()
      })
      .where(eq(inventory.id, inventoryId));

    // Enregistrer l'activité
    const actionMap: Record<MovementType, string> = {
      'in': 'STOCK_IN',
      'out': 'STOCK_OUT',
      'adjustment': 'STOCK_ADJUSTMENT'
    };

    await logInventoryActivity(
      currentUser.id,
      actionMap[type],
      `${reason} - Quantité: ${quantity} ${item.unit} - Nouveau stock: ${newStock}`,
      req,
      inventoryId
    );

    logger.info('Mouvement de stock enregistré', {
      inventoryId,
      type,
      quantity,
      previousStock: item.currentStock,
      newStock,
      reason,
      userId: currentUser.id
    });

    res.json({
      success: true,
      data: {
        inventoryId,
        type,
        quantity,
        previousStock: item.currentStock,
        newStock,
        reason,
        reference
      },
      message: 'Mouvement de stock enregistré avec succès'
    });
  })
);

// Statistiques d'inventaire
router.get('/stats',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  cacheMiddleware({ ttl: 5 * 60 * 1000, tags: ['inventory', 'stats'] }),
  asyncHandler(async (req, res) => {
    const db = getDb();

    // Statistiques générales
    const [stats] = await db
      .select({
        totalItems: sql<number>`count(*)`,
        lowStockItems: sql<number>`count(*) filter (where ${inventory.currentStock} <= ${inventory.minStock})`,
        outOfStockItems: sql<number>`count(*) filter (where ${inventory.currentStock} = 0)`,
        expiredItems: sql<number>`count(*) filter (where ${inventory.expiryDate} < now())`,
        totalValue: sql<number>`sum(${inventory.currentStock} * ${inventory.cost})`
      })
      .from(inventory);

    // Valeur par catégorie
    const categoryValues = await db
      .select({
        category: menuItems.category,
        totalValue: sql<number>`sum(${inventory.currentStock} * ${inventory.cost})`,
        itemCount: sql<number>`count(*)`
      })
      .from(inventory)
      .leftJoin(menuItems, eq(inventory.menuItemId, menuItems.id))
      .groupBy(menuItems.category);

    logger.info('Statistiques inventaire récupérées', stats);

    res.json({
      success: true,
      data: {
        overview: stats,
        byCategory: categoryValues
      }
    });
  })
);

export default router;
