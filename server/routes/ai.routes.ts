import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error-handler';
import { createLogger } from '../middleware/logging';
import { authenticateUser, requireRoles } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { getDb } from '../db';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { orders, customers, reservations } from '../../shared/schema';

const router = Router();
const logger = createLogger('AI_ROUTES');

// ==========================================
// TYPES ET INTERFACES
// ==========================================

interface ChatMessage {
  message: string;
  context?: Record<string, unknown>;
  sessionId?: string;
  userId?: string;
  timestamp: string;
}

interface VoiceCommand {
  audioData: string;
  language: string;
  userId?: string;
  confidence?: number;
}

interface AIReservationRequest {
  date: string;
  time: string;
  guests: number;
  preferences?: string;
  customerInfo?: {
    name: string;
    email: string;
    phone?: string;
  };
}

interface PredictionRequest {
  timeframe: 'daily' | 'weekly' | 'monthly';
  metrics?: string[];
  filters?: Record<string, unknown>;
}

interface AIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  fallback?: string;
  timestamp: string;
  confidence?: number;
}

interface SentimentAnalysisResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  keywords: string[];
  suggestions: string[];
}

interface AutomationSuggestion {
  id: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  implementation: string;
}

// ==========================================
// SCHÉMAS DE VALIDATION
// ==========================================

const ChatMessageSchema = z.object({
  message: z.string()
    .min(1, 'Message requis')
    .max(1000, 'Message trop long'),
  context: z.record(z.unknown()).optional(),
  sessionId: z.string().optional()
});

const VoiceCommandSchema = z.object({
  audioData: z.string().min(1, 'Données audio requises'),
  language: z.string().default('fr'),
  userId: z.string().optional()
});

const AIReservationSchema = z.object({
  date: z.string().datetime('Date invalide'),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format heure invalide (HH:MM)'),
  guests: z.number()
    .min(1, 'Nombre d\'invités minimum 1')
    .max(20, 'Nombre d\'invités maximum 20'),
  preferences: z.string().optional(),
  customerInfo: z.object({
    name: z.string().min(1, 'Nom requis'),
    email: z.string().email('Email invalide'),
    phone: z.string().optional()
  }).optional()
});

const PredictionQuerySchema = z.object({
  timeframe: z.enum(['daily', 'weekly', 'monthly']).default('weekly'),
  metrics: z.array(z.string()).optional(),
  filters: z.record(z.unknown()).optional()
});

