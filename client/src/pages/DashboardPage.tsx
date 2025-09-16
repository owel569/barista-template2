
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Calendar, Coffee, DollarSign, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/api-utils';

// Types TypeScript précis
interface DashboardStats {
  todayReservations: number;
  activeOrders: number;
  totalCustomers: number;
  monthlyRevenue: number;
  occupancyRate: number;
  averageOrderValue: number;
  customerSatisfaction: number;
  inventoryAlerts: number;
}

interface RecentActivity {
  id: number;
  type: 'reservation' | 'order' | 'alert';
  message: string;
  time: string;
  status: 'success' | 'info' | 'warning' | 'error';
  amount?: number;
}

interface DashboardData {
  stats: DashboardStats;
  activities: RecentActivity[];
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const { data: dashboardData, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['dashboard-overview'],
    queryFn: async () => {
      const [statsRes, activitiesRes] = await Promise.all([
        apiRequest<{ data: DashboardStats }>('GET', '/api/dashboard/real-time-stats'),
        apiRequest<{ data: RecentActivity[] }>('GET', '/api/dashboard/recent-activities')
      ]);
      
      return {
        stats: statsRes.data,
        activities: activitiesRes.data
      };
    },
    refetchInterval: 30000, // Actualiser toutes les 30 secondes
    enabled: !!user
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">Erreur lors du chargement du dashboard</div>
      </div>
    );
  }

  const stats = dashboardData?.stats;
  const activities = dashboardData?.activities || [];

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Dashboard Barista Café
          </h1>
          <p className="text-muted-foreground">
            Bienvenue {user?.firstName || user?.email?.split('@')[0] || 'Utilisateur'}, voici votre aperçu en temps réel
          </p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Actualiser
        </Button>
      </div>

      {/* Statistiques principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Réservations Aujourd'hui</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todayReservations || 0}</div>
            <p className="text-xs text-muted-foreground">
              Taux d'occupation: {stats?.occupancyRate || 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes Actives</CardTitle>
            <Coffee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              En cours de préparation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'Affaires</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR'
              }).format(stats?.monthlyRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ce mois-ci
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction Client</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.customerSatisfaction || 0}/5</div>
            <p className="text-xs text-muted-foreground">
              Note moyenne
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Onglets détaillés */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="analytics">Analytiques</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Activités récentes */}
            <Card>
              <CardHeader>
                <CardTitle>Activités Récentes</CardTitle>
                <CardDescription>
                  Les dernières actions dans votre café
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant={activity.status === 'success' ? 'default' : 'secondary'}>
                          {activity.type}
                        </Badge>
                        <span className="text-sm">{activity.message}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {activity.time}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Métriques rapides */}
            <Card>
              <CardHeader>
                <CardTitle>Métriques Clés</CardTitle>
                <CardDescription>
                  Indicateurs de performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Panier moyen</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'EUR'
                      }).format(stats?.averageOrderValue || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Clients totaux</span>
                    <span className="font-medium">{stats?.totalCustomers || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Alertes inventaire</span>
                    <Badge variant={stats?.inventoryAlerts ? 'destructive' : 'default'}>
                      {stats?.inventoryAlerts || 0}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytiques Avancées</CardTitle>
              <CardDescription>
                Analyses détaillées de votre activité
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">
                  Graphiques et analyses détaillées à venir...
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Alertes et Notifications</CardTitle>
              <CardDescription>
                Alertes système et notifications importantes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.inventoryAlerts ? (
                  <div className="p-3 border border-red-200 rounded-lg bg-red-50">
                    <p className="text-sm text-red-800">
                      {stats.inventoryAlerts} articles en rupture de stock
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Aucune alerte active</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardPage;
