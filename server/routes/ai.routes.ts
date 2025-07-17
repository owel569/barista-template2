
import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';
import { asyncHandler } from '../middleware/error-handler';
import { aiService } from '../services/ai-automation.service';
import { z } from 'zod';

// Schémas de validation pour l'API (couche 1)
const ChatRequestSchema = z.object({
  message: z.string().min(1, 'Message requis'),
  context: z.any().optional(),
  sessionId: z.string().optional()
});

const VoiceRequestSchema = z.object({
  audioData: z.string().min(1, 'Données audio requises'),
  language: z.string().default('fr-FR')
});

const ReservationRequestSchema = z.object({
  date: z.string().min(1, 'Date requise'),
  time: z.string().min(1, 'Heure requise'),
  guests: z.number().min(1).max(20, 'Maximum 20 personnes'),
  preferences: z.string().optional()
});

const PredictionQuerySchema = z.object({
  timeframe: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  metrics: z.array(z.string()).optional()
});

const router = Router();

/**
 * Routes du Chatbot IA (couche 1 - Interface Express)
 * Validation + Délégation au service IA
 */

// Chat conversationnel
router.post('/chat', 
  authenticateToken, 
  validateBody(ChatRequestSchema),
  asyncHandler(async (req, res) => {
    const { message, context, sessionId } = req.body;
    const userId = (req as any).user?.id?.toString();
    
    try {
      const response = await aiService.processChatMessage({
        message,
        context,
        sessionId: sessionId || userId,
        userId
      });
      
      res.json({
        success: true,
        data: response,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erreur chat AI:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur du service de chat IA',
        fallback: 'Désolé, je rencontre des difficultés. Un employé peut-il vous aider ?'
      });
    }
  })
);

// Commandes vocales
router.post('/voice-command',
  authenticateToken,
  validateBody(VoiceRequestSchema),
  asyncHandler(async (req, res) => {
    const { audioData, language } = req.body;
    const userId = (req as any).user?.id?.toString();
    
    try {
      // Simulation de reconnaissance vocale (à remplacer par un vrai service)
      const transcript = await simulateSpeechToText(audioData, language);
      
      // Traitement du transcript comme un message chat
      const chatResponse = await aiService.processChatMessage({
        message: transcript,
        userId,
        context: { source: 'voice', language }
      });
      
      res.json({
        success: true,
        transcript,
        response: chatResponse,
        confidence: 0.85
      });
    } catch (error) {
      console.error('Erreur reconnaissance vocale:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur de reconnaissance vocale'
      });
    }
  })
);

// Réservations automatisées
router.post('/auto-reservation',
  authenticateToken,
  validateBody(ReservationRequestSchema),
  asyncHandler(async (req, res) => {
    const { date, time, guests, preferences } = req.body;
    const userId = (req as any).user?.id?.toString();
    
    try {
      // Vérification de disponibilité
      const availability = await checkTableAvailability(date, time, guests);
      
      if (availability.available) {
        // Création de la réservation via le service IA
        const reservation = await createAIReservation({
          date, time, guests, preferences,
          userId,
          source: 'ai_assistant'
        });
        
        res.json({
          success: true,
          reservation,
          message: `Réservation confirmée pour ${guests} personnes le ${date} à ${time}`,
          confirmationNumber: reservation.id
        });
      } else {
        // Suggestions d'alternatives
        const alternatives = await generateAlternativeSlots(date, time, guests);
        res.json({
          success: false,
          message: 'Créneau non disponible',
          alternatives,
          suggestions: alternatives.map(alt => 
            `${alt.date} à ${alt.time} (${alt.available ? 'Disponible' : 'Complet'})`
          )
        });
      }
    } catch (error) {
      console.error('Erreur réservation automatique:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la réservation automatique'
      });
    }
  })
);

