
import { Router } from 'express';
import { authenticateUser, requireRoles } from '../middleware/auth';

const router = Router();

// Routes inventaire
router.get('/', authenticateUser, async (req, res) => {
  try {
    const inventory = [
      {
        id: 1,
        name: 'Grains de café Arabica',
        category: 'Matières premières',
        currentStock: 25,
        minStock: 10,
        maxStock: 100,
        unit: 'kg',
        price: 15.50,
        supplier: 'Café Premium SA'
      },
      {
        id: 2,
        name: 'Lait entier bio',
        category: 'Produits frais',
        currentStock: 8,
        minStock: 5,
        maxStock: 20,
        unit: 'L',
        price: 1.20,
        supplier: 'Ferme du Soleil'
      }
    ];
    res.json({
        success: true,
        data: inventory
      });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'inventaire' });
  }
});

router.post('/restock', authenticateUser, requireRoles(['gerant']), async (req, res) => {
  try {
    const { itemId, quantity } = req.body;
    const restockOrder = {
      id: Date.now(),
      itemId,
      quantity,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    res.status(201).json(restockOrder);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la commande de réapprovisionnement' });
  }
});

export default router;
