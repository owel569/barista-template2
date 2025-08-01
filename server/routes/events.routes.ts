
import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Routes événements et promotions
router.get('/', authenticateToken, async (req, res) => {
  try {
    const events = [
      {
        id: 1,
        title: 'Happy Hour Café',
        description: 'Tous les cafés à -30%',
        startDate: '2024-01-15T16:00:00Z',
        endDate: '2024-01-15T18:00:00Z',
        type: 'promotion',
        status: 'active'
      },
      {
        id: 2,
        title: 'Soirée Jazz',
        description: 'Concert de jazz avec dégustation',
        startDate: '2024-01-20T20:00:00Z',
        endDate: '2024-01-20T23:00:00Z',
        type: 'event',
        status: 'planned'
      }
    ];
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des événements' });
  }
});

router.post('/', authenticateToken, requireRole('manager'), async (req, res) => {
  try {
    const { title, description, startDate, endDate, type } = req.body;
    const newEvent = {
      id: Date.now(),
      title,
      description,
      startDate,
      endDate,
      type,
      status: 'planned',
      createdAt: new Date().toISOString()
    };
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création de l\'événement' });
  }
});

export default router;
