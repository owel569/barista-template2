import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Target, 
  Users,
  DollarSign,
  ShoppingCart,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Download
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const AnalyticsDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('day');
  const [selectedMetrics, setSelectedMetrics] = useState('all');

  // Récupérer les statistiques du dashboard
  const { data: dashboardStats, isLoading } = useQuery({
    queryKey: ['/api/admin/analytics/dashboard-stats'],
    refetchInterval: 30000 // Actualisation toutes les 30 secondes
  });

  // Récupérer les analytics de performance
  const { data: performanceData } = useQuery({
    queryKey: ['/api/admin/analytics/performance', selectedPeriod],
    enabled: !!selectedPeriod
  });

  // Récupérer les prédictions IA
  const { data: predictions } = useQuery({
    queryKey: ['/api/admin/analytics/predictions'],
    refetchInterval: 300000 // Actualisation toutes les 5 minutes
  });

  // Récupérer les analytics client
  const { data: customerAnalytics } = useQuery({
    queryKey: ['/api/admin/analytics/customer-analytics']
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Chargement des analytics...</p>
        </div>
      </div>
    );
  }

  const realTimeStats = dashboardStats?.realTime || {};
  const popularData = dashboardStats?.popular || {};
  const aiPredictions = dashboardStats?.predictions || {};

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Avancées</h1>
          <p className="text-gray-600">Intelligence artificielle et analyses prédictives</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Jour</SelectItem>
              <SelectItem value="week">Semaine</SelectItem>
              <SelectItem value="month">Mois</SelectItem>
              <SelectItem value="year">Année</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* KPIs temps réel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus du jour</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTimeStats.dailyRevenue || 0}€</div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +12% vs hier
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes actives</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTimeStats.currentOrders || 0}</div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +3 depuis 1h
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'occupation</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTimeStats.occupancyRate || 0}%</div>
            <Progress value={realTimeStats.occupancyRate || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panier moyen</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTimeStats.averageOrderValue?.toFixed(2) || 0}€</div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +5% vs semaine
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="predictions">Prédictions IA</TabsTrigger>
          <TabsTrigger value="customers">Clientèle</TabsTrigger>
          <TabsTrigger value="trends">Tendances</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Évolution des ventes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceData?.trends && (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Revenus</span>
                        <span className={`flex items-center ${performanceData.trends.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {performanceData.trends.revenueChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {Math.abs(performanceData.trends.revenuePercent || 0)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Commandes</span>
                        <span className={`flex items-center ${performanceData.trends.ordersChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {performanceData.trends.ordersChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {Math.abs(performanceData.trends.ordersChange || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Nouveaux clients</span>
                        <span className={`flex items-center ${performanceData.trends.customersChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {performanceData.trends.customersChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {Math.abs(performanceData.trends.customersChange || 0)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Répartition par catégorie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {popularData.dishes?.slice(0, 4).map((dish: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{dish.name}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={(dish.orders / (popularData.dishes[0]?.orders || 1)) * 100} className="w-16" />
                        <span className="text-xs text-muted-foreground">{dish.orders}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Prédictions demain
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Commandes prévues</span>
                    <Badge variant="outline">{aiPredictions.nextHourOrders || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Heure de pointe</span>
                    <Badge variant="outline">{aiPredictions.peakTime || '12:30'}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Personnel recommandé</span>
                    <Badge variant="outline">{aiPredictions.recommendedStaffing || 4}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Alertes Stock
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {aiPredictions.stockAlerts?.slice(0, 3).map((alert: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{alert.item}</span>
                      <Badge variant={alert.level === 'critical' ? 'destructive' : 'secondary'}>
                        {alert.level}
                      </Badge>
                    </div>
                  )) || (
                    <div className="text-sm text-gray-500">Aucune alerte stock</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Segments clients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {customerAnalytics?.segments && Object.entries(customerAnalytics.segments).map(([key, segment]: [string, any]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="capitalize">{key}</span>
                        <span>{segment.count}</span>
                      </div>
                      <Progress value={(segment.count / 100) * 100} className="w-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Comportement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Heures de pointe</span>
                    <span className="text-sm">12h-14h, 19h-21h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Plat préféré</span>
                    <span className="text-sm">{popularData.topDish || 'Cappuccino'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Satisfaction</span>
                    <Badge variant="outline">4.2/5</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Marketing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Taux d'ouverture</span>
                    <span>35%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taux de clic</span>
                    <span>8%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ROI campagnes</span>
                    <Badge variant="outline" className="text-green-600">+320%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendances & Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900">🔍 Insight Principal</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Les ventes de cappuccino augmentent de 15% le weekend. 
                    Recommandation: Augmenter le stock de grains de café pour le weekend.
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900">📈 Opportunité</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Pic d'affluence à 15h30. Proposer des promotions "happy hour" 
                    pourrait augmenter les revenus de 20%.
                  </p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <h4 className="font-medium text-orange-900">⚠️ Point d'attention</h4>
                  <p className="text-sm text-orange-700 mt-1">
                    Baisse de 8% des réservations en semaine. 
                    Considérer une campagne marketing ciblée professionnels.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rapports Personnalisés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-20 flex flex-col">
                    <BarChart3 className="h-5 w-5 mb-2" />
                    <span className="text-xs">Rapport Ventes</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col">
                    <Users className="h-5 w-5 mb-2" />
                    <span className="text-xs">Analyse Clients</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col">
                    <PieChart className="h-5 w-5 mb-2" />
                    <span className="text-xs">Performance Menu</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col">
                    <Target className="h-5 w-5 mb-2" />
                    <span className="text-xs">Objectifs</span>
                  </Button>
                </div>
                
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Rapports récents</h4>
                  <div className="space-y-2">
                    {[
                      { name: 'Rapport mensuel Janvier 2025', date: '2025-01-15', type: 'PDF' },
                      { name: 'Analyse clientèle Q4 2024', date: '2025-01-10', type: 'Excel' },
                      { name: 'Performance menu Décembre', date: '2025-01-05', type: 'PDF' }
                    ].map((report, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <span className="font-medium">{report.name}</span>
                          <span className="text-sm text-gray-500 ml-2">{report.date}</span>
                        </div>
                        <Badge variant="outline">{report.type}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;