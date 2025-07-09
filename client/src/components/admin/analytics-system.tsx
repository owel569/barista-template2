import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  Calendar,
  DollarSign,
  Clock,
  Coffee,
  Star,
  Target,
  Activity,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePicker } from '@/components/ui/date-picker';
import { cn } from '@/lib/utils';

interface AnalyticsSystemProps {
  userRole: 'directeur' | 'employe';
}

export default function AnalyticsSystem({ userRole }: AnalyticsSystemProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  // Données factices pour les analyses
  const revenueData = [
    { name: 'Lun', value: 850, orders: 45 },
    { name: 'Mar', value: 920, orders: 52 },
    { name: 'Mer', value: 1200, orders: 68 },
    { name: 'Jeu', value: 1100, orders: 61 },
    { name: 'Ven', value: 1450, orders: 78 },
    { name: 'Sam', value: 1650, orders: 89 },
    { name: 'Dim', value: 1380, orders: 74 }
  ];

  const customerData = [
    { name: 'Nouveaux', value: 35, color: '#8884d8' },
    { name: 'Réguliers', value: 45, color: '#82ca9d' },
    { name: 'Fidèles', value: 20, color: '#ffc658' }
  ];

  const productData = [
    { name: 'Cappuccino', sales: 156, revenue: 624 },
    { name: 'Latte', sales: 134, revenue: 536 },
    { name: 'Espresso', sales: 98, revenue: 294 },
    { name: 'Americano', sales: 87, revenue: 348 },
    { name: 'Croissant', sales: 76, revenue: 228 },
    { name: 'Muffin', sales: 54, revenue: 216 }
  ];

  const hourlyData = [
    { hour: '7h', customers: 12, orders: 8 },
    { hour: '8h', customers: 28, orders: 22 },
    { hour: '9h', customers: 35, orders: 28 },
    { hour: '10h', customers: 42, orders: 35 },
    { hour: '11h', customers: 38, orders: 31 },
    { hour: '12h', customers: 65, orders: 58 },
    { hour: '13h', customers: 72, orders: 65 },
    { hour: '14h', customers: 45, orders: 38 },
    { hour: '15h', customers: 32, orders: 25 },
    { hour: '16h', customers: 28, orders: 22 },
    { hour: '17h', customers: 35, orders: 28 },
    { hour: '18h', customers: 48, orders: 42 },
    { hour: '19h', customers: 52, orders: 45 },
    { hour: '20h', customers: 38, orders: 32 }
  ];

  const monthlyTrends = [
    { month: 'Jan', revenue: 25000, customers: 1200, orders: 2400 },
    { month: 'Fév', revenue: 28000, customers: 1350, orders: 2650 },
    { month: 'Mar', revenue: 32000, customers: 1500, orders: 2850 },
    { month: 'Avr', revenue: 29000, customers: 1400, orders: 2700 },
    { month: 'Mai', revenue: 35000, customers: 1650, orders: 3100 },
    { month: 'Juin', revenue: 38000, customers: 1800, orders: 3350 },
    { month: 'Juil', revenue: 42000, customers: 1950, orders: 3600 }
  ];

  const kpiData = [
    {
      title: 'Chiffre d\'affaires',
      value: '€12,450',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Commandes',
      value: '2,847',
      change: '+8.2%',
      trend: 'up',
      icon: ShoppingCart,
      color: 'text-blue-600'
    },
    {
      title: 'Nouveaux clients',
      value: '342',
      change: '+15.3%',
      trend: 'up',
      icon: Users,
      color: 'text-purple-600'
    },
    {
      title: 'Taux de satisfaction',
      value: '4.8/5',
      change: '+0.2%',
      trend: 'up',
      icon: Star,
      color: 'text-yellow-600'
    },
    {
      title: 'Temps moyen service',
      value: '12 min',
      change: '-2.1%',
      trend: 'down',
      icon: Clock,
      color: 'text-red-600'
    },
    {
      title: 'Taux de conversion',
      value: '68%',
      change: '+5.4%',
      trend: 'up',
      icon: Target,
      color: 'text-indigo-600'
    }
  ];

  const renderKPICards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {kpiData.map((kpi, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{kpi.title}</p>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <div className="flex items-center mt-1">
                  {kpi.trend === 'up' ? (
                    <ArrowUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={cn(
                    "text-sm ml-1",
                    kpi.trend === 'up' ? "text-green-500" : "text-red-500"
                  )}>
                    {kpi.change}
                  </span>
                </div>
              </div>
              <kpi.icon className={cn("h-8 w-8", kpi.color)} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderRevenueChart = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Évolution du chiffre d'affaires
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const renderCustomerChart = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5" />
          Répartition des clients
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={customerData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {customerData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const renderProductChart = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coffee className="h-5 w-5" />
          Produits les plus vendus
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={productData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="sales" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const renderHourlyChart = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LineChartIcon className="h-5 w-5" />
          Affluence par heure
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={hourlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="customers" stroke="#8884d8" />
            <Line type="monotone" dataKey="orders" stroke="#82ca9d" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const renderMonthlyTrends = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Tendances mensuelles
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Chiffre d'affaires" />
            <Line type="monotone" dataKey="customers" stroke="#82ca9d" name="Clients" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const renderCustomerAnalytics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderCustomerChart()}
        <Card>
          <CardHeader>
            <CardTitle>Détails clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Taux de rétention</span>
                <Badge variant="outline">72%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Panier moyen</span>
                <Badge variant="outline">€18.50</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Fréquence de visite</span>
                <Badge variant="outline">2.3/mois</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Satisfaction moyenne</span>
                <Badge variant="outline">4.8/5</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {renderHourlyChart()}
    </div>
  );

  const renderProductAnalytics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderProductChart()}
        <Card>
          <CardHeader>
            <CardTitle>Performance produits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {productData.slice(0, 4).map((product, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm">{product.name}</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{product.sales}</Badge>
                    <span className="text-sm font-medium">€{product.revenue}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Analyse des marges</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">68%</div>
              <div className="text-sm text-muted-foreground">Marge moyenne</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">€7.50</div>
              <div className="text-sm text-muted-foreground">Profit moyen/commande</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">€2,847</div>
              <div className="text-sm text-muted-foreground">Profit total</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderFinancialAnalytics = () => (
    <div className="space-y-6">
      {renderRevenueChart()}
      {renderMonthlyTrends()}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Revenus aujourd'hui</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€1,245</div>
            <div className="text-sm text-green-600 flex items-center">
              <ArrowUp className="h-4 w-4 mr-1" />
              +12.5% vs hier
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Revenus ce mois</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€42,000</div>
            <div className="text-sm text-green-600 flex items-center">
              <ArrowUp className="h-4 w-4 mr-1" />
              +18.2% vs mois dernier
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Objectif mensuel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">84%</div>
            <div className="text-sm text-muted-foreground">
              €42,000 / €50,000
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Analyses et statistiques</h1>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="90d">90 jours</SelectItem>
              <SelectItem value="1y">1 an</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="customers">Clients</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="financial">Finances</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {renderKPICards()}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderRevenueChart()}
            {renderCustomerChart()}
          </div>
        </TabsContent>

        <TabsContent value="customers">
          {renderCustomerAnalytics()}
        </TabsContent>

        <TabsContent value="products">
          {renderProductAnalytics()}
        </TabsContent>

        <TabsContent value="financial">
          {renderFinancialAnalytics()}
        </TabsContent>
      </Tabs>
    </div>
  );
}