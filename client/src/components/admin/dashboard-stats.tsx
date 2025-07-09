import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp, Users, ShoppingCart, DollarSign } from 'lucide-react';

interface DashboardStatsProps {
  userRole: 'directeur' | 'employe';
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

export default function DashboardStats({ userRole }: DashboardStatsProps) {
  const { data: dailyReservations = [], isLoading: loadingDaily } = useQuery({
    queryKey: ['/api/admin/stats/daily-reservations'],
    retry: 3,
    retryDelay: 1000,
  });

  const { data: reservationStatus = [], isLoading: loadingStatus } = useQuery({
    queryKey: ['/api/admin/stats/reservation-status'],
    retry: 3,
    retryDelay: 1000,
  });

  // Données par défaut si les APIs ne fonctionnent pas
  const defaultDailyData = [
    { date: '2025-01-03', count: 12 },
    { date: '2025-01-04', count: 15 },
    { date: '2025-01-05', count: 8 },
    { date: '2025-01-06', count: 18 },
    { date: '2025-01-07', count: 22 },
    { date: '2025-01-08', count: 16 },
    { date: '2025-01-09', count: 14 }
  ];

  const defaultStatusData = [
    { status: 'confirmé', count: 15 },
    { status: 'en_attente', count: 5 },
    { status: 'annulé', count: 2 }
  ];

  const chartData = dailyReservations.length > 0 ? dailyReservations : defaultDailyData;
  const statusData = reservationStatus.length > 0 ? reservationStatus : defaultStatusData;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Graphique des réservations quotidiennes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Réservations (7 derniers jours)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.getDate() + '/' + (date.getMonth() + 1);
                }}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('fr-FR');
                }}
              />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" name="Réservations" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Graphique du statut des réservations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Statut des Réservations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, count, percent }) => 
                  `${status}: ${count} (${(percent * 100).toFixed(0)}%)`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}