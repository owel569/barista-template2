import { Router } from 'express';
import { z } from 'zod';

const onlineOrdersRouter = Router();

// Mock data for online orders
let onlineOrders = [
  {
    id: 1,
    orderNumber: 'WEB-001',
    customerInfo: {
      name: 'Emma Martin',
      email: 'emma.martin@email.com',
      phone: '+33634567890'
    },
    items: [
      {
        id: 1,
        menuItem: {
          id: 1,
          name: 'Espresso Classique',
          price: 3.50,
          category: 'Cafés',
          imageUrl: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop'
        },
        quantity: 2,
        customizations: {},
        notes: 'Sans sucre'
      }
    ],
    orderType: 'pickup',
    status: 'preparing',
    scheduledTime: '10:30',
    paymentMethod: 'card',
    paymentStatus: 'paid',
    subtotal: 7.00,
    tax: 1.40,
    deliveryFee: 0,
    total: 8.40,
    estimatedReadyTime: '10:25',
    specialInstructions: 'Préparation rapide si possible',
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    orderNumber: 'WEB-002',
    customerInfo: {
      name: 'Thomas Petit',
      email: 'thomas.petit@email.com',
      phone: '+33645678901'
    },
    items: [
      {
        id: 2,
        menuItem: {
          id: 2,
          name: 'Latte Art',
          price: 4.80,
          category: 'Cafés',
          imageUrl: 'https://images.pexels.com/photos/851555/pexels-photo-851555.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop'
        },
        quantity: 1,
        customizations: { milk: 'avoine' },
        notes: 'Lait d\'avoine'
      },
      {
        id: 3,
        menuItem: {
          id: 10,
          name: 'Croissant Artisanal',
          price: 2.80,
          category: 'Pâtisseries',
          imageUrl: 'https://images.pexels.com/photos/2638026/pexels-photo-2638026.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop'
        },
        quantity: 1,
        customizations: {},
        notes: ''
      }
    ],
    orderType: 'delivery',
    status: 'confirmed',
    deliveryAddress: '789 Boulevard Saint-Germain, 75006 Paris',
    paymentMethod: 'mobile',
    paymentStatus: 'paid',
    subtotal: 7.60,
    tax: 1.52,
    deliveryFee: 2.50,
    total: 11.62,
    estimatedReadyTime: '11:15',
    createdAt: new Date().toISOString()
  }
];

// Get all online orders
onlineOrdersRouter.get('/', (req, res) => {
  res.json(onlineOrders);
});

// Create new online order
onlineOrdersRouter.post('/', (req, res) => {
  const newOrder = {
    id: onlineOrders.length + 1,
    orderNumber: `WEB-${(onlineOrders.length + 1).toString().padStart(3, '0')}`,
    ...req.body,
    status: req.body.status || 'pending',
    estimatedReadyTime: calculateEstimatedTime(req.body.items),
    createdAt: new Date().toISOString()
  };
  
  onlineOrders.push(newOrder);
  res.status(201).json(newOrder);
});

// Update online order status
onlineOrdersRouter.patch('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const order = onlineOrders.find(o => o.id === parseInt(id));
  if (!order) {
    return res.status(404).json({ message: 'Commande non trouvée' });
  }
  
  order.status = status;
  return res.json(order);
});

// Get order by ID
onlineOrdersRouter.get('/:id', (req, res) => {
  const { id } = req.params;
  const order = onlineOrders.find(o => o.id === parseInt(id));
  
  if (!order) {
    return res.status(404).json({ message: 'Commande non trouvée' });
  }
  
  return res.json(order);
});

// Delete online order
onlineOrdersRouter.delete('/:id', (req, res) => {
  const { id } = req.params;
  const orderIndex = onlineOrders.findIndex(o => o.id === parseInt(id));
  
  if (orderIndex === -1) {
    return res.status(404).json({ message: 'Commande non trouvée' });
  }
  
  onlineOrders.splice(orderIndex, 1);
  return res.status(204).send();
});

// Helper function to calculate estimated ready time
function calculateEstimatedTime(items: any[]): string {
  const totalPrepTime = items.reduce((total, item) => {
    return total + (item.menuItem.preparationTime || 10) * item.quantity;
  }, 0);
  
  const readyTime = new Date();
  readyTime.setMinutes(readyTime.getMinutes() + Math.min(totalPrepTime, 45)); // Max 45 min
  
  return readyTime.toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

export { onlineOrdersRouter };