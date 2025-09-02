
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign, Calendar } from 'lucide-react';

interface DashboardStatsProps {
  stats: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    averageOrderValue: number;
    revenueGrowth: number;
    ordersGrowth: number;
    customersGrowth: number;
    avgOrderGrowth: number;
  };
}

const StatCard: React.FC<{
  title: string;
  value: string | number;
  change: number;
  icon: React.ComponentType<{ className?: string }>;
  trend: 'up' | 'down' | 'neutral';
}> = ({ title, value, change, icon: Icon, trend }) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4" />;
      case 'down': return <TrendingDown className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className={`flex items-center text-xs ${getTrendColor()}`}>
          {getTrendIcon()}
          <span className="ml-1">
            {change > 0 ? '+' : ''}{change}% depuis le mois dernier
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Chiffre d'Affaires"
        value={formatCurrency(stats.totalRevenue)}
        change={stats.revenueGrowth}
        icon={DollarSign}
        trend={stats.revenueGrowth > 0 ? 'up' : stats.revenueGrowth < 0 ? 'down' : 'neutral'}
      />
      <StatCard
        title="Commandes"
        value={stats.totalOrders}
        change={stats.ordersGrowth}
        icon={ShoppingCart}
        trend={stats.ordersGrowth > 0 ? 'up' : stats.ordersGrowth < 0 ? 'down' : 'neutral'}
      />
      <StatCard
        title="Clients"
        value={stats.totalCustomers}
        change={stats.customersGrowth}
        icon={Users}
        trend={stats.customersGrowth > 0 ? 'up' : stats.customersGrowth < 0 ? 'down' : 'neutral'}
      />
      <StatCard
        title="Panier Moyen"
        value={formatCurrency(stats.averageOrderValue)}
        change={stats.avgOrderGrowth}
        icon={Calendar}
        trend={stats.avgOrderGrowth > 0 ? 'up' : stats.avgOrderGrowth < 0 ? 'down' : 'neutral'}
      />
    </div>
  );
};

export default DashboardStats;
