
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart3,
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Calendar,
  Settings,
  Brain,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Coffee
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// Types consolidés
interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  revenueGrowth: number;
  ordersGrowth: number;
}

interface QuickAction {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  href: string;
  color: string;
}

export default function DashboardConsolidated(): JSX.Element {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 25680,
    totalOrders: 1247,
    totalCustomers: 892,
    averageOrderValue: 20.6,
    revenueGrowth: 12.5,
    ordersGrowth: 8.3
  });

  const quickActions: QuickAction[] = [
    {
      id: 'orders',
      title: 'Nouvelle Commande',
      icon: <ShoppingCart className="h-5 w-5" />,
      description: 'Créer une nouvelle commande',
      href: '/admin/orders',
      color: 'bg-blue-500'
    },
    {
      id: 'menu',
      title: 'Gestion Menu',
      icon: <Coffee className="h-5 w-5" />,
      description: 'Modifier le menu',
      href: '/admin/menu',
      color: 'bg-green-500'
    },
    {
      id: 'analytics',
      title: 'Analytics',
      icon: <BarChart3 className="h-5 w-5" />,
      description: 'Voir les statistiques',
      href: '/admin/analytics',
      color: 'bg-purple-500'
    },
    {
      id: 'settings',
      title: 'Paramètres',
      icon: <Settings className="h-5 w-5" />,
      description: 'Configuration système',
      href: '/admin/settings',
      color: 'bg-gray-500'
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'order',
      message: 'Nouvelle commande #1248',
      time: 'Il y a 2 minutes',
      status: 'success'
    },
    {
      id: 2,
      type: 'customer',
      message: 'Nouveau client inscrit',
      time: 'Il y a 5 minutes',
      status: 'info'
    },
    {
      id: 3,
      type: 'alert',
      message: 'Stock faible: Café Arabica',
      time: 'Il y a 10 minutes',
      status: 'warning'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header avec informations utilisateur */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Tableau de Bord
          </h1>
          <p className="text-gray-600">
            Bienvenue, {user?.firstName || 'Admin'} | Barista Café Management
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-green-600">
            Système Opérationnel
          </Badge>
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Aujourd'hui
          </Button>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenus</p>
                <p className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()}€</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{stats.revenueGrowth}% ce mois
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Commandes</p>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{stats.ordersGrowth}% ce mois
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clients</p>
                <p className="text-2xl font-bold">{stats.totalCustomers}</p>
                <p className="text-xs text-purple-600 mt-1">Total enregistrés</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Panier Moyen</p>
                <p className="text-2xl font-bold">{stats.averageOrderValue}€</p>
                <p className="text-xs text-orange-600 mt-1">Par commande</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions Rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-gray-50"
                asChild
              >
                <a href={action.href}>
                  <div className={`p-2 rounded-full ${action.color} text-white`}>
                    {action.icon}
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{action.title}</p>
                    <p className="text-xs text-gray-500">{action.description}</p>
                  </div>
                </a>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contenu principal avec onglets */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="activities">Activités</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="ai">IA & Automatisation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Activités Récentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`p-2 rounded-full ${
                        activity.status === 'success' ? 'bg-green-100' :
                        activity.status === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
                      }`}>
                        {activity.status === 'success' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : activity.status === 'warning' ? (
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        ) : (
                          <Activity className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.message}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>État du Système</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Base de données</span>
                    </div>
                    <Badge variant="outline" className="text-green-600">Opérationnel</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium">API</span>
                    </div>
                    <Badge variant="outline" className="text-green-600">Opérationnel</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Paiements</span>
                    </div>
                    <Badge variant="outline" className="text-green-600">Opérationnel</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Journal d'Activités Détaillé</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center py-8">
                Module d'activités détaillées - En cours de développement
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Avancées</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center py-8">
                Module analytics - Intégration des composants existants
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2" />
                Intelligence Artificielle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center py-8">
                Module IA et automatisation - Configuration requise
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
