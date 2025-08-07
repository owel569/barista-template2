import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error-handler';
import { createLogger } from '../middleware/logging';
import { authenticateUser, requireRoles } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { getDb } from '../db';
import { orders, customers, reservations } from '../../shared/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

const router = Router();
const logger = createLogger('AI_ROUTES');

// ==========================================
// TYPES ET INTERFACES
// ==========================================

export interface ChatMessage {
  message: string;
  context?: Record<string, unknown>;
  sessionId?: string;
  userId?: string;
  timestamp: string;
}

export interface VoiceCommand {
  audioData: string;
  language: string;
  userId?: string;
  confidence?: number;
}

export interface AIReservationRequest {
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

export interface PredictionRequest {
  timeframe: 'daily' | 'weekly' | 'monthly';
  metrics?: string[];
  filters?: Record<string, unknown>;
}

export interface AIResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  fallback?: string;
  timestamp: string;
  confidence?: number;
}

export interface SentimentAnalysisResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  keywords: string[];
  suggestions: string[];
}

// ==========================================
// SCHÉMAS DE VALIDATION ZOD
// ==========================================

const ChatMessageSchema = z.object({
  message: z.string()}).min(1, 'Message requis').max(1000, 'Message trop long'),
  context: z.record(z.unknown()).optional(),
  sessionId: z.string().optional()
});

const VoiceCommandSchema = z.object({
  audioData: z.string()}).min(1, 'Données audio requises'),
  language: z.string().default('fr'),
  userId: z.string().optional()
});

const AIReservationSchema = z.object({
  date: z.string()}).datetime('Date invalide'),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format heure invalide (HH:MM)'),
  guests: z.number().min(1, 'Nombre d\'invités minimum 1').max(20, 'Nombre d\'invités maximum 20'),
  preferences: z.string().optional(),
  customerInfo: z.object({
    name: z.string()}).min(1, 'Nom requis'),
    email: z.string().email('Email invalide'),
    phone: z.string().optional()
  }).optional()
});

const PredictionQuerySchema = z.object({
  timeframe: z.enum(['daily', 'weekly', 'monthly'])}).default('weekly'),
  metrics: z.array(z.string()).optional(),
  filters: z.record(z.unknown()).optional()
});

const AutomationSuggestionSchema = z.object({
  category: z.enum(['operations', 'marketing', 'inventory', 'staffing'])}).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional()
});

// ==========================================
// SERVICES MÉTIER
// ==========================================

class AIServiceUtils {
  /**
   * Valide une date de réservation
   */
  static validateReservationDate(date: string, time: string): { isValid: boolean; error?: string } {
    const reservationDate = new Date(`${date)}T${time}`);
    const now = new Date();
    
    if (reservationDate <= now) {
      return { isValid: false, error: 'La date de réservation doit être dans le futur' };
    }
    
    const hours = parseInt(time.split(':')[0]);
    if (hours < 7 || hours > 22) {
      return { isValid: false, error: 'Heures d\'ouverture: 7h-22h' };
    }
    
    return { isValid: true };
  }

  /**
   * Simule la conversion audio vers texte
   */
  static async simulateSpeechToText(audioData: string, language: string): Promise<{ transcript: string; confidence: number }> {
    // TODO: Implémenter la vraie conversion audio
    const mockTranscripts = {
      fr: ['Je voudrais réserver une table', 'Quels sont vos horaires', 'Avez-vous du café'],
      en: ['I would like to make a reservation', 'What are your hours', 'Do you have coffee']
    };
    
    const transcripts = mockTranscripts[language as keyof typeof mockTranscripts] || mockTranscripts.fr;
    const randomTranscript = transcripts[Math.floor(Math.random() * transcripts.length)];
    const confidence = 0.85 + Math.random() * 0.15;
    
    return {
      transcript: randomTranscript,
      confidence: Math.round(confidence * 100) / 100
    };
  }

