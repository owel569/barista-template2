import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  DollarSign,
  Users,
  ShoppingCart,
  Package,
  BarChart3,
  PieChart,
  Activity,
  Target
} from 'lucide-react';

interface ReportsProps {
  userRole?: 'directeur' | 'employe';
}

export default function Reports({ userRole = 'directeur' }: ReportsProps) {
  const [activeTab, setActiveTab] = useState('sales');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedFormat, setSelectedFormat] = useState('pdf');

  // Données de rapports factices
  const salesData = {
    totalSales: 45000,
    growth: 12.5,
    transactions: 1250,
    avgTransaction: 36,
    topProducts: [
      { name: 'Cappuccino', sales: 8500, units: 425 },
      { name: 'Croissant', sales: 6200, units: 310 },
      { name: 'Americano', sales: 5800, units: 290 },
      { name: 'Latte', sales: 4900, units: 245 },
      { name: 'Macaron', sales: 3600, units: 120 }
    ],
    dailyTrends: [
      { date: '2025-07-01', sales: 1200, transactions: 45 },
      { date: '2025-07-02', sales: 1450, transactions: 52 },
      { date: '2025-07-03', sales: 1650, transactions: 58 },
      { date: '2025-07-04', sales: 1350, transactions: 48 },
      { date: '2025-07-05', sales: 1800, transactions: 62 },
      { date: '2025-07-06', sales: 2100, transactions: 68 },
      { date: '2025-07-07', sales: 1950, transactions: 65 }
    ]
  };

  const customerData = {
    totalCustomers: 890,
    newCustomers: 125,
    returningCustomers: 765,
    avgSpending: 42.5,
    topCustomers: [
      { name: 'Marie Dubois', visits: 24, spending: 1250 },
      { name: 'Jean Martin', visits: 18, spending: 980 },
      { name: 'Sophie Laurent', visits: 22, spending: 1150 },
      { name: 'Pierre Durand', visits: 15, spending: 750 },
      { name: 'Claire Moreau', visits: 20, spending: 890 }
    ]
  };

  const inventoryData = {
    totalItems: 145,
    lowStock: 8,
    outOfStock: 2,
    avgTurnover: 15,
    fastMoving: [
      { name: 'Grains Arabica', turnover: 25, stock: 120 },
      { name: 'Lait', turnover: 22, stock: 50 },
      { name: 'Sucre', turnover: 18, stock: 80 },
      { name: 'Croissants', turnover: 15, stock: 200 },
      { name: 'Capsules', turnover: 12, stock: 300 }
    ]
  };

  const performanceData = {
    totalRevenue: 45000,
    totalCosts: 28000,
    grossProfit: 17000,
    profitMargin: 37.8,
    employeePerformance: [
      { name: 'Alice Johnson', sales: 12500, efficiency: 92 },
      { name: 'Bob Smith', sales: 10800, efficiency: 88 },
      { name: 'Claire Davis', sales: 11200, efficiency: 90 },
      { name: 'David Wilson', sales: 9800, efficiency: 85 },
      { name: 'Eva Brown', sales: 8900, efficiency: 82 }
    ]
  };

  const renderSalesReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ventes totales</p>
                <p className="text-2xl font-bold">{salesData.totalSales.toLocaleString()}€</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Croissance</p>
                <p className="text-2xl font-bold text-green-600">+{salesData.growth}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold">{salesData.transactions}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Panier moyen</p>
                <p className="text-2xl font-bold">{salesData.avgTransaction}€</p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Produits les plus vendus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {salesData.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.units} unités</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{product.sales.toLocaleString()}€</p>
                    <p className="text-sm text-green-600">#{index + 1}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tendances quotidiennes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {salesData.dailyTrends.map((day, index) => (
                <div key={index} className="flex items-center justify-between p-2 border-b">
                  <div>
                    <p className="text-sm font-medium">{new Date(day.date).toLocaleDateString('fr-FR')}</p>
                    <p className="text-xs text-muted-foreground">{day.transactions} transactions</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{day.sales.toLocaleString()}€</p>
                    <p className="text-xs text-green-600">+{((day.sales / salesData.dailyTrends[0].sales - 1) * 100).toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderCustomerReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total clients</p>
                <p className="text-2xl font-bold">{customerData.totalCustomers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Nouveaux clients</p>
                <p className="text-2xl font-bold text-green-600">{customerData.newCustomers}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clients fidèles</p>
                <p className="text-2xl font-bold">{customerData.returningCustomers}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dépense moyenne</p>
                <p className="text-2xl font-bold">{customerData.avgSpending}€</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meilleurs clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {customerData.topCustomers.map((customer, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">{customer.name}</p>
                  <p className="text-sm text-muted-foreground">{customer.visits} visites</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{customer.spending.toLocaleString()}€</p>
                  <Badge variant="outline">Top {index + 1}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderInventoryReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Articles total</p>
                <p className="text-2xl font-bold">{inventoryData.totalItems}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Stock faible</p>
                <p className="text-2xl font-bold text-orange-600">{inventoryData.lowStock}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rupture</p>
                <p className="text-2xl font-bold text-red-600">{inventoryData.outOfStock}</p>
              </div>
              <Activity className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rotation moy.</p>
                <p className="text-2xl font-bold">{inventoryData.avgTurnover} jours</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Articles à forte rotation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {inventoryData.fastMoving.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">Stock: {item.stock}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{item.turnover} jours</p>
                  <Badge variant={item.turnover < 10 ? "destructive" : item.turnover < 20 ? "secondary" : "default"}>
                    {item.turnover < 10 ? "Très rapide" : item.turnover < 20 ? "Rapide" : "Normal"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPerformanceReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Chiffre d'affaires</p>
                <p className="text-2xl font-bold">{performanceData.totalRevenue.toLocaleString()}€</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Coûts</p>
                <p className="text-2xl font-bold text-red-600">{performanceData.totalCosts.toLocaleString()}€</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bénéfice brut</p>
                <p className="text-2xl font-bold text-blue-600">{performanceData.grossProfit.toLocaleString()}€</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Marge</p>
                <p className="text-2xl font-bold text-purple-600">{performanceData.profitMargin}%</p>
              </div>
              <PieChart className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance des employés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {performanceData.employeePerformance.map((employee, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">{employee.name}</p>
                  <p className="text-sm text-muted-foreground">Efficacité: {employee.efficiency}%</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{employee.sales.toLocaleString()}€</p>
                  <Badge variant={employee.efficiency > 90 ? "default" : employee.efficiency > 85 ? "secondary" : "destructive"}>
                    {employee.efficiency > 90 ? "Excellent" : employee.efficiency > 85 ? "Bon" : "À améliorer"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Rapports & Analyses</h2>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Semaine</SelectItem>
              <SelectItem value="month">Mois</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="year">Année</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedFormat} onValueChange={setSelectedFormat}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales">Ventes</TabsTrigger>
          <TabsTrigger value="customers">Clients</TabsTrigger>
          <TabsTrigger value="inventory">Stock</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          {renderSalesReport()}
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          {renderCustomerReport()}
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          {renderInventoryReport()}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {renderPerformanceReport()}
        </TabsContent>
      </Tabs>
    </div>
  );
}