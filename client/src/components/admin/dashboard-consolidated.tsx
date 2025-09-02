import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart3,
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Calendar,
  Settings,
  Brain,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Coffee,
  Package,
  Euro,
  RefreshCw,
  Bell,
  Star,
  Utensils,
  PieChart,
  LineChart
} from 'lucide-react';
import { 
  PieChart as RechartsPieChart, 
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
  LineChart as RechartsLineChart, 
  Line, 
  AreaChart, 
  Area 
} from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';
import { useTypedToast } from '@/hooks/use-typed-toast';

// Types consolidés
interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  revenueGrowth: number;
  ordersGrowth: number;
  todayReservations: number;
  activeOrders: number;
  occupancyRate: number;
  monthlyRevenue: number;
}

interface QuickAction {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  href: string;
  color: string;
  permission?: string;
}

interface RecentActivity {
  id: number;
  type: 'order' | 'reservation' | 'customer' | 'alert';
  message: string;
  time: string;
  status: 'success' | 'info' | 'warning' | 'error';
  icon?: React.ReactNode;
}

interface SystemStatus {
  service: string;
  status: 'operational' | 'degraded' | 'down';
  responseTime?: string;
  uptime?: string;
}

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'];

export default function DashboardConsolidated(): JSX.Element {
  const { user } = useAuth();
  const { canView, canManage, isAdmin, userRole } = usePermissions();
  const toast = useTypedToast();
  const [refreshing, setRefreshing] = useState(false);

  // Requête pour les statistiques temps réel
  const { data: realTimeStats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard-consolidated-stats'],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('barista_auth_token');
        const response = await fetch('/api/dashboard/real-time-stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) throw new Error('Erreur stats');
        const data = await response.json();
        return data.success ? data.data : null;
      } catch (error) {
        console.warn('API non disponible, utilisation des données de démonstration');
        return null;
      }
    },
    refetchInterval: 15000, // Actualisation toutes les 15 secondes
  });

  // Données par défaut si l'API n'est pas disponible
  const stats: DashboardStats = realTimeStats || {
    totalRevenue: 25680,
    totalOrders: 1247,
    totalCustomers: 892,
    averageOrderValue: 20.6,
    revenueGrowth: 12.5,
    ordersGrowth: 8.3,
    todayReservations: 24,
    activeOrders: 8,
    occupancyRate: 75,
    monthlyRevenue: 25680
  };

  const quickActions: QuickAction[] = [
    {
      id: 'orders',
      title: 'Nouvelle Commande',
      icon: <ShoppingCart className="h-5 w-5" />,
      description: 'Créer une nouvelle commande',
      href: '#orders',
      color: 'bg-blue-500',
      permission: 'orders'
    },
    {
      id: 'menu',
      title: 'Gestion Menu',
      icon: <Coffee className="h-5 w-5" />,
      description: 'Modifier le menu',
      href: '#menu',
      color: 'bg-green-500',
      permission: 'menu'
    },
    {
      id: 'inventory',
      title: 'Inventaire',
      icon: <Package className="h-5 w-5" />,
      description: 'Gérer le stock',
      href: '#inventory',
      color: 'bg-orange-500',
      permission: 'inventory'
    },
    {
      id: 'analytics',
      title: 'Analytics',
      icon: <BarChart3 className="h-5 w-5" />,
      description: 'Voir les statistiques',
      href: '#analytics',
      color: 'bg-purple-500',
      permission: 'analytics'
    },
    {
      id: 'customers',
      title: 'Clients',
      icon: <Users className="h-5 w-5" />,
      description: 'Gérer les clients',
      href: '#customers',
      color: 'bg-pink-500',
      permission: 'customers'
    },
    {
      id: 'reservations',
      title: 'Réservations',
      icon: <Calendar className="h-5 w-5" />,
      description: 'Gérer les réservations',
      href: '#reservations',
      color: 'bg-cyan-500',
      permission: 'reservations'
    },
    {
      id: 'reports',
      title: 'Rapports',
      icon: <BarChart3 className="h-5 w-5" />,
      description: 'Générer des rapports',
      href: '#reports',
      color: 'bg-indigo-500',
      permission: 'reports'
    },
    {
      id: 'settings',
      title: 'Paramètres',
      icon: <Settings className="h-5 w-5" />,
      description: 'Configuration système',
      href: '#settings',
      color: 'bg-gray-500',
      permission: 'settings'
    }
  ];

  const recentActivities: RecentActivity[] = [
    {
      id: 1,
      type: 'order',
      message: 'Nouvelle commande #1248 - 2 Cappuccinos, 1 Croissant',
      time: 'Il y a 2 minutes',
      status: 'success',
      icon: <ShoppingCart className="h-4 w-4" />
    },
    {
      id: 2,
      type: 'customer',
      message: 'Nouveau client inscrit - Marie Dubois',
      time: 'Il y a 5 minutes',
      status: 'info',
      icon: <Users className="h-4 w-4" />
    },
    {
      id: 3,
      type: 'reservation',
      message: 'Réservation confirmée - Table 4 à 19h30',
      time: 'Il y a 8 minutes',
      status: 'success',
      icon: <Calendar className="h-4 w-4" />
    },
    {
      id: 4,
      type: 'alert',
      message: 'Stock faible: Café Arabica (5 unités restantes)',
      time: 'Il y a 10 minutes',
      status: 'warning',
      icon: <Package className="h-4 w-4" />
    },
    {
      id: 5,
      type: 'order',
      message: 'Commande #1247 préparée et servie',
      time: 'Il y a 12 minutes',
      status: 'success',
      icon: <CheckCircle className="h-4 w-4" />
    }
  ];

  const systemStatus: SystemStatus[] = [
    { service: 'Base de données', status: 'operational', responseTime: '45ms', uptime: '99.9%' },
    { service: 'API Principal', status: 'operational', responseTime: '120ms', uptime: '99.8%' },
    { service: 'Système de paiement', status: 'operational', responseTime: '230ms', uptime: '99.7%' },
    { service: 'Notifications', status: 'operational', responseTime: '78ms', uptime: '99.9%' }
  ];

  const salesData = [
    { day: 'Lun', revenue: 450, orders: 32 },
    { day: 'Mar', revenue: 520, orders: 38 },
    { day: 'Mer', revenue: 480, orders: 35 },
    { day: 'Jeu', revenue: 620, orders: 42 },
    { day: 'Ven', revenue: 780, orders: 55 },
    { day: 'Sam', revenue: 950, orders: 68 },
    { day: 'Dim', revenue: 820, orders: 58 }
  ];

  const popularItems = [
    { name: 'Cappuccino', count: 125, revenue: 375 },
    { name: 'Espresso', count: 98, revenue: 196 },
    { name: 'Latte', count: 87, revenue: 348 },
    { name: 'Croissant', count: 76, revenue: 228 },
    { name: 'Américano', count: 65, revenue: 162.5 }
  ];

  const reservationStatus = [
    { name: 'Confirmées', value: Math.floor(stats.todayReservations * 0.7), color: '#10b981' },
    { name: 'En attente', value: Math.floor(stats.todayReservations * 0.2), color: '#f59e0b' },
    { name: 'Annulées', value: Math.floor(stats.todayReservations * 0.1), color: '#ef4444' }
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchStats();
      toast.toast({ title: 'Données rafraîchies', description: 'Les statistiques ont été mises à jour', variant: 'success' });
    } catch (error) {
      toast.toast({ title: 'Erreur', description: 'Impossible d\'actualiser les données', variant: 'destructive' });
    } finally {
      setRefreshing(false);
    }
  };

  const handleExportDashboard = async () => {
    try {
      const dashboardData = {
        stats,
        salesData,
        popularItems,
        reservationStatus,
        generatedAt: new Date().toISOString()
      };

      // Simulation d'export - remplacer par vraie fonction d'export
      const exportStatistics = async (data: any[]) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            console.log('Dashboard exporté:', data);
            resolve(data);
          }, 1000);
        });
      };

      toast.toast({ 
        title: 'Export en cours', 
        description: 'Export du dashboard en cours...' 
      });

      await exportStatistics([dashboardData]);

      toast.toast({ 
        title: 'Export terminé', 
        description: 'Dashboard exporté avec succès' 
      });
    } catch (error) {
      console.error('Erreur export dashboard:', error);
    }
  };

  const handleQuickAction = (actionId: string, actionTitle: string) => {
    // Simulation de navigation
    const routes: Record<string, string> = {
      orders: '/admin/orders',
      menu: '/admin/menu',
      inventory: '/admin/inventory',
      analytics: '/admin/analytics',
      customers: '/admin/customers',
      reservations: '/admin/reservations',
      reports: '/admin/reports',
      settings: '/admin/settings'
    };

    const route = routes[actionId];
    if (route) {
      toast.toast({ title: `Navigation vers ${actionTitle}`, description: `Redirection vers ${route}`, variant: 'default' });
      // Ici vous pouvez ajouter la vraie navigation avec votre router
      // navigate(route);
    }
  };

  if (statsLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header avec informations utilisateur */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Tableau de Bord
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Bienvenue, {user?.firstName || 'Admin'} | Barista Café Management
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Système Opérationnel
          </Badge>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Actualisation...' : 'Actualiser'}
          </Button>
          {canManage('reports') && (
            <Button onClick={handleExportDashboard}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Exporter Dashboard
            </Button>
          )}
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Chiffre d'affaires
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.totalRevenue.toLocaleString('fr-FR')}€
                </p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{stats.revenueGrowth}% ce mois
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
                  Commandes
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.totalOrders}
                </p>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{stats.ordersGrowth}% ce mois
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Clients
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.totalCustomers}
                </p>
                <p className="text-xs text-purple-600 mt-1">Total enregistrés</p>
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
                  Panier Moyen
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.averageOrderValue}€
                </p>
                <p className="text-xs text-orange-600 mt-1">Par commande</p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                <BarChart3 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Actions Rapides
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {quickActions
              .filter(action => !action.permission || canView(action.permission as any))
              .map((action) => (
              <Button
                key={action.id}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => handleQuickAction(action.id, action.title)}
              >
                <div className={`p-2 rounded-full ${action.color} text-white`}>
                  {action.icon}
                </div>
                <div className="text-center">
                  <p className="font-medium text-xs">{action.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {action.description}
                  </p>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contenu principal avec onglets */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="activities">Activités</TabsTrigger>
          <TabsTrigger value="system">Système</TabsTrigger>
          {isAdmin() && <TabsTrigger value="admin">Administration</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Graphique des ventes */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Revenus de la semaine
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip formatter={(value, name) => [`${value}€`, 'Revenus']} />
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

            {/* Articles populaires */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Articles populaires
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {popularItems.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                          <Utensils className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <span className="text-sm font-medium">{item.name}</span>
                          <p className="text-xs text-gray-500">{item.revenue}€ de revenus</p>
                        </div>
                      </div>
                      <Badge variant="outline">{item.count} ventes</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statut des réservations */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Réservations du jour
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={reservationStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {reservationStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Taux d'occupation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Taux d'occupation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600">
                      {stats.occupancyRate}%
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      Occupation actuelle
                    </p>
                  </div>
                  <Progress value={stats.occupancyRate} className="h-3" />
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>0%</span>
                    <span>Objectif: 80%</span>
                    <span>100%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics Détaillées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Module d'analytics avancées en cours de développement
                </p>
                {canManage('analytics') && (
                  <Button className="mt-4" onClick={() => toast.toast({ title: 'Configuration', description: 'Module analytics bientôt disponible', variant: 'default' })}>
                    Configurer Analytics
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Activités Récentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className={`p-2 rounded-full ${
                      activity.status === 'success' ? 'bg-green-100 dark:bg-green-900/20' :
                      activity.status === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                      activity.status === 'error' ? 'bg-red-100 dark:bg-red-900/20' :
                      'bg-blue-100 dark:bg-blue-900/20'
                    }`}>
                      {activity.icon || <Activity className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                    </div>
                    <Badge variant={
                      activity.status === 'success' ? 'default' :
                      activity.status === 'warning' ? 'secondary' :
                      activity.status === 'error' ? 'destructive' :
                      'outline'
                    }>
                      {activity.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                État du Système
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemStatus.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <span className="font-medium">{service.service}</span>
                        {service.responseTime && (
                          <p className="text-xs text-gray-500">
                            Temps de réponse: {service.responseTime}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-green-600">
                        {service.status === 'operational' ? 'Opérationnel' : service.status}
                      </Badge>
                      {service.uptime && (
                        <p className="text-xs text-gray-500 mt-1">
                          Uptime: {service.uptime}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin() && (
          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Administration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Accès administrateur détecté. Vous avez accès à toutes les fonctionnalités.
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Rôle: {userRole} | Permissions complètes activées
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

// Composant de squelette pour le chargement
function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center space-x-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-48 mb-4" />
              <Skeleton className="h-80 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}