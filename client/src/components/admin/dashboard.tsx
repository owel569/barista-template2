import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWebSocket } from '@/hooks/useWebSocket';
import { 
  Calendar, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  Clock,
  Euro,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface DashboardStats {
  todayReservations: number;
  monthlyRevenue: number;
  activeOrders: number;
  occupancyRate: number;
  reservationStatus: Array<{ status: string; count: number; }>;
  dailyReservations: Array<{ date: string; count: number; }>;
}

interface DashboardProps {
  userRole: 'directeur' | 'employe';
}

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'];

export default function Dashboard({ userRole }: DashboardProps) {
  // Initialiser WebSocket pour les notifications temps réel
  useWebSocket();
  
  const [stats, setStats] = useState<DashboardStats>({
    todayReservations: 0,
    monthlyRevenue: 0,
    activeOrders: 0,
    occupancyRate: 0,
    reservationStatus: [],
    dailyReservations: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
    
    // Actualisation automatique toutes les 10 secondes
    const interval = setInterval(() => {
      fetchDashboardStats();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch all stats in parallel
      const [
        todayRes,
        revenueRes,
        ordersRes,
        occupancyRes,
        statusRes,
        dailyRes
      ] = await Promise.all([
        fetch('/api/admin/stats/today-reservations', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/stats/monthly-revenue', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/stats/active-orders', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/stats/occupancy-rate', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/stats/reservation-status', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/stats/daily-reservations', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const [todayData, revenueData, ordersData, occupancyData, statusData, dailyData] = await Promise.all([
        todayRes.json(),
        revenueRes.json(),
        ordersRes.json(),
        occupancyRes.json(),
        statusRes.json(),
        dailyRes.json()
      ]);

      setStats({
        todayReservations: todayData.count || 0,
        monthlyRevenue: revenueData.revenue || 0,
        activeOrders: ordersData.count || 0,
        occupancyRate: occupancyData.rate || 0,
        reservationStatus: statusData || [],
        dailyReservations: dailyData || []
      });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tableau de bord
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Vue d'ensemble des activités du café
          </p>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
          {userRole === 'directeur' ? 'Directeur' : 'Employé'}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Réservations Aujourd'hui</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayReservations}</div>
            <p className="text-xs text-muted-foreground">
              Nouvelles réservations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'Affaires</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthlyRevenue.toFixed(2)}€</div>
            <p className="text-xs text-muted-foreground">
              Ce mois-ci
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes Actives</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeOrders}</div>
            <p className="text-xs text-muted-foreground">
              En préparation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'Occupation</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.occupancyRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Aujourd'hui
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reservation Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Statut des Réservations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.reservationStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {stats.reservationStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily Reservations Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Réservations (7 derniers jours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.dailyReservations}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#f59e0b" name="Réservations" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Actions Rapides
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h4 className="font-medium">Réservations</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Gérer les réservations du jour
              </p>
            </div>
            
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart className="h-4 w-4 text-green-600 dark:text-green-400" />
                <h4 className="font-medium">Commandes</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Suivre les commandes actives
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <h4 className="font-medium">Clients</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Base de données clients
              </p>
            </div>
            
            {userRole === 'directeur' && (
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <h4 className="font-medium">Paramètres</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configuration du système
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}