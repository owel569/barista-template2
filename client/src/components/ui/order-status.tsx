
import React from 'react';
import { Badge } from './badge';
import { Progress } from './progress';
import { Card, CardContent } from './card';
import { Clock, CheckCircle, AlertCircle, Truck, ChefHat } from 'lucide-react';

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'delivering'
  | 'delivered'
  | 'cancelled';

export interface OrderStatusProps {
  status: OrderStatus;
  estimatedTime?: number; // en minutes
  actualTime?: number;
  trackingNumber?: string;
  showProgress?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

const statusConfig = {
  pending: {
    label: 'En attente',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    icon: Clock,
    progress: 0
  },
  confirmed: {
    label: 'Confirmée',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    icon: CheckCircle,
    progress: 20
  },
  preparing: {
    label: 'En préparation',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    icon: ChefHat,
    progress: 50
  },
  ready: {
    label: 'Prête',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    icon: CheckCircle,
    progress: 80
  },
  delivering: {
    label: 'En livraison',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    icon: Truck,
    progress: 90
  },
  delivered: {
    label: 'Livrée',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    icon: CheckCircle,
    progress: 100
  },
  cancelled: {
    label: 'Annulée',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    icon: AlertCircle,
    progress: 0
  }
};

export function OrderStatus({
  status,
  estimatedTime,
  actualTime,
  trackingNumber,
  showProgress = true,
  variant = 'default'
}: OrderStatusProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  if (variant === 'compact') {
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  }

  if (variant === 'detailed') {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <span className="font-medium">Statut de la commande</span>
              </div>
              <Badge className={config.color}>
                {config.label}
              </Badge>
            </div>

            {showProgress && status !== 'cancelled' && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progression</span>
                  <span>{config.progress}%</span>
                </div>
                <Progress value={config.progress} className="h-2" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              {estimatedTime && status !== 'delivered' && status !== 'cancelled' && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Temps estimé:</span>
                  <p className="font-medium">{estimatedTime} min</p>
                </div>
              )}
              
              {actualTime && (status === 'delivered' || status === 'ready') && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Temps réel:</span>
                  <p className="font-medium">{actualTime} min</p>
                </div>
              )}
              
              {trackingNumber && (
                <div className="col-span-2">
                  <span className="text-gray-600 dark:text-gray-400">N° de suivi:</span>
                  <p className="font-medium font-mono">{trackingNumber}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Variant par défaut
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        <Badge className={config.color}>
          {config.label}
        </Badge>
      </div>
      
      {estimatedTime && status !== 'delivered' && status !== 'cancelled' && (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          ~{estimatedTime} min
        </span>
      )}
      
      {showProgress && status !== 'cancelled' && (
        <div className="flex-1 max-w-32">
          <Progress value={config.progress} className="h-1" />
        </div>
      )}
    </div>
  );
}
