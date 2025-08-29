
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';
import { cn } from "@/lib/utils";

// Types unifiés pour tous les composants de statistiques
export interface BaseStatsData {
  value: string | number;
  label: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    period?: string;
  };
  icon?: LucideIcon;
  color?: string;
  subtitle?: string;
  loading?: boolean;
}

export interface UnifiedStatsCardProps {
  data: BaseStatsData;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
  onClick?: () => void;
}

// Composant pour l'indicateur de tendance
const TrendIndicator: React.FC<{ trend: BaseStatsData['trend'] }> = ({ trend }) => {
  if (!trend) return null;

  const TrendIcon = trend.direction === 'up' ? TrendingUp : 
                   trend.direction === 'down' ? TrendingDown : Minus;
  
  const colorClass = trend.direction === 'up' ? 'text-green-600' : 
                    trend.direction === 'down' ? 'text-red-600' : 'text-gray-600';

  return (
    <div className={cn("flex items-center space-x-1 text-xs", colorClass)}>
      <TrendIcon className="h-3 w-3" />
      <span>{Math.abs(trend.value)}%</span>
      {trend.period && <span className="text-muted-foreground">({trend.period})</span>}
    </div>
  );
};

// Composant principal unifié
export const UnifiedStatsCard: React.FC<UnifiedStatsCardProps> = ({
  data,
  variant = 'default',
  className,
  onClick
}) => {
  const { value, label, trend, icon: Icon, color, subtitle, loading } = data;

  if (loading) {
    return (
      <Card className={cn("cursor-pointer transition-all hover:shadow-md", className)}>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-20" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-24" />
        </CardContent>
      </Card>
    );
  }

  const cardContent = (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        onClick && "hover:bg-accent/50",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className={cn(
        "pb-2",
        variant === 'compact' && "pb-1"
      )}>
        <CardTitle className={cn(
          "text-sm font-medium flex items-center justify-between",
          variant === 'compact' && "text-xs"
        )}>
          <span className="text-muted-foreground">{label}</span>
          {Icon && (
            <Icon 
              className={cn(
                "h-4 w-4",
                color ? `text-${color}` : "text-muted-foreground",
                variant === 'compact' && "h-3 w-3"
              )} 
            />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className={cn(variant === 'compact' && "pt-0")}>
        <div className="space-y-1">
          <div className={cn(
            "text-2xl font-bold",
            variant === 'compact' && "text-lg",
            color && `text-${color}`
          )}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          
          {subtitle && (
            <div className="text-xs text-muted-foreground">{subtitle}</div>
          )}
          
          {trend && variant !== 'compact' && (
            <TrendIndicator trend={trend} />
          )}
        </div>
      </CardContent>
    </Card>
  );

  return cardContent;
};

// Hook personnalisé pour la gestion des données de statistiques
export const useStatsData = (initialData: BaseStatsData[]) => {
  const [data, setData] = React.useState<BaseStatsData[]>(initialData);
  const [loading, setLoading] = React.useState(false);

  const updateData = React.useCallback((newData: BaseStatsData[]) => {
    setData(newData);
  }, []);

  const setLoadingState = React.useCallback((isLoading: boolean) => {
    setLoading(isLoading);
    if (isLoading) {
      setData(prev => prev.map(item => ({ ...item, loading: true })));
    }
  }, []);

  return { data, loading, updateData, setLoadingState };
};

// Export par défaut
export default UnifiedStatsCard;
