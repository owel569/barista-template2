import React, { useState, useEffect } from 'react';
import { exportToJSON, exportToCSV, exportToExcel } from './analytics/ExportUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, ShoppingCart, DollarSign, 
  Target, Download 
} from 'lucide-react';

// Import des composants modulaires
import MetricCard from './analytics/MetricCard';
import RevenueView from './analytics/RevenueView';
import ProductView from './analytics/ProductView';
import HourView from './analytics/HourView';
import TrendsView from './analytics/TrendsView';

// Import des utilitaires
import { 
  generateRevenueData, 
  generateProductData, 
  generateHourlyData, 
  generateTrendsData,
  generateMetrics 
} from './analytics/dataGenerators';

export default function AnalyticsDashboard(): JSX.Element {
  const [timeRange, setTimeRange] = useState('7d');
  const [metrics, setMetrics] = useState(generateMetrics('7d'));
  const [revenueData, setRevenueData] = useState(generateRevenueData('7d'));
  const [productData, setProductData] = useState(generateProductData('7d'));
  const [hourlyData, setHourlyData] = useState(generateHourlyData('7d'));
  const [trendsData, setTrendsData] = useState(generateTrendsData('7d'));

  // Mise à jour des données quand la période change
  useEffect(() => {
    setMetrics(generateMetrics(timeRange));
    setRevenueData(generateRevenueData(timeRange));
    setProductData(generateProductData(timeRange));
    setHourlyData(generateHourlyData(timeRange));
    setTrendsData(generateTrendsData(timeRange));
  }, [timeRange]);

  // Fonction d'export améliorée
  const handleExport = (format: 'json' | 'csv' | 'excel') => {
    const exportData = {
      metrics,
      revenueData,
      productData,
      hourlyData,
      trendsData,
      timeRange,
      exportDate: new Date().toISOString()
    };

    const filename = `analytics-dashboard-${timeRange}-${new Date().toISOString().split('T')[0]}`;

    switch (format) {
      case 'json':
        exportToJSON(exportData, filename);
        break;
      case 'csv':
        exportToCSV(revenueData, filename);
        break;
      case 'excel':
        exportToExcel(revenueData, filename);
        break;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Avancées</h2>
          <p className="text-muted-foreground">
            Analyse détaillée des performances de votre café
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="90d">90 jours</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => handleExport('json')}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Chiffre d'affaires"
          value={metrics.revenue.current}
          previousValue={metrics.revenue.previous}
          growth={metrics.revenue.growth}
          icon={DollarSign}
          format="currency"
        />
        <MetricCard
          title="Nombre de commandes"
          value={metrics.orders.current}
          previousValue={metrics.orders.previous}
          growth={metrics.orders.growth}
          icon={ShoppingCart}
        />
        <MetricCard
          title="Clients uniques"
          value={metrics.customers.current}
          previousValue={metrics.customers.previous}
          growth={metrics.customers.growth}
          icon={Users}
        />
        <MetricCard
          title="Panier moyen"
          value={metrics.avgOrderValue.current}
          previousValue={metrics.avgOrderValue.previous}
          growth={metrics.avgOrderValue.growth}
          icon={Target}
          format="currency"
        />
      </div>

      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenus</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="hours">Heures de pointe</TabsTrigger>
          <TabsTrigger value="trends">Tendances</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <RevenueView data={revenueData} timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <ProductView data={productData} timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="hours" className="space-y-4">
          <HourView data={hourlyData} timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <TrendsView data={trendsData} timeRange={timeRange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}