const AutomationSuggestionSchema = z.object({
  category: z.enum(['operations', 'marketing', 'inventory', 'staffing']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional()
});

const SentimentAnalysisSchema = z.object({
  text: z.string()
    .min(1, 'Texte requis')
    .max(2000, 'Texte trop long'),
  source: z.enum(['review', 'feedback', 'comment']).default('review')
});

// ==========================================
// SERVICES MÉTIER
// ==========================================

class AIService {
  private static mockTranscripts = {
    fr: ['Je voudrais réserver une table', 'Quels sont vos horaires', 'Avez-vous du café'],
    en: ['I would like to make a reservation', 'What are your hours', 'Do you have coffee']
  };

  private static positiveWords = ['excellent', 'délicieux', 'parfait', 'génial', 'super', 'adorable'];
  private static negativeWords = ['mauvais', 'horrible', 'terrible', 'décevant', 'nul', 'dégueulasse'];

  static validateReservationDate(date: string, time: string): { isValid: boolean; error?: string } {
    const reservationDate = new Date(`${date}T${time}`);
    const now = new Date();

    if (reservationDate <= now) {
      return { isValid: false, error: 'La date de réservation doit être dans le futur' };
    }

    const timeParts = time?.split(':');
    const hours = parseInt(timeParts?.[0] || '0');
    if (hours < 7 || hours > 22) {
      return { isValid: false, error: 'Heures d\'ouverture: 7h-22h' };
    }

    return { isValid: true };
  }

  static async simulateSpeechToText(audioData: string, language: string): Promise<{ 
    transcript: string; 
    confidence: number 
  }> {
    const transcripts = this.mockTranscripts[language as keyof typeof this.mockTranscripts] || this.mockTranscripts.fr;
    const randomTranscript = transcripts[Math.floor(Math.random() * transcripts.length)];
    const confidence = 0.85 + Math.random() * 0.15;

    return {
      transcript: randomTranscript || 'Aucune transcription disponible',
      confidence: parseFloat(confidence.toFixed(2))
    };
  }

  static async checkTableAvailability(
    date: string, 
    time: string, 
    guests: number
  ): Promise<{ available: boolean; alternatives?: string[] }> {
    try {
      const db = await getDb();

      // Vérifier les réservations existantes
      const existingReservations = await db
      .select()
      .from(reservations)
      .where(
        and(
          eq(reservations.date, new Date(date)),
          eq(reservations.status, 'confirmed')
        )
      );

    const totalGuests = existingReservations.reduce((sum, r) => sum + r.partySize, 0);

      // Logique simplifiée de disponibilité
      const isWeekend = new Date(date).getDay() === 0 || new Date(date).getDay() === 6;
      const isPeakHour = time >= '19:00' && time <= '21:00';
      const capacity = isWeekend && isPeakHour ? 50 : 80;

      const available = (totalGuests + guests) <= capacity;

      if (!available) {
        const alternatives = ['18:00', '21:30', '22:00'];
        return { available: false, alternatives };
      }

      return { available: true };
    } catch (error) {
      logger.error('Erreur vérification disponibilité', { date, time, guests, error });
      return { available: false };
    }
  }

  static generateAutomationSuggestions(
    category?: string, 
    priority?: 'low' | 'medium' | 'high'
  ): AutomationSuggestion[] {
    const suggestions: AutomationSuggestion[] = [
      {
        id: 'auto-inventory',
        title: 'Gestion automatique des stocks',
        description: 'Commande automatique basée sur les ventes',
        impact: 'high',
        implementation: 'ML + API fournisseurs'
      },
      {
        id: 'auto-scheduling',
        title: 'Planification intelligente du personnel',
        description: 'Optimisation des horaires selon l\'affluence',
        impact: 'medium',
        implementation: 'Analytics + prédictions'
      },
      {
        id: 'auto-marketing',
        title: 'Campagnes marketing personnalisées',
        description: 'Emails et promotions ciblées',
        impact: 'medium',
        implementation: 'Segmentation clients + IA'
      }
    ];

    return suggestions
      .filter(s => !category || s.id.includes(category))
      .filter(s => !priority || s.impact === priority);
  }

  static analyzeSentiment(text: string): SentimentAnalysisResult {
    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (this.positiveWords.includes(word)) positiveCount++;
      if (this.negativeWords.includes(word)) negativeCount++;
    });

    const total = words.length;
    const positiveScore = positiveCount / total;
    const negativeScore = negativeCount / total;

    let sentiment: 'positive' | 'negative' | 'neutral';
    let score: number;

    if (positiveScore > negativeScore && positiveScore > 0.1) {
      sentiment = 'positive';
      score = positiveScore;
    } else if (negativeScore > positiveScore && negativeScore > 0.1) {
      sentiment = 'negative';
      score = negativeScore;
    } else {
      sentiment = 'neutral';
      score = 0.5;
    }

    return {
      sentiment,
      score: parseFloat(score.toFixed(2)),
      keywords: words.filter(word => 
        this.positiveWords.includes(word) || 
        this.negativeWords.includes(word)
      ),
      suggestions: sentiment === 'negative' ? [
        'Contacter le client pour résoudre le problème',
        'Former le personnel sur ce point',
        'Améliorer le processus concerné'
      ] : []
    };
  }

  static generateChatResponse(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('réserver')) {
      return "Bien sûr! Pour combien de personnes souhaitez-vous réserver?";
    } else if (lowerMessage.includes('menu')) {
      return "Nous avons un délicieux menu avec des cafés, pâtisseries et plats chauds. Que préférez-vous?";
    } else if (lowerMessage.includes('horaires')) {
      return "Nous sommes ouverts tous les jours de 7h à 22h.";
    }

    return "Je suis désolé, je n'ai pas compris votre demande.";
  }

  static generatePredictions(timeframe: string, metrics?: string[]) {
    const baseValues = {
      daily: { revenue: 1500, orders: 12, customers: 9 },
      weekly: { revenue: 15000, orders: 120, customers: 95 },
      monthly: { revenue: 60000, orders: 480, customers: 380 }
    };

    const base = baseValues[timeframe as keyof typeof baseValues] || baseValues.weekly;
    const selectedMetrics = metrics || ['revenue', 'orders'];

    const predictions = {
      timeframe,
      metrics: selectedMetrics,
      predictions: {} as Record<string, { current: number; predicted: number; confidence: number }>,
      insights: [
        `Augmentation prévue de 10% des ventes (${timeframe})`,
        'Pic d\'activité attendu entre 19h et 21h',
        'Recommandation: augmenter le stock de café'
      ]
    };

    selectedMetrics.forEach(metric => {
      const current = base[metric as keyof typeof base] || 0;
      const predicted = Math.round(current * (1.1 + Math.random() * 0.05));
      const confidence = 0.75 + Math.random() * 0.2;

      predictions.predictions[metric] = {
        current,
        predicted,
        confidence: parseFloat(confidence.toFixed(2))
      };
    });

    return predictions;
  }
}

