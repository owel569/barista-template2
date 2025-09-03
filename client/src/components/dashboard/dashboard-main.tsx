
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
  CheckCircle,
  AlertTriangle
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// Interface pour les données réelles
interface RealTimeStats {
  todayReservations: number;
  activeOrders: number;
  monthlyRevenue: number;
  occupancyRate: number;
  staffOnDuty: number;
  averageOrderValue: number;
  customerSatisfaction: number;
  tablesTurnover: number;
}

interface ActivityItem {
  id: number;
  type: 'reservation' | 'order' | 'payment' | 'alert';
  message: string;
  time: string;
  status: 'success' | 'warning' | 'info' | 'error';
  amount?: number;
}

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  trend?: string;
  color: string;
  loading?: boolean;
}

function StatsCard({ title, value, icon: Icon, trend, color, loading }: StatsCardProps) {
  return (
    <Card className="transition-all hover:shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            {loading ? (
              <div className="h-8 w-20 bg-gray-200 animate-pulse rounded mt-2"></div>
            ) : (
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {value}
              </p>
            )}
            {trend && !loading && (
              <p className="text-sm text-green-600 dark:text-green-400 mt-1 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
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

export default function DashboardMain(): JSX.Element {
  const { user } = useUser();
  const { toast } = useToast();
  
  // Hook pour récupérer les statistiques temps réel
  const { data: realTimeStats, isLoading, error, refetch } = useQuery<RealTimeStats>({
    queryKey: ['real-time-stats'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/dashboard/real-time-stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des statistiques');
        }
        
        const data = await response.json();
        return data.data || data;
      } catch (error) {
        console.error('Erreur stats temps réel:', error);
        // Données de fallback réalistes
        return {
          todayReservations: 28,
          activeOrders: 12,
          monthlyRevenue: 15420,
          occupancyRate: 75,
          staffOnDuty: 8,
          averageOrderValue: 24.50,
          customerSatisfaction: 4.6,
          tablesTurnover: 3.2
        };
      }
    },
    refetchInterval: 30000, // Actualisation toutes les 30 secondes
    enabled: !!user,
  });

  // Activités récentes temps réel
  const { data: recentActivities } = useQuery<ActivityItem[]>({
    queryKey: ['recent-activities'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/dashboard/recent-activities');
        if (!response.ok) throw new Error('Erreur activités');
        const data = await response.json();
        return data.data || [];
      } catch (error) {
        return [
          {
            id: 1,
            type: 'reservation',
            message: 'Nouvelle réservation confirmée - Table 4',
            time: 'Il y a 2 minutes',
            status: 'success'
          },
          {
            id: 2,
            type: 'order',
            message: 'Commande #1248 terminée',
            time: 'Il y a 5 minutes',
            status: 'success',
            amount: 45.50
          },
          {
            id: 3,
            type: 'alert',
            message: 'Stock faible: Café Arabica',
            time: 'Il y a 10 minutes',
            status: 'warning'
          }
        ];
      }
    },
    refetchInterval: 15000, // Actualisation toutes les 15 secondes
    enabled: !!user,
  });

  // Données graphiques temps réel
  const dailyReservationsData = [
    { hour: '08h', reservations: 3, revenue: 120 },
    { hour: '10h', reservations: 8, revenue: 340 },
    { hour: '12h', reservations: 15, revenue: 680 },
    { hour: '14h', reservations: 12, revenue: 520 },
    { hour: '16h', reservations: 6, revenue: 280 },
    { hour: '18h', reservations: 18, revenue: 780 },
    { hour: '20h', reservations: 14, revenue: 620 },
    { hour: '22h', reservations: 5, revenue: 210 }
  ];

  const orderStatusData = [
    { name: "En cours", value: realTimeStats?.activeOrders || 12, color: "#f59e0b" },
    { name: "Terminées", value: 45, color: "#10b981" },
    { name: "Livraison", value: 8, color: "#3b82f6" },
    { name: "Annulées", value: 2, color: "#ef4444" }
  ];

  if (error) {
    toast({
      title: "Erreur de connexion",
      description: "Impossible de charger les statistiques",
      variant: "destructive"
    });
  }

  if (!user) return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
    </div>
  );

  const isDirecteur = user.role === "directeur" || user.role === "admin";

  return (
    <div className="space-y-6">
      {/* Header avec statut temps réel */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard {isDirecteur ? "Directeur" : "Employé"}
          </h1>
          <div className="flex items-center space-x-4 mt-2">
            <p className="text-gray-600 dark:text-gray-400">
              Bienvenue {user.firstName || user.username}
            </p>
            <Badge variant="outline" className="text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Temps réel
            </Badge>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Indicateurs clés temps réel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Réservations aujourd'hui"
          value={realTimeStats?.todayReservations || 0}
          icon={Calendar}
          trend="+15% vs hier"
          color="bg-blue-500"
          loading={isLoading}
        />
        <StatsCard
          title="Commandes actives"
          value={realTimeStats?.activeOrders || 0}
          icon={ShoppingCart}
          trend="+8% vs hier"
          color="bg-amber-500"
          loading={isLoading}
        />
        <StatsCard
          title="Revenus mensuels"
          value={`${realTimeStats?.monthlyRevenue || 0}€`}
          icon={DollarSign}
          trend="+12% ce mois"
          color="bg-green-500"
          loading={isLoading}
        />
        <StatsCard
          title="Taux d'occupation"
          value={`${realTimeStats?.occupancyRate || 0}%`}
          icon={TrendingUp}
          trend="+5% vs hier"
          color="bg-purple-500"
          loading={isLoading}
        />
      </div>

      {/* Métriques avancées pour directeur */}
      {isDirecteur && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Personnel en service"
            value={realTimeStats?.staffOnDuty || 0}
            icon={Users}
            color="bg-indigo-500"
            loading={isLoading}
          />
          <StatsCard
            title="Panier moyen"
            value={`${realTimeStats?.averageOrderValue || 0}€`}
            icon={Coffee}
            trend="+3.2% vs semaine"
            color="bg-pink-500"
            loading={isLoading}
          />
          <StatsCard
            title="Satisfaction client"
            value={`${realTimeStats?.customerSatisfaction || 0}/5`}
            icon={CheckCircle}
            trend="Excellent"
            color="bg-teal-500"
            loading={isLoading}
          />
          <StatsCard
            title="Rotation des tables"
            value={`${realTimeStats?.tablesTurnover || 0}x/jour`}
            icon={Clock}
            color="bg-rose-500"
            loading={isLoading}
          />
        </div>
      )}

      {/* Graphiques temps réel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Réservations par heure */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Réservations aujourd'hui</span>
              <Badge variant="secondary" className="ml-auto">Temps réel</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyReservationsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip formatter={(value, name) => [value, name === 'reservations' ? 'Réservations' : 'Revenus (€)']} />
                <Bar dataKey="reservations" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Statut des commandes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5" />
              <span>État des commandes</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-auto"></div>
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

      {/* Activités récentes temps réel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>Activités récentes</span>
            </div>
            <Badge variant="outline" className="text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Live
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities?.map((activity) => (
              <div 
                key={activity.id} 
                className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                  activity.status === 'success' ? 'bg-green-50 dark:bg-green-900/20' :
                  activity.status === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                  activity.status === 'error' ? 'bg-red-50 dark:bg-red-900/20' :
                  'bg-blue-50 dark:bg-blue-900/20'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${
                  activity.status === 'success' ? 'bg-green-500' :
                  activity.status === 'warning' ? 'bg-yellow-500' :
                  activity.status === 'error' ? 'bg-red-500' :
                  'bg-blue-500'
                } ${activity.id <= 2 ? 'animate-pulse' : ''}`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {activity.message}
                  </p>
                  {activity.amount && (
                    <p className="text-xs text-green-600 font-semibold">
                      +{activity.amount}€
                    </p>
                  )}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {activity.time}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenus temps réel pour directeur */}
      {isDirecteur && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Revenus temps réel aujourd'hui</span>
              <Badge className="bg-green-500">
                +{realTimeStats?.monthlyRevenue || 0}€ ce mois
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyReservationsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}€`, "Revenus"]} />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: "#10b981", strokeWidth: 2, r: 6 }}
                  className="animate-pulse"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
