
import { LucideIcon } from 'lucide-react';
import { ComponentType, SVGProps } from 'react';

// Type pour les composants d'icônes Lucide
export type LucideIconComponent = LucideIcon;

// Type pour les props des icônes
export interface IconProps {
  className?: string;
  size?: number | string;
  color?: string;
  strokeWidth?: number;
}

// Type pour les icônes SVG personnalisées
export type SVGIconComponent = ComponentType<SVGProps<SVGSVGElement>>;

// Type union pour tous les types d'icônes
export type IconComponent = LucideIconComponent | SVGIconComponent;

// Interface pour les icônes avec métadonnées
export interface IconDefinition {
  icon: IconComponent;
  name: string;
  category: 'navigation' | 'action' | 'status' | 'data' | 'communication';
  description?: string;
}

// Types pour les variantes d'icônes
export type IconVariant = 'default' | 'outline' | 'filled' | 'mini';
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

// Interface pour les props étendues des icônes
export interface ExtendedIconProps extends IconProps {
  variant?: IconVariant;
  size?: IconSize;
  'aria-label'?: string;
  'aria-hidden'?: boolean;
}

// Export des types principaux
export type { LucideIcon };
