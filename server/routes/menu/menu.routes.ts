import { Router } from 'express';
import { requireRoleHierarchy } from '../../middleware/security';
import { validateBody } from '../../middleware/validation';
import { z } from 'zod';

// Schémas de validation pour le menu
const MenuItemSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  price: z.number().positive().max(1000),
  category: z.string().min(1).max(50),
  available: z.boolean().optional()
});

const MenuItemUpdateSchema = MenuItemSchema.partial();

const router = Router();

// Récupérer tout le menu
router.get('/', async (req, res) => {
  try {
    // TODO: Récupérer depuis la base de données
    const menu = [
      {
        id: '1',
        name: 'Espresso',
        description: 'Café espresso traditionnel',
        price: 2.50,
        category: 'Boissons chaudes',
        available: true
      },
      {
        id: '2',
        name: 'Cappuccino',
        description: 'Espresso avec mousse de lait',
        price: 3.50,
        category: 'Boissons chaudes',
        available: true
      },
      {
        id: '3',
        name: 'Croissant',
        description: 'Croissant frais du jour',
        price: 2.00,
        category: 'Viennoiseries',
        available: true
      }
    ];
    
    res.json({
      success: true,
      data: menu
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du menu'
    });
  }
});

// Récupérer un article du menu
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // TODO: Récupérer depuis la base de données
    const item = {
      id,
      name: 'Espresso',
      description: 'Café espresso traditionnel',
      price: 2.50,
      category: 'Boissons chaudes',
      available: true
    };
    
    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'article'
    });
  }
});

// Ajouter un article au menu - Seuls les managers+ peuvent ajouter
router.post('/', requireRoleHierarchy('manager'), validateBody(MenuItemSchema), async (req, res) => {
  try {
    const { name, description, price, category } = req.body;
    
    // TODO: Sauvegarder en base de données
    const newItem = {
      id: Date.now().toString(),
      name,
      description,
      price,
      category,
      available: true
    };
    
    res.status(201).json({
      success: true,
      message: 'Article ajouté au menu',
      data: newItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de l\'article'
    });
  }
});

// Mettre à jour un article du menu - Seuls les managers+ peuvent modifier
router.put('/:id', requireRoleHierarchy('manager'), validateBody(MenuItemUpdateSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // TODO: Mettre à jour en base de données
    
    res.json({
      success: true,
      message: 'Article mis à jour'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour'
    });
  }
});

// Supprimer un article du menu - Seuls les admins peuvent supprimer
router.delete('/:id', requireRoleHierarchy('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // TODO: Supprimer de la base de données
    
    res.json({
      success: true,
      message: 'Article supprimé du menu'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression'
    });
  }
});

// Récupérer les catégories du menu
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      {
        id: '1',
        name: 'Boissons chaudes',
        description: 'Cafés, thés et chocolats chauds',
        items: [
          { id: '1', name: 'Espresso', price: 2.50 },
          { id: '2', name: 'Cappuccino', price: 3.50 },
          { id: '3', name: 'Latte', price: 4.00 }
        ]
      },
      {
        id: '2', 
        name: 'Viennoiseries',
        description: 'Pâtisseries et viennoiseries fraîches',
        items: [
          { id: '4', name: 'Croissant', price: 2.00 },
          { id: '5', name: 'Pain au chocolat', price: 2.50 }
        ]
      },
      {
        id: '3',
        name: 'Boissons froides', 
        description: 'Boissons glacées et rafraîchissantes',
        items: [
          { id: '6', name: 'Frappuccino', price: 4.50 },
          { id: '7', name: 'Thé glacé', price: 3.00 }
        ]
      }
    ];
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des catégories'
    });
  }
});

export default router;