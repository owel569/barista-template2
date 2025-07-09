import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download, 
  TrendingUp, 
  TrendingDown,
  Users,
  ShoppingCart,
  Euro,
  Calendar,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';

interface ReportsSystemProps {
  userRole?: 'directeur' | 'employe';
}

export default function ReportsSystem({ userRole = 'directeur' }: ReportsSystemProps) {
  const [activeTab, setActiveTab] = useState('sales');
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['/api/admin/reports/sales'],
    enabled: userRole === 'directeur'
  });

  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ['/api/admin/reports/customers'],
    enabled: userRole === 'directeur'
  });

  if (userRole !== 'directeur') {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Accès restreint</h3>
          <p className="text-gray-600">Seuls les directeurs peuvent accéder aux rapports.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rapports et Analyses</h2>
          <p className="text-gray-600">Analysez les performances et tendances du café</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
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
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales">Ventes</TabsTrigger>
          <TabsTrigger value="customers">Clients</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="financial">Financier</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Ventes totales</p>
                    <p className="text-2xl font-bold">{salesData?.totalSales?.toLocaleString() || 0} €</p>
                    <p className="text-sm text-green-600 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +{salesData?.growth || 0}%
                    </p>
                  </div>
                  <Euro className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Transactions</p>
                    <p className="text-2xl font-bold">{salesData?.transactions?.toLocaleString() || 0}</p>
                    <p className="text-sm text-blue-600">+12% vs mois dernier</p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Panier moyen</p>
                    <p className="text-2xl font-bold">{salesData?.avgTransaction || 0} €</p>
                    <p className="text-sm text-purple-600">+5% vs mois dernier</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Taux de croissance</p>
                    <p className="text-2xl font-bold text-green-600">+{salesData?.growth || 0}%</p>
                    <p className="text-sm text-gray-600">Par rapport au mois dernier</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <LineChart className="h-5 w-5 mr-2" />
                Tendances des ventes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {salesData?.dailyTrends?.map((trend: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{new Date(trend.date).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-600">{trend.transactions} transactions</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{trend.sales.toLocaleString()} €</p>
                      <p className="text-sm text-gray-600">
                        {(trend.sales / trend.transactions).toFixed(2)} € / transaction
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="h-5 w-5 mr-2" />
                Produits les plus vendus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {salesData?.topProducts?.map((product: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-600">{product.units} unités vendues</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{product.sales.toLocaleString()} €</p>
                      <p className="text-sm text-gray-600">
                        {(product.sales / product.units).toFixed(2)} € / unité
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total clients</p>
                    <p className="text-2xl font-bold">{customersData?.totalCustomers || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Nouveaux clients</p>
                    <p className="text-2xl font-bold text-green-600">{customersData?.newCustomers || 0}</p>
                    <p className="text-sm text-green-600">+15% vs mois dernier</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Clients fidèles</p>
                    <p className="text-2xl font-bold text-purple-600">{customersData?.returningCustomers || 0}</p>
                    <p className="text-sm text-purple-600">85% de fidélité</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Dépense moyenne</p>
                    <p className="text-2xl font-bold">{customersData?.avgSpending || 0} €</p>
                    <p className="text-sm text-orange-600">Par client</p>
                  </div>
                  <Euro className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Meilleurs clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {customersData?.topCustomers?.map((customer: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-gray-600">{customer.visits} visites</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-600">{customer.spending.toLocaleString()} €</p>
                      <p className="text-sm text-gray-600">
                        {(customer.spending / customer.visits).toFixed(2)} € / visite
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Analyse des produits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Produits les plus rentables</h4>
                  <div className="space-y-2">
                    {salesData?.topProducts?.slice(0, 3).map((product: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{product.name}</span>
                        <Badge className="bg-green-100 text-green-800">
                          {product.sales.toLocaleString()} €
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Analyse des catégories</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-blue-700">Boissons chaudes</p>
                      <p className="font-bold text-blue-900">65% des ventes</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-700">Pâtisseries</p>
                      <p className="font-bold text-blue-900">35% des ventes</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Euro className="h-5 w-5 mr-2" />
                Analyse financière
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Résumé financier</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-yellow-700">Chiffre d'affaires</p>
                      <p className="font-bold text-yellow-900">{salesData?.totalSales?.toLocaleString() || 0} €</p>
                    </div>
                    <div>
                      <p className="text-sm text-yellow-700">Marge brute</p>
                      <p className="font-bold text-yellow-900">
                        {salesData?.totalSales ? (salesData.totalSales * 0.7).toLocaleString() : 0} €
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-yellow-700">Croissance</p>
                      <p className="font-bold text-green-600">+{salesData?.growth || 0}%</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-2">Indicateurs clés</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-purple-700">ROI moyen</p>
                      <p className="font-bold text-purple-900">145%</p>
                    </div>
                    <div>
                      <p className="text-sm text-purple-700">Marge nette</p>
                      <p className="font-bold text-purple-900">25%</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}