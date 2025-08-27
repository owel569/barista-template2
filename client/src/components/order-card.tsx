
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Monitor, Smartphone, Tablet } from 'lucide-react';
import { OrderTimer } from './order-timer';

interface OnlineOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  platform: 'website' | 'mobile_app' | 'phone';
  orderType: 'pickup' | 'delivery' | 'dine_in';
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  totalAmount: number;
  estimatedTime?: number;
  stockChecked: boolean;
  createdAt: string;
}

interface OrderCardProps {
  order: OnlineOrder;
  onSelect: (order: OnlineOrder) => void;
  onUpdateStatus: (id: number, status: string) => void;
  onCancel: (id: number) => void;
  onCheckStock: (id: number) => void;
}

const platformIcons = {
  website: Monitor,
  mobile_app: Smartphone,
  phone: Tablet,
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-purple-100 text-purple-800',
  ready: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  ready: 'Prête',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

export function OrderCard({ order, onSelect, onUpdateStatus, onCancel, onCheckStock }: OrderCardProps) {
  const PlatformIcon = platformIcons[order.platform] || platformIcons.website;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">#{order.orderNumber}</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => onSelect(order)}>
            <Eye className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <PlatformIcon className="h-4 w-4" />
          <span className="text-sm capitalize">
            {order.platform === 'website' ? 'Site Web' : 
             order.platform === 'mobile_app' ? 'App Mobile' : 'Téléphone'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="font-medium">{order.customerName}</p>
          <p className="text-sm text-gray-500">{order.customerPhone}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            {order.orderType === 'pickup' ? 'À emporter' :
             order.orderType === 'delivery' ? 'Livraison' : 'Sur place'}
          </Badge>
          <Badge className={statusColors[order.status]}>
            {statusLabels[order.status]}
          </Badge>
        </div>

        {order.estimatedTime && (
          <OrderTimer createdAt={order.createdAt} estimatedTime={order.estimatedTime} />
        )}

        <p className="font-bold">{(order.totalAmount || 0).toFixed(2)}€</p>

        <div className="flex flex-wrap gap-2">
          {!order.stockChecked && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCheckStock(order.id)}
              className="text-xs"
            >
              Vérifier stock
            </Button>
          )}

          {order.status === 'pending' && (
            <Button
              size="sm"
              onClick={() => onUpdateStatus(order.id, 'confirmed')}
              className="text-xs"
            >
              Confirmer
            </Button>
          )}
          
          {order.status !== 'cancelled' && order.status !== 'completed' && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onCancel(order.id)}
              className="text-xs"
            >
              Annuler
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
