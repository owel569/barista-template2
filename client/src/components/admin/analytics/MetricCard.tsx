
/**
 * Composant MetricCard unifié et optimisé
 * Combine toutes les fonctionnalités des différentes versions
 */

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Types unifiés pour toutes les variantes
export interface MetricCardProps {
  title: string;
  value: number | string;
  previousValue?: number;
  growth?: number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  format?: 'number' | 'currency' | 'percentage' | 'rating' | 'custom';
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  loading?: boolean;
  color?: string;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
  showTrend?: boolean;
  customFormatter?: (value: number | string) => string;
}

/**
 * Formate une valeur selon le type spécifié
 */
const formatValue = (
  val: number | string, 
  format: MetricCardProps['format'] = 'number',
  customFormatter?: (value: number | string) => string
): string => {
  if (customFormatter) {
    return customFormatter(val);
  }

  if (typeof val === 'string') {
    return val;
  }

  switch (format) {
    case 'currency':
      return val.toLocaleString('fr-FR', { 
        style: 'currency', 
        currency: 'EUR',
        minimumFractionDigits: val % 1 === 0 ? 0 : 2
      });
    case 'percentage':
      return `${val.toFixed(1)}%`;
    case 'rating':
      return `${val.toFixed(1)}/5`;
    case 'custom':
      return val.toString();
    default:
      return val.toLocaleString('fr-FR');
  }
};

/**
 * Détermine la couleur de la tendance
 */
const getTrendColor = (
  growth?: number, 
  changeType?: 'positive' | 'negative' | 'neutral'
): string => {
  if (changeType) {
    return {
      positive: 'text-green-600 dark:text-green-400',
      negative: 'text-red-600 dark:text-red-400',
      neutral: 'text-gray-600 dark:text-gray-400'
    }[changeType];
  }

  if (growth === undefined) return 'text-gray-600 dark:text-gray-400';
  
  if (growth > 0) return 'text-green-600 dark:text-green-400';
  if (growth < 0) return 'text-red-600 dark:text-red-400';
  return 'text-gray-600 dark:text-gray-400';
};

/**
 * Retourne l'icône de tendance appropriée
 */
const getTrendIcon = (
  growth?: number, 
  changeType?: 'positive' | 'negative' | 'neutral',
  trend?: 'up' | 'down' | 'stable'
) => {
  if (trend) {
    return {
      up: TrendingUp,
      down: TrendingDown,
      stable: Minus
    }[trend];
  }

  if (changeType) {
    return {
      positive: TrendingUp,
      negative: TrendingDown,
      neutral: Minus
    }[changeType];
  }

  if (growth === undefined) return null;
  
  if (growth > 0) return TrendingUp;
  if (growth < 0) return TrendingDown;
  return Minus;
};

/**
 * Composant MetricCard unifié avec toutes les fonctionnalités
 */
export const MetricCard: React.FC<MetricCardProps> = memo(({
  title,
  value,
  previousValue,
  growth,
  change,
  changeType,
  icon: Icon,
  format = 'number',
  subtitle,
  trend,
  loading = false,
  color,
  variant = 'default',
  className,
  showTrend = true,
  customFormatter
}) => {
  const formattedValue = formatValue(value, format, customFormatter);
  const trendColor = getTrendColor(growth, changeType);
  const TrendIcon = getTrendIcon(growth, changeType, trend);
  
  // Calcul automatique de la croissance si previousValue est fourni
  const calculatedGrowth = growth !== undefined ? growth : 
    (previousValue && typeof value === 'number' && previousValue > 0) ?
    ((value - previousValue) / previousValue) * 100 : undefined;

  if (loading) {
    return (
      <Card className={cn(
        "hover:shadow-lg transition-shadow duration-200 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
        className
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
            <Skeleton className="h-4 w-24" />
          </CardTitle>
          <Skeleton className="h-4 w-4 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 mb-2" />
          {showTrend && <Skeleton className="h-4 w-32" />}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "hover:shadow-lg transition-shadow duration-200 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
      variant === 'compact' && "p-3",
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {title}
        </CardTitle>
        <Icon 
          className={cn(
            "h-4 w-4",
            color ? '' : "text-gray-600 dark:text-gray-400"
          )} 
          style={color ? { color } : undefined}
        />
      </CardHeader>
      
      <CardContent className={variant === 'compact' ? "p-0 pt-2" : undefined}>
        <div 
          className={cn(
            "text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1",
            variant === 'compact' && "text-xl"
          )}
          style={color ? { color } : undefined}
        >
          {formattedValue}
        </div>
        
        {subtitle && (
          <p className="text-xs text-muted-foreground mb-2">
            {subtitle}
          </p>
        )}
        
        {showTrend && (calculatedGrowth !== undefined || change || changeType) && (
          <div className="flex items-center space-x-2 text-xs">
            {calculatedGrowth !== undefined && (
              <>
                <Badge 
                  variant={
                    calculatedGrowth > 0 ? "default" : 
                    calculatedGrowth < 0 ? "destructive" : 
                    "secondary"
                  }
                  className="flex items-center gap-1 text-xs px-2 py-1"
                >
                  {TrendIcon && <TrendIcon className="h-3 w-3" />}
                  {calculatedGrowth > 0 ? '+' : ''}{Math.abs(calculatedGrowth).toFixed(1)}%
                </Badge>
                
                <span className="text-muted-foreground">
                  vs période précédente
                </span>
              </>
            )}
            
            {change && !calculatedGrowth && (
              <span className={cn("flex items-center gap-1", trendColor)}>
                {TrendIcon && <TrendIcon className="h-4 w-4" />}
                {change}
              </span>
            )}
          </div>
        )}
        
        {variant === 'detailed' && previousValue !== undefined && typeof value === 'number' && (
          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="text-xs text-muted-foreground">
              Précédent: {formatValue(previousValue, format, customFormatter)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

MetricCard.displayName = 'MetricCard';

export default MetricCard;
