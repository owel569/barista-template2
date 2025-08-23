import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { 
  Calendar, 
  Users, 
  ShoppingCart, 
  TrendingUp,
  Coffee,
  Clock,
  CheckCircle
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardCharts from "./dashboard-charts";

// Types pour les données
interface TodayReservations {
  count: number;
}

interface OccupancyRate {
  rate: number;
}

interface OrderStatus {
  status: string;
  count: number;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  // autres propriétés...
}

interface MenuItem {
  id: number;
  name: string;
  price: string;
  description: string;
  categoryId?: number;
  category_id?: number;
}

export default function DashboardStats(): JSX.Element {
  const { t } = useLanguage();

  const { 
    data: todayReservations = { count: 0 }, 
    isLoading: loadingReservations 
  } = useQuery<TodayReservations>({
    queryKey: ['/api/admin/stats/today-reservations'],
  });

  const { 
    data: occupancyRate = { rate: 0 }, 
    isLoading: loadingOccupancy 
  } = useQuery<OccupancyRate>({
    queryKey: ['/api/admin/stats/occupancy-rate'],
  });

  const { 
    data: ordersByStatus = [], 
    isLoading: loadingOrders 
  } = useQuery<OrderStatus[]>({
    queryKey: ['/api/admin/stats/orders-by-status'],
  });

  const { 
    data: customers = [], 
    isLoading: loadingCustomers 
  } = useQuery<Customer[]>({
    queryKey: ['/api/admin/customers'],
  });

  const { 
    data: menuItems = [], 
    isLoading: loadingMenu 
  } = useQuery<MenuItem[]>({
    queryKey: ['/api/menu/items'],
  });

  // Trouver les commandes en cours (statut 'pending')
  const pendingOrdersCount = ordersByStatus.find(
    (o: OrderStatus) => o.status === 'pending'
  )?.count || 0;

  const stats = [
    {
      title: t('dashboard.todayReservations', "Réservations Aujourd'hui"),
      value: todayReservations.count,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: t('dashboard.pendingOrders', "Commandes en Cours"),
      value: pendingOrdersCount,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      title: t('dashboard.activeCustomers', "Clients Actifs"),
      value: customers.length,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: t('dashboard.occupancyRate', "Taux d'Occupation"),
      value: `${Math.round(occupancyRate.rate}%`,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  // Fonction pour traduire les statuts de commande
  const translateOrderStatus = (status: string): string => {
    const statusTranslations: Record<string, string> = {
      'pending': t('orderStatus.pending', 'En Attente'),
      'confirmed': t('orderStatus.confirmed', 'Confirmées'),
      'completed': t('orderStatus.completed', 'Terminées'),
      'cancelled': t('orderStatus.cancelled', 'Annulées')
    };
    return statusTranslations[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* Indicateurs clés */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  {(loadingReservations || loadingOccupancy || loadingOrders || loadingCustomers) && (
                    <Spinner className="h-4 w-4" />
                  }
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Graphiques et statistiques détaillées */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coffee className="h-5 w-5" />
              {t('dashboard.topProducts', 'Produits les Plus Vendus'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {menuItems.slice(0, 5).map((item: MenuItem, index: number) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <span className="text-sm text-gray-500">{item.price}€</span>
                </div>
              );}
              {menuItems.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  {t('dashboard.noProducts', 'Aucun produit disponible'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              {t('dashboard.orderStatus', 'État des Commandes'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ordersByStatus.map((status: OrderStatus) => (
                <div key={status.status} className="flex items-center justify-between">
                  <span className="font-medium">
                    {translateOrderStatus(status.status}
                  </span>
                  <Badge 
                    variant={status.status === 'pending' ? 'warning' : status.status === 'completed' ? 'success' : 'default'}
                    className="text-sm font-medium"
                  >
                    {status.count}
                  </Badge>
                </div>
              );}
              {ordersByStatus.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  {t('dashboard.noOrders', 'Aucune commande'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques détaillés */}
      <DashboardCharts />
    </div>
  );
}