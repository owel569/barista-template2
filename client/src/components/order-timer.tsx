
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface OrderTimerProps {
  createdAt: string;
  estimatedTime: number;
}

export function OrderTimer({ createdAt, estimatedTime }: OrderTimerProps) {
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    const created = new Date(createdAt).getTime();
    const updateElapsed = () => {
      const elapsed = Math.floor((Date.now() - created) / 60000);
      setTimeElapsed(elapsed);
    };

    updateElapsed();
    const timer = setInterval(updateElapsed, 30000); // Optimisé à 30 secondes

    return () => clearInterval(timer);
  }, [createdAt]);

  const isOverdue = timeElapsed > estimatedTime;

  return (
    <div className="flex items-center gap-1 min-w-[120px]">
      <Clock className={`h-3 w-3 ${isOverdue ? 'text-red-500' : 'text-amber-500'}`} />
      <Badge 
        variant={isOverdue ? "destructive" : "outline"} 
        className="text-xs font-mono"
      >
        {timeElapsed}m/{estimatedTime}m
      </Badge>
    </div>
  );
}
