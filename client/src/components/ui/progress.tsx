import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
}

export function Progress({ value, max = 100, className, color = 'blue' }: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    indigo: 'bg-indigo-500'
  };

  return (
    <div className={cn("w-full bg-gray-200 rounded-full h-2", className)}>
      <div
        className={cn("h-2 rounded-full transition-all duration-300", colorClasses[color])}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}