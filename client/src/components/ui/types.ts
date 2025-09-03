import { ComponentProps, ReactNode } from 'react';
import { LucideProps } from 'lucide-react';

// ===== TYPES DE BASE =====
export interface BaseUIComponentProps {
  className?: string;
  children?: ReactNode;
}

export interface SafeObject {
  [key: string]: unknown;
}

export type SafeEventHandler<T = unknown> = (event: T) => void;

export interface AccessibilityProps {
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-labelledby'?: string;
  role?: string;
}

// ===== TYPES DE COMPOSANTS =====
export interface LabelProps extends BaseUIComponentProps {
  htmlFor?: string;
  required?: boolean;
}

export interface TextareaProps extends BaseUIComponentProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  rows?: number;
  disabled?: boolean;
  required?: boolean;
}

export interface CheckboxProps extends BaseUIComponentProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  required?: boolean;
}

export interface RadioGroupProps extends BaseUIComponentProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

export interface SwitchProps extends BaseUIComponentProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
}

export interface SelectProps extends BaseUIComponentProps {
  value?: string;
  onChange?: (value: string) => void;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  disabled?: boolean;
}

export interface FormFieldProps extends BaseUIComponentProps {
  label?: string;
  error?: string;
  required?: boolean;
  description?: string;
}

// ===== TYPES DE DONNÉES =====
export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface MultiSelectOption extends ComboboxOption {
  selected?: boolean;
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps extends BaseUIComponentProps {
  columns: TableColumn[];
  data: SafeObject[];
  loading?: boolean;
  pagination?: boolean;
  sortable?: boolean;
  filterable?: boolean;
}

export interface DateRangePickerProps extends BaseUIComponentProps {
  startDate?: Date;
  endDate?: Date;
  onChange?: (startDate: Date, endDate: Date) => void;
  placeholder?: string;
  disabled?: boolean;
}

export interface DatePickerProps extends BaseUIComponentProps {
  value?: Date;
  onChange?: (date: Date) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

// ===== TYPES D'ALERTE =====
export interface AlertProps extends BaseUIComponentProps {
  variant?: 'default' | 'destructive' | 'warning' | 'success';
  title?: string;
  description?: string;
}

export interface AlertDescriptionProps extends BaseUIComponentProps {
  children: ReactNode;
}

// ===== TYPES DE VARIANTS =====
export type ComponentVariant = 'default' | 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
export type ComponentSize = 'sm' | 'md' | 'lg' | 'xl';

// ===== TYPES DE PAYS ET TÉLÉPHONE =====
export interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

export interface InternationalPhoneInputProps extends BaseUIComponentProps {
  value?: string;
  onChange?: (value: string) => void;
  defaultCountry?: string;
  disabled?: boolean;
  placeholder?: string;
}

// ===== TYPES DE CHARGEMENT =====
export interface LoadingSpinnerProps extends BaseUIComponentProps {
  size?: ComponentSize;
  color?: string;
}

export interface LoadingPageProps extends BaseUIComponentProps {
  message?: string;
  showSpinner?: boolean;
}

export interface SkeletonLoaderProps extends BaseUIComponentProps {
  width?: string;
  height?: string;
  count?: number;
}

// Alias pour compatibilité
export type SkeletonProps = SkeletonLoaderProps;

// ===== TYPES DE GRAPHIQUES =====
export interface ChartConfig {
  [key: string]: {
    label: string;
    color?: string;
    theme?: {
      light?: string;
      dark?: string;
    };
  };
}

export interface StatsCardProps extends BaseUIComponentProps {
  title: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  description?: string;
}

// ===== TYPES DE NAVIGATION =====
export interface BreadcrumbProps extends BaseUIComponentProps {
  items: Array<{
    label: string;
    href?: string;
    current?: boolean;
  }>;
  separator?: ReactNode;
}

export interface PaginationProps extends BaseUIComponentProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
}

// ===== TYPES DE MODALES =====
export interface ConfirmationDialogProps extends BaseUIComponentProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  variant?: 'default' | 'destructive';
}

// ===== TYPES DE LAYOUT =====
export interface ResizableLayoutProps extends BaseUIComponentProps {
  direction?: 'horizontal' | 'vertical';
  defaultSizes?: number[];
  minSizes?: number[];
  maxSizes?: number[];
}

export interface ResizablePanelGroupProps extends BaseUIComponentProps {
  direction?: 'horizontal' | 'vertical';
  autoSaveId?: string;
}

export interface ResizableHandleProps extends BaseUIComponentProps {
  disabled?: boolean;
  hitAreaMargins?: {
    coarse: number;
    fine: number;
  };
}

// ===== TYPES DE MÉDIA =====
export interface AspectRatioProps extends BaseUIComponentProps {
  ratio?: number;
  asChild?: boolean;
}

// ===== TYPES DE COLLAPSIBLE =====
export interface CollapsibleTriggerButtonProps extends BaseUIComponentProps {
  disabled?: boolean;
  asChild?: boolean;
}

export interface CollapsibleContentWrapperProps extends BaseUIComponentProps {
  forceMount?: boolean;
  asChild?: boolean;
}

// ===== TYPES D'ICÔNES COMPATIBLES =====
export type IconComponent = React.ComponentType<{ className?: string }>;

// Export par défaut pour compatibilité
// No default export: types are type-only and should be imported by name