import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  Clock,
  Euro,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Bell,
  Coffee,
  Star,
  Package,
  Utensils,
  TrendingDown,
  Activity,
  Target,
  Zap
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  ComposedChart
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

// Types
interface DashboardStats {
  todayReservations: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
  activeOrders: number;
  occupancyRate: number;
  averageOrderValue: number;
  newCustomers: number;
  totalTables: number;
  popularItems: { name: string; count: number }[];
  lastUpdated: string;
}

interface RealTimeStats {
  currentReservations: number;
  preparingOrders: number;
  staffOnDuty: number;
  customerSatisfaction: number;
  tablesTurnover: number;
  lastUpdated: string;
}

interface RecentActivity {
  id: number;
  type: 'reservation' | 'order' | 'customer';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'info' | 'warning' | 'error';
  icon: string;
  amount?: number;
}

interface AlertItem {
  id: number;
  type: 'warning' | 'error' | 'info';
  title: string;
  description: string;
  icon: string;
  color: string;
  items?: any[];
  count?: number;
}

interface RevenueData {
  date: string;
  revenue: number;
}

interface ReservationData {
  byStatus: { status: string; count: number }[];
  byDay: { day: string; count: number }[];
}

interface KPIData {
  revenue: { current: number; previous: number; change: number };
  orders: { current: number; previous: number; change: number };
  customers: { current: number; previous: number; change: number };
  averageOrderValue: number;
  customerRetention: number;
  tableUtilization: number;
}

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Dashboard(): JSX.Element {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [realTimeStats, setRealTimeStats] = useState<RealTimeStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [reservationData, setReservationData] = useState<ReservationData | null>(null);
  const [kpis, setKpis] = useState<KPIData | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  const { toast } = useToast();

  // Fonction pour récupérer les données du dashboard
  const fetchDashboardData = useCallback(async (silent = false) => {
    try {
      if (!silent) setRefreshing(true);
      setError(null);
      
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('barista_auth_token');
      
      // Récupérer toutes les données en parallèle
      const [statsRes, realTimeRes, activitiesRes, alertsRes, revenueRes, reservationsRes, kpisRes] = await Promise.all([
        fetch('/api/admin/dashboard/stats', {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        }),
        fetch('/api/admin/dashboard/real-time-stats', {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        }),
        fetch('/api/admin/dashboard/recent-activities', {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        }),
        fetch('/api/admin/dashboard/alerts', {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        }),
        fetch('/api/admin/dashboard/charts/revenue', {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        }),
        fetch('/api/admin/dashboard/charts/reservations', {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        }),
        fetch('/api/admin/dashboard/kpis', {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        })
      ]);

      // Traiter les réponses
      const [statsData, realTimeData, activitiesData, alertsData, revenueData, reservationsData, kpisData] = await Promise.all([
        statsRes.json(),
        realTimeRes.json(),
        activitiesRes.json(),
        alertsRes.json(),
        revenueRes.json(),
        reservationsRes.json(),
        kpisRes.json()
      ]);

      if (statsData.success) setStats(statsData.data);
      if (realTimeData.success) setRealTimeStats(realTimeData.data);
      if (activitiesData.success) setRecentActivities(activitiesData.data);
      if (alertsData.success) setAlerts(alertsData.data);
      if (revenueData.success) setRevenueData(revenueData.data);
      if (reservationsData.success) setReservationData(reservationsData.data);
      if (kpisData.success) setKpis(kpisData.data);

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setError('Impossible de charger les données du tableau de bord');
      
      if (!silent) {
        toast({
          title: "Erreur",
          description: "Impossible de charger les données du tableau de bord",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  // Charger les données au montage et toutes les 30 secondes
  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => fetchDashboardData(true), 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Fonction de rafraîchissement manuel
  const handleRefresh = () => {
    fetchDashboardData();
  };

  // Calculer les tendances pour les KPIs
  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Activity className="h-4 w-4 text-gray-600" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  // Composant de chargement
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-80 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Composant d'erreur
  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>
            {error}
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              size="sm" 
              className="ml-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Tableau de bord
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Vue d'ensemble de l'activité du café • Dernière mise à jour: {stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleTimeString('fr-FR') : '...'}
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          size="sm"
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Actualisation...' : 'Actualiser'}
        </Button>
      </div>

      {/* Alertes importantes */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Alert key={alert.id} variant={alert.type === 'error' ? 'destructive' : 'default'}>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{alert.title}</AlertTitle>
              <AlertDescription>
                {alert.description}
                {alert.count && (
                  <Badge variant="outline" className="ml-2">
                    {alert.count}
                  </Badge>
                )}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Réservations aujourd'hui
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats?.todayReservations || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Capacité: {stats?.totalTables || 0} places
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Chiffre d'affaires mensuel
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats?.monthlyRevenue ? stats.monthlyRevenue.toLocaleString('fr-FR') : 0}€
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Semaine: {stats?.weeklyRevenue ? stats.weeklyRevenue.toLocaleString('fr-FR') : 0}€
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                <Euro className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Commandes actives
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {realTimeStats?.preparingOrders || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  En préparation
                </p>
              </div>
              <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-full">
                <ShoppingCart className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Taux d'occupation
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats?.occupancyRate || 0}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Moyenne: 75%
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-3">
              <Progress value={stats?.occupancyRate || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPIs et tendances */}
      {kpis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              <span>Indicateurs de performance</span>
            </CardTitle>
            <CardDescription>
              Comparaison avec le mois précédent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {getTrendIcon(kpis.revenue.change)}
                  <span className={`text-sm font-medium ${getTrendColor(kpis.revenue.change)}`}>
                    {kpis.revenue.change > 0 ? '+' : ''}{kpis.revenue.change.toFixed(1)}%
                  </span>
                </div>
                <p className="text-2xl font-bold">{kpis.revenue.current.toLocaleString('fr-FR')}€</p>
                <p className="text-sm text-gray-600">Revenus du mois</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {getTrendIcon(kpis.orders.change)}
                  <span className={`text-sm font-medium ${getTrendColor(kpis.orders.change)}`}>
                    {kpis.orders.change > 0 ? '+' : ''}{kpis.orders.change.toFixed(1)}%
                  </span>
                </div>
                <p className="text-2xl font-bold">{kpis.orders.current}</p>
                <p className="text-sm text-gray-600">Commandes du mois</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {getTrendIcon(kpis.customers.change)}
                  <span className={`text-sm font-medium ${getTrendColor(kpis.customers.change)}`}>
                    {kpis.customers.change > 0 ? '+' : ''}{kpis.customers.change.toFixed(1)}%
                  </span>
                </div>
                <p className="text-2xl font-bold">{kpis.customers.current}</p>
                <p className="text-sm text-gray-600">Nouveaux clients</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Onglets pour les graphiques et données */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="revenue">Revenus</TabsTrigger>
          <TabsTrigger value="reservations">Réservations</TabsTrigger>
          <TabsTrigger value="activities">Activités</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Répartition des réservations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Statut des réservations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reservationData?.byStatus || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, percent }) => `${status}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {(reservationData?.byStatus || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [value, 'Réservations']}
                        labelFormatter={(label) => `Statut: ${label}`}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Articles populaires */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-600" />
                  <span>Articles populaires</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.popularItems?.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                          <Utensils className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <Badge variant="outline">{item.count} ventes</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Statistiques temps réel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-600" />
                  <span>Temps réel</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Personnel en service</span>
                    <span className="font-semibold">{realTimeStats?.staffOnDuty || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Satisfaction client</span>
                    <span className="font-semibold">{realTimeStats?.customerSatisfaction || 0}/5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Rotation des tables</span>
                    <span className="font-semibold">{realTimeStats?.tablesTurnover || 0}x</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span>Évolution des revenus</span>
              </CardTitle>
              <CardDescription>
                Revenus des 7 derniers jours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={revenueData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`${value}€`, 'Revenu']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.2} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reservations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span>Réservations par jour</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reservationData?.byDay || []}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip formatter={(value) => [value, 'Réservations']} />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Répartition par statut</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reservationData?.byStatus || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, percent }) => `${status}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {(reservationData?.byStatus || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, 'Réservations']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-600" />
                <span>Activité récente</span>
              </CardTitle>
              <CardDescription>
                Dernières activités du système
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div 
                    key={activity.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      activity.status === 'success' ? 'bg-green-50 border-green-200' :
                      activity.status === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                      activity.status === 'error' ? 'bg-red-50 border-red-200' :
                      'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className={`p-2 rounded-full ${
                      activity.status === 'success' ? 'bg-green-100' :
                      activity.status === 'warning' ? 'bg-yellow-100' :
                      activity.status === 'error' ? 'bg-red-100' :
                      'bg-blue-100'
                    }`}>
                      {activity.icon === 'calendar' && <Calendar className="h-4 w-4" />}
                      {activity.icon === 'shopping-cart' && <ShoppingCart className="h-4 w-4" />}
                      {activity.icon === 'users' && <Users className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.timestamp).toLocaleTimeString('fr-FR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                    {activity.amount && (
                      <Badge variant="outline">
                        {activity.amount.toFixed(2)}€
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}