
import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Routes feedback client
router.get('/', authenticateToken, async (req, res) => {
  try {
    const feedback = [
      {
        id: 1,
        customerId: 123,
        customerName: 'Marie Dubois',
        rating: 5,
        comment: 'Excellent service et café délicieux !',
        category: 'service',
        date: '2024-01-10T14:30:00Z',
        status: 'reviewed'
      },
      {
        id: 2,
        customerId: 456,
        customerName: 'Pierre Martin',
        rating: 4,
        comment: 'Bon café mais attente un peu longue',
        category: 'service',
        date: '2024-01-10T16:15:00Z',
        status: 'pending'
      }
    ];
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des commentaires' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { rating, comment, category, customerName } = req.body;
    const newFeedback = {
      id: Date.now(),
      rating,
      comment,
      category,
      customerName,
      date: new Date().toISOString(),
      status: 'pending'
    };
    res.status(201).json(newFeedback);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'envoi du commentaire' });
  }
});

// Route pour créer un feedback
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { rating, comment, category, orderId, customerId } = req.body;
    
    const feedback = {
      id: Date.now(),
      rating: parseInt(rating),
      comment,
      category,
      orderId: orderId ? parseInt(orderId) : null,
      customerId: customerId ? parseInt(customerId) : null,
      status: 'new',
      createdAt: new Date().toISOString(),
      response: null,
      respondedAt: null
    };

    res.status(201).json(feedback);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création du feedback' });
  }
});

// Route pour répondre à un feedback
router.put('/:id/response', authenticateToken, requireRole('manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body;
    
    const updatedFeedback = {
      id: parseInt(id),
      response,
      respondedAt: new Date().toISOString(),
      status: 'responded'
    };

    res.json(updatedFeedback);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la réponse au feedback' });
  }
});

// Route pour statistiques de satisfaction
router.get('/satisfaction-stats', authenticateToken, async (req, res) => {
  try {
    const stats = {
      averageRating: 4.2,
      totalFeedbacks: 245,
      satisfactionRate: 85.7,
      responseRate: 92.3,
      ratingDistribution: {
        5: 120,
        4: 85,
        3: 25,
        2: 10,
        1: 5
      },
      categoryBreakdown: {
        service: { average: 4.3, count: 98 },
        quality: { average: 4.1, count: 87 },
        ambiance: { average: 4.4, count: 60 }
      },
      trendsData: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        rating: (Math.random() * 2 + 3).toFixed(1)
      }))
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

export default router;
