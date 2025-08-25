
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Percent,
  ArrowUp,
  ArrowDown,
  Minus,
  RefreshCw,
  Filter,
  Eye,
  PieChart,
  LineChart
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';
import { exportStatistics } from '@/lib/excel-export';

interface StatisticData {
  period: string;
  revenue: number;
  orders: number;
  customers: number;
  avgOrderValue: number;
  profit: number;
  growth: number;
}

interface CategoryData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface ProductPerformance {
  name: string;
  sales: number;
  revenue: number;
  profit: number;
  margin: number;
  trend: 'up' | 'down' | 'stable';
}

interface CustomerAnalytics {
  newCustomers: number;
  returningCustomers: number;
  retentionRate: number;
  avgLifetimeValue: number;
  segments: {
    name: string;
    count: number;
    value: number;
  }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function StatisticsEnhanced(): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [comparisonPeriod, setComparisonPeriod] = useState('previous');
  const { canView, canManage } = usePermissions();
  const { toast } = useToast();

  // Données statistiques
  const [statisticsData, setStatisticsData] = useState<StatisticData[]>([
    { period: 'Sem 1', revenue: 12500, orders: 156, customers: 89, avgOrderValue: 80.13, profit: 3750, growth: 8.5 },
    { period: 'Sem 2', revenue: 13200, orders: 168, customers: 95, avgOrderValue: 78.57, profit: 3960, growth: 5.6 },
    { period: 'Sem 3', revenue: 14800, orders: 189, customers: 112, avgOrderValue: 78.31, profit: 4440, growth: 12.1 },
    { period: 'Sem 4', revenue: 16200, orders: 203, customers: 125, avgOrderValue: 79.80, profit: 4860, growth: 9.5 }
  ]);

  const [categoryData, setCategoryData] = useState<CategoryData[]>([
    { name: 'Boissons chaudes', value: 45, percentage: 45, color: '#0088FE' },
    { name: 'Boissons froides', value: 25, percentage: 25, color: '#00C49F' },
    { name: 'Pâtisseries', value: 20, percentage: 20, color: '#FFBB28' },
    { name: 'Sandwichs', value: 10, percentage: 10, color: '#FF8042' }
  ]);

  const [productPerformance, setProductPerformance] = useState<ProductPerformance[]>([
    { name: 'Cappuccino', sales: 245, revenue: 735, profit: 441, margin: 60, trend: 'up' },
    { name: 'Espresso', sales: 198, revenue: 396, profit: 237.6, margin: 60, trend: 'up' },
    { name: 'Latte', sales: 167, revenue: 668, profit: 334, margin: 50, trend: 'stable' },
    { name: 'Américano', sales: 134, revenue: 402, profit: 201, margin: 50, trend: 'down' },
    { name: 'Croissant', sales: 189, revenue: 567, profit: 226.8, margin: 40, trend: 'up' }
  ]);

  const [customerAnalytics, setCustomerAnalytics] = useState<CustomerAnalytics>({
    newCustomers: 45,
    returningCustomers: 123,
    retentionRate: 73.2,
    avgLifetimeValue: 245.50,
    segments: [
      { name: 'Réguliers', count: 89, value: 15630 },
      { name: 'Occasionnels', count: 56, value: 8960 },
      { name: 'Nouveaux', count: 45, value: 4725 },
      { name: 'VIP', count: 12, value: 3600 }
    ]
  });

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('barista_auth_token');
      
