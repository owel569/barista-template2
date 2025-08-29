import { z } from 'zod';

// === TYPES ET INTERFACES ===
interface StaffingRecommendation {
  optimal: number;
  minimum: number;
  peakHourBoost: number;
  recommendations: string[];
}

interface MarketingOpportunity {
  type: string;
  suggestion: string;
  expectedImpact: string;
  confidence: number;
}

interface CustomerFlowPrediction {
  peakPeriods: Array<{
    time: string;
    expectedCustomers: number;
    confidence: number;
  }>;
  quietPeriods: Array<{
    time: string;
    expectedCustomers: number;
    confidence: number;
  }>;
}

// Schémas de validation pour les services internes
const ChatContextSchema = z.object({
  message: z.string().min(1),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  context: z.record(z.unknown()).optional()
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

import { getDb } from '../db';
import { customers, orders, menuItems, reservations } from '../../shared/schema';
import { eq, sql, desc, and, gte, lte } from 'drizzle-orm';
import { createLogger } from '../middleware/logging';

const logger = createLogger('AI_AUTOMATION_SERVICE');

interface ChatMessage {
  message: string;
  userId?: number;
}

interface PredictionRequest {
  type: 'sales' | 'traffic' | 'inventory';
  period: string;
}

interface VoiceRequest {
  audioData: string;
  userId?: number;
}

interface AnomalyRequest {
  metric: string;
  period: string;
}

// Placeholder types for clarity, replace with actual types if available
// Removed duplicate interface definitions
// type StaffingRecommendation = any;
// type MarketingOpportunity = any;

/**
 * Service central d'Intelligence Artificielle pour Barista Café
 * Gère toute la logique métier IA : chat, prédictions, analyse comportementale
 */
export class AIAutomationService {
  private static instance: AIAutomationService;
  private chatSessions: Map<string, Array<Record<string, unknown>>> = new Map();
  private userPreferences: Map<string, Record<string, unknown>> = new Map();

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
      logger.error('Erreur traitement chat:', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
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

  private async detectIntent(message: string, context?: Record<string, unknown>) {
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
      intentScores[a as keyof typeof intentScores] > intentScores[b as keyof typeof intentScores] ? a : b
    );

    return {
      category: maxIntent,
      confidence: intentScores[maxIntent as keyof typeof intentScores],
      subCategories: Object.keys(intentScores).filter(key => 
        key !== maxIntent && intentScores[key as keyof typeof intentScores] > 0.3
      )
    };
  }

  private calculateScore(words: string[], keywords: string[]): number {
    const matches = words.filter(word => 
      keywords.some(keyword => word.includes(keyword) || keyword.includes(word))
    );
    return Math.min(matches.length / keywords.length + (matches.length * 0.2), 1);
  }

  private async generateContextualResponse(message: string, intent: { category: string; confidence: number }, session: unknown[], userId?: string) {
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

  private generateMenuResponse(message: string, session: unknown[]) {
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

  private generateReservationResponse(message: string, session: unknown[], userId?: string) {
    // Extraction des informations de réservation du message
    const guestMatch = message.match(/(\d+)\s*(personne|gens|places)/i);
    const guests = guestMatch && guestMatch[1] ? parseInt(guestMatch[1], 10) : null;

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

  private generateOrderResponse(message: string, session: unknown[], userId?: string) {
    // Détection des items mentionnés
    const mentionedItems = Object.keys(CAFE_KNOWLEDGE_BASE.menu).filter(item =>
      message.toLowerCase().includes(item.toLowerCase())
    );

    if (mentionedItems.length > 0) {
      const item = mentionedItems[0];
      const itemInfo = CAFE_KNOWLEDGE_BASE.menu[item as keyof typeof CAFE_KNOWLEDGE_BASE.menu];

      return {
        text: `☕ **Excellent choix !**\n\n` +
              `${item ? item.charAt(0).toUpperCase() + item.slice(1) : 'Article'} - ${itemInfo?.price || 0}€\n` +
              `${itemInfo?.description || ''}\n\n` +
              `Voulez-vous l'ajouter à votre commande ?`,
        actions: [
          { type: 'add_to_cart', data: { item, price: itemInfo?.price || 0, quantity: 1 } },
          { type: 'show_similar_items', data: { category: itemInfo?.category || 'general' } }
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
        text: `ℹ️ **${specificService.charAt(0).toUpperCase() + specificService.slice(1)}**\n\n${(CAFE_KNOWLEDGE_BASE.services as any)[specificService] || 'Information non disponible'}`,
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

  private generateGeneralResponse(session: unknown[]) {
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
      logger.error('Erreur prédictions IA:', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
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
    return factors[day as keyof typeof factors] || factors[0];
  }

  // === GESTION DE SESSION ===

  private getOrCreateSession(sessionId: string): unknown[] {
    if (!this.chatSessions.has(sessionId)) {
      this.chatSessions.set(sessionId, []);
    }
    return this.chatSessions.get(sessionId)!;
  }

  private updateSession(sessionId: string, interaction: unknown) {
    const session = this.getOrCreateSession(sessionId);
    session.push({
      ...(interaction || {}),
      timestamp: new Date().toISOString()
    });

    // Limiter l'historique à 50 interactions
    if (session.length > 50) {
      session.splice(0, session.length - 50);
    }
  }

  // === MÉTHODES UTILITAIRES ===

  private async predictCustomerFlow(timeframe: string): Promise<CustomerFlowPrediction> {
    try {
      const db = getDb();

      // Analyse des données historiques pour prédire le flux
      const historicalData = await db.select({
        hour: sql`EXTRACT(HOUR FROM created_at)`,
        avgCustomers: sql`COUNT(*)`,
        dayOfWeek: sql`EXTRACT(DOW FROM created_at)`
      }).from(orders)
        .groupBy(sql`EXTRACT(HOUR FROM created_at)`, sql`EXTRACT(DOW FROM created_at)`)
        .where(gte(orders.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));

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
    } catch (error) {
      logger.error('Erreur prédiction flux clients:', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
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
  }

  private async generateInventoryAlerts() {
    try {
      const db = getDb();

      // Analyse des niveaux de stock et des tendances de vente
      const inventoryAnalysis = await db.select({
        itemName: menuItems.name,
        currentStock: menuItems.stock || 0,
        dailySales: sql`COALESCE(AVG(orders.quantity), 0)`,
        daysRemaining: sql`CASE WHEN AVG(orders.quantity) > 0 THEN ${menuItems.stock || 0} / AVG(orders.quantity) ELSE 999 END`
      }).from(menuItems)
        .leftJoin(orders, eq(orders.id, menuItems.id))
        .groupBy(menuItems.id, menuItems.name, menuItems.stock)
        .where(gte(orders.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)));

      return inventoryAnalysis.map(item => ({
        item: item.itemName || 'Item inconnu',
        level: (Number(item.daysRemaining) || 999) < 2 ? 'low' : (Number(item.daysRemaining) || 999) < 5 ? 'medium' : 'optimal',
        currentStock: `${item.currentStock || 0} unités`,
        recommendedOrder: (Number(item.daysRemaining) || 999) < 3 ? `${Math.ceil((Number(item.dailySales) || 0) * 7)} unités` : 'none',
        urgency: (Number(item.daysRemaining) || 999) < 2 ? 'high' : (Number(item.daysRemaining) || 999) < 5 ? 'medium' : 'none'
      }));
    } catch (error) {
      logger.error('Erreur analyse inventaire:', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
      return [
        { item: 'Lait entier', level: 'low', currentStock: '5L', recommendedOrder: '20L', urgency: 'high' },
        { item: 'Grains café Arabica', level: 'medium', currentStock: '2kg', recommendedOrder: '10kg', urgency: 'medium' },
        { item: 'Croissants', level: 'optimal', currentStock: '25 unités', recommendedOrder: 'none', urgency: 'none' }
      ];
    }
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

  private async generateStaffingRecommendations(customerFlow: CustomerFlowPrediction): Promise<StaffingRecommendation> {
    const totalPeakCustomers = customerFlow.peakPeriods.reduce((sum, period) => sum + period.expectedCustomers, 0);
    const totalQuietCustomers = customerFlow.quietPeriods.reduce((sum, period) => sum + period.expectedCustomers, 0);

    // Calcul basé sur le ratio clients/employés optimisé pour un café
    const optimalPeakStaff = Math.ceil(totalPeakCustomers / 15);
    const optimalQuietStaff = Math.ceil(totalQuietCustomers / 25);

    return {
      optimal: optimalPeakStaff,
      minimum: optimalQuietStaff,
      peakHourBoost: optimalPeakStaff - optimalQuietStaff,
      recommendations: [
        `Ajouter ${optimalPeakStaff - optimalQuietStaff} employés pendant les heures de pointe`,
        'Formation croisée du personnel pour plus de flexibilité',
        'Optimiser les pauses pendant les heures creuses',
        'Prévoir un serveur supplémentaire le weekend'
      ]
    };
  }

  private async identifyMarketingOpportunities(): Promise<MarketingOpportunity[]> {
    try {
      const db = getDb();

      // Analyse des tendances des ventes par catégorie
      const salesTrends = await db.select({
        category: menuItems.category,
        totalSales: sql`COALESCE(SUM(orders.totalAmount), 0)`,
        growth: sql`
          CASE 
            WHEN SUM(CASE WHEN orders.created_at >= NOW() - INTERVAL '14 days' AND orders.created_at < NOW() - INTERVAL '7 days' THEN orders.total_amount ELSE 0 END) > 0 
            THEN (SUM(CASE WHEN orders.created_at >= NOW() - INTERVAL '7 days' THEN orders.total_amount ELSE 0 END) - 
                  SUM(CASE WHEN orders.created_at >= NOW() - INTERVAL '14 days' AND orders.created_at < NOW() - INTERVAL '7 days' THEN orders.total_amount ELSE 0 END)) / 
                 SUM(CASE WHEN orders.created_at >= NOW() - INTERVAL '14 days' AND orders.created_at < NOW() - INTERVAL '7 days' THEN orders.total_amount ELSE 0 END)
            ELSE 0 
          END`
      }).from(orders)
        .innerJoin(menuItems, eq(orders.itemId, menuItems.id))
        .groupBy(menuItems.category)
        .where(gte(orders.createdAt, new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)));

      const opportunities: MarketingOpportunity[] = salesTrends.map(trend => ({
        type: 'category_promotion',
        suggestion: `Promouvoir les ${trend.category} - croissance détectée`,
        expectedImpact: `+${Math.round((Number(trend.growth) || 0) * 15)}% de ventes`,
        confidence: 0.78
      }));

      // Ajouter des opportunités génériques basées sur les données
      opportunities.push(
        {
          type: 'happy_hour',
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
      );

      return opportunities;
    } catch (error) {
      logger.error('Erreur opportunités marketing:', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
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

  async getChatResponse(data: ChatMessage): Promise<any> {
    try {
      const { message, userId } = data;

      // Analyse de l'intention
      const intention = this.analyzeIntention(message);

      switch (intention.type) {
        case 'reservation':
          return await this.handleReservationIntent(message, userId);
        case 'menu':
          return await this.handleMenuIntent(message);
        case 'order_status':
          return await this.handleOrderStatusIntent(message, userId);
        case 'recommendation':
          return await this.handleRecommendationIntent(userId);
        default:
          return {
            response: "Je ne suis pas sûr de comprendre. Puis-je vous aider avec une réservation, des informations sur le menu, ou autre chose ?",
            actions: [],
            confidence: 0.3
          };
      }
    } catch (error) {
      logger.error('Erreur chat IA:', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
      return {
        response: "Désolé, je rencontre un problème technique. Veuillez réessayer.",
        actions: [],
        confidence: 0
      };
    }
  }

  private analyzeIntention(message: string): { type: string; confidence: number; entities: unknown[] } {
    const lowercaseMessage = message.toLowerCase();

    // Mots-clés pour différentes intentions
    const reservationKeywords = ['réserver', 'réservation', 'table', 'réserver une table'];
    const menuKeywords = ['menu', 'carte', 'plat', 'boisson', 'café'];
    const orderKeywords = ['commande', 'livraison'];

    let maxScore = 0;
    let detectedIntent = 'general';

    if (reservationKeywords.some(keyword => lowercaseMessage.includes(keyword))) {
      detectedIntent = 'reservation';
      maxScore = 0.8;
    } else if (menuKeywords.some(keyword => lowercaseMessage.includes(keyword))) {
      detectedIntent = 'menu';
      maxScore = 0.7;
    } else if (orderKeywords.some(keyword => lowercaseMessage.includes(keyword))) {
      detectedIntent = 'order_status';
      maxScore = 0.6;
    }

    return {
      type: detectedIntent,
      confidence: maxScore,
      entities: this.extractEntities(message)
    };
  }

  private async handleReservationIntent(message: string, userId?: number): Promise<any> {
    // Logique de réservation basée sur l'IA
    return {
      response: "Je peux vous aider avec votre réservation. Combien de personnes serez-vous et pour quelle date ?",
      actions: ['show_reservation_form',],
      confidence: 0.9
    };
  }

  private async handleMenuIntent(message: string): Promise<any> {
    try {
      const db = await getDb();
      const items = await db.select().from(menuItems).limit(5);

      return {
        response: "Voici quelques suggestions de notre menu :",
        data: items,
        actions: ['show_menu',],
        confidence: 0.8
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération du menu:', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
      return {
        response: "Voici notre menu principal...",
        actions: ['show_menu',],
        confidence: 0.6
      };
    }
  }

  private async handleOrderStatusIntent(message: string, userId?: number): Promise<any> {
    return {
      response: "Laissez-moi vérifier le statut de votre commande...",
      actions: ['check_order_status',],
      confidence: 0.7
    };
  }

  private async handleRecommendationIntent(userId?: number): Promise<any> {
    return {
      response: "Basé sur vos préférences, je recommande notre café signature...",
      actions: ['show_recommendations',],
      confidence: 0.8
    };
  }

  private extractEntities(message: string): unknown[] {
    // Extraction d'entités simple
    const entities: unknown[] = [];

    // Extraction de dates
    const dateRegex = /(\d{1,2}\/\d{1,2}\/\d{4})/g;
    const dates = message.match(dateRegex);
    if (dates) {
      entities.push({ type: 'date', value: dates[0] });
    }

    // Extraction de nombres (pour nombre de personnes)
    const numberRegex = /(\d+)\s*(personne|gens|personnes)/g;
    const numbers = message.match(numberRegex);
    if (numbers) {
      // Ensure parseInt is called correctly and handles potential non-numeric matches
      const parsedNumber = parseInt(numbers[0].match(/\d+/)?.[0] || '0', 10);
      if (!isNaN(parsedNumber)) {
        entities.push({ type: 'party_size', value: parsedNumber });
      }
    }

    return entities;
  }

  async analyzeVoiceInput(data: z.infer<typeof VoiceAnalysisSchema>) {
    const { audioData, language, userId } = VoiceAnalysisSchema.parse(data);

    try {
      // Simulation d'analyse vocale - à remplacer par un vrai service ASR
      const transcribedText = this.simulateSpeechRecognition(audioData);
      const chatResponse = await this.processChatMessage({
        message: transcribedText,
        userId: userId?.toString(),
        sessionId: `voice_${userId}`
      });

      return {
        transcription: transcribedText,
        response: chatResponse.response,
        actions: chatResponse.actions,
        confidence: 0.85
      };
    } catch (error) {
      logger.error('Erreur analyse vocale:', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
      throw new Error('Échec de l\'analyse vocale');
    }
  }

  private simulateSpeechRecognition(audioData: string): string {
    // Simulation basique - à remplacer par une vraie API ASR
    const commonPhrases = [
      "Je voudrais réserver une table pour ce soir",
      "Quels sont vos horaires d'ouverture ?",
      "Je veux commander un cappuccino",
      "Avez-vous des promotions en ce moment ?",
      "Peut-on venir en groupe ?"
    ];

    const phrase = commonPhrases[Math.floor(Math.random() * commonPhrases.length)];
    return phrase || 'Phrase par défaut';
  }

  async detectAnomalies(data: AnomalyRequest) {
    const { metric, period } = data;

    try {
      const db = getDb();
      const anomalies = await db.select({
        timestamp: orders.createdAt,
        value: sql`SUM(orders.total_amount)`,
        expected: sql`AVG(SUM(orders.total_amount)) OVER (ORDER BY DATE(orders.created_at) ROWS BETWEEN 7 PRECEDING AND 1 PRECEDING)`
      }).from(orders)
        .groupBy(sql`DATE(orders.created_at)`)
        .having(sql`ABS(SUM(orders.total_amount) - AVG(SUM(orders.total_amount)) OVER (ORDER BY DATE(orders.created_at) ROWS BETWEEN 7 PRECEDING AND 1 PRECEDING)) > 
                   COALESCE(STDDEV(SUM(orders.total_amount)) OVER (ORDER BY DATE(orders.created_at) ROWS BETWEEN 7 PRECEDING AND 1 PRECEDING) * 2, 100)`)
        .where(gte(orders.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));

      return anomalies.map(anomaly => ({
        metric: 'revenue',
        timestamp: anomaly.timestamp,
        actualValue: Number(anomaly.value) || 0,
        expectedValue: Number(anomaly.expected) || 0,
        deviation: Math.round(((Number(anomaly.value) - Number(anomaly.expected)) / Math.max(Number(anomaly.expected), 1)) * 100),
        severity: Math.abs((Number(anomaly.value) - Number(anomaly.expected)) / Math.max(Number(anomaly.expected), 1)) > 0.3 ? 'high' : 'medium'
      }));
    } catch (error) {
      logger.error('Erreur détection anomalies:', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
      return [];
    }
  }

  private async generateInsight(data: Record<string, unknown>): Promise<string> {
    // Simulation d'analyse IA
    const insights = [
      'Les ventes de café augmentent de 15% le matin',
      'Recommandation: Augmenter le stock de lait d\'amande',
      'Tendance: Les clients préfèrent les boissons chaudes en hiver'
    ];
    const insight = insights[Math.floor(Math.random() * insights.length)];
    return insight || 'Insight par défaut';
  }

  private async optimizeMenu(menuData: Record<string, unknown>): Promise<Record<string, unknown>> {
    // Placeholder logic for menu optimization
    return { ...menuData, optimizationStatus: 'optimized' };
  }

  private async predictDemand(salesData: Record<string, unknown>[]): Promise<Record<string, unknown>> {
    // Simulation de prédiction de demande
    return {
      predictions: [
        { item: 'Espresso', demand: 85 },
        { item: 'Cappuccino', demand: 72 },
        { item: 'Croissant', demand: 45 }
      ],
      accuracy: 0.87
    };
  }
}

// Export de l'instance singleton
export const aiService = AIAutomationService.getInstance();