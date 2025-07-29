import { z } from 'zod';''
// import { getDb } from '''../db'; // inutilisé ici''
// import { menuItems } from '''@shared/schema'; // inutilisé ici
// Si vous voyez une erreur sur LRUCache, installez les types : npm i --save-dev @types/lru-cache''
import { LRUCache } from '''lru-cache';
// Si vous voyez une erreur sur metricsCollector, créez src/services/metrics.ts comme proposé dans les annexes''
import { metricsCollector } from '''../middleware/metrics';

// Configuration des caches
const SESSION_CACHE_CONFIG = {
  max: 100, // 100 sessions maximum''
  ttl: 1000 * 60 * 30, // 30 minutes d'''inactivité
};

const KEYWORD_CACHE_CONFIG = {
  max: 500, // 500 items maximum
};

// Schémas de validation améliorés
const ChatContextSchema = z.object({
  message: z.string().min(1).max(500).transform(sanitizeInput),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  context: z.record(z.unknown()).optional()
});

const VoiceAnalysisSchema = z.object({
  audioData: z.string(),'
  language: z.string().default(''fr-FR'''),
  userId: z.string().optional()
});

const PredictionContextSchema = z.object({'
  timeframe: z.enum([''daily''', 'weekly''', ''monthly''']).default('daily'''),
  metrics: z.array(z.string()).optional()
});

