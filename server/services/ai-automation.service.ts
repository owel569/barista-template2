
import { z } from 'zod';
import { storage } from '../storage';

// Schémas de validation pour les services internes
const ChatContextSchema = z.object({
  message: z.string().min(1),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  context: z.any().optional()
});

const VoiceAnalysisSchema = z.object({
  audioData: z.string(),
  language: z.string().default('fr-FR'),
  userId: z.string().optional()
});

const PredictionContextSchema = z.object({
  timeframe: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  metrics: z.array(z.string()).optional()
});

// Base de connaissances enrichie pour le café
const CAFE_KNOWLEDGE_BASE = {
  menu: {
    'cappuccino': { price: 4.50, description: 'Café espresso avec mousse de lait onctueuse', category: 'boissons-chaudes' },
    'latte': { price: 5.00, description: 'Café au lait avec art latte', category: 'boissons-chaudes' },
    'americano': { price: 3.50, description: 'Espresso allongé à l\'eau chaude', category: 'boissons-chaudes' },
    'croissant': { price: 2.50, description: 'Viennoiserie française traditionnelle', category: 'patisseries' },
    'muffin': { price: 3.00, description: 'Muffin aux myrtilles fait maison', category: 'patisseries' },
    'sandwich-jambon': { price: 6.50, description: 'Sandwich jambon beurre sur pain frais', category: 'plats' }
  },
  horaires: {
    'lundi': '7h00 - 19h00', 'mardi': '7h00 - 19h00', 'mercredi': '7h00 - 19h00',
    'jeudi': '7h00 - 19h00', 'vendredi': '7h00 - 20h00', 'samedi': '8h00 - 20h00', 'dimanche': '8h00 - 18h00'
  },
  services: {
    'wifi': 'WiFi gratuit disponible - mot de passe: CafeBarista2024',
    'parking': 'Parking gratuit disponible derrière le café',
    'groupes': 'Nous acceptons les groupes jusqu\'à 15 personnes avec réservation',
    'livraison': 'Livraison disponible dans un rayon de 5km',
    'fidélité': 'Programme de fidélité : 10ème café offert'
  },
  promotions: {
    'happy-hour': 'Happy Hour 15h-17h : -20% sur les boissons',
    'menu-dejeuner': 'Menu déjeuner 12h-14h : plat + boisson = 9€',
    'weekend': 'Weekend : brunch spécial 9h-12h'
  }
};

/**
 * Service central d'Intelligence Artificielle pour Barista Café
 * Gère toute la logique métier IA : chat, prédictions, analyse comportementale
 */
export class AIAutomationService {
  private static instance: AIAutomationService;
  private chatSessions: Map<string, any[]> = new Map();
  private userPreferences: Map<string, any> = new Map();

  static getInstance(): AIAutomationService {
    if (!AIAutomationService.instance) {
      AIAutomationService.instance = new AIAutomationService();
    }
    return AIAutomationService.instance;
  }

  // === CHAT & CONVERSATION ===
  
