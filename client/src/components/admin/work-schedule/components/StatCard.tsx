import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Users,
  Clock,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { StatCardProps } from '../types/schedule.types';

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change = 0,
  changeType,
  icon: Icon,
  color = 'blue',
  loading = false,
}) => {
  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      // Format currency if it looks like a monetary value
      if (title.toLowerCase().includes('salaire') || title.toLowerCase().includes('coût')) {
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR',
        }).format(val);
      }
      
      // Format hours if it looks like time
      if (title.toLowerCase().includes('heure')) {
        const hours = Math.floor(val);
        const minutes = Math.round((val - hours) * 60);
        return minutes > 0 ? `${hours}h${minutes.toString().padStart(2, '0')}` : `${hours}h`;
      }
      
      // Default number formatting
      return val.toLocaleString('fr-FR');
    }
    
    return val;
  };

  const getColorClasses = (colorName: string) => {
    const colors: Record<string, {
      bg: string;
      border: string;
      icon: string;
      value: string;
    }> = {
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-950',
        border: 'border-blue-200 dark:border-blue-800',
        icon: 'text-blue-600 dark:text-blue-400',
        value: 'text-blue-900 dark:text-blue-100',
      },
      green: {
        bg: 'bg-green-50 dark:bg-green-950',
        border: 'border-green-200 dark:border-green-800',
        icon: 'text-green-600 dark:text-green-400',
        value: 'text-green-900 dark:text-green-100',
      },
      yellow: {
        bg: 'bg-yellow-50 dark:bg-yellow-950',
        border: 'border-yellow-200 dark:border-yellow-800',
        icon: 'text-yellow-600 dark:text-yellow-400',
        value: 'text-yellow-900 dark:text-yellow-100',
      },
      red: {
        bg: 'bg-red-50 dark:bg-red-950',
        border: 'border-red-200 dark:border-red-800',
        icon: 'text-red-600 dark:text-red-400',
        value: 'text-red-900 dark:text-red-100',
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-950',
        border: 'border-purple-200 dark:border-purple-800',
        icon: 'text-purple-600 dark:text-purple-400',
        value: 'text-purple-900 dark:text-purple-100',
      },
    };
    
    return colors[colorName] || colors.blue;
  };

  const getChangeIcon = () => {
    if (change === 0) return <Minus className="h-3 w-3" />;
    
    switch (changeType) {
      case 'increase':
        return <TrendingUp className="h-3 w-3" />;
      case 'decrease':
        return <TrendingDown className="h-3 w-3" />;
      default:
        return change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />;
    }
  };

  const getChangeColor = () => {
    if (change === 0) return 'text-gray-500';
    
    switch (changeType) {
      case 'increase':
        return 'text-green-600 dark:text-green-400';
      case 'decrease':
        return 'text-red-600 dark:text-red-400';
      case 'neutral':
        return 'text-gray-500';
      default:
        return change > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    }
  };

  const colorClasses = getColorClasses(color);

  if (loading) {
    return (
      <Card className={`${colorClasses?.bg || 'bg-gray-50'} ${colorClasses?.border || 'border-gray-200'} border`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </CardTitle>
          <div className="animate-pulse">
            <div className="h-4 w-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${colorClasses?.bg || 'bg-gray-50'} ${colorClasses?.border || 'border-gray-200'} border hover:shadow-md transition-shadow duration-200`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </CardTitle>
        {Icon && (
          <Icon className={`h-4 w-4 ${colorClasses?.icon || 'text-gray-600'}`} aria-hidden="true" />
        )}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${colorClasses?.value || 'text-gray-900'} mb-1`}>
          {formatValue(value)}
        </div>
        
        {typeof change === 'number' && (
          <div className="flex items-center space-x-1">
            <Badge 
              variant="secondary" 
              className={`${getChangeColor()} bg-transparent border-none p-0 text-xs flex items-center space-x-1`}
            >
              {getChangeIcon()}
              <span>
                {Math.abs(change ?? 0)}%
              </span>
            </Badge>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              vs mois dernier
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Composants de StatCard spécialisés pour différents types de données
export const EmployeeStatCard: React.FC<{
  totalEmployees: number;
  activeEmployees: number;
  loading?: boolean;
}> = ({ totalEmployees, activeEmployees, loading }) => (
  <StatCard
    title="Employés actifs"
    value={`${activeEmployees}/${totalEmployees}`}
    icon={Users}
    color="blue"
    loading={loading}
  />
);

export const HoursStatCard: React.FC<{
  scheduledHours: number;
  overtimeHours?: number;
  loading?: boolean;
}> = ({ scheduledHours, overtimeHours = 0, loading }) => (
  <StatCard
    title="Heures programmées"
    value={scheduledHours}
    change={overtimeHours > 0 ? (overtimeHours / scheduledHours) * 100 : undefined}
    changeType={overtimeHours > 0 ? 'increase' : 'neutral'}
    icon={Clock}
    color="green"
    loading={loading}
  />
);

export const PayrollStatCard: React.FC<{
  totalPayroll: number;
  change?: number;
  loading?: boolean;
}> = ({ totalPayroll, change, loading }) => (
  <StatCard
    title="Masse salariale"
    value={totalPayroll}
    change={change}
    icon={DollarSign}
    color="yellow"
    loading={loading}
  />
);

export const ShiftsStatCard: React.FC<{
  totalShifts: number;
  change?: number;
  loading?: boolean;
}> = ({ totalShifts, change, loading }) => (
  <StatCard
    title="Total des shifts"
    value={totalShifts}
    change={change}
    icon={Calendar}
    color="purple"
    loading={loading}
  />
);

export const ConflictsStatCard: React.FC<{
  conflictCount: number;
  loading?: boolean;
}> = ({ conflictCount, loading }) => (
  <StatCard
    title="Conflits détectés"
    value={conflictCount}
    icon={conflictCount > 0 ? AlertTriangle : CheckCircle}
    color={conflictCount > 0 ? 'red' : 'green'}
    loading={loading}
  />
);

export default StatCard;