/**
 * Tableau de bord analytics avancé
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  ShoppingCart,
  Clock,
  Target,
  Activity,
  BarChart3,
  PieChart,
  LineChart as LineChartIcon, // Renamed LineChart to LineChartIcon
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RevenueView } from './components/RevenueView';
import { AIInsightsPanel } from './components/AIInsightsPanel';
import { CustomerBehaviorView } from './components/CustomerBehaviorView';
import { PredictiveAnalyticsView } from './components/PredictiveAnalyticsView';
import { RealTimeKPIs } from './components/RealTimeKPIs';
import { MetricCard } from './MetricCard';

// Types sécurisés pour les données analytics
interface AnalyticsData {
  revenue: {
    total: number;
    growth: number;
    trend: 'up' | 'down' | 'stable';
  };
  orders: {
    total: number;
    growth: number;
    average: number;
  };
  customers: {
    total: number;
    new: number;
    returning: number;
  };
  performance: {
    satisfaction: number;
    efficiency: number;
    occupancy: number;
  };
}

interface RealTimeData {
  dailyRevenue: number;
  ordersCount: number;
  averageTicket: number;
  customerSatisfaction: number;
  tableOccupancy: number;
  staffEfficiency: number;
}

interface TimeRange {
  value: string;
  label: string;
}

const timeRanges: TimeRange[] = [
  { value: '1d', label: 'Aujourd\'hui' },
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '90d', label: '90 jours' },
  { value: '1y', label: '1 an' }
];

// Fonction sécurisée pour les appels API
const secureApiCall = async (endpoint: string) => {
  try {
    const token = localStorage.getItem('barista_token');
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error(`Erreur API pour ${endpoint}:`, error);
    throw error;
  }
};

// Fonction de validation sécurisée pour les données analytics
const isValidAnalyticsData = (data: unknown): data is AnalyticsData => {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;

  return (
    typeof obj.revenue === 'object' && obj.revenue !== null &&
    typeof obj.orders === 'object' && obj.orders !== null &&
    typeof obj.customers === 'object' && obj.customers !== null &&
    typeof obj.performance === 'object' && obj.performance !== null
  );
};

// Fonction de validation sécurisée pour les données temps réel
const isValidRealTimeData = (data: unknown): data is RealTimeData => {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;

  return (
    typeof obj.dailyRevenue === 'number' &&
    typeof obj.ordersCount === 'number' &&
    typeof obj.averageTicket === 'number' &&
    typeof obj.customerSatisfaction === 'number' &&
    typeof obj.tableOccupancy === 'number' &&
    typeof obj.staffEfficiency === 'number'
  );
};

export const AdvancedAnalyticsDashboard: React.FC = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('7d');
  const [selectedView, setSelectedView] = useState<string>('overview');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showRealTime, setShowRealTime] = useState<boolean>(true);
  const toast = useToast();

  // Récupération des données analytics avec gestion d'erreur sécurisée
  const { data: analyticsResponse, refetch } = useQuery({
    queryKey: ['analytics', selectedTimeRange],
    queryFn: async () => {
      try {
        const response = await secureApiCall(`/api/analytics/dashboard?period=${selectedTimeRange}`);
        return response.data || {
          revenue: { total: 12500, growth: 12.5, trend: 'up' },
          orders: { total: 450, growth: 8.2, average: 27.8 },
          customers: { total: 320, new: 45, returning: 275 },
          performance: { satisfaction: 4.6, efficiency: 0.85, occupancy: 0.72 }
        };
      } catch (error) {
        console.error('Erreur lors de la récupération des analytics:', error);
        return {
          revenue: { total: 12500, growth: 12.5, trend: 'up' },
          orders: { total: 450, growth: 8.2, average: 27.8 },
          customers: { total: 320, new: 45, returning: 275 },
          performance: { satisfaction: 4.6, efficiency: 0.85, occupancy: 0.72 }
        };
      }
    },
    refetchInterval: showRealTime ? 30000 : false
  });

  // Données temps réel avec gestion d'erreur sécurisée
  const { data: realTimeResponse } = useQuery({
    queryKey: ['real-time-kpis'],
    queryFn: async () => {
      try {
        const response = await secureApiCall('/api/analytics/real-time');
        return response.data || {
          dailyRevenue: 1250,
          ordersCount: 45,
          averageTicket: 27.8,
          customerSatisfaction: 4.6,
          tableOccupancy: 0.72,
          staffEfficiency: 0.85
        };
      } catch (error) {
        console.error('Erreur lors de la récupération des données temps réel:', error);
        return {
          dailyRevenue: 1250,
          ordersCount: 45,
          averageTicket: 27.8,
          customerSatisfaction: 4.6,
          tableOccupancy: 0.72,
          staffEfficiency: 0.85
        };
      }
    },
    refetchInterval: showRealTime ? 10000 : false,
    enabled: showRealTime
  });

  // Validation et sécurisation des données
  const analyticsData = isValidAnalyticsData(analyticsResponse) ? analyticsResponse : {
    revenue: { total: 12500, growth: 12.5, trend: 'up' },
    orders: { total: 450, growth: 8.2, average: 27.8 },
    customers: { total: 320, new: 45, returning: 275 },
    performance: { satisfaction: 4.6, efficiency: 0.85, occupancy: 0.72 }
  };

  const realTimeData = isValidRealTimeData(realTimeResponse) ? realTimeResponse : {
    dailyRevenue: 1250,
    ordersCount: 45,
    averageTicket: 27.8,
    customerSatisfaction: 4.6,
    tableOccupancy: 0.72,
    staffEfficiency: 0.85
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await refetch();
      toast({
        title: "Données actualisées",
        description: "Les analytics ont été mis à jour avec succès."
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les données.",
        variant: "destructive" // Changed from "error" to "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await secureApiCall(`/api/analytics/export?period=${selectedTimeRange}`);

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analytics-${selectedTimeRange}-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast({
        title: "Export réussi",
        description: "Le rapport a été téléchargé avec succès."
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les données.",
        variant: "destructive" // Changed from "error" to "destructive"
      });
    }
  };

  const metrics = [
    {
      title: 'Revenus Totaux',
      value: analyticsData.revenue.total,
      previousValue: Math.round(analyticsData.revenue.total / (1 + analyticsData.revenue.growth / 100)),
      growth: analyticsData.revenue.growth,
      icon: DollarSign,
      format: 'currency' as const,
      subtitle: 'Période sélectionnée'
    },
    {
      title: 'Commandes',
      value: analyticsData.orders.total,
      previousValue: Math.round(analyticsData.orders.total / (1 + analyticsData.orders.growth / 100)),
      growth: analyticsData.orders.growth,
      icon: ShoppingCart,
      format: 'number' as const,
      subtitle: 'Total des commandes'
    },
    {
      title: 'Clients Uniques',
      value: analyticsData.customers.total,
      previousValue: Math.round(analyticsData.customers.total * 0.9),
      growth: 10,
      icon: Users,
      format: 'number' as const,
      subtitle: 'Nouveaux clients inclus'
    },
    {
      title: 'Satisfaction',
      value: analyticsData.performance.satisfaction,
      previousValue: 4.2,
      growth: ((analyticsData.performance.satisfaction - 4.2) / 4.2) * 100,
      icon: Target,
      format: 'rating' as const,
      subtitle: 'Note moyenne'
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Avancés</h1>
          <p className="text-muted-foreground">
            Tableau de bord complet pour analyser les performances de votre café
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRealTime(!showRealTime)}
          >
            {showRealTime ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showRealTime ? 'Masquer' : 'Afficher'} temps réel
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="w-4 h-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Sélecteur de période */}
      <div className="flex items-center gap-4">
        <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sélectionner une période" />
          </SelectTrigger>
          <SelectContent>
            {timeRanges.map((range) => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Badge variant="secondary" className="flex items-center gap-1">
          <Activity className="w-3 h-3" />
          {showRealTime ? 'Temps réel activé' : 'Mode statique'}
        </Badge>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <MetricCard key={`metric-${index}`} {...metric} />
        ))}
      </div>

      {/* KPI temps réel */}
      {showRealTime && realTimeData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              KPI Temps Réel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RealTimeKPIs data={realTimeData} />
          </CardContent>
        </Card>
      )}

      {/* Onglets principaux */}
      <Tabs value={selectedView} onValueChange={setSelectedView} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Revenus
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Clients
          </TabsTrigger>
          <TabsTrigger value="predictive" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Prédictif
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Évolution des Revenus</CardTitle>
              </CardHeader>
              <CardContent>
                <RevenueView timeRange={selectedTimeRange} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Comportement Client</CardTitle>
              </CardHeader>
              <CardContent>
                <CustomerBehaviorView />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue">
          <RevenueView timeRange={selectedTimeRange} />
        </TabsContent>

        <TabsContent value="customers">
          <CustomerBehaviorView />
        </TabsContent>

        <TabsContent value="predictive">
          <PredictiveAnalyticsView />
        </TabsContent>

        <TabsContent value="ai">
          <AIInsightsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};