/**
 * Vue analytics prédictive
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Bar,
  Legend
} from 'recharts';
import { Brain, TrendingUp, AlertTriangle, Target, DollarSign } from 'lucide-react';

// Types sécurisés pour les données
interface PredictionDataItem {
  period: string;
  actual: number | null;
  predicted: number;
  confidence: number;
}

interface PriceRecommendation {
  item: string;
  currentPrice: number;
  suggestedPrice: number;
  expectedIncrease: string;
  reasoning: string;
}

interface PriceOptimizationData {
  recommendations: PriceRecommendation[];
  totalImpact: string;
}

interface GrowthOpportunity {
  type: string;
  title: string;
  potential: string;
  investment: string;
  roi: string;
}

interface PriorityMatrix {
  quickWins: string[];
  strategic: string[];
  experimental: string[];
}

interface GrowthOpportunitiesData {
  opportunities: GrowthOpportunity[];
  priorityMatrix: PriorityMatrix;
}

interface DemandForecastItem {
  hour: string;
  predicted: number;
  actual: number;
}

interface PredictiveAnalyticsData {
  priceOptimization?: PriceOptimizationData;
  growthOpportunities?: GrowthOpportunitiesData;
}

interface PredictiveAnalyticsViewProps {
  data?: PredictiveAnalyticsData;
}

export const PredictiveAnalyticsView: React.FC<PredictiveAnalyticsViewProps> = ({ data }) => {
  const predictionData: PredictionDataItem[] = [
    { period: 'Sem 1', actual: 8500, predicted: 8300, confidence: 0.85 },
    { period: 'Sem 2', actual: 9200, predicted: 9100, confidence: 0.87 },
    { period: 'Sem 3', actual: 8800, predicted: 8750, confidence: 0.89 },
    { period: 'Sem 4', actual: 9500, predicted: 9400, confidence: 0.82 },
    { period: 'Sem 5', actual: null, predicted: 9800, confidence: 0.75 },
    { period: 'Sem 6', actual: null, predicted: 10200, confidence: 0.72 },
    { period: 'Sem 7', actual: null, predicted: 10500, confidence: 0.68 },
    { period: 'Sem 8', actual: null, predicted: 10800, confidence: 0.65 }
  ];

  const defaultPriceOptimization: PriceOptimizationData = {
    recommendations: [
      {
        item: 'Cappuccino',
        currentPrice: 3.50,
        suggestedPrice: 3.80,
        expectedIncrease: '+8.2%',
        reasoning: 'Demande élevée et concurrence favorable'
      },
      {
        item: 'Croissant',
        currentPrice: 2.20,
        suggestedPrice: 2.40,
        expectedIncrease: '+5.1%',
        reasoning: 'Coût des matières premières en hausse'
      },
      {
        item: 'Latte',
        currentPrice: 4.00,
        suggestedPrice: 3.90,
        expectedIncrease: '-2.3%',
        reasoning: 'Optimisation pour augmenter le volume'
      }
    ],
    totalImpact: '+12.8% revenus mensuels'
  };

  const defaultGrowthOpportunities: GrowthOpportunitiesData = {
    opportunities: [
      {
        type: 'product',
        title: 'Nouveau menu brunch',
        potential: '+15% revenus weekend',
        investment: '2 500€',
        roi: '180%'
      },
      {
        type: 'service',
        title: 'Livraison à domicile',
        potential: '+25% commandes',
        investment: '5 000€',
        roi: '250%'
      },
      {
        type: 'marketing',
        title: 'Programme fidélité digital',
        potential: '+18% rétention',
        investment: '1 200€',
        roi: '320%'
      }
    ],
    priorityMatrix: {
      quickWins: ['Améliorer temps d\'attente', 'Optimiser prix cappuccino'],
      strategic: ['Nouveau menu brunch', 'Livraison à domicile'],
      experimental: ['Programme fidélité', 'Partenariats locaux']
    }
  };

  // Sécurisation de l'accès aux données avec validation
  const priceOptimization: PriceOptimizationData = (data && 'priceOptimization' in data) ? data.priceOptimization! : defaultPriceOptimization;
  const growthOpportunities: GrowthOpportunitiesData = (data && 'growthOpportunities' in data) ? data.growthOpportunities! : defaultGrowthOpportunities;

  const demandForecast: DemandForecastItem[] = [
    { hour: '8h', predicted: 35, actual: 32 },
    { hour: '9h', predicted: 42, actual: 38 },
    { hour: '10h', predicted: 28, actual: 31 },
    { hour: '11h', predicted: 25, actual: 23 },
    { hour: '12h', predicted: 65, actual: 68 },
    { hour: '13h', predicted: 72, actual: 75 },
    { hour: '14h', predicted: 48, actual: 45 },
    { hour: '15h', predicted: 35, actual: 38 },
    { hour: '16h', predicted: 28, actual: 25 },
    { hour: '17h', predicted: 32, actual: 35 },
    { hour: '18h', predicted: 25, actual: 22 },
    { hour: '19h', predicted: 18, actual: 20 }
  ];

  // Fonction de validation sécurisée pour les recommandations de prix
  const isValidPriceRecommendation = (rec: unknown): rec is PriceRecommendation => {
    if (typeof rec !== 'object' || rec === null) return false;
    const obj = rec as Record<string, unknown>;
    return (
      typeof obj.item === 'string' &&
      typeof obj.currentPrice === 'number' &&
      typeof obj.suggestedPrice === 'number' &&
      typeof obj.expectedIncrease === 'string' &&
      typeof obj.reasoning === 'string'
    );
  };

  // Fonction de validation sécurisée pour les opportunités de croissance
  const isValidGrowthOpportunity = (opp: unknown): opp is GrowthOpportunity => {
    if (typeof opp !== 'object' || opp === null) return false;
    const obj = opp as Record<string, unknown>;
    return (
      typeof obj.type === 'string' &&
      typeof obj.title === 'string' &&
      typeof obj.potential === 'string' &&
      typeof obj.investment === 'string' &&
      typeof obj.roi === 'string'
    );
  };

  // Fonction de validation sécurisée pour les chaînes de caractères
  const isValidString = (item: unknown): item is string => {
    return typeof item === 'string';
  };

  return (
    <div className="space-y-6">
      {/* Prédictions de revenus */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Prédictions de Revenus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={predictionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip formatter={(value: number) => [`${value}€`, 'Revenus']} />
              <Legend />
              <Bar dataKey="actual" fill="#8884d8" name="Réel" />
              <Line 
                type="monotone" 
                dataKey="predicted" 
                stroke="#82ca9d" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Prédiction"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Optimisation des prix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Optimisation des Prix
            <Badge variant="secondary" className="ml-auto">
              {priceOptimization.totalImpact}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {priceOptimization.recommendations
              .filter(isValidPriceRecommendation)
              .map((rec: PriceRecommendation, index: number) => (
              <div key={`price-rec-${index}`} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold">{rec.item}</h4>
                    <p className="text-sm text-muted-foreground">{rec.reasoning}</p>
                  </div>
                  <Badge variant={rec.expectedIncrease.startsWith('+') ? "default" : "secondary"}>
                    {rec.expectedIncrease}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Prix actuel: </span>
                    <span className="font-medium">{rec.currentPrice}€</span>
                    <span className="text-muted-foreground"> → </span>
                    <span className="font-medium text-green-600">{rec.suggestedPrice}€</span>
                  </div>
                  <Button variant="outline" size="sm">
                    Appliquer
                  </Button>
                </div>
              </div>
            );}
          </div>
        </CardContent>
      </Card>

      {/* Prédiction de demande */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Prédiction de Demande par Heure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={demandForecast}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip formatter={(value: number) => [value, 'Commandes']} />
              <Area 
                type="monotone" 
                dataKey="predicted" 
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.6}
                name="Prédiction"
              />
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="#82ca9d" 
                strokeWidth={2}
                name="Réel"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Opportunités de croissance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-600" />
            Opportunités de Croissance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {growthOpportunities.opportunities
              .filter(isValidGrowthOpportunity)
              .map((opp: GrowthOpportunity, index: number) => (
              <div key={`growth-opp-${index}`} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold">{opp.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      Type: {opp.type}
                    </p>
                  </div>
                  <Badge variant="outline">
                    ROI: {opp.roi}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Potentiel: </span>
                    <span className="font-medium text-green-600">{opp.potential}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Investissement: </span>
                    <span className="font-medium">{opp.investment}</span>
                  </div>
                </div>
              </div>
            );}
          </div>
        </CardContent>
      </Card>

      {/* Matrice de priorités */}
      <Card>
        <CardHeader>
          <CardTitle>Matrice de Priorités</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Gains Rapides</h4>
              <div className="space-y-2">
                {growthOpportunities.priorityMatrix.quickWins
                  .filter(isValidString)
                  .map((item: string, index: number) => (
                  <div key={`quick-win-${index}`} className="text-sm text-green-700">
                    • {item}
                  </div>
                );}
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Stratégique</h4>
              <div className="space-y-2">
                {growthOpportunities.priorityMatrix.strategic
                  .filter(isValidString)
                  .map((item: string, index: number) => (
                  <div key={`strategic-${index}`} className="text-sm text-blue-700">
                    • {item}
                  </div>
                );}
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-800 mb-2">Expérimental</h4>
              <div className="space-y-2">
                {growthOpportunities.priorityMatrix.experimental
                  .filter(isValidString)
                  .map((item: string, index: number) => (
                  <div key={`experimental-${index}`} className="text-sm text-purple-700">
                    • {item}
                  </div>
                );}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};