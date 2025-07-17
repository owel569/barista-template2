
import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { AIAutomationModule } from '../modules/ai-automation';
import { asyncHandler } from '../middleware/error-handler';

const router = Router();

// Routes du chatbot IA
router.post('/chat', authenticateToken, AIAutomationModule.processChatMessage);
router.post('/voice-command', authenticateToken, AIAutomationModule.processVoiceCommand);

// Routes de réservation automatique
router.post('/auto-reservation', authenticateToken, AIAutomationModule.processAutomaticReservation);

// Routes d'analyse prédictive (admin seulement)
router.get('/predictions', authenticateToken, requireRole('directeur'), AIAutomationModule.getPredictiveAnalytics);
router.get('/automation-suggestions', authenticateToken, requireRole('directeur'), AIAutomationModule.getAutomationSuggestions);

// Route pour les insights en temps réel
router.get('/real-time-insights', authenticateToken, requireRole('directeur'), asyncHandler(async (req, res) => {
  try {
    const insights = {
      currentCustomers: Math.floor(Math.random() * 50) + 10,
      waitTime: Math.floor(Math.random() * 15) + 5,
      popularItem: 'Cappuccino',
      revenue: (Math.random() * 1000 + 500).toFixed(2),
      alerts: [
        { type: 'stock', message: 'Stock de lait faible', severity: 'warning' },
        { type: 'staff', message: 'Rush hour - personnel supplémentaire recommandé', severity: 'info' }
      ],
      recommendations: [
        'Proposer une promotion sur les pâtisseries',
        'Préparer plus de cappuccinos',
        'Optimiser la disposition des tables'
      ]
    };
    
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des insights' });
  }
}));

// Route pour la génération de rapports IA
router.post('/generate-report', authenticateToken, requireRole('directeur'), asyncHandler(async (req, res) => {
  try {
    const { templateId, dateRange, fields, charts } = req.body;
    
    // Simulation de génération de rapport avec données réalistes
    const reportData = {
      id: `report_${Date.now()}`,
      templateId,
      generatedAt: new Date().toISOString(),
      dateRange,
      salesData: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
        revenue: Math.floor(Math.random() * 1000) + 500,
        orders: Math.floor(Math.random() * 100) + 50,
        customers: Math.floor(Math.random() * 80) + 40
      })),
      categoryData: [
        { name: 'Cafés', value: 45 },
        { name: 'Pâtisseries', value: 25 },
        { name: 'Sandwichs', value: 20 },
        { name: 'Boissons froides', value: 10 }
      ],
      metrics: {
        revenue: '€12,450',
        customers: '1,234',
        orders: '856',
        growth: '+15%'
      },
      aiInsights: [
        'Hausse significative des ventes de café le matin',
        'Opportunité d\'augmenter les prix des boissons froides',
        'Recommandation de réduire les portions de pâtisseries invendues'
      ]
    };
    
    res.json(reportData);
  } catch (error) {
    console.error('Erreur génération de rapport:', error);
    res.status(500).json({ error: 'Erreur lors de la génération du rapport' });
  }
}));

export default router;
