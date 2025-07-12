import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingButton } from '@/components/ui/loading-button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  Calendar,
  DollarSign,
  Coffee,
  Clock,
  Download,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuth } from '@/hooks/useAuth';
import { mockRevenueData, mockCategoryData, mockCustomerData, mockPopularItems, mockHourlyData } from '@/data/mocks';
import * as XLSX from 'xlsx';

interface StatisticsEnhancedProps {
  userRole: 'directeur' | 'employe';
}

interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

interface CategoryData {
  category: string;
  value: number;
  color: string;
}

interface CustomerData {
  name: string;
  visits: number;
  spent: number;
}

interface PopularItem {
  name: string;
  sales: number;
  growth: number;
}

interface HourlyData {
  hour: string;
  customers: number;
  revenue: number;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'];

export default function StatisticsEnhanced({ userRole }: StatisticsEnhancedProps) {
  const { apiRequest } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [dateRange, setDateRange] = useState('7days');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // États pour les données
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [customerData, setCustomerData] = useState<CustomerData[]>([]);
  const [popularItems, setPopularItems] = useState<PopularItem[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    avgOrderValue: 0,
  });

  // Chargement des données en parallèle
  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      // Utilisation de Promise.all pour paralléliser les appels API
      const [
        revenueResponse,
        categoryResponse,
        customerResponse,
        popularItemsResponse,
        hourlyResponse,
        statsResponse
      ] = await Promise.all([
        apiRequest(`/api/admin/statistics/revenue?range=${dateRange}`).catch(() => null),
        apiRequest('/api/admin/statistics/categories').catch(() => null),
        apiRequest('/api/admin/statistics/customers').catch(() => null),
        apiRequest('/api/admin/statistics/popular-items').catch(() => null),
        apiRequest('/api/admin/statistics/hourly').catch(() => null),
        apiRequest('/api/admin/statistics/overview').catch(() => null),
      ]);

      // Traitement des réponses avec fallback sur données mock
      if (revenueResponse?.ok) {
        const data = await revenueResponse.json();
        setRevenueData(data);
      } else {
        setRevenueData(mockRevenueData);
      }

      if (categoryResponse?.ok) {
        const data = await categoryResponse.json();
        setCategoryData(data);
      } else {
        setCategoryData(mockCategoryData);
      }

      if (customerResponse?.ok) {
        const data = await customerResponse.json();
        setCustomerData(data);
      } else {
        setCustomerData(mockCustomerData);
      }

      if (popularItemsResponse?.ok) {
        const data = await popularItemsResponse.json();
        setPopularItems(data);
      } else {
        setPopularItems(mockPopularItems);
      }

      if (hourlyResponse?.ok) {
        const data = await hourlyResponse.json();
        setHourlyData(data);
      } else {
        setHourlyData(mockHourlyData);
      }

