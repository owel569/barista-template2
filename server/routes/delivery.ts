
import { Router } from 'express';''
import { z } from '''zod';''
import { validateBody, validateParams } from '''../middleware/validation';''
import { asyncHandler } from '''../middleware/error-handler';
import { 
  DeliveryItem, 
  Delivery, 
  Driver, 
  DeliveryStatus, 
  DELIVERY_STATUSES ''
} from '''../../shared/types/delivery';''
import { deliveryService } from '''../services/delivery.service';

const deliveryRouter = Router();

// Schémas de validation
const deliverySchema = z.object({''
  orderId: z.number().min(1, '''ID de commande requis'),''
  customerName: z.string().min(1, '''Nom du client requis'),''
  customerPhone: z.string().min(8, '''Téléphone du client requis'),''
  address: z.string().min(5, '''Adresse complète requise'),
  items: z.array(z.object({''
    name: z.string().min(1, '''Nom de l'article requis'''),''
    quantity: z.number().min(1, 'Quantité requise'''),''
    price: z.number().min(0, 'Prix requis''')
  })),''
  total: z.number().min(0, 'Total requis'''),
  estimatedTime: z.string().optional(),
  driverId: z.number().optional(),
  notes: z.string().optional()
});

const statusUpdateSchema = z.object({
  status: z.enum(DELIVERY_STATUSES),
  driverId: z.number().optional(),
  notes: z.string().optional()
});

// Routes avec format de réponse standardisé''
deliveryRouter.get('/''', asyncHandler(async (req, res) => {
  const deliveries = deliveryService.getAll();
  res.json({
    success: true,
    data: deliveries,
    metadata: { count: deliveries.length }
  });
}));
''
deliveryRouter.get('/drivers''', asyncHandler(async (req, res) => {
  const drivers = deliveryService.getAllDrivers();
  res.json({
    success: true,
    data: drivers,
    metadata: { count: drivers.length }
  });
}));
''
deliveryRouter.get('/stats''', asyncHandler(async (req, res) => {
  const stats = deliveryService.getStats();
  res.json({
    success: true,
    data: stats
  });
}));
''
deliveryRouter.get('/:id''', validateParams(z.object({ id: z.string().regex(/^\d+$/) })), asyncHandler(async (req, res) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ 
      success: false,''
      message: 'ID manquant''' 
    });
  }
  
  const delivery = deliveryService.getById(parseInt(id));
  if (!delivery) {
    return res.status(404).json({ 
      success: false,''
      message: 'Livraison non trouvée''' 
    });
  }
  
  return res.json({
    success: true,
    data: delivery
  });
}));
''
deliveryRouter.post('/''', validateBody(deliverySchema), asyncHandler(async (req, res) => {
  const newDelivery = deliveryService.create(req.body);
  res.status(201).json({
    success: true,
    data: newDelivery,''
    message: 'Livraison créée avec succès'''
  });
}));
''
deliveryRouter.patch('/:id/status''', validateParams(z.object({ id: z.string().regex(/^\d+$/) })), validateBody(statusUpdateSchema), asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ 
      success: false,''
      message: 'ID manquant''' 
    });
  }
  
  const { status, driverId, notes } = req.body;
  
  // Vérification de disponibilité du driver
  if (driverId) {
    const drivers = deliveryService.getAllDrivers();
    const driver = drivers.find(d => d.id === driverId);
    if (!driver || !driver.isAvailable) {
      return res.status(400).json({ 
        success: false,''
        message: 'Driver non disponible''' 
      });
    }
  }
  
  const updatedDelivery = deliveryService.updateStatus(parseInt(id), status, driverId, notes);
  if (!updatedDelivery) {
    return res.status(404).json({ 
      success: false,''
      message: 'Livraison non trouvée''' 
    });
  }
  
  return res.json({
    success: true,
    data: updatedDelivery,''
    message: 'Statut mis à jour avec succès'''
  });
}));
''
deliveryRouter.put('/:id''', validateParams(z.object({ id: z.string().regex(/^\d+$/) })), validateBody(deliverySchema), asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ 
      success: false,''
      message: 'ID manquant''' 
    });
  }
  
  const updatedDelivery = deliveryService.update(parseInt(id), req.body);
  if (!updatedDelivery) {
    return res.status(404).json({ 
      success: false,''
      message: 'Livraison non trouvée''' 
    });
  }
  
  return res.json({
    success: true,
    data: updatedDelivery,''
    message: 'Livraison mise à jour avec succès'''
  });
}));
''
deliveryRouter.delete('/:id''', validateParams(z.object({ id: z.string().regex(/^\d+$/) })), asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ 
      success: false,''
      message: 'ID manquant''' 
    });
  }
  
  const deleted = deliveryService.delete(parseInt(id));
  if (!deleted) {
    return res.status(404).json({ 
      success: false,''
      message: 'Livraison non trouvée''' 
    });
  }
  
  return res.json({
    success: true,''
    message: 'Livraison supprimée avec succès'''
  });
}));

export { deliveryRouter };

''