import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  ComposedChart,
  Scatter
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  Coffee,
  Clock,
  Download,
  RefreshCw,
  BarChart3,
  Filter,
  ArrowLeft,
  ArrowRight,
  ChevronFirst,
  ChevronLast
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { subDays, format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

// Types d'interface pour les données
interface StatisticsEnhancedProps {
  userRole: 'directeur' | 'employe';
  cafeId: string;
}

interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
  profit: number;
}

interface CategoryData {
  category: string;
  value: number;
  color?: string;
}

interface CustomerData {
  id: string;
  name: string;
  visits: number;
  spent: number;
  lastVisit: string;
}

interface PopularItem {
  id: string;
  name: string;
  sales: number;
  growth: number;
  category: string;
}

interface HourlyData {
  hour: string;
  customers: number;
  revenue: number;
  profitMargin: number;
}

interface StatisticsResponse {
  revenueData: RevenueData[];
  categoryData: CategoryData[];
  customerData: CustomerData[];
  popularItems: PopularItem[];
  hourlyData: HourlyData[];
  totalStats: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    avgOrderValue: number;
    profitMargin: number;
  };
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00bcd4', '#ff5252'];

// Composant de chargement réutilisable
const LoadingButton: React.FC<{
  loading: boolean;
  loadingText: string;
  onClick: () => void;
  variant?: 'outline' | 'default' | 'destructive' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children: React.ReactNode;
  className?: string;
  'aria-label'?: string;
}> = ({ loading, loadingText, onClick, variant = 'default', size = 'default', children, className, ...props }) => (
  <Button 
    variant={variant} 
    size={size}
    onClick={onClick} 
    disabled={loading} 
    className={className}
    {...props}
  >
    {loading ? (
      <>
        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
        {loadingText}
      </>
    ) : children}
  </Button>
);