  /**
   * Vérifie la disponibilité des tables
   */
  static async checkTableAvailability(date: string, time: string, guests: number): Promise<{ available: boolean; alternatives?: string[] }> {
    try {
      // TODO: Implémenter la vraie logique de vérification avec Drizzle
      // Pour l'instant, simulation basique
      const isWeekend = new Date(date).getDay() === 0 || new Date(date).getDay() === 6;
      const isPeakHour = time >= '19:00' && time <= '21:00';
      
      if (isWeekend && isPeakHour && guests > 6) {
        return { 
          available: false, 
          alternatives: ['18:00', '21:30', '22:00'] 
        };
      }
      
      return { available: true };
    } catch (error) {
      logger.error('Erreur vérification disponibilité', { 
        date, 
        time, 
        guests, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      )});
      return { available: false };
    }
  }

  /**
   * Génère des suggestions d'automatisation
   */
  static generateAutomationSuggestions(category?: string): Array<{ 
    id: string; 
    title: string; 
    description: string; 
    impact: 'low' | 'medium' | 'high'; 
    implementation: string 
  }> {
    const suggestions = [
      {
        id: 'auto-inventory',
        title: 'Gestion automatique des stocks',
        description: 'Commande automatique basée sur les ventes',
        impact: 'high' as const,
        implementation: 'ML + API fournisseurs'
      },
      {
        id: 'auto-scheduling',
        title: 'Planification intelligente du personnel',
        description: 'Optimisation des horaires selon l\'affluence',
        impact: 'medium' as const,
        implementation: 'Analytics + prédictions'
      },
      {
        id: 'auto-marketing',
        title: 'Campagnes marketing personnalisées',
        description: 'Emails et promotions ciblées',
        impact: 'medium' as const,
        implementation: 'Segmentation clients + IA'
      }
    ];

    if (category) {
      return suggestions.filter(s => s.id.includes(category));
    }

    return suggestions;
  }

  /**
   * Analyse le sentiment d'un texte
   */
  static analyzeSentiment(text: string): SentimentAnalysisResult {
    const positiveWords = ['excellent', 'délicieux', 'parfait', 'génial', 'super', 'adorable'];
    const negativeWords = ['mauvais', 'horrible', 'terrible', 'décevant', 'nul', 'dégueulasse'];
    
    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word})) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
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
      score: Math.round(score * 100) / 100,
      keywords: words.filter(word => positiveWords.includes(word) || negativeWords.includes(word)),
      suggestions: sentiment === 'negative' ? [
        'Contacter le client pour résoudre le problème',
        'Former le personnel sur ce point',
        'Améliorer le processus concerné'
      ] : []
    };
  }
}

// ==========================================
// ROUTES AVEC AUTHENTIFICATION ET VALIDATION
// ==========================================

// Chatbot IA
router.post('/chat', 
  authenticateUser,
  validateBody(ChatMessageSchema),
  asyncHandler(async (req, res) => {
    const { message, context, sessionId } = req.body;
    
    try {
      let response = "Je suis désolé, je n'ai pas compris votre demande.";

      if (message.toLowerCase().includes('réserver')) {
        response = "Bien sûr! Pour combien de personnes souhaitez-vous réserver?";
      } else if (message.toLowerCase().includes('menu')) {
        response = "Nous avons un délicieux menu avec des cafés, pâtisseries et plats chauds. Que préférez-vous?";
      } else if (message.toLowerCase().includes('horaires')) {
        response = "Nous sommes ouverts tous les jours de 7h à 22h.";
      }

      const aiResponse: AIResponse = {
        success: true,
        data: { message: response },
        timestamp: new Date().toISOString(),
        confidence: 0.85
      };

      res.json(aiResponse);
    } catch (error) {
      logger.error('Erreur chatbot IA', { 
        message, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      )});
      res.status(500).json({
        success: false,
        message: 'Erreur lors du traitement de la demande' 
      });
    }
  })
);

// Commandes vocales
router.post('/voice',
  authenticateUser,
  validateBody(VoiceCommandSchema),
  asyncHandler(async (req, res) => {
    const { audioData, language, userId } = req.body;
    
    try {
      const { transcript, confidence } = await AIServiceUtils.simulateSpeechToText(audioData, language);
      
      let response = "Je n'ai pas compris votre commande vocale.";
      
      if (transcript.toLowerCase().includes('réserver')) {
        response = "Je vais vous aider à faire une réservation. Combien de personnes?";
      } else if (transcript.toLowerCase().includes('menu')) {
        response = "Voici notre menu du jour. Que souhaitez-vous commander?";
      }

      const aiResponse: AIResponse = {
        success: true,
        data: { 
        transcript,
          response,
          confidence
        },
        timestamp: new Date().toISOString()
      };

      res.json(aiResponse);
    } catch (error) {
      logger.error('Erreur commandes vocales', { 
        audioData, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      )});
      res.status(500).json({
        success: false,
        message: 'Erreur lors du traitement de la commande vocale' 
      });
    }
  })
);