// Analyses prédictives (admin seulement)
router.get('/predictions',
  authenticateToken,
  requireRole('directeur'),
  validateQuery(PredictionQuerySchema),
  asyncHandler(async (req, res) => {
    const { timeframe, metrics } = req.query;
    
    try {
      const predictions = await aiService.generatePredictiveAnalytics({
        timeframe: timeframe as any,
        metrics: metrics as string[]
      });
      
      res.json({
        success: true,
        data: predictions,
        metadata: {
          generatedBy: 'ai-service',
          requestedBy: (req as any).user?.username,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Erreur prédictions IA:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur de génération des prédictions'
      });
    }
  })
);

// Suggestions d'automatisation
router.get('/automation-suggestions',
  authenticateToken,
  requireRole('directeur'),
  asyncHandler(async (req, res) => {
    try {
      const suggestions = await generateAutomationSuggestions();
      
      res.json({
        success: true,
        data: suggestions,
        appliedCount: 0,
        pendingCount: suggestions.length
      });
    } catch (error) {
      console.error('Erreur suggestions automatisation:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur de génération de suggestions'
      });
    }
  })
);

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

// === FONCTIONS UTILITAIRES ===

async function simulateSpeechToText(audioData: string, language: string): Promise<string> {
  // Simulation de reconnaissance vocale (à remplacer par Google Speech-to-Text, Azure, etc.)
  const phrases = [
    'Je voudrais commander un cappuccino s\'il vous plaît',
    'Avez-vous une table libre pour ce soir ?',
    'Quel est le prix du latte ?',
    'Je voudrais réserver pour quatre personnes',
    'Quels sont vos horaires d\'ouverture ?',
    'Où puis-je me garer ?',
    'Avez-vous le WiFi ?'
  ];
  
  // Simulation d'un délai de traitement
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return phrases[Math.floor(Math.random() * phrases.length)];
}

async function checkTableAvailability(date: string, time: string, guests: number) {
  // TODO: Intégrer avec le système de réservation existant
  const isWeekend = new Date(date).getDay() === 0 || new Date(date).getDay() === 6;
  const hour = parseInt(time.split(':')[0]);
  
  // Simulation de logique de disponibilité
  const available = !isWeekend && (hour < 12 || hour > 14) && (hour < 19 || hour > 21);
  
  return {
    available,
    reason: available ? null : 'Heure de pointe - toutes les tables occupées',
    alternativeSlots: available ? [] : [
      { date, time: '15:30', available: true },
      { date, time: '16:00', available: true }
    ]
  };
}

async function createAIReservation(data: any) {
  // TODO: Intégrer avec le storage existant
  return {
    id: `AI-RES-${Date.now()}`,
    ...data,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
    aiGenerated: true
  };
}

async function generateAlternativeSlots(date: string, time: string, guests: number) {
  return [
    { date, time: '15:30', available: true, capacity: 4 },
    { date, time: '16:00', available: true, capacity: 6 },
    { 
      date: new Date(new Date(date).getTime() + 86400000).toISOString().split('T')[0], 
      time, 
      available: true, 
      capacity: 8 
    }
  ];
}

async function generateAutomationSuggestions() {
  return {
    menu: {
      recommendations: [
        'Ajouter des options véganes - demande en hausse de 25%',
        'Créer un menu du jour avec rotation hebdomadaire',
        'Introduire des smoothies pour l\'été'
      ],
      pricingAdjustments: [
        { item: 'Cappuccino', currentPrice: 4.50, suggestedPrice: 4.80, reason: 'Alignement marché' },
        { item: 'Croissant', currentPrice: 2.50, suggestedPrice: 2.70, reason: 'Coût matières premières' }
      ]
    },
    operations: {
      staffOptimization: 'Réduire les effectifs de 30% entre 15h-17h',
      inventoryManagement: 'Activer la commande automatique pour le lait et café',
      wasteReduction: 'Réduire de 15% les commandes de pâtisseries le lundi'
    },
    marketing: {
      dynamicPricing: 'Activer les prix dynamiques pour les heures creuses (-10%)',
      loyaltyProgram: 'Proposer une carte fidélité - ROI estimé +22%',
      promotions: 'Offre "Happy Hour" 15h-17h recommandée'
    }
  };
}

export default router;