// Composant de pagination
const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}> = ({ currentPage, totalPages, onPageChange, className }) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1}
          disabled={currentPage === 1}
          aria-label="Première page"
        >
          <ChevronFirst className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1);}
          disabled={currentPage === 1}
          aria-label="Page précédente"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </div>
      
      <span className="text-sm font-medium">
        Page {currentPage} sur {totalPages}
      </span>
      
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1);}
          disabled={currentPage === totalPages}
          aria-label="Page suivante"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages}
          disabled={currentPage === totalPages}
          aria-label="Dernière page"
        >
          <ChevronLast className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default function StatisticsEnhanced({ userRole, cafeId }: StatisticsEnhancedProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [statsFilter, setStatsFilter] = useState<'revenue' | 'profit'>('revenue');
  const itemsPerPage = 5;
  
  // États pour les données
  const [statistics, setStatistics] = useState<StatisticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour charger les données depuis l'API
  const fetchStatistics = useCallback(async () => {
    try {
      setError(null);
      const params = new URLSearchParams({
        cafeId,
        from: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : '',
        to: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : '',
      });

      const response = await fetch(`/api/cafe/statistics?${params}`);
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des données');
      }

      const data: StatisticsResponse = await response.json();
      
      // Ajouter des couleurs aux catégories si elles n'en ont pas
      const coloredCategoryData = data.categoryData.map((category, index) => ({
        ...category,
        color: category.color || COLORS[index % COLORS.length]
      });

      setStatistics({
        ...data,
        categoryData: coloredCategoryData
      });
    } catch (err) {
      console.error('Erreur:', err);
      setError(err instanceof Error ? err.message : 'Une erreur inconnue est survenue');
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cafeId, dateRange, toast]);

  // Effet pour charger les données au montage et lors des changements
  useEffect(() => {
    setLoading(true);
    fetchStatistics();
  }, [fetchStatistics]);

  // Fonction de rafraîchissement manuel
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStatistics();
  }, [fetchStatistics]);

  // Données paginées pour les clients (mémorisées)
  const paginatedCustomers = useMemo(() => {
    if (!statistics?.customerData) return [];
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    return statistics.customerData
      .sort((a, b) => b.spent - a.spent) // Tri par dépenses décroissantes
      .slice(startIndex, startIndex + itemsPerPage);
  }, [statistics?.customerData, currentPage]);

  const totalPages = useMemo(() => {
    return statistics?.customerData 
      ? Math.ceil(statistics.customerData.length / itemsPerPage) 
      : 0;
  }, [statistics?.customerData]);

  // Données combinées pour le graphique mixte (mémorisées)
  const combinedData = useMemo(() => {
    if (!statistics?.revenueData) return [];
    
    return statistics.revenueData.map((item) => ({
      ...item,
      avgOrderValue: item.revenue / item.orders || 0,
      formattedDate: format(parseISO(item.date), 'dd MMM', { locale: fr }}););
  }, [statistics?.revenueData]);

  // Articles populaires dynamiques (mémorisés)
  const dynamicPopularItems = useMemo(() => {
    if (!statistics?.popularItems) return [];
    
    return [...statistics.popularItems]
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);
  }, [statistics?.popularItems]);

  // Fonction d'export Excel
  const exportToExcel = useCallback(async () => {
    setExporting(true);
    try {
      const response = await fetch('/api/export/statistics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cafeId,
          dateRange,
          statistics
        }),
      });

      if (!response.ok) {
        throw new Error('Échec de l\'export');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `statistiques-cafe-${cafeId}-${format(new Date(), 'yyyy-MM-dd'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export réussi",
        description: "Les statistiques ont été exportées avec succès",
      });
    } catch (err) {
      console.error('Erreur d\'export:', err);
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les données",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  }, [cafeId, dateRange, statistics, toast]);

  // Formatage des montants
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Formatage des pourcentages
  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1}%`;
  };

  // Formatage de la date
  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'PPP', { locale: fr });
  };

  // Affichage du chargement
  if (loading && !statistics) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-8" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-full mt-2" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardContent>
            </Card>
          );}
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-80 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Affichage des erreurs
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold">Erreur de chargement</h3>
          <p className="text-gray-600">{error}</p>
        </div>
        <LoadingButton
          loading={refreshing}
          loadingText="Rechargement..."
          onClick={handleRefresh}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </LoadingButton>
      </div>
    );
  }

  // Affichage quand il n'y a pas de données
  if (!statistics) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold">Aucune donnée disponible</h3>
          <p className="text-gray-600">Aucune statistique n'a été trouvée pour cette période</p>
        </div>
        <Button onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* En-tête avec actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Statistiques Avancées
          </h2>
          <p className="text-gray-600">
            Analyses détaillées des performances du café ({userRole})
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <DateRangePicker 
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            className="w-full md:w-auto"
          />
          
          <div className="flex gap-2">
            <LoadingButton
              loading={refreshing}
              loadingText="Actualisation..."
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              aria-label="Actualiser les données"
            >
              <RefreshCw className="h-4 w-4" />
            </LoadingButton>
            
            <LoadingButton
              loading={exporting}
              loadingText="Export..."
              onClick={exportToExcel}
              variant="outline"
              size="sm"
              aria-label="Exporter les données"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </LoadingButton>
          </div>
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
            <div className="text-2xl font-bold">
              {formatCurrency(statistics.totalStats.totalRevenue}
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics.totalStats.totalRevenue >= 0 ? (
                <TrendingUp className="h-3 w-3 inline mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 inline mr-1 text-red-500" />
              }
              {formatPercentage(
                (statistics.totalStats.totalRevenue / 
                 (statistics.totalStats.totalRevenue - statistics.totalStats.profitMargin);* 100
              } par rapport à la période précédente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalStats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1 text-green-500" />
              {formatPercentage(
                (statistics.totalStats.totalOrders / 
                 (statistics.totalStats.totalCustomers || 1);* 100
              } commandes par client
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalStats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1 text-green-500" />
              {formatPercentage(statistics.totalStats.totalCustomers / 100} fidélisation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panier moyen</CardTitle>
            <Coffee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(statistics.totalStats.avgOrderValue}
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics.totalStats.avgOrderValue >= 0 ? (
                <TrendingUp className="h-3 w-3 inline mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 inline mr-1 text-red-500" />
              }
              {formatPercentage(statistics.totalStats.avgOrderValue / 10} évolution
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
          <TabsTrigger value="combined">Analyse</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Évolution des revenus</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={statsFilter === 'revenue' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatsFilter('revenue'}
                  >
                    Revenus
                  </Button>
                  <Button
                    variant={statsFilter === 'profit' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatsFilter('profit'}
                  >
                    Profit
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={statistics.revenueData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => format(parseISO(date), 'dd MMM', { locale: fr })}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      tickFormatter={(value) => formatCurrency(value}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        name === 'revenue' || name === 'profit' 
                          ? formatCurrency(value as number) 
                          : value,
                        name === 'revenue' ? 'Revenus' : 
                        name === 'profit' ? 'Profit' : 'Commandes'
                      ]}
                      labelFormatter={(date) => format(parseISO(date), 'PPPP', { locale: fr })}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey={statsFilter}
                      stroke={statsFilter === 'revenue' ? "#8884d8" : "#82ca9d"}
                      fill={statsFilter === 'revenue' ? "#8884d8" : "#82ca9d"}
                      fillOpacity={0.3}
                      name={statsFilter === 'revenue' ? 'Revenus' : 'Profit'}
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
                        data={statistics.categoryData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ category, value }) => `${category}: ${value}%`}
                        labelLine={false}
                      >
                        {statistics.categoryData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color || COLORS[index % COLORS.length]} 
                          />
                        );}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${value}%`, 'Part de marché']}
                      />
                      <Legend />
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
                  {dynamicPopularItems.map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3 w-full">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/10">
                          <span className="text-primary font-medium text-sm">
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{item.name}</div>
                          <div className="text-xs text-gray-500 truncate">{item.category}</div>
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
                            {formatPercentage(item.growth}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {paginatedCustomers.map((customer, index) => (
                  <div 
                    key={customer.id} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-medium">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-gray-600">
                          {customer.visits} visites • Dernière visite: {formatDate(customer.lastVisit}
                        </div>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(customer.spent}
                    </div>
                  </div>
                );}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  className="mt-6"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="combined" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analyse combinée</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={combinedData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis 
                      dataKey="formattedDate"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      yAxisId="left" 
                      orientation="left" 
                      tickFormatter={(value) => formatCurrency(value}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        name === 'revenue' || name === 'avgOrderValue' 
                          ? formatCurrency(value as number) 
                          : value,
                        name === 'revenue' ? 'Revenus' : 
                        name === 'orders' ? 'Commandes' : 'Panier moyen'
                      ]}
                    />
                    <Legend />
                    <Bar 
                      yAxisId="left" 
                      dataKey="revenue" 
                      fill="#8884d8" 
                      name="Revenus" 
                      radius={[4, 4, 0, 0]}
                    />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="orders" 
                      stroke="#82ca9d" 
                      name="Commandes" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="avgOrderValue" 
                      stroke="#ffc658" 
                      name="Panier moyen" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
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
              <ComposedChart data={statistics.hourlyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="hour" />
                <YAxis 
                  yAxisId="left" 
                  orientation="left" 
                  tickFormatter={(value) => value}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  tickFormatter={(value) => formatCurrency(value}
                />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'customers' 
                      ? `${value} clients` 
                      : formatCurrency(value as number),
                    name === 'customers' ? 'Clients' : 'Revenus'
                  ]}
                />
                <Legend />
                <Bar 
                  yAxisId="left" 
                  dataKey="customers" 
                  fill="#8884d8" 
                  name="Clients" 
                  radius={[4, 4, 0, 0]}
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#82ca9d" 
                  name="Revenus" 
                  strokeWidth={2}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}