// Réservation IA
router.post('/reservation',
  authenticateUser,
  validateBody(AIReservationSchema),
  asyncHandler(async (req, res) => {
    const { date, time, guests, preferences, customerInfo } = req.body;
    
    try {
      // Valider la date et l'heure
      const validation = AIServiceUtils.validateReservationDate(date, time);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.error
        });
      }

      // Vérifier la disponibilité
      const availability = await AIServiceUtils.checkTableAvailability(date, time, guests);
      if (!availability.available) {
        return res.status(409).json({
          success: false,
          message: 'Aucune table disponible pour cette date/heure',
          alternatives: availability.alternatives
        });
      }

      // TODO: Créer la vraie réservation en base
      const reservation = {
        id: Date.now(),
        date,
        time,
        guests,
        preferences,
        customerInfo,
        status: 'confirmed',
        createdAt: new Date().toISOString()
      };

      const aiResponse: AIResponse = {
        success: true,
        data: reservation,
        timestamp: new Date().toISOString(),
        confidence: 0.95
      };

      res.json(aiResponse);
    } catch (error) {
      logger.error('Erreur réservation IA', { 
        date, 
        time, 
        guests, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      )});
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la réservation IA' 
      });
    }
  })
);

// Prédictions et analytics
router.get('/predictions',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  validateQuery(PredictionQuerySchema),
  asyncHandler(async (req, res) => {
    const { timeframe, metrics, filters } = req.query as {
      timeframe: string;
      metrics?: string[];
      filters?: Record<string, unknown>;
    };
    
    try {
      // TODO: Implémenter les vraies prédictions avec ML
      const predictions = {
        timeframe,
        metrics: metrics || ['revenue', 'orders'],
        predictions: {
          revenue: { current: 15000, predicted: 16500, confidence: 0.85 },
          orders: { current: 120, predicted: 135, confidence: 0.78 },
          customers: { current: 95, predicted: 108, confidence: 0.82 }
        },
        insights: [
          'Augmentation prévue de 10% des ventes',
          'Pic d\'activité attendu entre 19h et 21h',
          'Recommandation: augmenter le stock de café'
        ]
      };

      res.json({
        success: true,
        data: predictions,
        timestamp: new Date()}).toISOString()
      });
    } catch (error) {
      logger.error('Erreur prédictions IA', { 
        timeframe, 
        metrics, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      )});
      
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la génération des prédictions',
        timestamp: new Date()}).toISOString()
      });
    }
  })
);

// Suggestions d'automatisation
router.get('/automation/suggestions',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  validateQuery(AutomationSuggestionSchema),
  asyncHandler(async (req, res) => {
    const { category, priority } = req.query as {
      category?: string;
      priority?: string;
    };
    
    try {
      const suggestions = AIServiceUtils.generateAutomationSuggestions(category);
      
      let filteredSuggestions = suggestions;
      if (priority) {
        filteredSuggestions = suggestions.filter(s => s.impact === priority);
      }

      res.json({
        success: true,
        data: {
          suggestions: filteredSuggestions,
          total: filteredSuggestions.length,
          category,
          priority
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Erreur suggestions automatisation', { 
        category, 
        priority, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      )});
      
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la génération des suggestions',
        timestamp: new Date()}).toISOString()
      });
    }
  })
);

// Analyse de sentiment des avis
router.post('/sentiment-analysis',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  validateBody(z.object({
    text: z.string()}).min(1, 'Texte requis').max(2000, 'Texte trop long'),
    source: z.enum(['review', 'feedback', 'comment']).default('review')
  })),
  asyncHandler(async (req, res) => {
    const { text, source } = req.body;
    
    try {
      const analysis = AIServiceUtils.analyzeSentiment(text);
      
      res.json({
        success: true,
        data: {
          ...analysis,
          source,
          analyzedAt: new Date(}).toISOString()
        }
      });
  } catch (error) {
      logger.error('Erreur analyse sentiment', { 
        text: text.substring(0, 100)}), 
        source, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      });
      
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'analyse de sentiment'
      });
    }
  })
);

export default router;