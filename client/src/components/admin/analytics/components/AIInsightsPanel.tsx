
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Zap,
  Target,
  Users,
  DollarSign,
  Clock
} from 'lucide-react';
import { ApiClient } from '@/lib/auth-utils';
import { toast } from '@/hooks/use-toast';

interface AIInsight {
  id: string;
  type: 'prediction' | 'recommendation' | 'alert' | 'optimization';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  category: string;
  actionable: boolean;
  timestamp: string;
}

interface AIMetrics {
  accuracy: number;
  processing_speed: number;
  insights_generated: number;
  cost_savings: number;
  efficiency_gain: number;
}

export const AIInsightsPanel: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Récupération des insights IA
  const { data: insights, isLoading, refetch } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: async () => {
      const response = await ApiClient.get('/api/advanced/ai-insights');
      return response.insights || [];
    },
    refetchInterval: 60000 // Actualisation toutes les minutes
  });

  // Métriques de performance IA
  const { data: aiMetrics } = useQuery({
    queryKey: ['ai-metrics'],
    queryFn: async () => {
      const response = await ApiClient.get('/api/advanced/ai-metrics');
      return response.metrics || {
        accuracy: 94,
        processing_speed: 0.8,
        insights_generated: 247,
        cost_savings: 3250,
        efficiency_gain: 28
      };
    },
    refetchInterval: 300000 // Actualisation toutes les 5 minutes
  });

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'prediction': return <TrendingUp className="w-5 h-5 text-blue-600" />;
      case 'recommendation': return <Lightbulb className="w-5 h-5 text-yellow-600" />;
      case 'alert': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'optimization': return <Target className="w-5 h-5 text-green-600" />;
      default: return <Brain className="w-5 h-5 text-purple-600" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredInsights = insights?.filter((insight: AIInsight) => 
    selectedCategory === 'all' || insight.category === selectedCategory
  ) || [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Génération des insights IA...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métriques IA globales */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Précision IA</p>
                <p className="text-2xl font-bold text-blue-600">{aiMetrics?.accuracy || 94}%</p>
              </div>
              <Brain className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vitesse</p>
                <p className="text-2xl font-bold text-green-600">{aiMetrics?.processing_speed || 0.8}s</p>
              </div>
              <Zap className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Insights</p>
                <p className="text-2xl font-bold text-purple-600">{aiMetrics?.insights_generated || 247}</p>
              </div>
              <Lightbulb className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Économies</p>
                <p className="text-2xl font-bold text-green-600">€{aiMetrics?.cost_savings || 3250}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gain efficacité</p>
                <p className="text-2xl font-bold text-blue-600">+{aiMetrics?.efficiency_gain || 28}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Panneau principal des insights */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-purple-600" />
              Intelligence Artificielle - Insights en Temps Réel
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-600">
                <CheckCircle className="w-4 h-4 mr-1" />
                IA Active
              </Badge>
              <Button
                onClick={() => refetch()}
                variant="outline"
                size="sm"
              >
                <Clock className="w-4 h-4 mr-2" />
                Actualiser
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtres */}
          <div className="flex gap-2 mb-6">
            <Button 
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('all')}
              size="sm"
            >
              Tous
            </Button>
            <Button 
              variant={selectedCategory === 'sales' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('sales')}
              size="sm"
            >
              Ventes
            </Button>
            <Button 
              variant={selectedCategory === 'inventory' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('inventory')}
              size="sm"
            >
              Stock
            </Button>
            <Button 
              variant={selectedCategory === 'customer' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('customer')}
              size="sm"
            >
              Clients
            </Button>
            <Button 
              variant={selectedCategory === 'operations' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('operations')}
              size="sm"
            >
              Opérations
            </Button>
          </div>

          {/* Liste des insights */}
          <div className="space-y-4">
            {filteredInsights.length > 0 ? (
              filteredInsights.map((insight: AIInsight) => (
                <Alert key={insight.id} className="border-l-4 border-l-blue-500">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getInsightIcon(insight.type)}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{insight.title}</h4>
                          <Badge className={getImpactColor(insight.impact)}>
                            {insight.impact === 'high' ? 'Impact Élevé' : 
                             insight.impact === 'medium' ? 'Impact Moyen' : 'Impact Faible'}
                          </Badge>
                          <Badge variant="outline">
                            {Math.round(insight.confidence)}% confiance
                          </Badge>
                        </div>
                        <AlertDescription className="text-sm">
                          {insight.description}
                        </AlertDescription>
                        <div className="text-xs text-muted-foreground">
                          {new Date(insight.timestamp).toLocaleString('fr-FR')}
                        </div>
                      </div>
                    </div>
                    {insight.actionable && (
                      <Button size="sm" variant="outline">
                        Appliquer
                      </Button>
                    )}
                  </div>
                </Alert>
              ))
            ) : (
              <Alert>
                <Brain className="w-4 h-4" />
                <AlertDescription>
                  Aucun insight disponible pour le moment. L'IA continue d'analyser vos données.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIInsightsPanel;