// Base de connaissances externalisée dans la classe
const CAFE_KNOWLEDGE = {
  menu: {''
    'cappuccino''': { price: 4.50, description: ''Café espresso avec mousse de lait onctueuse''', category: 'boissons-chaudes''' },''
    'latte''': { price: 5.00, description: ''Café au lait avec art latte''', category: 'boissons-chaudes''' },''
    'americano''': { price: 3.50, description: ''Espresso allongé à l'''eau chaude', category: '''boissons-chaudes'' },'
    '''croissant'': { price: 2.50, description: '''Viennoiserie française traditionnelle', category: '''patisseries'' },'
    '''muffin'': { price: 3.00, description: '''Muffin aux myrtilles fait maison', category: '''patisseries'' },'
    '''sandwich-jambon'': { price: 6.50, description: '''Sandwich jambon beurre sur pain frais', category: '''plats'' }
  },
  horaires: {'
    '''lundi'': '''7h00 - 19h00', '''mardi'': '''7h00 - 19h00', '''mercredi'': '''7h00 - 19h00',''
    '''jeudi': '''7h00 - 19h00'', '''vendredi': '''7h00 - 20h00'', '''samedi': '''8h00 - 20h00'', '''dimanche': '''8h00 - 18h00''
  },
  services: {'
    '''wifi'': '''WiFi gratuit disponible - mot de passe: CafeBarista2024',''
    '''parking': '''Parking gratuit disponible derrière le café'','
    '''groupes'': '''Nous acceptons les groupes jusqu'à 15 personnes avec réservation''',''
    'livraison''': ''Livraison disponible dans un rayon de 5km''','
    ''fidélité''': 'Programme de fidélité : 10ème café offert'''
  },
  promotions: {''
    'happy-hour''': ''Happy Hour 15h-17h : -20% sur les boissons''','
    ''menu-dejeuner''': 'Menu déjeuner 12h-14h : plat + boisson = 9€''',''
    'weekend''': ''Weekend : brunch spécial 9h-12h'''
  }
};

// Helper functions
function sanitizeInput(input: string): string {'
  return input.replace(/[<>]/g, '').trim();
}

function logInteraction(type: string, data: Record<string, unknown>) {
  console.log(`[${new Date().toISOString()}] ${type}:`, data);
  // Utilisation adaptée à MetricsCollector (API probable : recordRequest)'
  if (typeof metricsCollector.recordRequest === '''function'') {'
    metricsCollector.recordRequest('''AI'', type, 200, 0); // méthode, route, status, duration (dummy)
  }
}

/**'
 * Service central d'''Intelligence Artificielle pour Barista Café
 * Version améliorée avec gestion de cache, meilleure performance et sécurité modérée
 */
export class AIAutomationService {
  private static instance: AIAutomationService;
  private chatSessions: LRUCache<string, Array<ChatInteraction>>;
  private keywordCache: LRUCache<string, number>;
  private intentMatchers: IntentMatcher[] = [];

  private constructor() {
    this.chatSessions = new LRUCache(SESSION_CACHE_CONFIG);
    this.keywordCache = new LRUCache(KEYWORD_CACHE_CONFIG);
    this.initializeIntentMatchers();
  }

  static getInstance(): AIAutomationService {
    if (!AIAutomationService.instance) {
      AIAutomationService.instance = new AIAutomationService();
    }
    return AIAutomationService.instance;
  }

  private initializeIntentMatchers() {
    this.intentMatchers = [
      {''
        name: 'menu''',''
        keywords: new Set(['menu''', ''carte''', 'plat''', ''boisson''', 'manger''', ''boire''', 'prix''', ''coût''']),
        handler: this.generateMenuResponse.bind(this)
      },
      {'
        name: ''reservation''','
        keywords: new Set([''réserver''', 'table''', ''places''', 'réservation''', ''libre''', 'disponible''']),
        handler: this.generateReservationResponse.bind(this)
      },
      {''
        name: 'commande''',''
        keywords: new Set(['commander''', ''prendre''', 'voudrais''', ''acheter''', 'cappuccino''', ''café''']),
        handler: this.generateOrderResponse.bind(this)
      },
      {'
        name: ''horaires''','
        keywords: new Set([''horaires''', 'ouvert''', ''fermé''', 'heure''', ''quand''']),
        handler: this.generateHoursResponse.bind(this)
      },
      {'
        name: ''services''','
        keywords: new Set([''wifi''', 'parking''', ''livraison''', 'groupe''', ''fidélité''']),
        handler: this.generateServicesResponse.bind(this)
      },
      {'
        name: ''promotions''','
        keywords: new Set([''promotion''', 'offre''', ''réduction''', 'prix''', ''happy''', 'menu''']),
        handler: this.generatePromotionsResponse.bind(this)
      }
    ];
  }

  // === CHAT & CONVERSATION (optimisé) ===

  async processChatMessage(data: unknown) {
    const parsed = ChatContextSchema.safeParse(data);
    if (!parsed.success) {''
      logInteraction('invalid_input''', { error: parsed.error });
      return this.getErrorResponse();
    }

    const { message, userId, sessionId, context } = parsed.data;''
    const sessionKey = sessionId || userId || 'anonymous''';

    try {''
      // Détection d'intention optimisée
      const intent = await this.detectIntentOptimized(message);''
      logInteraction('''intent_detected', { intent, message });

      // Génération de réponse
      const response = await intent.handler(message, this.getSession(sessionKey), userId);
      this.updateSession(sessionKey, { message, response, intent, timestamp: new Date().toISOString() });

      return {
        ...response,
        intent: intent.name,
        confidence: intent.confidence,
        timestamp: new Date().toISOString()
      };
    } catch (error) {''
      logInteraction('''processing_error', { error, sessionKey });
      return this.getErrorResponse();
    }
  }

  private async detectIntentOptimized(message: string): Promise<DetectedIntent> {
    const lowerMessage = message.toLowerCase();
    const words = lowerMessage.split(/\s+/);
    
    // Vérification du cache''
    const cacheKey = words.sort().join('''|');
    const cached = this.keywordCache.get(cacheKey);
    if (cached !== undefined) {
      const matcher = this.intentMatchers[cached];
      if (matcher) {
        return {
          name: matcher.name,
          confidence: 1,
          handler: matcher.handler
        };
      }
    }''
    // Si aucun intent trouvé, retourner un intent d'''erreur générique
    return {'
      name: ''error''',
      confidence: 0,
      handler: async () => this.getErrorResponse()
    };
  }

  private calculateKeywordScoreOptimized(words: string[], keywords: Set<string>): number {
    let matches = 0;
    for (const word of words) {
      if (keywords.has(word)) matches++;
    }
    return Math.min(matches / keywords.size + (matches * 0.2), 1);
  }

  // === GESTION DE SESSION (optimisé) ===

  private getSession(sessionId: string): ChatInteraction[] {
    if (!this.chatSessions.has(sessionId)) {
      this.chatSessions.set(sessionId, []);
    }
    return this.chatSessions.get(sessionId)!;
  }

  private updateSession(sessionId: string, interaction: ChatInteraction) {
    const session = this.getSession(sessionId);
    session.push({
      ...interaction,
      timestamp: new Date().toISOString()
    });

    // Rotation automatique gérée par LRUCache
  }

  // === GENERATEURS DE REPONSE (simplifié) ===

  private async generateMenuResponse(message: string): Promise<ChatResponse> {
    const menuText = Object.entries(CAFE_KNOWLEDGE.menu)
      .map(([name, info]) => `• ${name}: ${info.description} - ${info.price}€`)'
      .join('' ''');

    return {
      text: `🍽️ **Notre Menu**  ${menuText}`,'
      actions: [''show_menu'''],'
      suggestions: [''Commander un cappuccino''', 'Voir les pâtisseries''']
    };
  }

  private async generateReservationResponse(message: string): Promise<ChatResponse> {
    return {
      text: `🏪 **Réservation**  Je peux vous aider à réserver. Pour quelle date et combien de personnes ?`,''
      actions: ['show_reservation_form'''],''
      suggestions: ['Réserver pour ce soir''', ''Voir les disponibilités''']
    };
  }

  private async generateOrderResponse(message: string): Promise<ChatResponse> {
    return {
      text: `🛒 **Commande**  Que souhaitez-vous commander ?`,'
      actions: [''show_order_form'''],'
      suggestions: [''Commander un cappuccino''', 'Commander un croissant''']
    };
  }

  private async generateHoursResponse(message: string): Promise<ChatResponse> {
    const hours = Object.entries(CAFE_KNOWLEDGE.horaires)
      .map(([day, hours]) => `• ${day}: ${hours}`)''
      .join(' ''');
    return {''
      text: `🕐 **Horaires d'ouverture**  ${hours}`,''
      actions: ['''show_hours'],''
      suggestions: ['''Voir l'adresse''', ''Réserver maintenant''']
    };
  }

  private async generateServicesResponse(message: string): Promise<ChatResponse> {
    const servicesList = Object.entries(CAFE_KNOWLEDGE.services)
      .map(([key, value]) => `• ${key}: ${value}`)'
      .join('' ''');
    return {
      text: `🛎️ **Nos Services**  ${servicesList}`,'
      actions: [''show_services'''],'
      suggestions: [''Réserver une table''', 'Commander en ligne''']
    };
  }

  private async generatePromotionsResponse(message: string): Promise<ChatResponse> {
    const promosList = Object.entries(CAFE_KNOWLEDGE.promotions)
      .map(([key, value]) => `🎉 ${key}: ${value}`)''
      .join(' ''');
    return {
      text: `💰 **Promotions**  ${promosList}`,''
      actions: ['show_promotions'''],''
      suggestions: ['S'''abonner aux offres'', '''Programme fidélité']
    };
  }

  // === PRÉDICTIONS & ANALYTICS ===

  async generatePredictiveAnalytics(context: unknown) {
    const parsed = PredictionContextSchema.safeParse(context);
    if (!parsed.success) {''
      throw new Error('''Invalid prediction context');
    }

    const { timeframe } = parsed.data;
    const [predictions, customerFlow] = await Promise.all([
      this.calculatePredictions(timeframe),
      this.predictCustomerFlow(timeframe)
    ]);

      return {
        timeframe,
        predictions: {
        ...predictions,
          customerFlow,
        staffing: this.generateStaffingRecommendations(customerFlow)
      },
      generatedAt: new Date().toISOString()
    };
  }

  private async calculatePredictions(timeframe: string) {
    const factors = this.getSeasonalFactors();
    return {
      expectedCustomers: Math.round(120 * factors.customer),
      expectedRevenue: Math.round(1500 * factors.revenue),''
      peakHours: ['''08:00-10:00', '''12:00-14:00'']
    };
  }

  private async predictCustomerFlow(timeframe: string) {
    return {
      peakPeriods: ['
        { time: '''08:00-10:00'', expectedCustomers: 45 },'
        { time: '''12:00-14:00'', expectedCustomers: 65 }
      ],
      quietPeriods: ['
        { time: '''14:00-17:00'', expectedCustomers: 15 }
      ]
    };
  }

  private generateStaffingRecommendations(customerFlow: unknown) {
    return {
      optimal: 6,
      minimum: 4,
      recommendations: ['
        '''Ajouter 1 barista pendant 12h-14h'','
        '''Prévoir un serveur supplémentaire le weekend''
      ]
    };
  }

  // === UTILITAIRES & ERREURS ===

  private getErrorResponse(): ChatResponse {
    return {
      text: "Désolé, je rencontre une difficulté technique. Puis-je vous aider autrement ?",
      actions: [],'
      suggestions: ['''Réessayer'', '''Voir le menu'],''
      intent: '''error',
      confidence: 0
    };
  }

  private getSeasonalFactors() {
    const month = new Date().getMonth();
    return month >= 5 && month <= 7 ? 
      { customer: 1.25, revenue: 1.3 } : 
      { customer: 0.9, revenue: 0.95 };
  }
}

// Types améliorés
interface ChatInteraction {
  message: string;
  response: ChatResponse;
  intent: DetectedIntent;
  timestamp: string;
}

interface ChatResponse {
  text: string;
  actions: string[];
  suggestions: string[];
  intent?: string;
  confidence?: number;
}

interface DetectedIntent {
  name: string;
  confidence: number;
  handler: (message: string, session?: ChatInteraction[], userId?: string) => Promise<ChatResponse>;
}

interface IntentMatcher {
  name: string;
  keywords: Set<string>;
  handler: (message: string, session?: ChatInteraction[], userId?: string) => Promise<ChatResponse>;
}
''
// Export de l'''instance singleton""
export const aiService = AIAutomationService.getInstance();"'""'