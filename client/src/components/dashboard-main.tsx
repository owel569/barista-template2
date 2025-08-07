import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar, 
  ShoppingCart, 
  DollarSign, 
  Activity,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Clock
} from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
type UserRole = 'directeur' | 'employe' | 'admin';

interface DashboardMainProps {
  userRole?: UserRole;
}

export default function DashboardMain({ userRole = 'directeur' }: DashboardMainProps) {
  // Requêtes pour les statistiques
  const { data: todayReservations } = useQuery({
    queryKey: ["/api/admin/stats/today-reservations",],
  });

  const { data: monthlyRevenue } = useQuery({
    queryKey: ["/api/admin/stats/monthly-revenue",],
  });

  const { data: activeOrders } = useQuery({
    queryKey: ["/api/admin/stats/active-orders",],
  });

  const { data: occupancyRate } = useQuery({
    queryKey: ["/api/admin/stats/occupancy-rate",],
  });

  const { data: dailyReservations } = useQuery({
    queryKey: ["/api/admin/stats/daily-reservations",],
  });

  const { data: reservationStatus } = useQuery({
    queryKey: ["/api/admin/stats/reservation-status",],
  });

  // Données pour les graphiques avec fallback
  const dailyData = dailyReservations || [
    { date: "Lun", count: 0 },
    { date: "Mar", count: 0 },
    { date: "Mer", count: 0 },
    { date: "Jeu", count: 0 },
    { date: "Ven", count: 0 },
    { date: "Sam", count: 0 },
    { date: "Dim", count: 0 }
  ];

  const statusData = reservationStatus || [];

  const hourlyData = [
    { hour: "8h", commandes: 5 },
    { hour: "10h", commandes: 12 },
    { hour: "12h", commandes: 28 },
    { hour: "14h", commandes: 22 },
    { hour: "16h", commandes: 15 },
    { hour: "18h", commandes: 30 },
    { hour: "20h", commandes: 25 }
  ];

  const getRoleTitle = (role: UserRole) => {
    switch (role) {
      case "directeur": return "Tableau de bord Directeur";
      case "employe": return "Tableau de bord Employé";
      case "admin": return "Tableau de bord Administrateur";
      default: return "Tableau de bord";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {getRoleTitle(userRole)}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Vue d'ensemble de l'activité du café
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">
              Réservations aujourd'hui
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayReservations?.count || 12}</div>
            <p className="text-xs text-blue-200">
              +2 par rapport à hier
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-amber-500 to-amber-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-100">
              Commandes en cours
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-amber-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeOrders?.count || 8}</div>
            <p className="text-xs text-amber-200">
              En préparation
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-100">
              Revenus du mois
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyRevenue?.revenue || "0"}€</div>
            <p className="text-xs text-green-200">
              +15% ce mois
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-100">
              Taux d'occupation
            </CardTitle>
            <Activity className="h-4 w-4 text-purple-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupancyRate?.rate || "78"}%</div>
            <p className="text-xs text-purple-200">
              Moyenne journalière
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques et analyses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Réservations par jour */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Réservations de la semaine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#F59E0B" 
                  strokeWidth={3}
                  dot={{ fill: "#F59E0B", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Statut des réservations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Statut des réservations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData.length > 0 ? statusData : [
                    { name: "Aucune donnée", value: 1, color: "#9CA3AF" }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(statusData.length > 0 ? statusData : [{ name: "Aucune donnée", value: 1, color: "#9CA3AF" )}]).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 flex flex-wrap gap-4">
              {statusData.length > 0 ? statusData.map((item, index: unknown) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {item.name}: {item.value}
                  </span>
                </div>
              )) : (
                <div className="text-sm text-gray-500">Aucune donnée disponible</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commandes par heure (visible seulement pour directeur) */}
      {(userRole === "directeur" || userRole === "admin") && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Commandes par heure aujourd'hui
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="commandes" 
                  fill="#10B981" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Alertes et notifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <AlertCircle className="h-5 w-5" />
              Alertes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-amber-500 rounded-full" />
                <span className="text-sm text-amber-800 dark:text-amber-200">
                  3 réservations en attente de confirmation
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-sm text-amber-800 dark:text-amber-200">
                  Stock de café faible (2 kg restants)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <CheckCircle className="h-5 w-5" />
              Activité récente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm text-green-800 dark:text-green-200">
                  Nouvelle réservation confirmée pour ce soir
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-sm text-green-800 dark:text-green-200">
                  Menu mis à jour avec 2 nouveaux plats
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}