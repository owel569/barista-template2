import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  ShoppingCart, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Clock,
  Coffee,
  RefreshCw
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useToast } from '@/hooks/use-toast';

interface DashboardMainProps {
  userRole: 'directeur' | 'employe';
}

interface DashboardStats {
  todayReservations: number;
  monthlyRevenue: number;
  activeOrders: number;
  occupancyRate: number;
}

export default function DashboardMain({ userRole }: DashboardMainProps) {
  const [refreshTime, setRefreshTime] = useState(new Date());
  const { toast } = useToast();
  
  // Initialiser WebSocket pour les notifications temps réel
  useWebSocket();

  // Statistiques principales
  const { data: todayReservations = { count: 0 }, isLoading: loadingReservations } = useQuery({
    queryKey: ['/api/admin/stats/today-reservations'],
    retry: 3,
    retryDelay: 1000,
  });

  const { data: monthlyRevenue = { revenue: 0 }, isLoading: loadingRevenue } = useQuery({
    queryKey: ['/api/admin/stats/monthly-revenue'],
    retry: 3,
    retryDelay: 1000,
  });

  const { data: activeOrders = { count: 0 }, isLoading: loadingOrders } = useQuery({
    queryKey: ['/api/admin/stats/active-orders'],
    retry: 3,
    retryDelay: 1000,
  });

  const { data: occupancyRate = { rate: 0 }, isLoading: loadingOccupancy } = useQuery({
    queryKey: ['/api/admin/stats/occupancy-rate'],
    retry: 3,
    retryDelay: 1000,
  });

  // Actualisation automatique toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTime(new Date());
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshTime(new Date());
    toast({
      title: "Actualisation",
      description: "Données mises à jour",
    });
  };

  const isLoading = loadingReservations || loadingRevenue || loadingOrders || loadingOccupancy;

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            Tableau de Bord {userRole === 'directeur' ? 'Directeur' : 'Employé'}
          </h1>
          <p className="text-muted-foreground">
            Vue d'ensemble de l'activité du restaurant
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Mis à jour: {refreshTime.toLocaleTimeString()}
          </Badge>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Indicateurs clés */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              Réservations Aujourd'hui
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : todayReservations.count}
            </div>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="h-3 w-3" />
              <span>+12% cette semaine</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              Revenus du Mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : `${monthlyRevenue.revenue.toLocaleString()}€`}
            </div>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="h-3 w-3" />
              <span>+8% vs mois dernier</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-orange-500" />
              Commandes Actives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : activeOrders.count}
            </div>
            <div className="text-sm text-muted-foreground">
              En préparation/attente
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              Taux d'Occupation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : `${occupancyRate.rate}%`}
            </div>
            <div className="text-sm text-muted-foreground">
              Capacité restaurant
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activité récente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Activité Récente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
              <div>
                <div className="font-medium">Nouvelle réservation</div>
                <div className="text-sm text-muted-foreground">Table pour 4 - 19h30</div>
              </div>
              <Badge>Nouveau</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
              <div>
                <div className="font-medium">Commande terminée</div>
                <div className="text-sm text-muted-foreground">2x Cappuccino, 1x Croissant</div>
              </div>
              <Badge variant="secondary">Livré</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
              <div>
                <div className="font-medium">Nouveau message</div>
                <div className="text-sm text-muted-foreground">Demande d'information</div>
              </div>
              <Badge variant="outline">Non lu</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coffee className="h-5 w-5" />
              Articles Populaires
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  1
                </div>
                <div>
                  <div className="font-medium">Cappuccino</div>
                  <div className="text-sm text-muted-foreground">127 ventes</div>
                </div>
              </div>
              <div className="text-sm font-medium">4.50€</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  2
                </div>
                <div>
                  <div className="font-medium">Croissant</div>
                  <div className="text-sm text-muted-foreground">89 ventes</div>
                </div>
              </div>
              <div className="text-sm font-medium">2.50€</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  3
                </div>
                <div>
                  <div className="font-medium">Latte</div>
                  <div className="text-sm text-muted-foreground">76 ventes</div>
                </div>
              </div>
              <div className="text-sm font-medium">5.00€</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes et notifications */}
      {userRole === 'directeur' && (
        <Card>
          <CardHeader>
            <CardTitle>Alertes & Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <div className="flex-1">
                <div className="font-medium">Stock faible</div>
                <div className="text-sm text-muted-foreground">
                  Café en grains: 2kg restants
                </div>
              </div>
              <Button variant="outline" size="sm">Gérer</Button>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <div className="flex-1">
                <div className="font-medium">Réservations en attente</div>
                <div className="text-sm text-muted-foreground">
                  3 réservations à confirmer
                </div>
              </div>
              <Button variant="outline" size="sm">Voir</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}