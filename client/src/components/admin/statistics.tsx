import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  Calendar,
  DollarSign,
  Clock,
  Target,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from 'recharts';

interface StatisticsProps {
  userRole?: 'directeur' | 'employe';
}

export default function Statistics({ userRole = 'directeur' }: StatisticsProps) {
  const [period, setPeriod] = useState('month');
  const [category, setCategory] = useState('all');

  // Data queries for statistics
  const { data: revenueStats = [], refetch: refetchRevenue } = useQuery({
    queryKey: ['/api/admin/stats/revenue-detailed', period],
  });

  const { data: customerStats = [] } = useQuery({
    queryKey: ['/api/admin/stats/customer-analytics'],
  });

  const { data: productStats = [] } = useQuery({
    queryKey: ['/api/admin/stats/product-performance'],
  });

  const { data: timeStats = [] } = useQuery({
    queryKey: ['/api/admin/stats/time-analysis'],
  });

  // Mock data for demonstration (replace with real API data)
  const mockRevenueData = [
    { month: 'Jan', revenue: 8400, orders: 156, customers: 89 },
    { month: 'Fév', revenue: 9200, orders: 178, customers: 102 },
    { month: 'Mar', revenue: 7800, orders: 142, customers: 86 },
    { month: 'Avr', revenue: 10500, orders: 195, customers: 118 },
    { month: 'Mai', revenue: 11200, orders: 208, customers: 125 },
    { month: 'Jun', revenue: 9800, orders: 184, customers: 109 },
  ];

  const mockProductData = [
    { name: 'Cappuccino', sales: 1245, revenue: 4980, growth: 12.5 },
    { name: 'Latte', sales: 1089, revenue: 4356, growth: 8.2 },
    { name: 'Americano', sales: 892, revenue: 2676, growth: -2.1 },
    { name: 'Croissant', sales: 567, revenue: 1701, growth: 15.3 },
    { name: 'Macaron', sales: 445, revenue: 1780, growth: 22.8 },
  ];

  const mockTimeData = [
    { hour: '7h', commandes: 12, revenus: 156 },
    { hour: '8h', commandes: 28, revenus: 364 },
    { hour: '9h', commandes: 45, revenus: 585 },
    { hour: '10h', commandes: 38, revenus: 494 },
    { hour: '11h', commandes: 52, revenus: 676 },
    { hour: '12h', commandes: 78, revenus: 1014 },
    { hour: '13h', commandes: 65, revenus: 845 },
    { hour: '14h', commandes: 42, revenus: 546 },
    { hour: '15h', commandes: 35, revenus: 455 },
    { hour: '16h', commandes: 48, revenus: 624 },
    { hour: '17h', commandes: 55, revenus: 715 },
    { hour: '18h', commandes: 32, revenus: 416 },
  ];

  const mockCategoryData = [
    { name: 'Cafés', value: 45, color: '#8884d8' },
    { name: 'Pâtisseries', value: 30, color: '#82ca9d' },
    { name: 'Boissons', value: 15, color: '#ffc658' },
    { name: 'Snacks', value: 10, color: '#ff7c7c' },
  ];

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

  const totalRevenue = mockRevenueData.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = mockRevenueData.reduce((sum, item) => sum + item.orders, 0);
  const totalCustomers = mockRevenueData.reduce((sum, item) => sum + item.customers, 0);
  const avgOrderValue = totalRevenue / totalOrders;

  const exportData = () => {
    const data = {
      revenue: mockRevenueData,
      products: mockProductData,
      timeAnalysis: mockTimeData,
      categories: mockCategoryData,
      summary: {
        totalRevenue,
        totalOrders,
        totalCustomers,
        avgOrderValue
      }
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `barista-stats-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Statistiques Avancées</h1>
          <p className="text-muted-foreground">Analyse détaillée des performances du café</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Filtres:</span>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Cette semaine</SelectItem>
            <SelectItem value="month">Ce mois</SelectItem>
            <SelectItem value="quarter">Ce trimestre</SelectItem>
            <SelectItem value="year">Cette année</SelectItem>
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            <SelectItem value="cafes">Cafés</SelectItem>
            <SelectItem value="patisseries">Pâtisseries</SelectItem>
            <SelectItem value="boissons">Boissons</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'Affaires</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toLocaleString()}€</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12.5% vs mois dernier
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +8.2% vs mois dernier
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients Uniques</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +15.3% vs mois dernier
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgOrderValue.toFixed(2)}€</div>
            <div className="flex items-center text-xs text-red-600">
              <TrendingDown className="h-3 w-3 mr-1" />
              -2.1% vs mois dernier
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenus</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="time">Temporel</TabsTrigger>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Évolution du Chiffre d'Affaires</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={mockRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#8884d8" name="Revenus (€)" />
                  <Bar dataKey="orders" fill="#82ca9d" name="Commandes" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance des Produits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockProductData.map((product, index) => (
                  <div key={product.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="font-medium">{product.name}</div>
                      <Badge variant={product.growth > 0 ? 'default' : 'destructive'}>
                        {product.growth > 0 ? '+' : ''}{product.growth}%
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{product.revenue.toLocaleString()}€</div>
                      <div className="text-sm text-muted-foreground">{product.sales} ventes</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analyse Temporelle</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={mockTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="commandes" stroke="#8884d8" name="Commandes" />
                  <Line type="monotone" dataKey="revenus" stroke="#82ca9d" name="Revenus (€)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Répartition par Catégorie</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={mockCategoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {mockCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}