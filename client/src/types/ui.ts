
// Types précis pour les composants UI
export type ToastVariant = 'default' | 'destructive' | 'success' | 'warning' | 'info';

export interface ToastConfig {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
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
  size?: number | string;
  color?: string;
  strokeWidth?: number;
}

export type LucideIconComponent = React.ForwardRefExoticComponent<
  Omit<React.SVGProps<SVGSVGElement>, "ref"> & {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
  } & React.RefAttributes<SVGSVGElement>
>;

// Types pour les formulaires
export interface FormFieldProps {
  name: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface FormSelectProps extends FormFieldProps {
  options: SelectOption[];
  multiple?: boolean;
}

// Types pour les données tabulaires
export interface TableColumn<T = unknown> {
  id: string;
  header: string;
  accessor: keyof T | ((row: T) => unknown);
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface TableProps<T = unknown> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  sorting?: {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  };
  selection?: {
    selectedRows: string[] | number[];
    onSelectionChange: (selectedRows: string[] | number[]) => void;
  };
}

// Types pour les modales et dialogs
export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void | Promise<void>;
}

// Types pour les notifications
export interface NotificationData {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

// Types pour les filtres et recherche
export interface FilterConfig {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'number' | 'boolean';
  options?: SelectOption[];
  placeholder?: string;
}

export interface SearchConfig {
  placeholder?: string;
  fields: string[];
  debounceMs?: number;
}

// Types pour l'état global des composants
export interface GlobalComponentState {
  theme: 'light' | 'dark' | 'system';
  language: string;
  user: {
    id: string;
    name: string;
    role: string;
    permissions: string[];
  } | null;
  notifications: NotificationData[];
  loading: Record<string, boolean>;
  errors: Record<string, string | null>;
}

// Types utilitaires
export type WithLoading<T> = T & { loading?: boolean };
export type WithError<T> = T & { error?: string | null };
export type WithTimestamps<T> = T & { createdAt: Date; updatedAt: Date };

// Types pour les réponses API
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
