import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Calendar, TrendingUp, Users, DollarSign } from "lucide-react";
import React from "react";

// Define colors for the pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// Define types for better TypeScript support
interface ReservationData {
  customerName: string;
  time: string;
  guests: number;
  status: string;
}

interface StatusData {
  status: string;
  count: number;
}

interface RevenueData {
  date: string;
  revenue: number;
}

interface TodayStats {
  count: number;
}

interface OccupancyData {
  rate: number;
}

export default function DashboardCharts() : void {
  const { data: dailyReservations = [] } = useQuery<ReservationData[]>({
    queryKey: ["/api/stats/daily-reservations"],
  });

  const { data: reservationsByStatus = [] } = useQuery<StatusData[]>({
    queryKey: ["/api/stats/reservations-by-status"],
  });

  const { data: revenueStats = [] } = useQuery<RevenueData[]>({
    queryKey: ["/api/stats/revenue"],
  });

  const { data: ordersByStatus = [] } = useQuery<StatusData[]>({
    queryKey: ["/api/stats/orders-by-status"],
  });

  const { data: todayReservations = { count: 0 } } = useQuery<TodayStats>({
    queryKey: ["/api/stats/today-reservations"],
  });

  const { data: occupancyData = { rate: 0 } } = useQuery<OccupancyData>({
    queryKey: ["/api/stats/occupancy"],
  });

  // Formatage des données pour les graphiques
  const formattedDailyData = dailyReservations.map((item: ReservationData, index: number) => ({
    name: `${item.customerName}`,
    heure: item.time,
    invites: item.guests,
    status: getStatusLabel(item.status)
  }));

  const formattedReservationsStatusData = reservationsByStatus.map((item: StatusData, index: number) => ({
    name: getStatusLabel(item.status),
    value: item.count,
    fill: COLORS[index % COLORS.length]
  }));

  const formattedRevenueData = revenueStats.map((item: RevenueData) => ({
    date: new Date(item.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
    revenue: item.revenue
  }));

  const formattedOrdersData = ordersByStatus.map((item: StatusData, index: number) => ({
    name: getStatusLabel(item.status),
    value: item.count,
    fill: COLORS[index % COLORS.length]
  }));

  function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
      pending: "En attente",
      confirmed: "Confirmé",
      cancelled: "Annulé",
      completed: "Terminé",
      preparing: "En préparation", 
      ready: "Prêt"
    };
    return labels[status] || status;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Réservations Aujourd'hui</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailyReservations.length}</div>
            <p className="text-xs text-muted-foreground">
              Réservations en cours
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus du Mois</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {revenueStats.reduce((sum: number, item: RevenueData) => sum + item.revenue, 0).toFixed(0)}€
            </div>
            <p className="text-xs text-muted-foreground">
              Chiffre d'affaires mensuel
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes Actives</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ordersByStatus
                .filter((item: StatusData) => ['pending', 'preparing', 'ready'].includes(item.status))
                .reduce((sum: number, item: StatusData) => sum + item.count, 0)
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Commandes en cours
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'Occupation</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupancyData.rate}%</div>
            <p className="text-xs text-muted-foreground">
              Capacité utilisée
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Réservations du Jour</CardTitle>
            <CardDescription>
              Liste des réservations d'aujourd'hui
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={formattedDailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  labelFormatter={(label) => `Client: ${label}`}
                  formatter={(value: any, name: any) => {
                    if (name === 'invites') return [value, 'Invités'];
                    return [value, name];
                  }}
                />
                <Bar dataKey="invites" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statut des Réservations</CardTitle>
            <CardDescription>
              Répartition par statut
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={formattedReservationsStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {formattedReservationsStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenus des 30 Derniers Jours</CardTitle>
            <CardDescription>
              Évolution du chiffre d'affaires
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={formattedRevenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => [`${value}€`, 'Revenus']}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statut des Commandes</CardTitle>
            <CardDescription>
              Répartition des commandes par statut
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={formattedOrdersData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {formattedOrdersData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}