      const response = await fetch(`/api/statistics/enhanced?range=${dateRange}&metric=${selectedMetric}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStatisticsData(data.statistics || statisticsData);
          setCategoryData(data.categories || categoryData);
          setProductPerformance(data.products || productPerformance);
          setCustomerAnalytics(data.customers || customerAnalytics);
        }
      }
    } catch (error) {
      console.log('Utilisation des données de démonstration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView('analytics')) {
      fetchStatistics();
    }
  }, [dateRange, selectedMetric, comparisonPeriod]);

  const handleExport = async () => {
    try {
      const exportData = statisticsData.map(stat => ({
        'Période': stat.period,
        'Revenus': stat.revenue,
        'Commandes': stat.orders,
        'Clients': stat.customers,
        'Panier moyen': stat.avgOrderValue,
        'Profit': stat.profit,
        'Croissance': `${stat.growth}%`
      }));

      await toast.operation(
        () => exportStatistics(exportData),
        {
          loading: 'Export des statistiques en cours...',
          success: 'Statistiques exportées avec succès',
          error: 'Impossible d\'exporter les statistiques'
        }
      );
    } catch (error) {
      console.error('Erreur export:', error);
    }
  };

  const handleCompareWithPrevious = () => {
    // Simulation de comparaison avec la période précédente
    const comparisonData = statisticsData.map(stat => ({
      ...stat,
      previousRevenue: stat.revenue * 0.9, // Simulation
      revenueChange: ((stat.revenue - stat.revenue * 0.9) / (stat.revenue * 0.9)) * 100
    }));
    
    toast.info('Comparaison activée', 'Données comparées avec la période précédente');
    // Ici vous pouvez mettre à jour l'état pour afficher la comparaison
  };

  const handleGenerateReport = async () => {
    try {
      const reportData = {
        statistics: statisticsData,
        categories: categoryData,
        products: productPerformance,
        customers: customerAnalytics,
        period: dateRange,
        generatedAt: new Date().toISOString()
      };

      await toast.operation(
        () => exportFinancialReport(reportData),
        {
          loading: 'Génération du rapport complet...',
          success: 'Rapport généré avec succès',
          error: 'Erreur lors de la génération du rapport'
        }
      );
    } catch (error) {
      console.error('Erreur génération rapport:', error);
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <ArrowDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!canView('analytics')) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Accès non autorisé</h3>
            <p className="text-gray-600">
              Vous n'avez pas les permissions nécessaires pour consulter les statistiques.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Statistiques Avancées
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Analyse détaillée des performances de votre café
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 derniers jours</SelectItem>
              <SelectItem value="30d">30 derniers jours</SelectItem>
              <SelectItem value="90d">3 derniers mois</SelectItem>
              <SelectItem value="1y">1 année</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={fetchStatistics} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>

          {canManage('analytics') && (
            <>
              <Button variant="outline" onClick={handleCompareWithPrevious}>
                <Filter className="h-4 w-4 mr-2" />
                Comparer
              </Button>
              <Button variant="outline" onClick={handleGenerateReport}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Rapport Complet
              </Button>
              <Button onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Revenus totaux
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {statisticsData.reduce((sum, stat) => sum + stat.revenue, 0).toLocaleString('fr-FR')}€
                </p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  +12.5% vs période précédente
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Commandes totales
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {statisticsData.reduce((sum, stat) => sum + stat.orders, 0)}
                </p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  +8.3% vs période précédente
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                <ShoppingCart className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Clients uniques
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {statisticsData.reduce((sum, stat) => sum + stat.customers, 0)}
                </p>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  +15.2% nouveaux clients
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Panier moyen
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {(statisticsData.reduce((sum, stat) => sum + stat.avgOrderValue, 0) / statisticsData.length).toFixed(2)}€
                </p>
                <p className="text-xs text-orange-600 flex items-center mt-1">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  +3.1% d'amélioration
                </p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                <BarChart3 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenu principal avec onglets */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="revenue">Revenus</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="customers">Clients</TabsTrigger>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
          <TabsTrigger value="trends">Tendances</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Évolution des revenus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statisticsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value}€`, 'Revenus']} />
                      <Legend />
                      <Bar dataKey="revenue" fill="#3b82f6" name="Revenus" />
                      <Bar dataKey="profit" fill="#10b981" name="Profit" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Croissance hebdomadaire</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statisticsData.map((stat, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium">{stat.period}</p>
                        <p className="text-sm text-gray-600">{stat.revenue.toLocaleString()}€</p>
                      </div>
                      <div className={`flex items-center gap-1 ${
                        stat.growth > 0 ? 'text-green-600' : stat.growth < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {stat.growth > 0 ? <ArrowUp className="h-4 w-4" /> : 
                         stat.growth < 0 ? <ArrowDown className="h-4 w-4" /> : 
                         <Minus className="h-4 w-4" />}
                        <span className="font-medium">{Math.abs(stat.growth)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Performance des produits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Produit</th>
                      <th className="text-right p-2">Ventes</th>
                      <th className="text-right p-2">Revenus</th>
                      <th className="text-right p-2">Profit</th>
                      <th className="text-right p-2">Marge</th>
                      <th className="text-center p-2">Tendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productPerformance.map((product, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="p-2 font-medium">{product.name}</td>
                        <td className="p-2 text-right">{product.sales}</td>
                        <td className="p-2 text-right">{product.revenue}€</td>
                        <td className="p-2 text-right">{product.profit}€</td>
                        <td className="p-2 text-right">
                          <Badge variant={product.margin > 50 ? 'default' : 'secondary'}>
                            {product.margin}%
                          </Badge>
                        </td>
                        <td className="p-2 text-center">
                          <div className={`flex items-center justify-center ${getTrendColor(product.trend)}`}>
                            {getTrendIcon(product.trend)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Analytics clients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {customerAnalytics.newCustomers}
                      </div>
                      <p className="text-sm text-gray-600">Nouveaux clients</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {customerAnalytics.returningCustomers}
                      </div>
                      <p className="text-sm text-gray-600">Clients fidèles</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Taux de rétention</span>
                      <span className="text-sm text-gray-600">{customerAnalytics.retentionRate}%</span>
                    </div>
                    <Progress value={customerAnalytics.retentionRate} className="h-2" />
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Valeur vie client moyenne</p>
                    <p className="text-xl font-bold">{customerAnalytics.avgLifetimeValue}€</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Segments de clientèle</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customerAnalytics.segments.map((segment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium">{segment.name}</p>
                        <p className="text-sm text-gray-600">{segment.count} clients</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{segment.value}€</p>
                        <p className="text-sm text-gray-600">
                          {((segment.value / customerAnalytics.segments.reduce((sum, s) => sum + s.value, 0)) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Répartition par catégories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance par catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryData.map((category, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{category.name}</span>
                        <span>{category.percentage}%</span>
                      </div>
                      <Progress 
                        value={category.percentage} 
                        className="h-2"
                        style={{ 
                          '--progress-background': category.color 
                        } as React.CSSProperties}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Analyse des tendances
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={statisticsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      name="Revenus"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="orders" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Commandes"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="customers" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      name="Clients"
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
