import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText, TrendingUp, TrendingDown, Users, Euro, Package, Calendar, BarChart3, PieChart, LineChart, RefreshCw, Filter, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ApiClient } from '@/lib/auth-utils';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, AreaChart, Area } from 'recharts';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

// Types pour les données statistiques
interface RevenueData {
  period: string;
  revenue: number;
  orders: number;
  customers: number;
  growth: number;
}

interface CategoryData {
  category: string;
  revenue: number;
  orders: number;
  percentage: number;
}

interface CustomerData {
  id: number;
  name: string;
  email: string;
  totalSpent: number;
  orders: number;
  loyaltyPoints: number;
  lastVisit: string;
  growthRate: number;
}

interface PopularItem {
  id: number;
  name: string;
  category: string;
  sales: number;
  revenue: number;
  growth: number;
  imageUrl?: string;
}

interface StatsSummary {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  revenueGrowth: number;
  orderGrowth: number;
  customerGrowth: number;
}

// Données mock pour les statistiques (à remplacer par des appels API réels)
const mockRevenueData: RevenueData[] = [
  { period: 'Jan', revenue: 12500, orders: 145, customers: 89, growth: 12.5 },
  { period: 'Fév', revenue: 13200, orders: 156, customers: 94, growth: 5.6 },
  { period: 'Mar', revenue: 14800, orders: 178, customers: 102, growth: 12.1 },
  { period: 'Avr', revenue: 13900, orders: 167, customers: 98, growth: -6.1 },
  { period: 'Mai', revenue: 15600, orders: 189, customers: 108, growth: 12.2 },
  { period: 'Jun', revenue: 16200, orders: 195, customers: 112, growth: 3.8 },
  { period: 'Jul', revenue: 17500, orders: 212, customers: 118, growth: 8.0 },
];

const mockCategoryData: CategoryData[] = [
  { category: 'Cafés', revenue: 45200, orders: 890, percentage: 42.8 },
  { category: 'Pâtisseries', revenue: 28900, orders: 567, percentage: 27.4 },
  { category: 'Plats', revenue: 19800, orders: 345, percentage: 18.7 },
  { category: 'Boissons', revenue: 11600, orders: 234, percentage: 11.1 },
];

const mockCustomerData: CustomerData[] = [
  { id: 1, name: 'Marie Dubois', email: 'marie.dubois@email.com', totalSpent: 2450, orders: 34, loyaltyPoints: 245, lastVisit: '2024-07-11', growthRate: 15.2 },
  { id: 2, name: 'Pierre Martin', email: 'pierre.martin@email.com', totalSpent: 1890, orders: 28, loyaltyPoints: 189, lastVisit: '2024-07-10', growthRate: 8.7 },
  { id: 3, name: 'Sophie Laurent', email: 'sophie.laurent@email.com', totalSpent: 3200, orders: 45, loyaltyPoints: 320, lastVisit: '2024-07-12', growthRate: 22.1 },
  { id: 4, name: 'Jean-Luc Moreau', email: 'jl.moreau@email.com', totalSpent: 1650, orders: 24, loyaltyPoints: 165, lastVisit: '2024-07-09', growthRate: 5.3 },
];

const mockPopularItems: PopularItem[] = [
  { id: 1, name: 'Cappuccino Premium', category: 'Cafés', sales: 234, revenue: 982.8, growth: 12.5 },
  { id: 2, name: 'Croissant Artisanal', category: 'Pâtisseries', sales: 189, revenue: 529.2, growth: 8.7 },
  { id: 3, name: 'Latte Art', category: 'Cafés', sales: 156, revenue: 748.8, growth: 15.2 },
  { id: 4, name: 'Sandwich Club', category: 'Plats', sales: 134, revenue: 1192.6, growth: 6.9 },
  { id: 5, name: 'Macarons Français', category: 'Pâtisseries', sales: 98, revenue: 637.0, growth: 18.3 },
];

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

