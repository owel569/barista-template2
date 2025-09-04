
import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface IconWrapperProps {
  icon: LucideIcon;
  className?: string | undefined;
  size?: number | undefined;
}

export const IconWrapper: React.FC<IconWrapperProps> = ({ 
  icon: Icon, 
  className, 
  size
}) => {
  const props: { className?: string; size?: string | number } = {};
  if (className !== undefined) props.className = className;
  if (size !== undefined) props.size = size;
  return <Icon {...props} />;
};

// Helper pour créer des composants d'icônes typés
export function createIconComponent(icon: LucideIcon) {
  return function WrappedIcon({ className }: { className?: string | undefined }) {
    return <IconWrapper icon={icon} className={className} />;
  };
}
