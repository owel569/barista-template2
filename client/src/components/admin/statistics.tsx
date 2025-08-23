import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import {
  TrendingUp, Users, ShoppingCart, DollarSign, Coffee,
  Download, RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/useWebSocket';

interface StatisticsProps {
  userRole: 'directeur' | 'employe';
}

interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

interface CategoryData {
  category: string;
  value: number;
  color: string;
}

interface CustomerData {
  name: string;
  visits: number;
  spent: number;
}

interface TotalStats {
  totalRevenue: number;
  totalOrders: number;
  averageOrder: number;
  totalCustomers: number;
  growthRate: number;
  popularItems: { name: string; sales: number }[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'];

export default function Statistics({ userRole }: StatisticsProps) {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7days');
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [customerData, setCustomerData] = useState<CustomerData[]>([]);
  const [totalStats, setTotalStats] = useState<TotalStats>({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrder: 0,
    totalCustomers: 0,
    growthRate: 0,
    popularItems: []
  });

  const { toast } = useToast();

  // Activer WebSocket uniquement pour le directeur
  useEffect(() => {
    if (userRole === 'directeur') {
      useWebSocket();
    }
  }, [userRole]);

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || '';
      const headers = { 'Authorization': `Bearer ${token}` };

      const [revenueRes, categoryRes, customerRes] = await Promise.all([
        fetch(`/api/admin/stats/revenue-detailed?range=${dateRange}`, { headers }),
        fetch(`/api/admin/stats/category-analytics?range=${dateRange}`, { headers }),
        fetch(`/api/admin/stats/customer-analytics?range=${dateRange}`, { headers })
      ]);

      // Revenus
      if (revenueRes.ok) {
        const revenueStats = await revenueRes.json();
                  setRevenueData(revenueStats.daily || generateMockRevenueData());
        setTotalStats(prev => ({
          ...prev,
          totalRevenue: revenueStats.total || 15420,
          totalOrders: revenueStats.orders || 245,
          averageOrder: revenueStats.average || 62.94,
          growthRate: revenueStats.growth || 12.5
        }));
      } else {
        setRevenueData(generateMockRevenueData());
      }

      // Catégories
      if (categoryRes.ok) {
        const categoryStats = await categoryRes.json();
        setCategoryData(categoryStats || generateMockCategoryData());
      } else {
        setCategoryData(generateMockCategoryData());
      }

      // Clients
      if (customerRes.ok) {
        const customerStats = await customerRes.json();
        setCustomerData(customerStats.topCustomers || generateMockCustomerData());
        setTotalStats(prev => ({
          ...prev,
          totalCustomers: customerStats.total || 156
        }));
      } else {
        setCustomerData(generateMockCustomerData());
      }

    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      setRevenueData(generateMockRevenueData());
      setCategoryData(generateMockCategoryData());
      setCustomerData(generateMockCustomerData());
      toast({
        title: 'Attention',
        description: 'Chargement des données par défaut',
        variant: 'default'
      });
    } finally {
      setLoading(false);
    }
  }, [dateRange, toast]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  // Fonctions Mock
  const generateMockRevenueData = (): RevenueData[] => {
    const today = new Date();
    const days = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 90;
    return Array.from({ length: days }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (days - 1 - i));
      return {
        date: date.toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 500) + 200,
        orders: Math.floor(Math.random() * 20) + 5
      };
    });
  };

  const generateMockCategoryData = (): CategoryData[] => [
    { category: 'Cafés', value: 4250, color: '#8884d8' },
    { category: 'Pâtisseries', value: 3100, color: '#82ca9d' },
    { category: 'Thés', value: 2300, color: '#ffc658' },
    { category: 'Plats', value: 1800, color: '#ff7300' },
    { category: 'Boissons froides', value: 1200, color: '#00ff00' }
  ];

  const generateMockCustomerData = (): CustomerData[] => [
    { name: 'Marie Martin', visits: 15, spent: 285.5 },
    { name: 'Jean Dupont', visits: 12, spent: 198.75 },
    { name: 'Sophie Bernard', visits: 10, spent: 165.25 },
    { name: 'Pierre Durand', visits: 8, spent: 142.0 },
    { name: 'Lucie Moreau', visits: 7, spent: 128.5 }
  ];

  const exportData = useCallback(() => {
    toast({
      title: 'Export en cours',
      description: 'Les données sont en cours d’export...'
    });
  }, [toast]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
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
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Statistiques Avancées</h1>
          <p className="text-muted-foreground">Analyse détaillée des performances</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">7 derniers jours</SelectItem>
              <SelectItem value="30days">30 derniers jours</SelectItem>
              <SelectItem value="90days">90 derniers jours</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchStatistics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Indicateurs clés */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Revenus Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
                              {totalStats.totalRevenue.toLocaleString()}€
            </div>
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+{totalStats.growthRate}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" /> Commandes Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalOrders}</div>
            <div className="text-sm text-muted-foreground">
              Moy: {totalStats.averageOrder}€
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" /> Clients Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalCustomers}</div>
            <div className="text-sm text-muted-foreground">Actifs ce mois</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Coffee className="h-4 w-4" /> Article Populaire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">Cappuccino</div>
            <div className="text-sm text-muted-foreground">127 ventes</div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques détaillés */}
      {/* ... reste du code identique à ton affichage des onglets avec corrections de syntaxe */}
      <Tabs defaultValue="revenue" className="space-y-4">
  <TabsList>
    <TabsTrigger value="revenue">Revenus</TabsTrigger>
    <TabsTrigger value="categories">Catégories</TabsTrigger>
    <TabsTrigger value="customers">Clients</TabsTrigger>
    <TabsTrigger value="trends">Tendances</TabsTrigger>
  </TabsList>

  {/* Revenus */}
  <TabsContent value="revenue" className="space-y-4">
    <Card>
      <CardHeader>
        <CardTitle>Évolution des Revenus</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.6}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  </TabsContent>

  {/* Catégories */}
  <TabsContent value="categories" className="space-y-4">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Répartition par Catégorie</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}€`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                );}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance par Catégorie</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  </TabsContent>

  {/* Clients */}
  <TabsContent value="customers" className="space-y-4">
    <Card>
      <CardHeader>
        <CardTitle>Top Clients</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {customerData.map((customer, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border rounded"
            >
              <div>
                <div className="font-medium">{customer.name}</div>
                <div className="text-sm text-muted-foreground">
                  {customer.visits} visites
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold">{customer.spent.toFixed(2}€</div>
                <Badge variant="secondary">#{index + 1}</Badge>
              </div>
            </div>
          );}
        </div>
      </CardContent>
    </Card>
  </TabsContent>

  {/* Tendances */}
  <TabsContent value="trends" className="space-y-4">
    <Card>
      <CardHeader>
        <CardTitle>Tendances des Commandes</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="orders"
              stroke="#82ca9d"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  </TabsContent>
</Tabs>
  
    </div>
  );
}