      if (statsResponse?.ok) {
        const data = await statsResponse.json();
        setTotalStats(data);
      } else {
        // Calculer les stats à partir des données mock
        const totalRevenue = mockRevenueData.reduce((sum, item) => sum + item.revenue, 0);
        const totalOrders = mockRevenueData.reduce((sum, item) => sum + item.orders, 0);
        setTotalStats({
          totalRevenue,
          totalOrders,
          totalCustomers: mockCustomerData.length,
          avgOrderValue: totalRevenue / totalOrders,
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [dateRange, apiRequest, toast]);

  // Effet pour charger les données au montage et lors des changements
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Données paginées pour les clients (mémorisées)
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return customerData
      .sort((a, b) => b.spent - a.spent) // Tri par dépenses décroissantes
      .slice(startIndex, endIndex);
  }, [customerData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(customerData.length / itemsPerPage);

  // Données combinées pour le graphique mixte (mémorisées)
  const combinedData = useMemo(() => {
    return revenueData.map(item => ({
      ...item,
      avgOrderValue: item.revenue / item.orders || 0
    }));
  }, [revenueData]);

  // Articles populaires dynamiques (mémorisés)
  const dynamicPopularItems = useMemo(() => {
    return popularItems.sort((a, b) => b.sales - a.sales);
  }, [popularItems]);

  // Fonction d'export Excel
  const exportToExcel = useCallback(async () => {
    setExporting(true);
    try {
      const wb = XLSX.utils.book_new();
      
      // Feuille Revenus
      const revenueWS = XLSX.utils.json_to_sheet(revenueData);
      XLSX.utils.book_append_sheet(wb, revenueWS, 'Revenus');
      
      // Feuille Catégories
      const categoryWS = XLSX.utils.json_to_sheet(categoryData);
      XLSX.utils.book_append_sheet(wb, categoryWS, 'Catégories');
      
      // Feuille Clients
      const customerWS = XLSX.utils.json_to_sheet(customerData);
      XLSX.utils.book_append_sheet(wb, customerWS, 'Clients');
      
      // Feuille Articles populaires
      const popularWS = XLSX.utils.json_to_sheet(popularItems);
      XLSX.utils.book_append_sheet(wb, popularWS, 'Articles populaires');
      
      // Feuille Statistiques générales
      const statsWS = XLSX.utils.json_to_sheet([totalStats]);
      XLSX.utils.book_append_sheet(wb, statsWS, 'Statistiques générales');
      
      // Télécharger le fichier
      const fileName = `barista-cafe-stats-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast({
        title: "Export réussi",
        description: `Les statistiques ont été exportées dans ${fileName}`,
      });
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les données",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  }, [revenueData, categoryData, customerData, popularItems, totalStats, toast]);

  // Formatage des montants
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Formatage des pourcentages
  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-label="Chargement des statistiques">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Statistiques Avancées
          </h2>
          <p className="text-gray-600">
            Analyses détaillées des performances du café
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">7 derniers jours</SelectItem>
              <SelectItem value="30days">30 derniers jours</SelectItem>
              <SelectItem value="90days">3 derniers mois</SelectItem>
              <SelectItem value="1year">1 an</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={loadAllData}
            disabled={loading}
            aria-label="Actualiser les données"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <LoadingButton
            loading={exporting}
            loadingText="Export..."
            onClick={exportToExcel}
            variant="outline"
            aria-label="Exporter les données"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </LoadingButton>
        </div>
      </div>

      {/* Cartes de statistiques générales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus totaux</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalStats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +12.5% par rapport au mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +8.2% cette semaine
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +15.8% nouveaux clients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panier moyen</CardTitle>
            <Coffee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalStats.avgOrderValue)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 inline mr-1" />
              -2.1% ce mois-ci
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques principaux */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenus</TabsTrigger>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
          <TabsTrigger value="customers">Clients</TabsTrigger>
          <TabsTrigger value="combined">Vue combinée</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Évolution des revenus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      aria-label="Date"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      aria-label="Revenus en euros"
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        name === 'revenue' ? formatCurrency(value as number) : value,
                        name === 'revenue' ? 'Revenus' : 'Commandes'
                      ]}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                      name="Revenus"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Répartition par catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ category, value }) => `${category}: ${value}%`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Articles populaires</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dynamicPopularItems.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{item.sales} ventes</Badge>
                        <Badge 
                          variant={item.growth >= 0 ? "default" : "destructive"}
                          className="flex items-center gap-1"
                        >
                          {item.growth >= 0 ? 
                            <TrendingUp className="h-3 w-3" /> : 
                            <TrendingDown className="h-3 w-3" />
                          }
                          {formatPercentage(item.growth)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top clients (page {currentPage}/{totalPages})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {paginatedCustomers.map((customer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {((currentPage - 1) * itemsPerPage + index + 1)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-gray-600">{customer.visits} visites</div>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(customer.spent)}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Précédent
                  </Button>
                  <span className="px-3 py-1 text-sm">
                    {currentPage} / {totalPages}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Suivant
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="combined" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vue combinée - Revenus et Commandes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={combinedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" orientation="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip
                      formatter={(value, name) => [
                        name === 'revenue' ? formatCurrency(value as number) : value,
                        name === 'revenue' ? 'Revenus' : 
                        name === 'orders' ? 'Commandes' : 'Panier moyen'
                      ]}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" name="Revenus" />
                    <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#82ca9d" name="Commandes" />
                    <Line yAxisId="right" type="monotone" dataKey="avgOrderValue" stroke="#ffc658" name="Panier moyen" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Graphique des heures d'affluence */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Affluence par heure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'customers' ? `${value} clients` : formatCurrency(value as number),
                    name === 'customers' ? 'Clients' : 'Revenus'
                  ]}
                />
                <Legend />
                <Bar dataKey="customers" fill="#8884d8" name="Clients" />
                <Bar dataKey="revenue" fill="#82ca9d" name="Revenus" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}