// ==========================================
// ROUTES
// ==========================================

/**
 * @openapi
 * /ai/chat:
 *   post:
 *     summary: Chatbot IA
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatMessage'
 *     responses:
 *       200:
 *         description: Réponse du chatbot
 */
router.post('/chat', 
  authenticateUser,
  validateBody(ChatMessageSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { message, context, sessionId } = req.body;

    try {
      const response = AIService.generateChatResponse(message);

      const aiResponse: AIResponse<{ message: string }> = {
        success: true,
        data: { message: response },
        timestamp: new Date().toISOString(),
        confidence: 0.85
      };

      res.json(aiResponse);
      return;
    } catch (error) {
      logger.error('Erreur chatbot IA', { message, error });

      res.status(500).json({
        success: false,
        error: 'CHAT_ERROR',
        message: 'Erreur lors de la traitement de la demande',
        timestamp: new Date().toISOString()
      });
      return;
    }
  })
);

/**
 * @openapi
 * /ai/voice:
 *   post:
 *     summary: Traitement des commandes vocales
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VoiceCommand'
 *     responses:
 *       200:
 *         description: Réponse vocale générée
 */
router.post('/voice',
  authenticateUser,
  validateBody(VoiceCommandSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { audioData, language, userId } = req.body;

    try {
      const { transcript, confidence } = await AIService.simulateSpeechToText(audioData, language);
      const response = AIService.generateChatResponse(transcript);

      const aiResponse: AIResponse<{ 
        transcript: string;
        response: string;
        confidence: number;
      }> = {
        success: true,
        data: { transcript, response, confidence },
        timestamp: new Date().toISOString()
      };

      res.json(aiResponse);
    } catch (error) {
      logger.error('Erreur commandes vocales', { audioData, error });

      res.status(500).json({
        success: false,
        error: 'VOICE_PROCESSING_ERROR',
        message: 'Erreur lors du traitement de la commande vocale',
        timestamp: new Date().toISOString()
      });
    }
  })
);

/**
 * @openapi
 * /ai/reservation:
 *   post:
 *     summary: Réservation via IA
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AIReservation'
 *     responses:
 *       200:
 *         description: Réservation créée
 *       400:
 *         description: Données de réservation invalides
 *       409:
 *         description: Aucune disponibilité
 */
router.post('/reservation',
  authenticateUser,
  validateBody(AIReservationSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { date, time, guests, preferences, customerInfo } = req.body;

    try {
      const validation = AIService.validateReservationDate(date, time);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          error: 'INVALID_RESERVATION_DATE',
          message: validation.error,
          timestamp: new Date().toISOString()
        });
        return;
      }

      const availability = await AIService.checkTableAvailability(date, time, guests);
      if (!availability.available) {
        res.status(409).json({
          success: false,
          error: 'NO_AVAILABILITY',
          message: 'Aucune table disponible pour cette date/heure',
          alternatives: availability.alternatives,
          timestamp: new Date().toISOString()
        });
        return;
      }

      const db = await getDb();
      const reservation = await db.insert(reservations)
        .values({
          customerId: 1, // ID par défaut pour les réservations IA
          tableId: 1, // Table par défaut
          date: new Date(date),
          time: time,
          partySize: guests,
          status: 'confirmed' as const,
          specialRequests: preferences || '',
          notes: `Réservation créée par IA - ${customerInfo?.name || 'Client IA'}`
        })
        .returning();

      const aiResponse: AIResponse<NonNullable<typeof reservation[0]>> = {
        success: true,
        data: reservation[0]!,
        timestamp: new Date().toISOString(),
        confidence: 0.95
      };

      res.json(aiResponse);
    } catch (error) {
      logger.error('Erreur réservation IA', { date, time, guests, error });

      res.status(500).json({
        success: false,
        error: 'RESERVATION_ERROR',
        message: 'Erreur lors de la création de la réservation',
        timestamp: new Date().toISOString()
      });
    }
  })
);

