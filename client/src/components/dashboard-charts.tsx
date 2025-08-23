import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { Calendar, TrendingUp, Users, DollarSign, Clock, CheckCircle, XCircle, Coffee, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

// Define a color palette for consistent styling
const CHART_COLORS = {
  primary: '#8884d8',
  secondary: '#82ca9d',
  accent: '#ffc658',
  pending: '#ffbb28',
  confirmed: '#00c49f',
  cancelled: '#ff8042',
  completed: '#0088fe',
  preparing: '#a4de6c',
  ready: '#d0ed57'
};

// Type definitions for better TypeScript support
interface ReservationData {
  id: string;
  customerName: string;
  time: string;
  guests: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}

interface StatusData {
  status: string;
  count: number;
}

interface RevenueData {
  date: string;
  revenue: number;
  averageOrderValue?: number;
}

interface DashboardStats {
  todayReservations: number;
  monthlyRevenue: number;
  activeOrders: number;
  occupancyRate: number;
}

const statusIcons: Record<string, JSX.Element> = {
  pending: <Clock className="w-4 h-4" />,
  confirmed: <CheckCircle className="w-4 h-4" />,
  cancelled: <XCircle className="w-4 h-4" />,
  completed: <Coffee className="w-4 h-4" />,
  preparing: <Loader2 className="w-4 h-4 animate-spin" />,
  ready: <CheckCircle className="w-4 h-4" />
};

export default function DashboardCharts(): JSX.Element {
  // Fetch all data in parallel with proper error handling
  const { 
    data: dailyReservations = [], 
    isLoading: reservationsLoading,
    error: reservationsError
  } = useQuery<ReservationData[]>({
    queryKey: ["daily-reservations"],
    queryFn: async () => {
      const res = await fetch("/api/stats/daily-reservations");
      if (!res.ok) throw new Error("Failed to fetch daily reservations");
      return res.json();
    },
  });

  const { 
    data: reservationsByStatus = [], 
    isLoading: statusLoading 
  } = useQuery<StatusData[]>({
    queryKey: ["reservations-by-status"],
    queryFn: async () => {
      const res = await fetch("/api/stats/reservations-by-status");
      if (!res.ok) throw new Error("Failed to fetch reservations by status");
      return res.json();
    },
  });

  const { 
    data: revenueStats = [], 
    isLoading: revenueLoading 
  } = useQuery<RevenueData[]>({
    queryKey: ["revenue-stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats/revenue");
      if (!res.ok) throw new Error("Failed to fetch revenue stats");
      return res.json();
    },
  });

  const { 
    data: ordersByStatus = [], 
    isLoading: ordersLoading 
  } = useQuery<StatusData[]>({
    queryKey: ["orders-by-status"],
    queryFn: async () => {
      const res = await fetch("/api/stats/orders-by-status");
      if (!res.ok) throw new Error("Failed to fetch orders by status");
      return res.json();
    },
  });

  const { 
    data: dashboardStats, 
    isLoading: statsLoading 
  } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats/summary");
      if (!res.ok) throw new Error("Failed to fetch dashboard stats");
      return res.json();
    },
  });

  // Format data for charts with memoization to prevent unnecessary recalculations
  const formattedDailyData = React.useMemo(() => 
    dailyReservations.map((item) => ({
      id: item.id,
      name: item.customerName,
      time: item.time,
      guests: item.guests,
      status: getStatusLabel(item.status),
      statusColor: getStatusColor(item.status});)
  , [dailyReservations]);

  const formattedReservationsStatusData = React.useMemo(() => 
    reservationsByStatus.map((item) => ({
      name: getStatusLabel(item.status),
      value: item.count,
      color: getStatusColor(item.status),
      icon: statusIcons[item.status]
    });, [reservationsByStatus]);

  const formattedRevenueData = React.useMemo(() => 
    revenueStats.map((item) => ({
      date: new Date(item.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
      revenue: item.revenue,
      average: item.averageOrderValue || 0
    });, [revenueStats]);

  const formattedOrdersData = React.useMemo(() => 
    ordersByStatus.map((item) => ({
      name: getStatusLabel(item.status),
      value: item.count,
      color: getStatusColor(item.status),
      icon: statusIcons[item.status]
    });, [ordersByStatus]);

  // Helper functions
  function getStatusLabel(status: string): string {
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

  function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      pending: CHART_COLORS.pending,
      confirmed: CHART_COLORS.confirmed,
      cancelled: CHART_COLORS.cancelled,
      completed: CHART_COLORS.completed,
      preparing: CHART_COLORS.preparing,
      ready: CHART_COLORS.ready
    };
    return colors[status] || CHART_COLORS.primary;
  }

  // Custom tooltip components for better UX
  const renderCustomTooltip = (data: any) => {
    if (data.active && data.payload && data.payload.length) {
      const payload = data.payload[0].payload;
      return (
        <div className="bg-white p-4 border rounded-lg shadow-sm">
          <p className="font-medium">{payload.name || payload.date}</p>
          {payload.guests && <p>Invites: {payload.guests}</p>}
          {payload.revenue && <p>Revenu: {payload.revenue}€</p>}
          {payload.average && <p>Moyenne: {payload.average}€</p>}
          {payload.status && (
            <div className="flex items-center mt-1">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: payload.statusColor }}
              />
              <span>{payload.status}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const renderPieTooltip = (data: any) => {
    if (data.active && data.payload && data.payload.length) {
      const payload = data.payload[0].payload;
      return (
        <div className="bg-white p-4 border rounded-lg shadow-sm">
          <div className="flex items-center">
            {payload.icon && React.cloneElement(payload.icon, { className: "w-4 h-4 mr-2" })}
            <p className="font-medium">{payload.name}</p>
          </div>
          <p>Total: {payload.value}</p>
          <p>Pourcentage: {((payload.value / data.payload.reduce((sum: number, item: any) => sum + item.value, 0);* 100).toFixed(1}%</p>
        </div>
      );
    }
    return null;
  };

  // Loading state
  if (statsLoading || reservationsLoading || statusLoading || revenueLoading || ordersLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          );}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          );}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Réservations Aujourd'hui</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.todayReservations || 0}</div>
            <p className="text-xs text-muted-foreground">
              {dailyReservations.length} ce jour
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
              {dashboardStats?.monthlyRevenue?.toFixed(0) || 0}€
            </div>
            <p className="text-xs text-muted-foreground">
              Moyenne: {(revenueStats.reduce((sum, item) => sum + (item.averageOrderValue || 0), 0) / (revenueStats.length || 1);.toFixed(2}€
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
              {dashboardStats?.activeOrders || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {ordersByStatus.filter(item => ['pending', 'preparing', 'ready'].includes(item.status);.reduce((sum, item) => sum + item.count, 0} en cours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'Occupation</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.occupancyRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Capacité maximale utilisée
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Daily Reservations Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Réservations du Jour</CardTitle>
            <CardDescription>
              Liste des réservations d'aujourd'hui par client
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={formattedDailyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.split(' ')[0]} // Show only first name
                />
                <YAxis />
                <Tooltip content={renderCustomTooltip} />
                <Bar 
                  dataKey="guests" 
                  name="Invités"
                  fill={CHART_COLORS.primary}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Reservations Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Statut des Réservations</CardTitle>
            <CardDescription>
              Répartition des réservations par statut
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
                  label={({ name, percent }) => 
                    `${name} ${(percent * 100).toFixed(0}%`
                  }
                  outerRadius={80}
                  innerRadius={40}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {formattedReservationsStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  );}
                </Pie>
                <Legend 
                  formatter={(value, entry, index) => {
                    const data = formattedReservationsStatusData[index];
                    return (
                      <span className="flex items-center">
                        {data.icon}
                        <span className="ml-2">{value}</span>
                      </span>
                    );
                  }}
                />
                <Tooltip content={renderPieTooltip} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenus des 30 Derniers Jours</CardTitle>
            <CardDescription>
              Évolution du chiffre d'affaires journalier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={formattedRevenueData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip content={renderCustomTooltip} />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  name="Revenus"
                  stroke={CHART_COLORS.primary} 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="average" 
                  name="Moyenne"
                  stroke={CHART_COLORS.secondary} 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Orders Status Pie Chart */}
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
                  label={({ name, percent }) => 
                    `${name} ${(percent * 100).toFixed(0}%`
                  }
                  outerRadius={80}
                  innerRadius={40}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {formattedOrdersData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  );}
                </Pie>
                <Legend 
                  formatter={(value, entry, index) => {
                    const data = formattedOrdersData[index];
                    return (
                      <span className="flex items-center">
                        {data.icon}
                        <span className="ml-2">{value}</span>
                      </span>
                    );
                  }}
                />
                <Tooltip content={renderPieTooltip} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}