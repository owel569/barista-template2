/**
 * Tableau de bord Analytics Avancées - Optimisé selon spécifications
 * Refactorisation complète en composants modulaires
 */

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Package, 
  Star,
  Download,
  Calendar,
  Clock,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Brain,
  Zap
} from 'lucide-react';
import { ApiClient } from '@/lib/auth-utils';
import { toast } from '@/hooks/use-toast';

// Composants modulaires extraits
import { MetricCard } from './components/MetricCard';
import { RevenueView } from './components/RevenueView';
import { CustomerBehaviorView } from './components/CustomerBehaviorView';
import { PredictiveAnalyticsView } from './components/PredictiveAnalyticsView';
import { RealTimeKPIs } from './components/RealTimeKPIs';
import { AIInsightsPanel } from './components/AIInsightsPanel';

interface AnalyticsData {
  overview: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    averageOrderValue: number;
    growthRate: number;
    predictions: {
      nextWeekRevenue: number;
      nextWeekOrders: number;
      confidence: number;
    };
  };
  realTimeKPIs: {
    dailyRevenue: number;
    ordersCount: number;
    averageTicket: number;
    customerSatisfaction: number;
    tableOccupancy: number;
    staffEfficiency: number;
  };
  customerBehavior: {
    segments: {
      vip: { count: number; percentage: number; avgSpent: number };
      regular: { count: number; percentage: number; avgSpent: number };
      occasional: { count: number; percentage: number; avgSpent: number };
    };
    insights: string[];
    actionItems: string[];
  };
  priceOptimization: {
    recommendations: Array<{
      item: string;
      currentPrice: number;
      suggestedPrice: number;
      expectedIncrease: string;
      reasoning: string;
    }>;
    totalImpact: string;
  };
  satisfaction: {
    overall: number;
    categories: {
      food: number;
      service: number;
      ambiance: number;
      pricing: number;
    };
    trends: {
      month: string;
      quarter: string;
    };
    alerts: string[];
    improvements: string[];
  };
  growthOpportunities: {
    opportunities: Array<{
      type: string;
      title: string;
      potential: string;
      investment: string;
      roi: string;
    }>;
    priorityMatrix: {
      quickWins: string[];
      strategic: string[];
      experimental: string[];
    };
  };
}

const AdvancedAnalyticsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedView, setSelectedView] = useState('overview');
  const [isExporting, setIsExporting] = useState(false);

  // Chargement des données analytics
  const { data: analyticsData, isLoading, refetch } = useQuery({
    queryKey: ['advanced-analytics', timeRange],
    queryFn: async () => {
      const [
        salesPrediction,
        customerBehavior,
        priceOptimization,
        satisfaction,
        growthOpportunities,
        realTimeKPIs
      ] = await Promise.all([
        ApiClient.get('/api/advanced/analytics/predict-sales?timeframe=monthly'),
        ApiClient.get('/api/advanced/analytics/customer-behavior'),
        ApiClient.get('/api/advanced/analytics/price-optimization'),
        ApiClient.get('/api/advanced/analytics/satisfaction'),
        ApiClient.get('/api/advanced/analytics/growth-opportunities'),
        ApiClient.get('/api/advanced/analytics/realtime-kpis')
      ]);

      return {
        overview: {
          totalRevenue: 45320,
          totalOrders: 1250,
          totalCustomers: 890,
          averageOrderValue: 36.26,
          growthRate: 12.5,
          predictions: {
            nextWeekRevenue: salesPrediction.prediction.revenue,
            nextWeekOrders: salesPrediction.prediction.orders,
            confidence: salesPrediction.prediction.confidence
          }
        },
        realTimeKPIs: realTimeKPIs,
        customerBehavior: customerBehavior,
        priceOptimization: priceOptimization,
        satisfaction: satisfaction,
        growthOpportunities: growthOpportunities
      };
    },
    refetchInterval: 60000 // Actualisation toutes les minutes
  });

  // Export des données
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const exportData = {
        timestamp: new Date().toISOString(),
        timeRange,
        data: analyticsData
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export réussi",
        description: "Les données analytics ont été exportées avec succès"
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Une erreur est survenue lors de l'export",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Chargement des analytics avancées...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec contrôles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics Avancées</h1>
          <p className="text-muted-foreground mt-2">
            Analyse prédictive et intelligence artificielle pour votre restaurant
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 derniers jours</SelectItem>
              <SelectItem value="30d">30 derniers jours</SelectItem>
              <SelectItem value="90d">90 derniers jours</SelectItem>
              <SelectItem value="1y">1 an</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            onClick={handleExport}
            disabled={isExporting}
            variant="outline"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Export...' : 'Exporter'}
          </Button>
          
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

      {/* KPI temps réel */}
      <RealTimeKPIs data={analyticsData?.realTimeKPIs} />

      {/* Panneau d'insights IA */}
      <AIInsightsPanel />

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Revenus Total"
          value={analyticsData?.overview.totalRevenue || 0}
          previousValue={40280}
          growth={analyticsData?.overview.growthRate || 0}
          icon={DollarSign}
          format="currency"
        />
        
        <MetricCard
          title="Commandes"
          value={analyticsData?.overview.totalOrders || 0}
          previousValue={1120}
          growth={11.6}
          icon={Package}
          format="number"
        />
        
        <MetricCard
          title="Clients"
          value={analyticsData?.overview.totalCustomers || 0}
          previousValue={820}
          growth={8.5}
          icon={Users}
          format="number"
        />
        
        <MetricCard
          title="Panier Moyen"
          value={analyticsData?.overview.averageOrderValue || 0}
          previousValue={34.80}
          growth={4.2}
          icon={Target}
          format="currency"
        />
      </div>

      {/* Prédictions IA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Prédictions IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {analyticsData?.overview.predictions.nextWeekRevenue?.toLocaleString('fr-FR', { 
                  style: 'currency', 
                  currency: 'EUR' 
                }) || '0 €'}
              </div>
              <div className="text-sm text-muted-foreground">Revenus prévus semaine prochaine</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {analyticsData?.overview.predictions.nextWeekOrders || 0}
              </div>
              <div className="text-sm text-muted-foreground">Commandes prévues</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round((analyticsData?.overview.predictions.confidence || 0) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Confiance prédiction</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Onglets des analyses */}
      <Tabs value={selectedView} onValueChange={setSelectedView}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="revenue">Revenus</TabsTrigger>
          <TabsTrigger value="customers">Clients</TabsTrigger>
          <TabsTrigger value="predictions">Prédictions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <RevenueView timeRange={timeRange} />
        </TabsContent>
        
        <TabsContent value="revenue" className="space-y-6">
          <RevenueView timeRange={timeRange} />
        </TabsContent>
        
        <TabsContent value="customers" className="space-y-6">
          <CustomerBehaviorView data={analyticsData?.customerBehavior} />
        </TabsContent>
        
        <TabsContent value="predictions" className="space-y-6">
          <PredictiveAnalyticsView data={analyticsData} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;