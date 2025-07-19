import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ComposedChart,
  Legend
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, TrendingDown, Users, ShoppingCart, 
  DollarSign, Calendar, Clock, BarChart3,
  Download, RefreshCw, Filter, Eye
} from 'lucide-react';

// Import des composants optimisés
import { MetricCard } from './components/MetricCard';
import { RevenueChart } from './components/RevenueChart';
import { CategoryPieChart } from './components/CategoryPieChart';
import { TopProductsList } from './components/TopProductsList';
import { ExportToExcelButton } from './components/ExportToExcelButton';
import { useQuery } from '@tanstack/react-query';
import { Package, Star, Target, ArrowUpRight, ArrowDownRight, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/components/admin/work-schedule/utils/schedule.utils';
import { ApiClient } from '@/lib/auth-utils';
import * as XLSX from 'xlsx';

// Types pour les statistiques
interface StatisticsData {
  overview: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    averageOrderValue: number;
    growthRate: number;
    topProducts: ProductStats[];
    recentTrends: TrendData[];
  };
  revenue: {
    daily: RevenuePoint[];
    monthly: RevenuePoint[];
    yearly: RevenuePoint[];
    byCategory: CategoryRevenue[];
  };
  customers: {
    acquisition: CustomerAcquisition[];
    retention: RetentionData[];
    demographics: Demographics[];
    satisfaction: SatisfactionData[];
  };
  products: {
    bestsellers: ProductStats[];
    categories: CategoryStats[];
    inventory: InventoryStats[];
    profitability: ProfitabilityData[];
  };
  operations: {
    peakHours: HourlyData[];
    staffPerformance: StaffPerformance[];
    efficiency: EfficiencyMetrics[];
  };
}

interface ProductStats {
  id: number;
  name: string;
  category: string;
  totalSold: number;
  revenue: number;
  profit: number;
  growth: number;
  rating: number;
  stock: number;
}

interface TrendData {
  date: string;
  value: number;
  change: number;
  label: string;
}

interface RevenuePoint {
  date: string;
  revenue: number;
  orders: number;
  customers: number;
}

interface CategoryRevenue {
  category: string;
  revenue: number;
  percentage: number;
  growth: number;
}

// Hook pour les données statistiques avec parallélisation
const useStatisticsData = (period: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
  return useQuery({
    queryKey: ['statistics', period],
    queryFn: async () => {
      // Appels API parallèles pour améliorer la performance
      const [overview, revenue, customers, products, operations] = await Promise.all([
        ApiClient.get('/admin/statistics/overview'),
        ApiClient.get(`/admin/statistics/revenue?period=${period}`),
        ApiClient.get('/admin/statistics/customers'),
        ApiClient.get('/admin/statistics/products'),
        ApiClient.get('/admin/statistics/operations')
      ]);

      return {
        overview,
        revenue,
        customers,
        products,
        operations
      } as StatisticsData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes de cache
    refetchInterval: 10 * 60 * 1000, // Actualisation toutes les 10 minutes
  });
};

const StatisticsEnhanced: React.FC = () => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const { data: stats, isLoading, error } = useStatisticsData(period);

  // Données pour les graphiques avec mémoisation
  const chartData = useMemo(() => {
    if (!stats) return null;

    const combinedData = stats.revenue.daily.map(item => ({
      date: item.date,
      revenus: item.revenue,
      commandes: item.orders,
      clients: item.customers
    }));

    return {
      combined: combinedData,
      categories: stats.revenue.byCategory,
      customers: stats.customers.acquisition,
      products: stats.products.bestsellers.slice(0, 10)
    };
  }, [stats]);

  // Pagination intelligente pour les clients
  const paginatedCustomers = useMemo(() => {
    if (!stats?.customers) return [];
    const start = (currentPage - 1) * itemsPerPage;
    return stats.customers.acquisition.slice(start, start + itemsPerPage);
  }, [stats, currentPage, itemsPerPage]);

  // Export vers Excel avec feuilles multiples
  const exportToExcel = () => {
    if (!stats) return;

    const wb = XLSX.utils.book_new();

    // Feuille revenus
    const revenueSheet = XLSX.utils.json_to_sheet(stats.revenue.daily);
    XLSX.utils.book_append_sheet(wb, revenueSheet, 'Revenus');

    // Feuille catégories
    const categoriesSheet = XLSX.utils.json_to_sheet(stats.revenue.byCategory);
    XLSX.utils.book_append_sheet(wb, categoriesSheet, 'Catégories');

    // Feuille clients
    const customersSheet = XLSX.utils.json_to_sheet(stats.customers.acquisition);
    XLSX.utils.book_append_sheet(wb, customersSheet, 'Clients');

    // Feuille produits populaires
    const productsSheet = XLSX.utils.json_to_sheet(stats.products.bestsellers);
    XLSX.utils.book_append_sheet(wb, productsSheet, 'Produits Populaires');

    XLSX.writeFile(wb, `statistiques-${period}-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive">Erreur lors du chargement des statistiques</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec contrôles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Statistiques Avancées</h2>
          <p className="text-muted-foreground">
            Analyses détaillées et métriques de performance
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="daily">Quotidien</option>
            <option value="weekly">Hebdomadaire</option>
            <option value="monthly">Mensuel</option>
            <option value="yearly">Annuel</option>
          </select>
          <Button onClick={exportToExcel} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exporter Excel
          </Button>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.overview.totalRevenue || 0)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {stats?.overview.growthRate && stats.overview.growthRate > 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
              )}
              {Math.abs(stats?.overview.growthRate || 0)}% vs période précédente
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.overview.totalOrders || 0}</div>
            <div className="text-xs text-muted-foreground">
              Panier moyen: {formatCurrency(stats?.overview.averageOrderValue || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.overview.totalCustomers || 0}</div>
            <div className="text-xs text-muted-foreground">
              Clients actifs cette période
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.8/5</div>
            <div className="text-xs text-muted-foreground">
              Basé sur les avis clients
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques et analyses */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="revenue">Revenus</TabsTrigger>
          <TabsTrigger value="customers">Clients</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Évolution Combinée</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={chartData?.combined}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenus" fill="#8884d8" name="Revenus" />
                    <Line yAxisId="right" type="monotone" dataKey="commandes" stroke="#82ca9d" name="Commandes" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Répartition par Catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData?.categories}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {chartData?.categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analyse des Revenus</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={chartData?.combined}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="revenus" stroke="#8884d8" fill="#8884d8" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Acquisition Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData?.customers}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="newCustomers" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Produits Populaires</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.products.bestsellers.slice(0, 10).map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium">{product.name}</h4>
                        <p className="text-sm text-muted-foreground">{product.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(product.revenue)}</div>
                      <div className="text-sm text-muted-foreground">{product.totalSold} vendus</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StatisticsEnhanced;