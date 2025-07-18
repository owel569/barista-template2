import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Star
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, AreaChart, Area } from 'recharts';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface DashboardStats {
  todayReservations: number;
  monthlyRevenue: number;
  activeOrders: number;
  occupancyRate: number;
  reservationStatus: Array<{ status: string; count: number; }>;
}

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    todayReservations: 0,
    monthlyRevenue: 0,
    activeOrders: 0,
    occupancyRate: 0,
    reservationStatus: []
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('barista_auth_token');

      const response = await fetch('/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setStats({
          todayReservations: data.data.reservations || 0,
          monthlyRevenue: data.data.revenue || 0,
          activeOrders: data.data.orders || 0,
          occupancyRate: Math.round((data.data.reservations / 50) * 100) || 0,
          reservationStatus: [
            { status: 'Confirmées', count: Math.floor(data.data.reservations * 0.7) },
            { status: 'En attente', count: Math.floor(data.data.reservations * 0.2) },
            { status: 'Annulées', count: Math.floor(data.data.reservations * 0.1) }
          ]
        });
      } else {
        console.warn('API a retourné success: false');
        setStats({
          todayReservations: 0,
          monthlyRevenue: 0,
          activeOrders: 0,
          occupancyRate: 0,
          reservationStatus: []
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      // Valeurs par défaut en cas d'erreur
      setStats({
        todayReservations: 0,
        monthlyRevenue: 0,
        activeOrders: 0,
        occupancyRate: 0,
        reservationStatus: []
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
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
        <Button onClick={fetchStats} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
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
                  {stats.monthlyRevenue}€
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

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Répartition des réservations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.reservationStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, count }) => `${status}: ${count}`}
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-600" />
              Activité récente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Nouvelle réservation
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Table 4 - 19h30
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Commande terminée
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    2 cappuccinos, 1 croissant
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <Users className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Nouveau client
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Inscription programme fidélité
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes et notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            Alertes importantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-900 dark:text-red-100">
                  Stock faible
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">
                  2 articles en rupture de stock
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <Clock className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  Réservations en attente
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  3 réservations nécessitent une confirmation
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}