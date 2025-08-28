
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle } from 'lucide-react';

interface OrderTimerProps {
  orderId?: number;
  createdAt: string;
  estimatedTime: number;
  status?: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  onOverdue?: (orderId: number) => void;
}

export function OrderTimer({ orderId, createdAt, estimatedTime, status = 'pending', onOverdue }: OrderTimerProps) {
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    const created = new Date(createdAt).getTime();
    const updateElapsed = () => {
      const elapsed = Math.floor((Date.now() - created) / 60000);
      setTimeElapsed(elapsed);
      
      // Notifier si en retard
      if (elapsed > estimatedTime && orderId && onOverdue && status === 'preparing') {
        onOverdue(orderId);
      }
    };

    updateElapsed();
    const timer = setInterval(updateElapsed, 30000); // Optimisé à 30 secondes

    return () => clearInterval(timer);
  }, [createdAt, estimatedTime, orderId, onOverdue, status]);

  const isOverdue = timeElapsed > estimatedTime && status !== 'delivered' && status !== 'cancelled';
  const isCompleted = status === 'delivered' || status === 'cancelled';

  const getStatusIcon = () => {
    if (isOverdue) return <AlertTriangle className="h-3 w-3 text-red-500" />;
    if (isCompleted) return <Clock className="h-3 w-3 text-green-500" />;
    return <Clock className={`h-3 w-3 ${timeElapsed > estimatedTime * 0.8 ? 'text-orange-500' : 'text-blue-500'}`} />;
  };

  const getStatusColor = () => {
    if (isOverdue) return 'destructive';
    if (isCompleted) return 'secondary';
    if (timeElapsed > estimatedTime * 0.8) return 'outline';
    return 'default';
  };

  return (
    <div className="flex items-center gap-1 min-w-[120px]" data-testid={`order-timer-${orderId}`}>
      {getStatusIcon()}
      <Badge 
        variant={getStatusColor()}
        className="text-xs font-mono"
        data-testid={`timer-badge-${orderId}`}
      >
        {timeElapsed}m/{estimatedTime}m
      </Badge>
      {isOverdue && (
        <Badge variant="destructive" className="text-xs ml-1" data-testid={`overdue-badge-${orderId}`}>
          En retard
        </Badge>
      )}
    </div>
  );
}

export default OrderTimer;
