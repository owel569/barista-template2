import { Router } from 'express';

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

// Ajouter un article au menu (admin uniquement)
router.post('/', async (req, res) => {
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

// Mettre à jour un article du menu
router.put('/:id', async (req, res) => {
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

// Supprimer un article du menu
router.delete('/:id', async (req, res) => {
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

export default router;