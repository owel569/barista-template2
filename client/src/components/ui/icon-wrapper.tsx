
import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface IconWrapperProps {
  icon: LucideIcon;
  className?: string;
  size?: number;
}

export const IconWrapper: React.FC<IconWrapperProps> = ({ 
  icon: Icon, 
  className = '', 
  size = 16 
}) => {
  return <Icon className={className} size={size} />;
};

// Helper pour créer des composants d'icônes typés
export function createIconComponent(icon: LucideIcon) {
  return function WrappedIcon({ className }: { className?: string }) {
    return <IconWrapper icon={icon} className={className} />;
  };
}
