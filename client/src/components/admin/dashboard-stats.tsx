import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  Euro,
  Calendar,
  Clock,
  Star,
  Package,
  AlertCircle
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface StatCard {
  title: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  color: string;
  suffix?: string;
}

export default function DashboardStats() {
  // Statistiques en temps réel
  const { data: realtimeStats, isLoading } = useQuery({
    queryKey: ['/api/admin/stats/realtime'],
    queryFn: async () => {
      const [reservations, revenue, customers, orders, loyalty, inventory] = await Promise.all([
        fetch('/api/admin/stats/today-reservations', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(r => r.json()),
        fetch('/api/admin/stats/monthly-revenue', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(r => r.json()),
        fetch('/api/admin/customers', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(r => r.json().catch(() => [])),
        fetch('/api/admin/orders', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(r => r.json().catch(() => [])),
        fetch('/api/admin/loyalty/stats', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(r => r.json().catch(() => ({ customers: [] }))),
        fetch('/api/admin/inventory/alerts', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(r => r.json().catch(() => []))
      ]);

      const totalCustomers = Array.isArray(customers) ? customers.length : 0;
      const totalOrders = Array.isArray(orders) ? orders.length : 0;
      const vipCustomers = Array.isArray(loyalty.customers) ? loyalty.customers.filter((c: any) => c.loyaltyLevel === 'VIP').length : 0;
      const lowStock = Array.isArray(inventory) ? inventory.length : 0;

      return {
        reservations: reservations.count || 0,
        revenue: revenue.revenue || 0,
        customers: totalCustomers,
        orders: totalOrders,
        vipCustomers,
        lowStock
      };
    },
    refetchInterval: 30000
  });

  // Données pour les graphiques avancés
  const { data: chartData } = useQuery({
    queryKey: ['/api/admin/stats/charts'],
    queryFn: async () => {
      // Données simulées pour les graphiques avancés
      const weeklyRevenue = [
        { day: 'Lun', revenue: 1240, orders: 18 },
        { day: 'Mar', revenue: 1580, orders: 23 },
        { day: 'Mer', revenue: 980, orders: 15 },
        { day: 'Jeu', revenue: 1350, orders: 20 },
        { day: 'Ven', revenue: 1890, orders: 28 },
        { day: 'Sam', revenue: 2240, orders: 35 },
        { day: 'Dim', revenue: 1680, orders: 25 }
      ];

      const customerSegments = [
        { name: 'Nouveaux', value: 35, color: '#0088FE' },
        { name: 'Réguliers', value: 45, color: '#00C49F' },
        { name: 'Fidèles', value: 15, color: '#FFBB28' },
        { name: 'VIP', value: 5, color: '#FF8042' }
      ];

      const productPerformance = [
        { name: 'Cappuccino', sales: 156, revenue: 468 },
        { name: 'Latte', sales: 142, revenue: 568 },
        { name: 'Espresso', sales: 98, revenue: 245 },
        { name: 'Americano', sales: 87, revenue: 261 },
        { name: 'Macchiato', sales: 76, revenue: 304 }
      ];

      return {
        weeklyRevenue,
        customerSegments,
        productPerformance
      };
    },
    refetchInterval: 300000 // 5 minutes
  });

  const statCards: StatCard[] = [
    {
      title: "Réservations Aujourd'hui",
      value: realtimeStats?.reservations || 0,
      change: 12.5,
      icon: Calendar,
      color: "bg-blue-500",
      suffix: ""
    },
    {
      title: "Chiffre d'Affaires",
      value: realtimeStats?.revenue || 0,
      change: 8.2,
      icon: Euro,
      color: "bg-green-500",
      suffix: "€"
    },
    {
      title: "Total Clients",
      value: realtimeStats?.customers || 0,
      change: 15.3,
      icon: Users,
      color: "bg-purple-500",
      suffix: ""
    },
    {
      title: "Commandes",
      value: realtimeStats?.orders || 0,
      change: -2.1,
      icon: ShoppingCart,
      color: "bg-orange-500",
      suffix: ""
    },
    {
      title: "Clients VIP",
      value: realtimeStats?.vipCustomers || 0,
      change: 25.0,
      icon: Star,
      color: "bg-yellow-500",
      suffix: ""
    },
    {
      title: "Alertes Stock",
      value: realtimeStats?.lowStock || 0,
      change: -10.0,
      icon: Package,
      color: "bg-red-500",
      suffix: ""
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.color} text-white`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline space-x-2">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}{stat.suffix}
                </div>
                <div className={`flex items-center text-sm ${
                  stat.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(stat.change)}%
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                vs. période précédente
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Graphiques avancés */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenus de la semaine */}
        <Card>
          <CardHeader>
            <CardTitle>Revenus de la Semaine</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData?.weeklyRevenue || []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip formatter={(value, name) => [`${value}€`, 'Revenus']} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8884d8" 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Segmentation clients */}
        <Card>
          <CardHeader>
            <CardTitle>Segmentation Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData?.customerSegments || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(chartData?.customerSegments || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance produits */}
      <Card>
        <CardHeader>
          <CardTitle>Performance des Produits</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData?.productPerformance || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="sales" fill="#8884d8" name="Ventes" />
              <Bar yAxisId="right" dataKey="revenue" fill="#82ca9d" name="Revenus (€)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Indicateurs de performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Taux de Conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold">68%</div>
              <Badge variant="secondary" className="text-green-600">
                +5%
              </Badge>
            </div>
            <Progress value={68} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Panier Moyen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold">28€</div>
              <Badge variant="secondary" className="text-green-600">
                +12%
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1">vs. mois dernier</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Satisfaction Client</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold">4.8/5</div>
              <div className="flex">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">156 avis ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Temps d'Attente Moyen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold">12min</div>
              <Badge variant="secondary" className="text-red-600">
                +2min
              </Badge>
            </div>
            <div className="flex items-center mt-2">
              <Clock className="h-3 w-3 mr-1 text-gray-500" />
              <p className="text-xs text-gray-500">Objectif: 10min</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}