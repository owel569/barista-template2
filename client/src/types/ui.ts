
// Types précis pour les composants UI
export type ToastVariant = 'default' | 'destructive';

export interface ToastConfig {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
  data?: unknown;
}

export interface ComponentState {
  loading: LoadingState;
  dialog: {
    open: boolean;
    type?: string;
    data?: unknown;
  };
  filter: {
    search: string;
    category: string;
    status?: string;
  };
}

// Types pour les icônes Lucide avec compatibilité strict
export interface IconProps {
  className?: string;
  size?: number;
}

export type LucideIconComponent = React.ForwardRefExoticComponent<
  Omit<React.SVGProps<SVGSVGElement>, "ref"> & {
    size?: string | number;
  } & React.RefAttributes<SVGSVGElement>
>;
