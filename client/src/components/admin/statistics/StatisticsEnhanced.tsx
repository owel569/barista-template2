import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, DollarSign, ShoppingCart, 
  Calendar, Download, Filter, RefreshCw, Eye, Star
} from 'lucide-react';

// Types professionnels stricts pour le restaurant
interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
  customers: number;
}

interface ProductSales {
  name: string;
  sales: number;
  revenue: number;
  category: string;
}

interface CustomerMetrics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  averageOrderValue: number;
}

interface OrderMetrics {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  averagePreparationTime: number;
}

interface HourlyData {
  hour: string;
  orders: number;
  revenue: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface StatisticsPeriod {
  label: string;
  value: string;
  days: number;
}

interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  period: string;
  includeCharts: boolean;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

const PERIODS: StatisticsPeriod[] = [
  { label: 'Aujourd\'hui', value: 'today', days: 1 },
  { label: '7 derniers jours', value: '7days', days: 7 },
  { label: '30 derniers jours', value: '30days', days: 30 },
  { label: '90 derniers jours', value: '90days', days: 90 },
  { label: 'Cette année', value: 'year', days: 365 }
];

export default function StatisticsEnhanced(): JSX.Element {
  // États avec types stricts
  const [selectedPeriod, setSelectedPeriod] = useState<string>('7days');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [selectedView, setSelectedView] = useState<string>('overview');

  // Données avec types professionnels
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [productSales, setProductSales] = useState<ProductSales[]>([]);
  const [customerMetrics, setCustomerMetrics] = useState<CustomerMetrics>({
    totalCustomers: 0,
    newCustomers: 0,
    returningCustomers: 0,
    averageOrderValue: 0
  });
  const [orderMetrics, setOrderMetrics] = useState<OrderMetrics>({
    totalOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    averagePreparationTime: 0
  });
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);