export default function StatisticsEnhanced() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showGrowthIndicators, setShowGrowthIndicators] = useState(true);
  const [viewMode, setViewMode] = useState<'detailed' | 'summary'>('detailed');

  // Requêtes API parallèles avec Promise.all pour optimiser les performances
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ['statistics', selectedPeriod],
    queryFn: async () => {
      const [revenue, categories, customers, popular] = await Promise.all([
        // ApiClient.get<RevenueData[]>(`/admin/statistics/revenue?period=${selectedPeriod}`),
        // ApiClient.get<CategoryData[]>('/admin/statistics/categories'),
        // ApiClient.get<CustomerData[]>('/admin/statistics/customers'),
        // ApiClient.get<PopularItem[]>('/admin/statistics/popular-items'),
        Promise.resolve(mockRevenueData),
        Promise.resolve(mockCategoryData),
        Promise.resolve(mockCustomerData),
        Promise.resolve(mockPopularItems),
      ]);
      
      return {
        revenue,
        categories,
        customers,
        popular,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Calcul des statistiques summary
  const summaryStats = useMemo<StatsSummary>(() => {
    if (!statsData) return {
      totalRevenue: 0,
      totalOrders: 0,
      totalCustomers: 0,
      averageOrderValue: 0,
      revenueGrowth: 0,
      orderGrowth: 0,
      customerGrowth: 0,
    };

    const totalRevenue = statsData.revenue.reduce((sum, item) => sum + item.revenue, 0);
    const totalOrders = statsData.revenue.reduce((sum, item) => sum + item.orders, 0);
    const totalCustomers = statsData.customers.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    const revenueGrowth = statsData.revenue.length > 1 
      ? ((statsData.revenue[statsData.revenue.length - 1].revenue - statsData.revenue[statsData.revenue.length - 2].revenue) / statsData.revenue[statsData.revenue.length - 2].revenue) * 100
      : 0;
    
    const orderGrowth = statsData.revenue.length > 1
      ? ((statsData.revenue[statsData.revenue.length - 1].orders - statsData.revenue[statsData.revenue.length - 2].orders) / statsData.revenue[statsData.revenue.length - 2].orders) * 100
      : 0;
    
    const customerGrowth = statsData.customers.reduce((sum, customer) => sum + customer.growthRate, 0) / statsData.customers.length;

    return {
      totalRevenue,
      totalOrders,
      totalCustomers,
      averageOrderValue,
      revenueGrowth,
      orderGrowth,
      customerGrowth,
    };
  }, [statsData]);

  // Données filtrées par catégorie
  const filteredData = useMemo(() => {
    if (!statsData || selectedCategory === 'all') return statsData;

    return {
      ...statsData,
      popular: statsData.popular.filter(item => item.category === selectedCategory),
    };
  }, [statsData, selectedCategory]);

  // Export Excel avec feuilles multiples
  const handleExportExcel = useCallback(() => {
    if (!statsData) return;

    const wb = XLSX.utils.book_new();

    // Feuille Revenus
    const revenueSheet = XLSX.utils.json_to_sheet(
      statsData.revenue.map(item => ({
        'Période': item.period,
        'Revenus (€)': item.revenue,
        'Commandes': item.orders,
        'Clients': item.customers,
        'Croissance (%)': item.growth,
      }))
    );
    XLSX.utils.book_append_sheet(wb, revenueSheet, 'Revenus');

    // Feuille Catégories
    const categorySheet = XLSX.utils.json_to_sheet(
      statsData.categories.map(item => ({
        'Catégorie': item.category,
        'Revenus (€)': item.revenue,
        'Commandes': item.orders,
        'Part (%)': item.percentage,
      }))
    );
    XLSX.utils.book_append_sheet(wb, categorySheet, 'Catégories');

    // Feuille Clients Top
    const customerSheet = XLSX.utils.json_to_sheet(
      statsData.customers.map(item => ({
        'Nom': item.name,
        'Email': item.email,
        'Total dépensé (€)': item.totalSpent,
        'Commandes': item.orders,
        'Points fidélité': item.loyaltyPoints,
        'Dernière visite': item.lastVisit,
        'Croissance (%)': item.growthRate,
      }))
    );
    XLSX.utils.book_append_sheet(wb, customerSheet, 'Clients Top');

    // Feuille Articles populaires
    const popularSheet = XLSX.utils.json_to_sheet(
      statsData.popular.map(item => ({
        'Article': item.name,
        'Catégorie': item.category,
        'Ventes': item.sales,
        'Revenus (€)': item.revenue,
        'Croissance (%)': item.growth,
      }))
    );
    XLSX.utils.book_append_sheet(wb, popularSheet, 'Articles Populaires');

    // Feuille Résumé
    const summarySheet = XLSX.utils.json_to_sheet([
      { 'Métrique': 'Revenus Total', 'Valeur': summaryStats.totalRevenue, 'Unité': '€' },
      { 'Métrique': 'Commandes Total', 'Valeur': summaryStats.totalOrders, 'Unité': '' },
      { 'Métrique': 'Clients Total', 'Valeur': summaryStats.totalCustomers, 'Unité': '' },
      { 'Métrique': 'Panier Moyen', 'Valeur': summaryStats.averageOrderValue, 'Unité': '€' },
      { 'Métrique': 'Croissance Revenus', 'Valeur': summaryStats.revenueGrowth, 'Unité': '%' },
      { 'Métrique': 'Croissance Commandes', 'Valeur': summaryStats.orderGrowth, 'Unité': '%' },
      { 'Métrique': 'Croissance Clients', 'Valeur': summaryStats.customerGrowth, 'Unité': '%' },
    ]);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Résumé');

    XLSX.writeFile(wb, `statistiques-barista-cafe-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast.success('Export Excel généré avec succès');
  }, [statsData, summaryStats]);

  const getGrowthIndicator = useCallback((growth: number) => {
    if (growth > 0) {
      return (
        <div className="flex items-center text-green-600 text-sm">
          <TrendingUp className="w-4 h-4 mr-1" />
          +{growth.toFixed(1)}%
        </div>
      );
    } else if (growth < 0) {
      return (
        <div className="flex items-center text-red-600 text-sm">
          <TrendingDown className="w-4 h-4 mr-1" />
          {growth.toFixed(1)}%
        </div>
      );
    }
    return <div className="text-gray-500 text-sm">Stable</div>;
  }, []);

  if (isStatsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec contrôles */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Statistiques Avancées</h2>
          <p className="text-gray-600 mt-1">
            Analytics détaillées avec export et visualisations temps réel
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">7 derniers jours</SelectItem>
              <SelectItem value="month">30 derniers jours</SelectItem>
              <SelectItem value="quarter">3 derniers mois</SelectItem>
              <SelectItem value="year">12 derniers mois</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              <SelectItem value="Cafés">Cafés</SelectItem>
              <SelectItem value="Pâtisseries">Pâtisseries</SelectItem>
              <SelectItem value="Plats">Plats</SelectItem>
              <SelectItem value="Boissons">Boissons</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            onClick={handleExportExcel}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </Button>
          
          <Button
            onClick={() => setViewMode(viewMode === 'detailed' ? 'summary' : 'detailed')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            {viewMode === 'detailed' ? 'Vue résumé' : 'Vue détaillée'}
          </Button>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenus Total</p>
                <p className="text-2xl font-bold">€{summaryStats.totalRevenue.toLocaleString()}</p>
                {showGrowthIndicators && getGrowthIndicator(summaryStats.revenueGrowth)}
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <Euro className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Commandes</p>
                <p className="text-2xl font-bold">{summaryStats.totalOrders}</p>
                {showGrowthIndicators && getGrowthIndicator(summaryStats.orderGrowth)}
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <Package className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Clients</p>
                <p className="text-2xl font-bold">{summaryStats.totalCustomers}</p>
                {showGrowthIndicators && getGrowthIndicator(summaryStats.customerGrowth)}
              </div>
              <div className="p-2 bg-purple-100 rounded-full">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Panier Moyen</p>
                <p className="text-2xl font-bold">€{summaryStats.averageOrderValue.toFixed(2)}</p>
                <div className="text-sm text-gray-500">Par commande</div>
              </div>
              <div className="p-2 bg-orange-100 rounded-full">
                <BarChart3 className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique combiné revenus/commandes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="w-5 h-5" />
              Évolution des Revenus et Commandes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={filteredData?.revenue || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      name === 'revenue' ? `€${value.toLocaleString()}` : value,
                      name === 'revenue' ? 'Revenus' : 'Commandes'
                    ]}
                  />
                  <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" name="revenue" />
                  <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#82ca9d" strokeWidth={3} name="orders" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Répartition par catégorie */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Répartition par Catégorie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={filteredData?.categories || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="revenue"
                  >
                    {(filteredData?.categories || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `€${value.toLocaleString()}`} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {(filteredData?.categories || []).map((category, index) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm">{category.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{category.percentage.toFixed(1)}%</Badge>
                    <span className="text-sm font-medium">€{category.revenue.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Évolution des clients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Évolution Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredData?.revenue || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="customers" 
                    stroke="#82ca9d" 
                    fill="#82ca9d" 
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tableaux détaillés */}
      <Tabs defaultValue="customers" className="w-full">
        <TabsList className="grid grid-cols-2 lg:grid-cols-3 w-full">
          <TabsTrigger value="customers">Clients Top</TabsTrigger>
          <TabsTrigger value="popular">Articles Populaires</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Clients les plus fidèles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(filteredData?.customers || []).map((customer, index) => (
                  <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">#{index + 1}</span>
                      </div>
                      <div>
                        <h4 className="font-medium">{customer.name}</h4>
                        <p className="text-sm text-gray-600">{customer.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Total dépensé</p>
                          <p className="font-semibold">€{customer.totalSpent.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Commandes</p>
                          <p className="font-semibold">{customer.orders}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Points</p>
                          <p className="font-semibold">{customer.loyaltyPoints}</p>
                        </div>
                        {showGrowthIndicators && getGrowthIndicator(customer.growthRate)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="popular" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Articles les plus populaires</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(filteredData?.popular || []).map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-semibold">#{index + 1}</span>
                      </div>
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-600">{item.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Ventes</p>
                          <p className="font-semibold">{item.sales}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Revenus</p>
                          <p className="font-semibold">€{item.revenue.toFixed(2)}</p>
                        </div>
                        {showGrowthIndicators && getGrowthIndicator(item.growth)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Tendances Temporelles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Meilleure journée</span>
                    <span className="font-semibold">Samedi</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Heure de pointe</span>
                    <span className="font-semibold">14h-16h</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Période creuse</span>
                    <span className="font-semibold">Mardi 10h-12h</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Métriques Clés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Taux de fidélisation</span>
                      <span className="font-semibold">76%</span>
                    </div>
                    <Progress value={76} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Satisfaction client</span>
                      <span className="font-semibold">92%</span>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Taux de recommandation</span>
                      <span className="font-semibold">85%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}