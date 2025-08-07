/**
 * Vue du comportement client
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Users, Star, TrendingUp, Target } from 'lucide-react';

// Types sécurisés pour les données
interface CustomerSegment {
  count: number;
  percentage: number;
  avgSpent: number;
}

interface CustomerBehaviorData {
    segments: {
    vip: CustomerSegment;
    regular: CustomerSegment;
    occasional: CustomerSegment;
    };
    insights: string[];
    actionItems: string[];
}

interface CustomerBehaviorViewProps {
  data?: CustomerBehaviorData;
}

interface SegmentDataItem {
  name: string;
  count: number;
  percentage: number;
  avgSpent: number;
  color: string;
}

interface SatisfactionDataItem {
  category: string;
  score: number;
  target: number;
}

export const CustomerBehaviorView: React.FC<CustomerBehaviorViewProps> = ({ data }) => {
  // Données sécurisées avec validation
  const segmentData: SegmentDataItem[] = data ? [
    { 
      name: 'VIP', 
      count: data.segments.vip.count, 
      percentage: data.segments.vip.percentage, 
      avgSpent: data.segments.vip.avgSpent, 
      color: '#8B5CF6' 
    },
    { 
      name: 'Réguliers', 
      count: data.segments.regular.count, 
      percentage: data.segments.regular.percentage, 
      avgSpent: data.segments.regular.avgSpent, 
      color: '#3B82F6' 
    },
    { 
      name: 'Occasionnels', 
      count: data.segments.occasional.count, 
      percentage: data.segments.occasional.percentage, 
      avgSpent: data.segments.occasional.avgSpent, 
      color: '#10B981' 
    }
  ] : [
    { name: 'VIP', count: 45, percentage: 15, avgSpent: 85.50, color: '#8B5CF6' },
    { name: 'Réguliers', count: 180, percentage: 60, avgSpent: 42.30, color: '#3B82F6' },
    { name: 'Occasionnels', count: 75, percentage: 25, avgSpent: 18.90, color: '#10B981' }
  ];

  const satisfactionData: SatisfactionDataItem[] = [
    { category: 'Nourriture', score: 4.5, target: 4.0 },
    { category: 'Service', score: 4.2, target: 4.0 },
    { category: 'Ambiance', score: 4.3, target: 4.0 },
    { category: 'Prix', score: 3.8, target: 4.0 }
  ];

  const insights = data?.insights || [
    "Les clients VIP génèrent 45% du chiffre d'affaires",
    "Le temps d'attente moyen a baissé de 12%",
    "Les commandes à emporter représentent 35% des ventes",
    "Le pic d'affluence se situe entre 12h et 14h"
  ];

  const actionItems = data?.actionItems || [
    "Créer un programme de fidélité renforcé",
    "Optimiser le processus de commande",
    "Améliorer la signalétique pour les nouveaux clients",
    "Développer les offres petit-déjeuner"
  ];

  // Fonction de validation sécurisée pour les chaînes de caractères
  const isValidString = (item: unknown): item is string => {
    return typeof item === 'string';
  };

  return (
    <div className="space-y-6">
      {/* Segmentation des clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Segmentation Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={segmentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {segmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, 'Clients']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Dépense Moyenne par Segment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={segmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => [`${value}€`, 'Dépense moyenne']} />
                <Bar dataKey="avgSpent" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Satisfaction client */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Satisfaction Client par Catégorie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {satisfactionData.map((item, index) => (
              <div key={`satisfaction-${index}`} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{item.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {item.score}/5
                    </span>
                    <Badge variant={item.score >= item.target ? "default" : "secondary"}>
                      {item.score >= item.target ? 'Objectif atteint' : 'À améliorer'}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <Progress value={(item.score / 5) * 100} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Objectif: {item.target}/5</span>
                    <span>{((item.score / 5) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights et actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Insights Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights
                .filter(isValidString)
                .map((insight, index) => (
                <div key={`insight-${index}`} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm text-blue-900">{insight}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              Actions Recommandées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {actionItems
                .filter(isValidString)
                .map((action, index) => (
                <div key={`action-${index}`} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm text-green-900">{action}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métriques détaillées */}
      <Card>
        <CardHeader>
          <CardTitle>Métriques Détaillées</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {segmentData.reduce((sum, segment) => sum + segment.count, 0)}
              </div>
              <div className="text-sm text-purple-600">Clients Total</div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {(segmentData.reduce((sum, segment) => sum + segment.avgSpent * segment.count, 0) / 
                  segmentData.reduce((sum, segment) => sum + segment.count, 0)).toFixed(2)}€
              </div>
              <div className="text-sm text-blue-600">Dépense Moyenne</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {(satisfactionData.reduce((sum, item) => sum + item.score, 0) / satisfactionData.length).toFixed(1)}/5
              </div>
              <div className="text-sm text-green-600">Satisfaction Globale</div>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {Math.round((segmentData.find(s => s.name === 'VIP')?.percentage || 0) * 
                  (segmentData.find(s => s.name === 'VIP')?.avgSpent || 0) / 100)}€
              </div>
              <div className="text-sm text-yellow-600">Valeur Client VIP</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};