  // Génération de données de démonstration professionnelles
  const generateMockData = useMemo(() => {
    const period = PERIODS.find(p => p.value === selectedPeriod);
    if (!period) return;

    const days = period.days;
    const today = new Date();

    // Données de revenus
    const revenue: RevenueData[] = Array.from({ length: days }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (days - i - 1));
      return {
        date: date.toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 2000) + 500,
        orders: Math.floor(Math.random() * 50) + 10,
        customers: Math.floor(Math.random() * 40) + 8
      };
    });

    // Produits les plus vendus
    const products: ProductSales[] = [
      { name: 'Espresso', sales: 245, revenue: 735, category: 'Boissons chaudes' },
      { name: 'Cappuccino', sales: 189, revenue: 851, category: 'Boissons chaudes' },
      { name: 'Croissant', sales: 156, revenue: 468, category: 'Viennoiseries' },
      { name: 'Sandwich jambon', sales: 134, revenue: 938, category: 'Sandwichs' },
      { name: 'Salade César', sales: 98, revenue: 1176, category: 'Salades' }
    ];

    // Données par heure
    const hourly: HourlyData[] = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      orders: Math.floor(Math.random() * 15) + 1,
      revenue: Math.floor(Math.random() * 300) + 50
    }));

    // Données par catégorie
    const categories: CategoryData[] = [
      { name: 'Boissons chaudes', value: 45, color: COLORS[0] },
      { name: 'Viennoiseries', value: 25, color: COLORS[1] },
      { name: 'Sandwichs', value: 20, color: COLORS[2] },
      { name: 'Salades', value: 10, color: COLORS[3] }
    ];

    setRevenueData(revenue);
    setProductSales(products);
    setHourlyData(hourly);
    setCategoryData(categories);

    // Métriques calculées
    const totalRevenue = revenue.reduce((sum, day) => sum + day.revenue, 0);
    const totalOrders = revenue.reduce((sum, day) => sum + day.orders, 0);
    const totalCustomers = revenue.reduce((sum, day) => sum + day.customers, 0);

    setCustomerMetrics({
      totalCustomers,
      newCustomers: Math.floor(totalCustomers * 0.3),
      returningCustomers: Math.floor(totalCustomers * 0.7),
      averageOrderValue: totalRevenue / totalOrders
    });

    setOrderMetrics({
      totalOrders,
      completedOrders: Math.floor(totalOrders * 0.95),
      cancelledOrders: Math.floor(totalOrders * 0.05),
      averagePreparationTime: 12
    });
  }, [selectedPeriod]);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      generateMockData;
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [generateMockData]);

  // Fonction d'export professionnelle
  const handleExport = async (options: ExportOptions): Promise<void> => {
    setIsExporting(true);
    try {
      // Simulation d'export
      await new Promise(resolve => setTimeout(resolve, 2000));

      const data = {
        period: selectedPeriod,
        revenue: revenueData,
        products: productSales,
        customers: customerMetrics,
        orders: orderMetrics
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `barista-cafe-stats-${selectedPeriod}.${options.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Calculs de performance
  const performanceMetrics = useMemo(() => {
    const currentPeriodRevenue = revenueData.reduce((sum, day) => sum + day.revenue, 0);
    const averageDailyRevenue = currentPeriodRevenue / revenueData.length;
    const completionRate = orderMetrics.totalOrders > 0 
      ? (orderMetrics.completedOrders / orderMetrics.totalOrders) * 100 
      : 0;

    return {
      totalRevenue: currentPeriodRevenue,
      averageDailyRevenue,
      completionRate,
      customerSatisfaction: 4.7
    };
  }, [revenueData, orderMetrics]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* En-tête avec contrôles */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Statistiques Avancées</h1>
          <p className="text-gray-600">Barista Café - Analyse professionnelle</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sélectionner période" />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map(period => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => handleExport({ format: 'excel', period: selectedPeriod, includeCharts: true })}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Export...' : 'Exporter'}
          </Button>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Chiffre d'affaires
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceMetrics.totalRevenue.toLocaleString('fr-FR')} €
            </div>
            <p className="text-xs text-gray-600">
              Moy. {performanceMetrics.averageDailyRevenue.toFixed(0)} €/jour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Commandes
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orderMetrics.totalOrders.toLocaleString('fr-FR')}
            </div>
            <div className="flex items-center">
              <Progress value={performanceMetrics.completionRate} className="flex-1 mr-2" />
              <span className="text-xs text-gray-600">
                {performanceMetrics.completionRate.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Clients
            </CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customerMetrics.totalCustomers.toLocaleString('fr-FR')}
            </div>
            <p className="text-xs text-gray-600">
              {customerMetrics.newCustomers} nouveaux clients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Satisfaction
            </CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceMetrics.customerSatisfaction}/5
            </div>
            <p className="text-xs text-gray-600">
              Temps moy. préparation: {orderMetrics.averagePreparationTime}min
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques détaillés */}
      <Tabs value={selectedView} onValueChange={setSelectedView}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="revenue">Revenus</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="hours">Heures de pointe</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Évolution du chiffre d'affaires</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`${value} €`, 'Revenus']} />
                    <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Répartition par catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Évolution détaillée des revenus</CardTitle>
              <CardDescription>
                Analyse complète des performances financières
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenus (€)" />
                  <Line type="monotone" dataKey="orders" stroke="#82ca9d" name="Commandes" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Produits les plus vendus</CardTitle>
              <CardDescription>
                Top des ventes par produit et catégorie
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={productSales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sales" fill="#8884d8" name="Ventes" />
                  <Bar dataKey="revenue" fill="#82ca9d" name="Revenus (€)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle>Activité par heure</CardTitle>
              <CardDescription>
                Analyse des heures de pointe du restaurant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="orders" stackId="1" stroke="#8884d8" fill="#8884d8" name="Commandes" />
                  <Area type="monotone" dataKey="revenue" stackId="2" stroke="#82ca9d" fill="#82ca9d" name="Revenus (€)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}