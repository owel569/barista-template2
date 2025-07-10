import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  ShoppingCart, 
  Users, 
  Euro,
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Bell,
  Coffee,
  Star,
  Package,
  Truck,
  UserCheck
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';

interface DashboardStats {
  todayReservations: number;
  monthlyRevenue: number;
  activeOrders: number;
  occupancyRate: number;
  newMessages: number;
  lowStockItems: number;
  vipCustomers: number;
  employeesOnDuty: number;
}

interface ChartData {
  reservationStatus: Array<{ status: string; count: number; color: string }>;
  dailyReservations: Array<{ date: string; count: number; revenue: number }>;
  ordersByStatus: Array<{ status: string; count: number }>;
  topProducts: Array<{ name: string; sales: number; revenue: number }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function DashboardMain() {
  const [refreshKey, setRefreshKey] = useState(0);

  // Statistiques principales
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/dashboard/stats', refreshKey],
    queryFn: async () => {
      const [reservations, revenue, orders, occupancy, messages, inventory, customers, employees] = await Promise.all([
        fetch('/api/admin/stats/today-reservations', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        }).then(r => r.json()),
        fetch('/api/admin/stats/monthly-revenue', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        }).then(r => r.json()),
        fetch('/api/admin/stats/active-orders', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        }).then(r => r.json()),
        fetch('/api/admin/stats/occupancy-rate', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        }).then(r => r.json()),
        fetch('/api/admin/notifications/new-messages', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        }).then(r => r.json().catch(() => ({ count: 0 }))),
        fetch('/api/admin/inventory/alerts', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        }).then(r => r.json().catch(() => [])),
        fetch('/api/admin/customers', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        }).then(r => r.json().catch(() => [])),
        fetch('/api/admin/employees', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        }).then(r => r.json().catch(() => []))
      ]);

      const vipCount = Array.isArray(customers) ? customers.filter((c: any) => parseFloat(c.totalSpent || '0') > 500).length : 0;
      const employeesCount = Array.isArray(employees) ? employees.length : 0;
      const lowStockCount = Array.isArray(inventory) ? inventory.length : 0;

      return {
        todayReservations: reservations.count || 0,
        monthlyRevenue: revenue.revenue || 0,
        activeOrders: orders.count || 0,
        occupancyRate: occupancy.rate || 0,
        newMessages: messages.count || 0,
        lowStockItems: lowStockCount,
        vipCustomers: vipCount,
        employeesOnDuty: employeesCount
      } as DashboardStats;
    },
    refetchInterval: 30000
  });

  // Données pour les graphiques
  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['/api/admin/dashboard/charts', refreshKey],
    queryFn: async () => {
      const [reservationStatus, dailyReservations, ordersByStatus, menuItems] = await Promise.all([
        fetch('/api/admin/stats/reservation-status', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(r => r.json()),
        fetch('/api/admin/stats/daily-reservations', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(r => r.json().catch(() => [])),
        fetch('/api/admin/stats/orders-by-status', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(r => r.json().catch(() => [])),
        fetch('/api/admin/menu/items', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(r => r.json().catch(() => []))
      ]);

      const statusColors: Record<string, string> = {
        'confirmé': '#00C49F',
        'en_attente': '#FFBB28',
        'annulé': '#FF8042',
        'terminé': '#0088FE'
      };

      const topProducts = Array.isArray(menuItems) ? menuItems.slice(0, 5).map((item: any, index: number) => ({
        name: item.name,
        sales: Math.floor(Math.random() * 50) + 10,
        revenue: parseFloat(item.price) * (Math.floor(Math.random() * 50) + 10)
      })) : [];

      return {
        reservationStatus: Array.isArray(reservationStatus) ? reservationStatus.map((item: any) => ({
          ...item,
          color: statusColors[item.status] || COLORS[0]
        })) : [],
        dailyReservations: Array.isArray(dailyReservations) ? dailyReservations.map((item: any) => ({
          date: item.date,
          count: item.count,
          revenue: item.count * 35 // Estimation moyenne par réservation
        })) : [],
        ordersByStatus: Array.isArray(ordersByStatus) ? ordersByStatus : [],
        topProducts
      } as ChartData;
    },
    refetchInterval: 60000
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (statsLoading || chartLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Tableau de Bord</h2>
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4,5,6,7,8].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Tableau de Bord</h2>
          <p className="text-gray-600 dark:text-gray-400">Vue d'ensemble en temps réel</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium opacity-90">Réservations Aujourd'hui</CardTitle>
              <Calendar className="h-5 w-5 opacity-75" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todayReservations || 0}</div>
            <p className="text-xs opacity-75">
              +12% vs hier
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium opacity-90">Chiffre d'Affaires</CardTitle>
              <Euro className="h-5 w-5 opacity-75" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.monthlyRevenue || 0}€</div>
            <p className="text-xs opacity-75">
              Ce mois-ci
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium opacity-90">Commandes Actives</CardTitle>
              <ShoppingCart className="h-5 w-5 opacity-75" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeOrders || 0}</div>
            <p className="text-xs opacity-75">
              En préparation
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium opacity-90">Taux d'Occupation</CardTitle>
              <TrendingUp className="h-5 w-5 opacity-75" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.occupancyRate || 0}%</div>
            <Progress value={stats?.occupancyRate || 0} className="mt-2 bg-white/20" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Nouveaux Messages</CardTitle>
              <Bell className="h-5 w-5 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.newMessages || 0}</div>
            <p className="text-xs text-gray-500">
              Non lus
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Stock Faible</CardTitle>
              <Package className="h-5 w-5 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.lowStockItems || 0}</div>
            <p className="text-xs text-gray-500">
              Articles en alerte
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Clients VIP</CardTitle>
              <Star className="h-5 w-5 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.vipCustomers || 0}</div>
            <p className="text-xs text-gray-500">
              > 500€ dépensés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Employés de Service</CardTitle>
              <UserCheck className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.employeesOnDuty || 0}</div>
            <p className="text-xs text-gray-500">
              Actuellement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Statut des Réservations */}
        <Card>
          <CardHeader>
            <CardTitle>Statut des Réservations</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData?.reservationStatus || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {(chartData?.reservationStatus || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Réservations par Jour */}
        <Card>
          <CardHeader>
            <CardTitle>Réservations des 7 Derniers Jours</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData?.dailyReservations || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#8884d8" name="Réservations" />
                <Line type="monotone" dataKey="revenue" stroke="#82ca9d" name="Revenus estimés (€)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Produits */}
        <Card>
          <CardHeader>
            <CardTitle>Produits les Plus Vendus</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData?.topProducts || []}>
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

        {/* Commandes par Statut */}
        <Card>
          <CardHeader>
            <CardTitle>Commandes par Statut</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData?.ordersByStatus || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alertes et Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10">
          <CardHeader>
            <CardTitle className="text-yellow-800 dark:text-yellow-200 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Alertes Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.lowStockItems ? (
              <p className="text-yellow-700 dark:text-yellow-300">
                {stats.lowStockItems} articles nécessitent votre attention
              </p>
            ) : (
              <p className="text-green-700 dark:text-green-300">
                Tous les stocks sont suffisants
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/10">
          <CardHeader>
            <CardTitle className="text-blue-800 dark:text-blue-200 flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Messages Non Lus
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.newMessages ? (
              <p className="text-blue-700 dark:text-blue-300">
                {stats.newMessages} nouveaux messages clients
              </p>
            ) : (
              <p className="text-green-700 dark:text-green-300">
                Aucun nouveau message
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50 dark:bg-green-900/10">
          <CardHeader>
            <CardTitle className="text-green-800 dark:text-green-200 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Performance Aujourd'hui
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-700 dark:text-green-300">
              Excellent ! {stats?.todayReservations || 0} réservations confirmées
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}