/**
 * @openapi
 * /ai/predictions:
 *   get:
 *     summary: Prédictions et analytics
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *           default: weekly
 *       - in: query
 *         name: metrics
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *     responses:
 *       200:
 *         description: Prédictions générées
 */
router.get('/predictions',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  validateQuery(PredictionQuerySchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { timeframe, metrics } = req.query;

    try {
      const predictions = AIService.generatePredictions(timeframe as string, metrics as string[]);

      res.json({
        success: true,
        data: predictions,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Erreur prédictions IA', { timeframe, metrics, error });

      res.status(500).json({
        success: false,
        error: 'PREDICTION_ERROR',
        message: 'Erreur lors de la génération des prédictions',
        timestamp: new Date().toISOString()
      });
    }
  })
);

/**
 * @openapi
 * /ai/automation/suggestions:
 *   get:
 *     summary: Suggestions d'automatisation
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [operations, marketing, inventory, staffing]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *     responses:
 *       200:
 *         description: Suggestions générées
 */
router.get('/automation/suggestions',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  validateQuery(AutomationSuggestionSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { category, priority } = req.query;

    try {
      const categoryStr = Array.isArray(category) ? category[0] : category as string;
      const priorityStr = Array.isArray(priority) ? priority[0] : (priority as string || 'medium');
      const suggestions = AIService.generateAutomationSuggestions(categoryStr, priorityStr as 'low' | 'medium' | 'high');

      res.json({
        success: true,
        data: {
          suggestions,
          total: suggestions.length,
          category,
          priority
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Erreur suggestions automatisation', { category, priority, error });

      res.status(500).json({
        success: false,
        error: 'SUGGESTION_ERROR',
        message: 'Erreur lors de la génération des suggestions',
        timestamp: new Date().toISOString()
      });
    }
  })
);

/**
 * @openapi
 * /ai/sentiment-analysis:
 *   post:
 *     summary: Analyse de sentiment
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SentimentAnalysis'
 *     responses:
 *       200:
 *         description: Analyse effectuée
 */
router.post('/sentiment-analysis',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  validateBody(SentimentAnalysisSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { text, source } = req.body;

    try {
      const analysis = AIService.analyzeSentiment(text);

      res.json({
        success: true,
        data: {
          ...analysis,
          source,
          analyzedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Erreur analyse sentiment', { 
        text: text.substring(0, 100), 
        source, 
        error 
      });

      res.status(500).json({
        success: false,
        error: 'SENTIMENT_ANALYSIS_ERROR',
        message: 'Erreur lors de l\'analyse de sentiment',
        timestamp: new Date().toISOString()
      });
    }
  })
);

// GET /api/ai/voice-analysis - Simuler une analyse vocale
router.get('/voice-analysis', authenticateUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const { time } = req.query;

    if (!time || typeof time !== 'string') {
      res.status(400).json({ 
        success: false, 
        message: 'Paramètre time requis' 
      });
      return;
    }

    // Simulation de différents accents/dialectes
    const transcripts = [
      "Bonjour, je souhaiterais réserver une table pour deux personnes",
      "Good evening, I'd like a table for four please",
      "Buongiorno, vorrei prenotare un tavolo per tre persone",
      "Hola, ¿podría reservar una mesa para dos?",
      "Guten Tag, ich möchte einen Tisch für vier Personen reservieren"
    ];

    const timeParts = time.split(':');
    const hours = parseInt(timeParts[0] || '0');
    let randomTranscript: string;

    // Logique basée sur l'heure
    if (hours >= 18) {
      randomTranscript = transcripts[Math.floor(Math.random() * transcripts.length)] || transcripts[0] || 'Transcription par défaut';
    } else {
      randomTranscript = transcripts[0] || 'Transcription française par défaut'; // Français par défaut
    }

    const analysisResult = {
      transcript: randomTranscript || '',
      confidence: Math.random() * 0.3 + 0.7, // Entre 70% et 100%
    };

    res.json({
      success: true,
      data: analysisResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Erreur lors de l\'analyse vocale:', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'analyse vocale'
    });
  }
});


export default router;