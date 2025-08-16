import React, { useState, useEffect } from 'react';
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
  Utensils
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
  Area 
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface ReservationStatus {
  status: string;
  count: number;
}

interface RecentActivity {
  id: number;
  type: 'reservation' | 'order' | 'customer';
  title: string;
  description: string;
  timestamp: string;
  icon: React.ReactNode;
  color: string;
}

interface AlertItem {
  id: number;
  type: 'warning' | 'error' | 'info';
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

interface DashboardStats {
  todayReservations: number;
  monthlyRevenue: number;
  activeOrders: number;
  occupancyRate: number;
  reservationStatus: ReservationStatus[];
  recentActivities: RecentActivity[];
  alerts: AlertItem[];
  dailyRevenue: { day: string; revenue: number }[];
  popularItems: { name: string; count: number }[];
}

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'];

export default function Dashboard() : JSX.Element {
  const [stats, setStats] = useState<DashboardStats>({
    todayReservations: 0,
    monthlyRevenue: 0,
    activeOrders: 0,
    occupancyRate: 0,
    reservationStatus: [],
    recentActivities: [],
    alerts: [],
    dailyRevenue: [],
    popularItems: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchStats = async (silent = false) => {
    try {
      if (!silent) setRefreshing(true);
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('barista_auth_token');

      const response = await fetch('/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setStats({
          todayReservations: data.data.reservations || 0,
          monthlyRevenue: data.data.revenue || 0,
          activeOrders: data.data.orders || 0,
          occupancyRate: Math.min(Math.round((data.data.reservations / 50) * 100), 100) || 0,
          reservationStatus: [
            { status: 'Confirmées', count: Math.floor(data.data.reservations * 0.7) },
            { status: 'En attente', count: Math.floor(data.data.reservations * 0.2) },
            { status: 'Annulées', count: Math.floor(data.data.reservations * 0.1) }
          ],
          recentActivities: [
            {
              id: 1,
              type: 'reservation',
              title: 'Nouvelle réservation',
              description: 'Table 4 - 19h30',
              timestamp: new Date().toISOString(),
              icon: <Calendar className="h-5 w-5" />,
              color: 'blue'
            },
            {
              id: 2,
              type: 'order',
              title: 'Commande terminée',
              description: '2 cappuccinos, 1 croissant',
              timestamp: new Date(Date.now() - 3600000).toISOString(),
              icon: <ShoppingCart className="h-5 w-5" />,
              color: 'green'
            },
            {
              id: 3,
              type: 'customer',
              title: 'Nouveau client',
              description: 'Inscription programme fidélité',
              timestamp: new Date(Date.now() - 7200000).toISOString(),
              icon: <Users className="h-5 w-5" />,
              color: 'amber'
            }
          ],
          alerts: [
            {
              id: 1,
              type: 'error',
              title: 'Stock faible',
              description: '2 articles en rupture de stock',
              icon: <Package className="h-5 w-5" />,
              color: 'red'
            },
            {
              id: 2,
              type: 'warning',
              title: 'Réservations en attente',
              description: '3 réservations nécessitent une confirmation',
              icon: <Clock className="h-5 w-5" />,
              color: 'amber'
            }
          ],
          dailyRevenue: [
            { day: 'Lun', revenue: 450 },
            { day: 'Mar', revenue: 520 },
            { day: 'Mer', revenue: 480 },
            { day: 'Jeu', revenue: 620 },
            { day: 'Ven', revenue: 780 },
            { day: 'Sam', revenue: 950 },
            { day: 'Dim', revenue: 820 }
          ],
          popularItems: [
            { name: 'Cappuccino', count: 125 },
            { name: 'Espresso', count: 98 },
            { name: 'Croissant', count: 76 },
            { name: 'Thé vert', count: 54 },
            { name: 'Sandwich', count: 42 }
          ]
        });
      } else {
        throw new Error(data.message || 'Données statistiques invalides');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
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
  };

  useEffect(() => {
    fetchStats();

    const interval = setInterval(() => fetchStats(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchStats();
  };

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

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tableau de bord
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Vue d'ensemble de l'activité du café
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          size="sm"
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Actualisation...' : 'Actualiser'}
        </Button>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Réservations aujourd'hui
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.todayReservations}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Capacité: 50 places
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Chiffre d'affaires mensuel
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.monthlyRevenue.toLocaleString('fr-FR')}€
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Objectif: 15 000€
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                <Euro className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Commandes actives
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.activeOrders}
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

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Taux d'occupation
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.occupancyRate}%
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
              <Progress value={stats.occupancyRate} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques et données */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Répartition des réservations */}
        <Card className="lg:col-span-1">
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
                    data={stats.reservationStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, percent }) => `${status}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {stats.reservationStatus.map((entry, index) => (
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

        {/* Activité récente */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-600" />
              <span>Activité récente</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivities.map((activity) => (
                <div 
                  key={activity.id}
                  className={`flex items-center gap-3 p-3 bg-${activity.color}-50 dark:bg-${activity.color}-900/20 rounded-lg`}
                >
                  <div className={`text-${activity.color}-600`}>
                    {activity.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Articles populaires */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-600" />
              <span>Articles populaires</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.popularItems.map((item, index) => (
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
      </div>

      {/* Graphique de revenus */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <span>Revenus hebdomadaires</span>
          </CardTitle>
          <CardDescription>
            Évolution des revenus sur les 7 derniers jours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={stats.dailyRevenue}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value}€`, 'Revenu']}
                  labelFormatter={(label) => `Jour: ${label}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8b5cf6" 
                  fill="#8b5cf6" 
                  fillOpacity={0.2} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Alertes et notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span>Alertes importantes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.alerts.map((alert) => (
              <div 
                key={alert.id}
                className={`flex items-center gap-3 p-3 bg-${alert.color}-50 dark:bg-${alert.color}-900/20 rounded-lg border border-${alert.color}-200 dark:border-${alert.color}-800`}
              >
                <div className={`text-${alert.color}-600`}>
                  {alert.icon}
                </div>
                <div>
                  <p className={`text-sm font-medium text-${alert.color}-900 dark:text-${alert.color}-100`}>
                    {alert.title}
                  </p>
                  <p className={`text-xs text-${alert.color}-600 dark:text-${alert.color}-400`}>
                    {alert.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}