import { Router } from 'express';
import { requireRoleHierarchy, OrderSchema } from '../../middleware/security';
import { validateBody } from '../../middleware/validation';
import { z } from 'zod';

const router = Router();

// Schémas de validation spécifiques aux commandes
const OrderStatusSchema = z.object({
  status: z.enum(['en_attente', 'en_preparation', 'pret', 'livre', 'annule'])
});

const OrderQuerySchema = z.object({
  status: z.enum(['en_attente', 'en_preparation', 'pret', 'livre', 'annule']).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.string().regex(/^\d+$/).transform(val => parseInt(val)).optional()
});

// Récupérer toutes les commandes - Employees+ peuvent voir
router.get('/', requireRoleHierarchy('employee'), async (req, res) => {
  try {
    // TODO: Récupérer depuis la base de données
    const orders = [
      {
        id: '1',
        customerName: 'Jean Dupont',
        items: [
          { name: 'Espresso', quantity: 2, price: 2.50 },
          { name: 'Croissant', quantity: 1, price: 2.00 }
        ],
        total: 7.00,
        status: 'en_preparation',
        createdAt: new Date().toISOString()
      }
    ];
    
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des commandes'
    });
  }
});

// Créer une nouvelle commande - Validation stricte des données
router.post('/', validateBody(OrderSchema), async (req, res) => {
  try {
    const { customerName, items, notes } = req.body;
    
    // Calculer le total
    const total = items.reduce((sum: number, item: any) => 
      sum + (item.price * item.quantity), 0
    );
    
    const newOrder = {
      id: Date.now().toString(),
      customerName,
      items,
      notes,
      total,
      status: 'en_attente',
      createdAt: new Date().toISOString()
    };
    
    // TODO: Sauvegarder en base de données
    
    res.status(201).json({
      success: true,
      message: 'Commande créée',
      data: newOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la commande'
    });
  }
});

// Mettre à jour le statut d'une commande - Seuls employees+ peuvent modifier
router.patch('/:id/status', requireRoleHierarchy('employee'), validateBody(OrderStatusSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // TODO: Mettre à jour en base de données
    
    res.json({
      success: true,
      message: 'Statut de commande mis à jour'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut'
    });
  }
});

// Récupérer une commande spécifique - Employees+ peuvent consulter
router.get('/:id', requireRoleHierarchy('employee'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // TODO: Récupérer depuis la base de données
    const order = {
      id,
      customerName: 'Jean Dupont',
      items: [
        { name: 'Espresso', quantity: 2, price: 2.50 }
      ],
      total: 5.00,
      status: 'en_preparation',
      createdAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la commande'
    });
  }
});

export default router;