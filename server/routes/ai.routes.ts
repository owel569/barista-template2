
import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Routes IA
router.get('/recommendations', authenticateToken, async (req, res) => {
  try {
    const recommendations = {
      menu: [
        { item: 'Latte Épicé', reason: 'Tendance saisonnière', confidence: 0.85 },
        { item: 'Croissant Amande', reason: 'Forte demande matinale', confidence: 0.78 }
      ],
      inventory: [
        { product: 'Grains Arabica', action: 'Réapprovisionner', urgency: 'high' },
        { product: 'Lait Bio', action: 'Stock optimal', urgency: 'low' }
      ],
      pricing: [
        { item: 'Cappuccino', suggestion: 'Augmenter de 0.20€', impact: '+12% revenus' }
      ]
    };
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la génération des recommandations IA' });
  }
});

router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    const response = {
      message: `Assistant IA: J'ai bien reçu votre message "${message}". Comment puis-je vous aider avec votre café ?`,
      suggestions: [
        'Voir les statistiques de vente',
        'Optimiser le menu',
        'Gérer les stocks'
      ]
    };
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Erreur du chatbot IA' });
  }
});

export default router;
