import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingUp, Users, DollarSign, Clock, ShoppingCart } from 'lucide-react';

const DashboardModule = () => {
  // Données temps réel simulées (à remplacer par des vraies données API)
  const realTimeStats = {
    dailyRevenue: 2450,
    currentOrders: 12,
    occupiedTables: 18,
    totalTables: 24,
    popularDish: "Cappuccino",
    pendingReservations: 5
  };

  const alerts = [
    { type: 'warning', message: 'Stock faible: Grains de café', priority: 'high' },
    { type: 'info', message: '3 réservations urgentes dans 30min', priority: 'medium' },
    { type: 'error', message: 'Machine espresso #2 nécessite maintenance', priority: 'high' }
  ];

  const kpis = [
    { title: 'Revenus du jour', value: `${realTimeStats.dailyRevenue}€`, change: '+12%', icon: DollarSign },
    { title: 'Commandes actives', value: realTimeStats.currentOrders, change: '+3', icon: ShoppingCart },
    { title: 'Tables occupées', value: `${realTimeStats.occupiedTables}/${realTimeStats.totalTables}`, change: '75%', icon: Users },
    { title: 'Réservations en attente', value: realTimeStats.pendingReservations, change: '+2', icon: Clock }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tableau de Bord</h1>
        <Badge variant="outline" className="text-green-600">
          En ligne
        </Badge>
      </div>

      {/* KPIs en temps réel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{kpi.change}</span> depuis hier
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alertes système */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertes Système
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant={alert.type === 'error' ? 'destructive' : alert.type === 'warning' ? 'secondary' : 'default'}>
                    {alert.priority}
                  </Badge>
                  <span>{alert.message}</span>
                </div>
                <button className="text-sm text-blue-600 hover:underline">
                  Résoudre
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="affluence">Affluence</TabsTrigger>
          <TabsTrigger value="menu">Menu</TabsTrigger>
          <TabsTrigger value="quick-actions">Actions Rapides</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Chiffre d'Affaires</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Objectif journalier</span>
                    <span>3000€</span>
                  </div>
                  <Progress value={82} className="w-full" />
                  <div className="text-sm text-muted-foreground">
                    2450€ / 3000€ (82%)
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Taux d'occupation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Tables occupées</span>
                    <span>{realTimeStats.occupiedTables}/{realTimeStats.totalTables}</span>
                  </div>
                  <Progress value={75} className="w-full" />
                  <div className="text-sm text-muted-foreground">
                    75% d'occupation
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="affluence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Affluence par heure</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { hour: '8h-10h', rate: 45, label: 'Petit-déjeuner' },
                  { hour: '12h-14h', rate: 85, label: 'Déjeuner (pic)' },
                  { hour: '15h-17h', rate: 30, label: 'Pause café' },
                  { hour: '19h-21h', rate: 70, label: 'Dîner' }
                ].map((slot, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{slot.hour} - {slot.label}</span>
                      <span>{slot.rate}%</span>
                    </div>
                    <Progress value={slot.rate} className="w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="menu" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Plats Populaires</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { dish: 'Cappuccino', orders: 45, trend: '+12%' },
                  { dish: 'Croissant au beurre', orders: 32, trend: '+8%' },
                  { dish: 'Salade César', orders: 28, trend: '+5%' },
                  { dish: 'Espresso', orders: 24, trend: '+15%' }
                ].map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{item.dish}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {item.orders} commandes
                      </span>
                    </div>
                    <Badge variant="outline" className="text-green-600">
                      {item.trend}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quick-actions" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Nouvelle Réservation', action: 'reservations' },
              { label: 'Prendre Commande', action: 'orders' },
              { label: 'Gérer Tables', action: 'tables' },
              { label: 'Menu du Jour', action: 'menu' },
              { label: 'Stock Urgent', action: 'inventory' },
              { label: 'Rapport Journalier', action: 'reports' },
              { label: 'Notifications', action: 'notifications' },
              { label: 'Paramètres', action: 'settings' }
            ].map((action, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <div className="text-sm font-medium">{action.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardModule;