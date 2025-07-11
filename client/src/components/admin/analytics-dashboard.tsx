import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign, 
  Calendar, Clock, Target, Activity, Zap, Filter, Download
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('7d');
  const [metrics, setMetrics] = useState({
    revenue: { current: 15432, previous: 14280, growth: 8.1 },
    orders: { current: 342, previous: 298, growth: 14.8 },
    customers: { current: 156, previous: 142, growth: 9.9 },
    avgOrderValue: { current: 45.12, previous: 47.95, growth: -5.9 }
  });
  
  const [salesData, setSalesData] = useState([
    { name: 'Lun', revenue: 2400, orders: 24, customers: 12 },
    { name: 'Mar', revenue: 1398, orders: 18, customers: 9 },
    { name: 'Mer', revenue: 9800, orders: 45, customers: 23 },
    { name: 'Jeu', revenue: 3908, orders: 32, customers: 16 },
    { name: 'Ven', revenue: 4800, orders: 38, customers: 19 },
    { name: 'Sam', revenue: 3800, orders: 28, customers: 14 },
    { name: 'Dim', revenue: 4300, orders: 35, customers: 18 }
  ]);

  const [productData, setProductData] = useState([
    { name: 'Cappuccino', value: 35, revenue: 5250, color: '#0088FE' },
    { name: 'Latte', value: 28, revenue: 4200, color: '#00C49F' },
    { name: 'Americano', value: 20, revenue: 3000, color: '#FFBB28' },
    { name: 'Espresso', value: 12, revenue: 1800, color: '#FF8042' },
    { name: 'Autres', value: 5, revenue: 750, color: '#8884d8' }
  ]);

  const [hourlyData, setHourlyData] = useState([
    { hour: '8h', orders: 12, revenue: 480 },
    { hour: '9h', orders: 25, revenue: 1000 },
    { hour: '10h', orders: 32, revenue: 1280 },
    { hour: '11h', orders: 28, revenue: 1120 },
    { hour: '12h', orders: 45, revenue: 1800 },
    { hour: '13h', orders: 52, revenue: 2080 },
    { hour: '14h', orders: 38, revenue: 1520 },
    { hour: '15h', orders: 30, revenue: 1200 },
    { hour: '16h', orders: 35, revenue: 1400 },
    { hour: '17h', orders: 28, revenue: 1120 },
    { hour: '18h', orders: 22, revenue: 880 },
    { hour: '19h', orders: 15, revenue: 600 }
  ]);

  const MetricCard = ({ title, value, previousValue, growth, icon: Icon, format = 'number' }) => {
    const isPositive = growth > 0;
    const formattedValue = format === 'currency' ? `${value.toLocaleString()}€` : 
                          format === 'percentage' ? `${value}%` : value.toLocaleString();

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formattedValue}</div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            {isPositive ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
              {Math.abs(growth)}%
            </span>
            <span>vs période précédente</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Avancées</h2>
          <p className="text-muted-foreground">
            Analyse détaillée des performances de votre café
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24h</SelectItem>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="90d">90 jours</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Chiffre d'affaires"
          value={metrics.revenue.current}
          previousValue={metrics.revenue.previous}
          growth={metrics.revenue.growth}
          icon={DollarSign}
          format="currency"
        />
        <MetricCard
          title="Nombre de commandes"
          value={metrics.orders.current}
          previousValue={metrics.orders.previous}
          growth={metrics.orders.growth}
          icon={ShoppingCart}
        />
        <MetricCard
          title="Clients uniques"
          value={metrics.customers.current}
          previousValue={metrics.customers.previous}
          growth={metrics.customers.growth}
          icon={Users}
        />
        <MetricCard
          title="Panier moyen"
          value={metrics.avgOrderValue.current}
          previousValue={metrics.avgOrderValue.previous}
          growth={metrics.avgOrderValue.growth}
          icon={Target}
          format="currency"
        />
      </div>

      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenus</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="hours">Heures de pointe</TabsTrigger>
          <TabsTrigger value="trends">Tendances</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Évolution du chiffre d'affaires</CardTitle>
              <CardDescription>Revenus quotidiens sur les 7 derniers jours</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'revenue' ? `${value}€` : value,
                      name === 'revenue' ? 'Revenus' : 'Commandes'
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stackId="1" 
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Répartition des ventes par produit</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={productData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {productData.map((entry, index) => (
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
                <CardTitle>Top produits par revenus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {productData.map((product, index) => (
                    <div key={product.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: product.color }}
                        />
                        <span className="font-medium">{product.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{product.revenue}€</div>
                        <div className="text-xs text-muted-foreground">{product.value} ventes</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="hours" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analyse des heures de pointe</CardTitle>
              <CardDescription>Commandes et revenus par heure</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="orders" fill="#8884d8" name="Commandes" />
                  <Bar yAxisId="right" dataKey="revenue" fill="#82ca9d" name="Revenus (€)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tendances par jour</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="orders" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="customers" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Insights clés</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Pic de ventes</span>
                  </div>
                  <span className="text-sm text-green-700">13h-14h (+45%)</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Fidélité client</span>
                  </div>
                  <span className="text-sm text-blue-700">67% de retour</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium">Temps moyen</span>
                  </div>
                  <span className="text-sm text-yellow-700">8 min/commande</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Efficacité</span>
                  </div>
                  <span className="text-sm text-purple-700">92% satisfaction</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}