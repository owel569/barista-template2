/**
 * Composant MetricCard extrait et optimisé
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react';

export interface MetricCardProps {
  title: string;
  value: number;
  previousValue: number;
  growth: number;
  icon: LucideIcon;
  format?: 'number' | 'currency' | 'percentage';
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  previousValue,
  growth,
  icon: Icon,
  format = 'number',
  subtitle,
  trend
}) => {
  const formatValue = (val: number): string => {
    switch (format) {
      case 'currency':
        return val.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
      case 'percentage':
        return `${val.toFixed(1)}%`;
      default:
        return val.toLocaleString('fr-FR');
    }
  };

  const getTrendColor = (growthValue: number): string => {
    if (growthValue > 0) return 'text-green-600';
    if (growthValue < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getTrendIcon = (growthValue: number) => {
    if (growthValue > 0) return TrendingUp;
    if (growthValue < 0) return TrendingDown;
    return null;
  };

  const TrendIcon = getTrendIcon(growth);

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-1">
          {formatValue(value)}
        </div>
        
        {subtitle && (
          <p className="text-xs text-muted-foreground mb-2">
            {subtitle}
          </p>
        )}
        
        <div className="flex items-center space-x-2">
          <Badge 
            variant={growth > 0 ? "default" : growth < 0 ? "destructive" : "secondary"}
            className="flex items-center gap-1"
          >
            {TrendIcon && <TrendIcon className="h-3 w-3" />}
            {Math.abs(growth).toFixed(1)}%
          </Badge>
          
          <span className="text-xs text-muted-foreground">
            vs période précédente
          </span>
        </div>
        
        <div className="mt-2 text-xs text-muted-foreground">
          Précédent: {formatValue(previousValue)}
        </div>
      </CardContent>
    </Card>
  );
};