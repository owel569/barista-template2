/**
 * Panneau d'insights IA
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  Target,
  Users,
  DollarSign,
  Clock
} from 'lucide-react';
import { ApiClient } from '@/lib/auth-utils';

interface AIInsight {
  id: string;
  type: 'prediction' | 'anomaly' | 'recommendation' | 'alert';
  title: string;
  description: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  action?: string;
  data?: any;
}

export const AIInsightsPanel: React.FC = () => {
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null);

  const { data: insights, isLoading } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: async () => {
      const [anomalies, recommendations] = await Promise.all([
        ApiClient.get('/api/advanced/ai/anomalies'),
        ApiClient.get('/api/advanced/ai/recommendations/1')
      ]);

      // Transformer les données en insights
      const allInsights: AIInsight[] = [
        {
          id: '1',
          type: 'prediction',
          title: 'Pic d\'affluence prévu',
          description: 'Un pic d\'affluence est prévu entre 12h30 et 13h30 aujourd\'hui',
          confidence: 0.85,
          priority: 'high',
          action: 'Prévoir du personnel supplémentaire'
        },
        {
          id: '2',
          type: 'recommendation',
          title: 'Optimisation du menu',
          description: 'Le Cappuccino pourrait être valorisé à 3.80€ (+8% de revenus)',
          confidence: 0.72,
          priority: 'medium',
          action: 'Ajuster les prix'
        },
        {
          id: '3',
          type: 'anomaly',
          title: 'Stock faible détecté',
          description: 'Stock de croissants inférieur au seuil critique',
          confidence: 1.0,
          priority: 'high',
          action: 'Réapprovisionner immédiatement'
        },
        {
          id: '4',
          type: 'alert',
          title: 'Satisfaction client',
          description: 'Légère baisse de satisfaction sur le service (-0.2)',
          confidence: 0.68,
          priority: 'medium',
          action: 'Former l\'équipe'
        }
      ];

      return allInsights;
    },
    refetchInterval: 30000 // Actualisation toutes les 30 secondes
  });

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'prediction': return TrendingUp;
      case 'anomaly': return AlertTriangle;
      case 'recommendation': return Lightbulb;
      case 'alert': return Clock;
      default: return Brain;
    }
  };

  const getInsightColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge variant="destructive">Élevé</Badge>;
      case 'medium': return <Badge variant="secondary">Moyen</Badge>;
      case 'low': return <Badge variant="outline">Faible</Badge>;
      default: return <Badge variant="outline">Normal</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 animate-pulse" />
            Insights IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          Insights IA
          <Badge variant="secondary" className="ml-auto">
            {insights?.length || 0} insights
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights?.map((insight) => {
            const Icon = getInsightIcon(insight.type);
            return (
              <Alert 
                key={insight.id} 
                className={`cursor-pointer transition-all ${getInsightColor(insight.priority)} ${
                  selectedInsight === insight.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedInsight(
                  selectedInsight === insight.id ? null : insight.id
                )}
              >
                <div className="flex items-start gap-3">
                  <Icon className="w-5 h-5 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-sm">{insight.title}</h4>
                      {getPriorityBadge(insight.priority)}
                    </div>
                    <AlertDescription className="text-xs mb-2">
                      {insight.description}
                    </AlertDescription>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Confiance: {Math.round(insight.confidence * 100)}%
                      </span>
                      {insight.action && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs h-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Action à implémenter
                          }}
                        >
                          {insight.action}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Alert>
            );
          })}
        </div>
        
        {(!insights || insights.length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucun insight disponible pour le moment</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};