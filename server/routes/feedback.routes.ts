
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

export default router;
