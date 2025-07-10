import { Router } from 'express';
import { z } from 'zod';

const deliveryRouter = Router();

// Mock data for deliveries
let deliveries = [
  {
    id: 1,
    orderNumber: 'DEL-001',
    customerName: 'Sophie Laurent',
    customerPhone: '+33612345678',
    deliveryAddress: '123 Rue de la Paix, 75001 Paris',
    items: [
      { name: 'Cappuccino Premium', quantity: 2, price: 4.20 },
      { name: 'Croissant Artisanal', quantity: 1, price: 2.80 }
    ],
    status: 'preparing',
    estimatedTime: '25 min',
    deliveryDriver: 'Jean Dupont',
    progress: 30,
    total: 11.20,
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    orderNumber: 'DEL-002',
    customerName: 'Marc Durand',
    customerPhone: '+33623456789',
    deliveryAddress: '456 Avenue des Champs, 75008 Paris',
    items: [
      { name: 'Latte Art', quantity: 1, price: 4.80 },
      { name: 'Muffin Myrtilles', quantity: 2, price: 3.50 }
    ],
    status: 'dispatched',
    estimatedTime: '15 min',
    deliveryDriver: 'Marie Martin',
    progress: 85,
    total: 11.80,
    createdAt: new Date().toISOString()
  }
];

// Get all deliveries
deliveryRouter.get('/', (req, res) => {
  res.json(deliveries);
});

// Update delivery status
deliveryRouter.patch('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const delivery = deliveries.find(d => d.id === parseInt(id));
  if (!delivery) {
    return res.status(404).json({ message: 'Livraison non trouvée' });
  }
  
  delivery.status = status;
  
  // Update progress based on status
  switch (status) {
    case 'pending': delivery.progress = 10; break;
    case 'preparing': delivery.progress = 30; break;
    case 'ready': delivery.progress = 60; break;
    case 'dispatched': delivery.progress = 85; break;
    case 'delivered': delivery.progress = 100; break;
    case 'cancelled': delivery.progress = 0; break;
  }
  
  res.json(delivery);
});

// Create new delivery
deliveryRouter.post('/', (req, res) => {
  const newDelivery = {
    id: deliveries.length + 1,
    orderNumber: `DEL-${(deliveries.length + 1).toString().padStart(3, '0')}`,
    ...req.body,
    status: 'pending',
    progress: 10,
    createdAt: new Date().toISOString()
  };
  
  deliveries.push(newDelivery);
  res.status(201).json(newDelivery);
});

export { deliveryRouter };