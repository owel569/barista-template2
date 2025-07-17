import React from "react";
import { useUser } from "@/hooks/use-user";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  ShoppingCart,
  Users,
  Coffee,
  TrendingUp,
  Clock,
  DollarSign,
  CheckCircle
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";

// Mock data for charts
const dailyReservationsData = [
  { day: "Lun", reservations: 12 },
  { day: "Mar", reservations: 19 },
  { day: "Mer", reservations: 15 },
  { day: "Jeu", reservations: 22 },
  { day: "Ven", reservations: 28 },
  { day: "Sam", reservations: 35 },
  { day: "Dim", reservations: 18 }
];

const orderStatusData = [
  { name: "En cours", value: 8, color: "#f59e0b" },
  { name: "Terminé", value: 23, color: "#10b981" },
  { name: "Livraison", value: 5, color: "#3b82f6" },
  { name: "Annulé", value: 2, color: "#ef4444" }
];

const revenueData = [
  { time: "08h", revenue: 450 },
  { time: "10h", revenue: 680 },
  { time: "12h", revenue: 1200 },
  { time: "14h", revenue: 890 },
  { time: "16h", revenue: 750 },
  { time: "18h", revenue: 950 },
  { time: "20h", revenue: 420 }
];

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  color: string;
}

function StatsCard({ title, value, icon: Icon, trend, color }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {value}
            </p>
            {trend && (
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                {trend}
              </p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardMain() {
  const { user } = useUser();
  
  const { data: todayReservations } = useQuery({
    queryKey: ["/api/admin/stats/today-reservations"],
    enabled: !!user,
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/stats/today-reservations');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        return data.data || data;
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
        return { count: 0 };
      }
    }
  });

  const { data: monthlyRevenue } = useQuery({
    queryKey: ["/api/admin/stats/monthly-revenue"],
    enabled: !!user,
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/stats/monthly-revenue');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        return data.data || data;
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
        return { revenue: 0 };
      }
    }
  });

  const { data: activeOrders } = useQuery({
    queryKey: ["/api/admin/stats/active-orders"],
    enabled: !!user,
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/stats/active-orders');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        return data.data || data;
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
        return { count: 0 };
      }
    }
  });

  const { data: occupancyRate } = useQuery({
    queryKey: ["/api/admin/stats/occupancy-rate"],
    enabled: !!user,
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/stats/occupancy-rate');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        return data.data || data;
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
        return { rate: 0 };
      }
    }
  });

  const { data: weeklyStats } = useQuery({
    queryKey: ["/api/dashboard/weekly-stats"],
    enabled: !!user,
    queryFn: async () => {
      try {
        const response = await fetch('/api/dashboard/weekly-stats');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        return data.data || data;
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
        return {};
      }
    }
  });

  if (!user) return null;

  const isDirecteur = user.role === "directeur";

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Tableau de bord {isDirecteur ? "Directeur" : "Employé"}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Bienvenue {user.firstName || user.username}, voici un aperçu de l'activité d'aujourd'hui.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Réservations aujourd'hui"
          value={todayReservations?.count || 0}
          icon={Calendar}
          trend="+12% vs hier"
          color="bg-blue-500"
        />
        <StatsCard
          title="Commandes en cours"
          value={activeOrders?.count || 0}
          icon={ShoppingCart}
          trend="+5% vs hier"
          color="bg-amber-500"
        />
        <StatsCard
          title="Revenus mensuels"
          value={`${monthlyRevenue?.revenue || 0}€`}
          icon={DollarSign}
          trend="+8% ce mois"
          color="bg-green-500"
        />
        <StatsCard
          title="Taux d'occupation"
          value={`${Math.round(occupancyRate?.rate || 0)}%`}
          icon={TrendingUp}
          trend="+3% vs hier"
          color="bg-purple-500"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Reservations Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Réservations cette semaine</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyReservationsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="reservations" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Order Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5" />
              <span>Statut des commandes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Advanced charts for Director only */}
      {isDirecteur && (
        <div className="space-y-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Revenus par heure aujourd'hui</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}€`, "Revenus"]} />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: "#10b981", strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Quick Actions for Director */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Gérer les employés
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ajouter, modifier ou gérer les permissions des employés
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <Clock className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Horaires d'ouverture
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configurer les heures d'ouverture et jours fériés
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <Coffee className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Menu du jour
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Mettre à jour les spécialités et promotions
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>Activités récentes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Nouvelle réservation confirmée
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Table 4 - 6 personnes - 19h30
                </p>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Il y a 5 min</span>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Commande terminée
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Commande #1247 - 45,50€
                </p>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Il y a 12 min</span>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Nouveau message client
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Question sur les allergènes
                </p>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Il y a 25 min</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}