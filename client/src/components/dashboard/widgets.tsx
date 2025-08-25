import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Calendar, 
  ShoppingCart, 
  Users, 
  Euro, 
  Target,
  Clock,
  Star,
  AlertCircle
} from 'lucide-react';

// ==========================================
// WIDGET STATISTIQUE SIMPLE
// ==========================================

interface StatWidgetProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatWidget({ 
  title, 
  value, 
  subtitle, 
  icon, 
  iconBgColor, 
  iconColor, 
  trend, 
  className = "" 
}: StatWidgetProps) {
  return (
    <Card className={`hover:shadow-lg transition-all duration-200 ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              {title}
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                <span className={`text-xs font-medium ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full ${iconBgColor}`}>
            <div className={iconColor}>
              {icon}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ==========================================
// WIDGET AVEC PROGRESS BAR
// ==========================================

interface ProgressWidgetProps {
  title: string;
  value: number;
  maxValue: number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  progressColor?: string;
  showPercentage?: boolean;
}

export function ProgressWidget({
  title,
  value,
  maxValue,
  subtitle,
  icon,
  iconBgColor,
  iconColor,
  progressColor = "bg-blue-600",
  showPercentage = true
}: ProgressWidgetProps) {
  const percentage = Math.round((value / maxValue) * 100);
  
  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-full ${iconBgColor}`}>
            <div className={iconColor}>
              {icon}
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Progression</span>
            {showPercentage && (
              <span className="font-medium text-gray-900 dark:text-white">
                {percentage}%
              </span>
            )}
          </div>
          <Progress value={percentage} className={`h-2 ${progressColor}`} />
        </div>
      </CardContent>
    </Card>
  );
}

// ==========================================
// WIDGET DE TENDANCE
// ==========================================

interface TrendWidgetProps {
  title: string;
  currentValue: number;
  previousValue: number;
  formatValue?: (value: number) => string;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  subtitle?: string;
}

export function TrendWidget({
  title,
  currentValue,
  previousValue,
  formatValue = (value) => value.toString(),
  icon,
  iconBgColor,
  iconColor,
  subtitle
}: TrendWidgetProps) {
  const change = previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;
  const isPositive = change >= 0;
  
  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              {title}
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatValue(currentValue)}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
            <div className="flex items-center gap-1 mt-2">
              {isPositive ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className={`text-xs font-medium ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {isPositive ? '+' : ''}{change.toFixed(1)}%
              </span>
              <span className="text-xs text-gray-500">
                vs mois précédent
              </span>
            </div>
          </div>
          <div className={`p-3 rounded-full ${iconBgColor}`}>
            <div className={iconColor}>
              {icon}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ==========================================
// WIDGET D'ALERTE
// ==========================================

interface AlertWidgetProps {
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  description: string;
  count?: number;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function AlertWidget({
  type,
  title,
  description,
  count,
  icon,
  action
}: AlertWidgetProps) {
  const getAlertStyles = () => {
    switch (type) {
      case 'error':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          iconBg: 'bg-red-100 dark:bg-red-900/40',
          iconColor: 'text-red-600 dark:text-red-400',
          titleColor: 'text-red-900 dark:text-red-100',
          descColor: 'text-red-700 dark:text-red-300'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-200 dark:border-yellow-800',
          iconBg: 'bg-yellow-100 dark:bg-yellow-900/40',
          iconColor: 'text-yellow-600 dark:text-yellow-400',
          titleColor: 'text-yellow-900 dark:text-yellow-100',
          descColor: 'text-yellow-700 dark:text-yellow-300'
        };
      case 'info':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          iconBg: 'bg-blue-100 dark:bg-blue-900/40',
          iconColor: 'text-blue-600 dark:text-blue-400',
          titleColor: 'text-blue-900 dark:text-blue-100',
          descColor: 'text-blue-700 dark:text-blue-300'
        };
      case 'success':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-800',
          iconBg: 'bg-green-100 dark:bg-green-900/40',
          iconColor: 'text-green-600 dark:text-green-400',
          titleColor: 'text-green-900 dark:text-green-100',
          descColor: 'text-green-700 dark:text-green-300'
        };
    }
  };

  const styles = getAlertStyles();
  const defaultIcon = icon || <AlertCircle className="h-4 w-4" />;

  return (
    <Card className={`${styles.bg} ${styles.border} border`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full ${styles.iconBg}`}>
            <div className={styles.iconColor}>
              {defaultIcon}
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={`text-sm font-medium ${styles.titleColor}`}>
                {title}
              </h4>
              {count && (
                <Badge variant="outline" className="text-xs">
                  {count}
                </Badge>
              )}
            </div>
            <p className={`text-sm ${styles.descColor}`}>
              {description}
            </p>
            {action && (
              <div className="mt-3">
                {action}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ==========================================
// WIDGET DE LISTE
// ==========================================

interface ListWidgetProps {
  title: string;
  items: Array<{
    id: string | number;
    title: string;
    subtitle?: string;
    value?: string | number;
    badge?: string;
    icon?: React.ReactNode;
  }>;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  emptyMessage?: string;
  maxItems?: number;
}

export function ListWidget({
  title,
  items,
  icon,
  iconBgColor,
  iconColor,
  emptyMessage = "Aucun élément",
  maxItems
}: ListWidgetProps) {
  const displayItems = maxItems ? items.slice(0, maxItems) : items;
  
  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-full ${iconBgColor}`}>
            <div className={iconColor}>
              {icon}
            </div>
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {displayItems.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            {emptyMessage}
          </p>
        ) : (
          <div className="space-y-3">
            {displayItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-3">
                  {item.icon && (
                    <div className="text-gray-400">
                      {item.icon}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.title}
                    </p>
                    {item.subtitle && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.value && (
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.value}
                    </span>
                  )}
                  {item.badge && (
                    <Badge variant="outline" className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ==========================================
// WIDGET DE MÉTRIQUE
// ==========================================

interface MetricWidgetProps {
  title: string;
  value: number;
  target: number;
  unit?: string;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  description?: string;
}

export function MetricWidget({
  title,
  value,
  target,
  unit = "",
  icon,
  iconBgColor,
  iconColor,
  description
}: MetricWidgetProps) {
  const percentage = Math.min((value / target) * 100, 100);
  const isOnTarget = percentage >= 100;
  
  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              {title}
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {value}{unit}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                / {target}{unit}
              </p>
            </div>
            {description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {description}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-full ${iconBgColor}`}>
            <div className={iconColor}>
              {icon}
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Objectif</span>
            <span className={`font-medium ${
              isOnTarget ? 'text-green-600' : 'text-amber-600'
            }`}>
              {percentage.toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={percentage} 
            className={`h-2 ${
              isOnTarget ? 'bg-green-600' : 'bg-amber-600'
            }`} 
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ==========================================
// EXPORT DES COMPOSANTS
// ==========================================

export {
  StatWidget,
  ProgressWidget,
  TrendWidget,
  AlertWidget,
  ListWidget,
  MetricWidget
};