import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

export type MetricCardProps = {
  title: string;
  value: number;
  previousValue: number;
  growth: number;
  icon: LucideIcon;
  format?: 'number' | 'currency' | 'percentage';
};

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  previousValue, 
  growth, 
  icon: Icon, 
  format = 'number' 
}) => {
  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return `€${val.toLocaleString(}`;
      case 'percentage':
        return `${val}%`;
      default:
        return val.toLocaleString();
    }
  };

  const isPositive = growth >= 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue(value}</div>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          }
          <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
            {isPositive ? '+' : ''}{growth.toFixed(1}%
          </span>
          <span>depuis la période précédente</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;