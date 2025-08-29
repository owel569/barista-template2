import { useState, useEffect } from 'react';
import { exportToJSON, exportToCSV, exportToExcel } from './analytics/ExportUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, ShoppingCart, DollarSign, Target, Download } from 'lucide-react';

// Composants modulaires
import { MetricCard } from '@/components/admin/analytics/MetricCard';
import RevenueView from './analytics/RevenueView';
import ProductView from './analytics/ProductView';
import HourView from './analytics/HourView';
import TrendsView from './analytics/TrendsView';

// Utilitaires de données
import { 
  generateRevenueData, 
  generateProductData, 
  generateHourlyData, 
  generateTrendsData,
  generateMetrics 
} from './analytics/dataGenerators';

// Types
interface ExportData extends Record<string, unknown> {
  metrics: ReturnType<typeof generateMetrics>;
  revenueData: ReturnType<typeof generateRevenueData>;
  productData: ReturnType<typeof generateProductData>;
  hourlyData: ReturnType<typeof generateHourlyData>;
  trendsData: ReturnType<typeof generateTrendsData>;
  timeRange: string;
  exportDate: string;
}

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('7d');
  const [metrics, setMetrics] = useState(() => generateMetrics(timeRange));
  const [revenueData, setRevenueData] = useState(() => generateRevenueData(timeRange));
  const [productData, setProductData] = useState(() => generateProductData(timeRange));
  const [hourlyData, setHourlyData] = useState(() => generateHourlyData(timeRange));
  const [trendsData, setTrendsData] = useState(() => generateTrendsData(timeRange));

  // Mise à jour des données quand la période change
  useEffect(() => {
    const updateData = () => {
      setMetrics(generateMetrics(timeRange));
      setRevenueData(generateRevenueData(timeRange));
      setProductData(generateProductData(timeRange));
      setHourlyData(generateHourlyData(timeRange));
      setTrendsData(generateTrendsData(timeRange));
    };

    updateData();
  }, [timeRange]);

  // Gestion de l'export des données
  const handleExport = (format: 'json' | 'csv' | 'excel') => {
    const exportData: ExportData = {
      metrics,
      revenueData,
      productData,
      hourlyData,
      trendsData,
      timeRange,
      exportDate: new Date().toISOString()
    };

    const dateString = new Date().toISOString().split('T')[0];
    const filename = `cafe-analytics-${timeRange}-${dateString}`;

    switch (format) {
      case 'json':
        exportToJSON(exportData, filename);
        break;
      case 'csv':
        // Export plus complet pour CSV
        const csvData = [
          {
            revenue: metrics.revenue.current,
            orders: metrics.orders.current,
            customers: metrics.customers.current,
            avgOrderValue: metrics.avgOrderValue.current
          }
        ];
        exportToCSV(csvData, filename);
        break;
      case 'excel':
        const excelData = [
          {
            revenue: metrics.revenue.current,
            orders: metrics.orders.current,
            customers: metrics.customers.current,
            avgOrderValue: metrics.avgOrderValue.current
          }
        ];
        exportToExcel(excelData, filename);
        break;
      default:
        console.warn(`Format d'export non supporté: ${format}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tableau de Bord Analytique</h2>
          <p className="text-muted-foreground">
            Analyse complète des performances de votre établissement
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="90d">90 jours</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleExport('json')}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Chiffre d'affaires"
          value={metrics.revenue.current}
          previousValue={metrics.revenue.previous}
          growth={metrics.revenue.growth}
          icon={DollarSign}
          format="currency"
        />
        <MetricCard
          title="Commandes"
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenus</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="hours">Fréquentation</TabsTrigger>
          <TabsTrigger value="trends">Tendances</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Analyse des revenus</CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueView data={revenueData} timeRange={timeRange} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Performance des produits</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductView data={productData} timeRange={timeRange} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle>Heures d'affluence</CardTitle>
            </CardHeader>
            <CardContent>
              <HourView data={hourlyData} timeRange={timeRange} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Tendances clés</CardTitle>
            </CardHeader>
            <CardContent>
              <TrendsView data={trendsData} timeRange={timeRange} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}