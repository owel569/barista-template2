
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePicker } from '@/components/ui/date-picker';
import { BarChart3, Download, Filter, TrendingUp } from 'lucide-react';
import { apiRequest } from '@/lib/api-utils';

// Types TypeScript précis
interface AnalyticsKPIs {
  revenue: {
    current: number;
    previous: number;
    growth: number;
  };
  orders: {
    total: number;
    delivered: number;
    pending: number;
    cancelled: number;
    completionRate: number;
  };
  customers: {
    new: number;
    growth: number;
  };
  averageOrder: {
    current: number;
    previous: number;
    growth: number;
  };
}

interface RevenueData {
  period: string;
  revenue: number;
  orders: number;
  average: number;
}

interface TopProduct {
  id: string;
  name: string;
  revenue: number;
  quantity: number;
}

type AnalyticsPeriod = 'today' | 'week' | 'month' | 'year';

const AnalyticsPage: React.FC = () => {
  const [period, setPeriod] = useState<AnalyticsPeriod>('month');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const { data: kpis, isLoading: kpisLoading } = useQuery<AnalyticsKPIs>({
    queryKey: ['analytics-kpis', period],
    queryFn: () => apiRequest<{ data: AnalyticsKPIs }>('GET', '/api/analytics/kpis', {
      params: { period, compare: 'true' }
    }).then(res => res.data)
  });

  const { data: revenueData, isLoading: revenueLoading } = useQuery<RevenueData[]>({
    queryKey: ['analytics-revenue', period, startDate, endDate],
    queryFn: () => apiRequest<{ data: { revenue: RevenueData[] } }>('GET', '/api/analytics/revenue', {
      params: {
        period,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString()
      }
    }).then(res => res.data.revenue)
  });

  const { data: topProducts, isLoading: productsLoading } = useQuery<TopProduct[]>({
    queryKey: ['analytics-top-products', period],
    queryFn: () => apiRequest<{ data: TopProduct[] }>('GET', '/api/analytics/top-products', {
      params: { period, limit: '10' }
    }).then(res => res.data)
  });

  const isLoading = kpisLoading || revenueLoading || productsLoading;

  const handleExport = async () => {
    try {
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ period, startDate, endDate })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${period}-${new Date().toISOString().split('T')[0]}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Erreur export:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* En-tête avec filtres */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytiques</h1>
          <p className="text-muted-foreground">
            Analyses détaillées de votre activité
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(value: AnalyticsPeriod) => setPeriod(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Aujourd'hui</SelectItem>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* KPIs principaux */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'Affaires</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR'
              }).format(kpis?.revenue.current || 0)}
            </div>
            <p className={`text-xs ${kpis?.revenue.growth && kpis.revenue.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {kpis?.revenue.growth > 0 ? '+' : ''}{kpis?.revenue.growth.toFixed(1)}% vs période précédente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.orders.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              Taux de réussite: {kpis?.orders.completionRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nouveaux Clients</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.customers.new || 0}</div>
            <p className={`text-xs ${kpis?.customers.growth && kpis.customers.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {kpis?.customers.growth > 0 ? '+' : ''}{kpis?.customers.growth.toFixed(1)}% vs période précédente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR'
              }).format(kpis?.averageOrder.current || 0)}
            </div>
            <p className={`text-xs ${kpis?.averageOrder.growth && kpis.averageOrder.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {kpis?.averageOrder.growth > 0 ? '+' : ''}{kpis?.averageOrder.growth.toFixed(1)}% vs période précédente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Onglets détaillés */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenus</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="customers">Clients</TabsTrigger>
          <TabsTrigger value="trends">Tendances</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Évolution du Chiffre d'Affaires</CardTitle>
              <CardDescription>
                Revenus par période avec détail des commandes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <p className="text-muted-foreground">
                  Graphique des revenus - {revenueData?.length || 0} points de données
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Produits les Plus Vendus</CardTitle>
              <CardDescription>
                Top 10 des articles par chiffre d'affaires
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topProducts?.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium">#{index + 1}</span>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.quantity} vendus
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: 'EUR'
                        }).format(product.revenue)}
                      </p>
                    </div>
                  </div>
                )) || (
                  <p className="text-muted-foreground">Aucune donnée disponible</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>Analyse Clientèle</CardTitle>
              <CardDescription>
                Comportement et segmentation des clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <p className="text-muted-foreground">
                  Analyses clients à venir...
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Tendances et Prédictions</CardTitle>
              <CardDescription>
                Analyses prédictives basées sur l'IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <p className="text-muted-foreground">
                  Module de prédictions à venir...
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsPage;
