/**
 * Composant KPI temps réel
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Clock, Users, TrendingUp, Star, Zap } from 'lucide-react';

interface RealTimeKPIsProps {
  data?: {
    dailyRevenue: number;
    ordersCount: number;
    averageTicket: number;
    customerSatisfaction: number;
    tableOccupancy: number;
    staffEfficiency: number;
  };
}

export const RealTimeKPIs: React.FC<RealTimeKPIsProps> = ({ data }) => {
  if (!data) return null;

  const kpis = [
    {
      title: 'Revenus Aujourd\'hui',
      value: data.dailyRevenue,
      format: 'currency',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      target: 800,
      progress: (data.dailyRevenue / 800) * 100
    },
    {
      title: 'Commandes',
      value: data.ordersCount,
      format: 'number',
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      target: 60,
      progress: (data.ordersCount / 60) * 100
    },
    {
      title: 'Panier Moyen',
      value: data.averageTicket,
      format: 'currency',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      target: 18,
      progress: (data.averageTicket / 18) * 100
    },
    {
      title: 'Satisfaction Client',
      value: data.customerSatisfaction,
      format: 'rating',
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      target: 5,
      progress: (data.customerSatisfaction / 5) * 100
    },
    {
      title: 'Occupation Tables',
      value: data.tableOccupancy * 100,
      format: 'percentage',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      target: 100,
      progress: data.tableOccupancy * 100
    },
    {
      title: 'Efficacité Personnel',
      value: data.staffEfficiency * 100,
      format: 'percentage',
      icon: Zap,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      target: 100,
      progress: data.staffEfficiency * 100
    }
  ];

  const formatValue = (value: number, format: string): string => {
    switch (format) {
      case 'currency':
        return value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'rating':
        return `${value.toFixed(1)}/5`;
      default:
        return value.toLocaleString('fr-FR');
    }
  };

  return (
    <Card className="border-dashed border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          KPI Temps Réel
          <Badge variant="secondary" className="ml-auto">
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpis.map((kpi, index) => (
            <div key={index} className={`p-4 rounded-lg ${kpi.bgColor} border`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                  <span className="text-sm font-medium text-gray-700">
                    {kpi.title}
                  </span>
                </div>
                <Badge 
                  variant={kpi.progress >= 80 ? "default" : kpi.progress >= 60 ? "secondary" : "destructive"}
                  className="text-xs"
                >
                  {kpi.progress.toFixed(0)}%
                </Badge>
              </div>
              
              <div className="text-2xl font-bold mb-2 text-gray-900">
                {formatValue(kpi.value, kpi.format)}
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Objectif: {formatValue(kpi.target, kpi.format)}</span>
                  <span>{kpi.progress.toFixed(1)}%</span>
                </div>
                <Progress value={kpi.progress} className="h-2" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};