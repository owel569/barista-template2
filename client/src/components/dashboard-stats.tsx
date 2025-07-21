import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function DashboardStats() : JSX.Element {
  const { t } = useLanguage();

  const { data: todayReservations = { count: 0 } } = useQuery({
    queryKey: ['/api/admin/stats/today-reservations'],
  });

  const { data: occupancyRate = { rate: 0 } } = useQuery({
    queryKey: ['/api/admin/stats/occupancy-rate'],
  });

  const { data: ordersByStatus = [] } = useQuery({
    queryKey: ['/api/admin/stats/orders-by-status'],
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['/api/admin/customers'],
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['/api/menu/items'],
  });

  const stats = [
    {
      title: "Réservations Aujourd'hui",
      value: todayReservations.count || 0,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Commandes en Cours",
      value: ordersByStatus.find((o: { status: string; count: number }) => o.status === 'pending')?.count || 0,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      title: "Clients Actifs",
      value: customers.length || 0,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Taux d'Occupation",
      value: `${Math.round(occupancyRate.rate || 0)}%`,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Indicateurs clés */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
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
              Produits les Plus Vendus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {menuItems?.slice(0, 5).map((item: { id: number; name: string; price: string; description: string; categoryId?: number; category_id?: number }, index: number) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <span className="text-sm text-gray-500">{item.price}€</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              État des Commandes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ordersByStatus?.map((status: { status: string; count: number }) => (
                <div key={status.status} className="flex items-center justify-between">
                  <span className="capitalize font-medium">
                    {status.status === 'pending' ? 'En Attente' :
                     status.status === 'confirmed' ? 'Confirmées' :
                     status.status === 'completed' ? 'Terminées' :
                     status.status === 'cancelled' ? 'Annulées' : status.status}
                  </span>
                  <span className="bg-gray-100 px-2 py-1 rounded-full text-sm font-medium">
                    {status.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques détaillés */}
      <DashboardCharts />
    </div>
  );
}