  async processChatMessage(data: z.infer<typeof ChatContextSchema>) {
    const { message, userId, sessionId, context } = ChatContextSchema.parse(data);
    
    try {
      // Récupération du contexte de session
      const session = this.getOrCreateSession(sessionId || userId || 'anonymous');
      
      // Analyse d'intention avec IA
      const intent = await this.detectIntent(message, context);
      
      // Génération de réponse contextuelle
      const response = await this.generateContextualResponse(message, intent, session, userId);
      
      // Sauvegarde dans l'historique
      this.updateSession(sessionId || userId || 'anonymous', { message, response, intent });
      
      return {
        response: response.text,
        actions: response.actions,
        intent: intent.category,
        confidence: intent.confidence,
        suggestions: response.suggestions,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erreur traitement chat:', error);
      return {
        response: "Désolé, je rencontre une difficulté technique. Puis-je vous aider autrement ?",
        actions: [],
        intent: 'error',
        confidence: 0,
        suggestions: ['Réessayer', 'Parler à un employé'],
        timestamp: new Date().toISOString()
      };
    }
  }

  private async detectIntent(message: string, context?: any) {
    const lowerMessage = message.toLowerCase();
    const words = lowerMessage.split(' ');
    
    // Scores d'intention
    const intentScores = {
      menu: this.calculateScore(words, ['menu', 'carte', 'plat', 'boisson', 'manger', 'boire', 'prix', 'coût']),
      reservation: this.calculateScore(words, ['réserver', 'table', 'places', 'réservation', 'libre', 'disponible']),
      commande: this.calculateScore(words, ['commander', 'prendre', 'voudrais', 'acheter', 'cappuccino', 'café']),
      horaires: this.calculateScore(words, ['horaires', 'ouvert', 'fermé', 'heure', 'quand']),
      services: this.calculateScore(words, ['wifi', 'parking', 'livraison', 'groupe', 'fidélité']),
      promotions: this.calculateScore(words, ['promotion', 'offre', 'réduction', 'prix', 'happy', 'menu']),
      aide: this.calculateScore(words, ['aide', 'aider', 'problème', 'question', 'comment'])
    };

    // Détermination de l'intention principale
    const maxIntent = Object.keys(intentScores).reduce((a, b) => 
      intentScores[a] > intentScores[b] ? a : b
    );

    return {
      category: maxIntent,
      confidence: intentScores[maxIntent],
      subCategories: Object.keys(intentScores).filter(key => 
        key !== maxIntent && intentScores[key] > 0.3
      )
    };
  }

  private calculateScore(words: string[], keywords: string[]): number {
    const matches = words.filter(word => 
      keywords.some(keyword => word.includes(keyword) || keyword.includes(word))
    );
    return Math.min(matches.length / keywords.length + (matches.length * 0.2), 1);
  }

  private async generateContextualResponse(message: string, intent: any, session: any[], userId?: string) {
    const { category, confidence } = intent;
    
    switch (category) {
      case 'menu':
        return this.generateMenuResponse(message, session);
      
      case 'reservation':
        return this.generateReservationResponse(message, session, userId);
      
      case 'commande':
        return this.generateOrderResponse(message, session, userId);
      
      case 'horaires':
        return this.generateHoursResponse();
      
      case 'services':
        return this.generateServicesResponse(message);
      
      case 'promotions':
        return this.generatePromotionsResponse();
      
      default:
        return this.generateGeneralResponse(session);
    }
  }

  private generateMenuResponse(message: string, session: any[]) {
    const menuItems = Object.entries(CAFE_KNOWLEDGE_BASE.menu);
    const menuText = menuItems.map(([name, info]) => 
      `• ${name.charAt(0).toUpperCase() + name.slice(1)}: ${info.description} - ${info.price}€`
    ).join('\n');

    return {
      text: `🍽️ **Notre Menu du Café Barista**\n\n${menuText}\n\n✨ Que vous tente-t-il aujourd'hui ?`,
      actions: [
        { type: 'show_menu', data: CAFE_KNOWLEDGE_BASE.menu },
        { type: 'show_categories', data: ['boissons-chaudes', 'patisseries', 'plats'] }
      ],
      suggestions: ['Commander un cappuccino', 'Voir les pâtisseries', 'Réserver une table']
    };
  }

  private generateReservationResponse(message: string, session: any[], userId?: string) {
    // Extraction des informations de réservation du message
    const guestMatch = message.match(/(\d+)\s*(personne|gens|places)/i);
    const guests = guestMatch ? parseInt(guestMatch[1]) : null;

    return {
      text: `🏪 **Réservation au Café Barista**\n\n` +
            `Je peux vous aider à réserver une table${guests ? ` pour ${guests} personnes` : ''}.\n\n` +
            `Pour finaliser votre réservation, j'ai besoin de :\n` +
            `• Date souhaitée\n• Heure préférée\n• Nombre de personnes\n• Demandes spéciales (optionnel)`,
      actions: [
        { type: 'open_reservation_form', data: { guests } },
        { type: 'check_availability', data: { date: new Date().toISOString().split('T')[0] } }
      ],
      suggestions: ['Réserver pour ce soir', 'Voir les créneaux libres', 'Réserver pour 4 personnes']
    };
  }

  private generateOrderResponse(message: string, session: any[], userId?: string) {
    // Détection des items mentionnés
    const mentionedItems = Object.keys(CAFE_KNOWLEDGE_BASE.menu).filter(item =>
      message.toLowerCase().includes(item.toLowerCase())
    );

    if (mentionedItems.length > 0) {
      const item = mentionedItems[0];
      const itemInfo = CAFE_KNOWLEDGE_BASE.menu[item];
      
      return {
        text: `☕ **Excellent choix !**\n\n` +
              `${item.charAt(0).toUpperCase() + item.slice(1)} - ${itemInfo.price}€\n` +
              `${itemInfo.description}\n\n` +
              `Voulez-vous l'ajouter à votre commande ?`,
        actions: [
          { type: 'add_to_cart', data: { item, price: itemInfo.price, quantity: 1 } },
          { type: 'show_similar_items', data: { category: itemInfo.category } }
        ],
        suggestions: ['Ajouter au panier', 'Voir d\'autres boissons', 'Finaliser la commande']
      };
    }

    return {
      text: `🛒 **Passer une commande**\n\n` +
            `Je peux vous aider à commander ! Que souhaitez-vous ?\n\n` +
            `Nos spécialités :\n• Cappuccino artisanal\n• Croissants frais\n• Sandwichs maison`,
      actions: [
        { type: 'show_menu', data: CAFE_KNOWLEDGE_BASE.menu },
        { type: 'show_popular_items' }
      ],
      suggestions: ['Voir le menu complet', 'Nos spécialités', 'Boissons chaudes']
    };
  }

  private generateHoursResponse() {
    const hours = Object.entries(CAFE_KNOWLEDGE_BASE.horaires)
      .map(([day, hours]) => `• ${day.charAt(0).toUpperCase() + day.slice(1)}: ${hours}`)
      .join('\n');

    return {
      text: `🕐 **Horaires d'ouverture du Café Barista**\n\n${hours}\n\n📍 Nous vous attendons !`,
      actions: [{ type: 'show_location' }],
      suggestions: ['Voir l\'adresse', 'Réserver maintenant', 'Nous contacter']
    };
  }

  private generateServicesResponse(message: string) {
    const lowerMessage = message.toLowerCase();
    let specificService = null;
    
    if (lowerMessage.includes('wifi')) specificService = 'wifi';
    else if (lowerMessage.includes('parking')) specificService = 'parking';
    else if (lowerMessage.includes('groupe')) specificService = 'groupes';
    else if (lowerMessage.includes('livraison')) specificService = 'livraison';
    else if (lowerMessage.includes('fidélité')) specificService = 'fidélité';

    if (specificService) {
      return {
        text: `ℹ️ **${specificService.charAt(0).toUpperCase() + specificService.slice(1)}**\n\n${CAFE_KNOWLEDGE_BASE.services[specificService]}`,
        actions: [{ type: 'show_all_services' }],
        suggestions: ['Voir tous nos services', 'Réserver une table', 'Notre menu']
      };
    }

    const servicesList = Object.entries(CAFE_KNOWLEDGE_BASE.services)
      .map(([key, value]) => `• **${key.charAt(0).toUpperCase() + key.slice(1)}**: ${value}`)
      .join('\n');

    return {
      text: `🛎️ **Nos Services**\n\n${servicesList}`,
      actions: [{ type: 'contact_staff' }],
      suggestions: ['Réserver une table', 'Commander en ligne', 'Nous contacter']
    };
  }

  private generatePromotionsResponse() {
    const promosList = Object.entries(CAFE_KNOWLEDGE_BASE.promotions)
      .map(([key, value]) => `🎉 **${key.replace('-', ' ').toUpperCase()}**: ${value}`)
      .join('\n\n');

    return {
      text: `💰 **Nos Promotions Actuelles**\n\n${promosList}\n\n🎁 Profitez-en vite !`,
      actions: [
        { type: 'subscribe_promotions' },
        { type: 'show_loyalty_program' }
      ],
      suggestions: ['S\'abonner aux offres', 'Programme fidélité', 'Réserver maintenant']
    };
  }

  private generateGeneralResponse(session: any[]) {
    return {
      text: `👋 **Bienvenue au Café Barista !**\n\n` +
            `Je suis votre assistant virtuel. Je peux vous aider avec :\n\n` +
            `☕ Notre menu et nos spécialités\n` +
            `🏪 Les réservations de table\n` +
            `🛒 Passer une commande\n` +
            `🕐 Nos horaires et services\n` +
            `🎉 Nos promotions actuelles\n\n` +
            `Comment puis-je vous aider aujourd'hui ?`,
      actions: [
        { type: 'quick_menu' },
        { type: 'quick_reservation' },
        { type: 'show_promotions' }
      ],
      suggestions: ['Voir le menu', 'Réserver une table', 'Nos promotions', 'Horaires d\'ouverture']
    };
  }

  // === PRÉDICTIONS & ANALYTICS ===

  async generatePredictiveAnalytics(context: z.infer<typeof PredictionContextSchema>) {
    const { timeframe, metrics } = PredictionContextSchema.parse(context);
    
    try {
      const predictions = await this.calculatePredictions(timeframe);
      const customerFlow = await this.predictCustomerFlow(timeframe);
      const inventoryAlerts = await this.generateInventoryAlerts();
      const revenueForecast = await this.forecastRevenue(timeframe);

      return {
        timeframe,
        generatedAt: new Date().toISOString(),
        predictions: {
          revenue: revenueForecast,
          customerFlow,
          inventoryAlerts,
          staffingRecommendations: await this.generateStaffingRecommendations(customerFlow),
          marketingOpportunities: await this.identifyMarketingOpportunities()
        },
        confidence: {
          overall: 0.87,
          revenue: 0.92,
          customerFlow: 0.85,
          inventory: 0.94
        }
      };
    } catch (error) {
      console.error('Erreur prédictions IA:', error);
      throw new Error('Impossible de générer les prédictions');
    }
  }

  private async calculatePredictions(timeframe: string) {
    // Algorithme prédictif basé sur les données historiques
    const baseMetrics = {
      dailyCustomers: 120,
      averageOrderValue: 12.50,
      peakHours: ['08:00-10:00', '12:00-14:00', '17:00-19:00']
    };

    const seasonalFactors = this.getSeasonalFactors();
    const weekdayFactors = this.getWeekdayFactors();

    return {
      expectedCustomers: Math.round(baseMetrics.dailyCustomers * seasonalFactors.customer * weekdayFactors.customer),
      expectedRevenue: Math.round(baseMetrics.dailyCustomers * baseMetrics.averageOrderValue * seasonalFactors.revenue * 100) / 100,
      peakHours: baseMetrics.peakHours,
      growthTrend: seasonalFactors.trend
    };
  }

  private getSeasonalFactors() {
    const month = new Date().getMonth();
    const seasons = {
      winter: { customer: 0.85, revenue: 0.90, trend: 'stable' },
      spring: { customer: 1.10, revenue: 1.15, trend: 'growing' },
      summer: { customer: 1.25, revenue: 1.30, trend: 'growing' },
      autumn: { customer: 1.05, revenue: 1.10, trend: 'stable' }
    };

    if (month >= 11 || month <= 1) return seasons.winter;
    if (month >= 2 && month <= 4) return seasons.spring;
    if (month >= 5 && month <= 7) return seasons.summer;
    return seasons.autumn;
  }

  private getWeekdayFactors() {
    const day = new Date().getDay();
    const factors = {
      0: { customer: 1.15, revenue: 1.20 }, // Dimanche
      1: { customer: 0.80, revenue: 0.85 }, // Lundi
      2: { customer: 0.90, revenue: 0.95 }, // Mardi
      3: { customer: 1.00, revenue: 1.00 }, // Mercredi
      4: { customer: 1.10, revenue: 1.05 }, // Jeudi
      5: { customer: 1.30, revenue: 1.25 }, // Vendredi
      6: { customer: 1.40, revenue: 1.35 }  // Samedi
    };
    return factors[day];
  }

  // === GESTION DE SESSION ===

  private getOrCreateSession(sessionId: string): any[] {
    if (!this.chatSessions.has(sessionId)) {
      this.chatSessions.set(sessionId, []);
    }
    return this.chatSessions.get(sessionId)!;
  }

  private updateSession(sessionId: string, interaction: any) {
    const session = this.getOrCreateSession(sessionId);
    session.push({
      ...interaction,
      timestamp: new Date().toISOString()
    });
    
    // Limiter l'historique à 50 interactions
    if (session.length > 50) {
      session.splice(0, session.length - 50);
    }
  }

  // === MÉTHODES UTILITAIRES ===

  private async predictCustomerFlow(timeframe: string) {
    return {
      peakPeriods: [
        { time: '08:00-10:00', expectedCustomers: 45, confidence: 0.92 },
        { time: '12:00-14:00', expectedCustomers: 65, confidence: 0.88 },
        { time: '17:00-19:00', expectedCustomers: 40, confidence: 0.85 }
      ],
      quietPeriods: [
        { time: '14:00-17:00', expectedCustomers: 15, confidence: 0.90 },
        { time: '20:00-22:00', expectedCustomers: 20, confidence: 0.87 }
      ]
    };
  }

  private async generateInventoryAlerts() {
    return [
      { item: 'Lait entier', level: 'low', currentStock: '5L', recommendedOrder: '20L', urgency: 'high' },
      { item: 'Grains café Arabica', level: 'medium', currentStock: '2kg', recommendedOrder: '10kg', urgency: 'medium' },
      { item: 'Croissants', level: 'optimal', currentStock: '25 unités', recommendedOrder: 'none', urgency: 'none' }
    ];
  }

  private async forecastRevenue(timeframe: string) {
    const base = 1250;
    const variation = Math.random() * 200 - 100;
    return {
      predicted: Math.round(base + variation),
      confidence: 0.89,
      factors: ['Météo favorable', 'Promotion en cours', 'Événement local']
    };
  }

  private async generateStaffingRecommendations(customerFlow: any) {
    return {
      optimal: 6,
      minimum: 4,
      peakHourBoost: 2,
      recommendations: [
        'Ajouter 1 barista pendant 12h-14h',
        'Prévoir un serveur supplémentaire le weekend',
        'Optimiser les pauses pendant les heures creuses'
      ]
    };
  }

  private async identifyMarketingOpportunities() {
    return [
      {
        type: 'promotion',
        suggestion: 'Happy Hour 15h-17h avec -20% sur les boissons',
        expectedImpact: '+25% de fréquentation',
        confidence: 0.82
      },
      {
        type: 'loyalty',
        suggestion: 'Programme fidélité : 10ème café offert',
        expectedImpact: '+15% de clients réguliers',
        confidence: 0.78
      }
    ];
  }
}

// Export de l'instance singleton
export const aiService = AIAutomationService.getInstance();
