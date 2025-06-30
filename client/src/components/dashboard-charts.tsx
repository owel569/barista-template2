import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Calendar, TrendingUp, Users, DollarSign } from "lucide-react";
import type {
  MonthlyReservation,
  RevenueStat,
  OrderStatus,
  TodayReservations,
  Occupancy,
} from "../types/stats";
import React from "react";
// Define colors for the pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function DashboardCharts() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
const { data: monthlyReservations = [] } = useQuery<MonthlyReservation[]>({
  queryKey: ["/api/stats/monthly-reservations", currentYear, currentMonth],
});
const { data: revenueStats = [] } = useQuery<RevenueStat[]>({
  queryKey: ["/api/stats/revenue"],
});
const { data: ordersByStatus = [] } = useQuery<OrderStatus[]>({
  queryKey: ["/api/stats/orders-by-status"],
});
const { data: todayReservations = { count: 0 } } = useQuery<TodayReservations>({
  queryKey: ["/api/stats/today-reservations"],
});
const { data: occupancyData = { rate: 0 } } = useQuery<Occupancy>({
  queryKey: ["/api/stats/occupancy"],
});

  // Formatage des données pour les graphiques
  const formattedMonthlyData = monthlyReservations.map((item: any) => ({
    date: new Date(item.date).getDate().toString(),
    reservations: item.count
  }));

  const formattedRevenueData = revenueStats.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
    revenue: item.revenue
  }));

  const formattedOrdersData = ordersByStatus.map((item: any, index: number) => ({
    name: getStatusLabel(item.status),
    value: item.count,
    color: COLORS[index % COLORS.length]
  }));

  function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
      pending: "En attente",
      preparing: "En préparation", 
      ready: "Prêt",
      completed: "Terminé",
      cancelled: "Annulé"
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
            <div className="text-2xl font-bold">{todayReservations.count}</div>
            <p className="text-xs text-muted-foreground">
              {occupancyData.rate}% de taux d'occupation
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
              {revenueStats.reduce((sum: number, item: any) => sum + item.revenue, 0).toFixed(0)}€
            </div>
            <p className="text-xs text-muted-foreground">
              +12% par rapport au mois dernier
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
                .filter((item: any) => ['pending', 'preparing', 'ready'].includes(item.status))
                .reduce((sum: number, item: any) => sum + item.count, 0)
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
            <CardTitle>Réservations ce Mois</CardTitle>
            <CardDescription>
              Évolution des réservations jour par jour
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={formattedMonthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  labelFormatter={(label) => `Jour ${label}`}
                  formatter={(value: any) => [value, 'Réservations']}
                />
                <Bar dataKey="reservations" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

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
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  dot={{ fill: '#82ca9d' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Répartition des Commandes</CardTitle>
            <CardDescription>
              Par statut de traitement
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
                  {formattedOrdersData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistiques Rapides</CardTitle>
            <CardDescription>
              Aperçu des performances
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Réservations ce mois</span>
              <span className="text-sm text-muted-foreground">
                {formattedMonthlyData.reduce((sum: number, item: any) => sum + item.reservations, 0)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Moyenne par jour</span>
              <span className="text-sm text-muted-foreground">
                {formattedMonthlyData.length > 0 
                  ? (formattedMonthlyData.reduce((sum: number, item: any) => sum + item.reservations, 0) / formattedMonthlyData.length).toFixed(1)
                  : 0
                }
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Commandes totales</span>
              <span className="text-sm text-muted-foreground">
                {ordersByStatus.reduce((sum: number, item: any) => sum + item.count, 0)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Taux de completion</span>
              <span className="text-sm text-muted-foreground">
                {ordersByStatus.length > 0 
                  ? (
                      (ordersByStatus.find((item: any) => item.status === 'completed')?.count || 0) / 
                      ordersByStatus.reduce((sum: number, item: any) => sum + item.count, 0) * 100
                    ).toFixed(1)
                  : 0
                }%
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Revenus moyens/jour</span>
              <span className="text-sm text-muted-foreground">
                {revenueStats.length > 0 
                  ? (revenueStats.reduce((sum: number, item: any) => sum + item.revenue, 0) / revenueStats.length).toFixed(0)
                  : 0
                }€
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}