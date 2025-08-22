// Types communs pour tous les composants admin
export type UserRole = 'directeur' | 'manager' | 'employee' | 'admin';

export type InventoryStatus = 'ok' | 'low' | 'critical' | 'out';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ActivityStatus = 'active' | 'inactive' | 'pending' | 'completed';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type Department = 'service' | 'cuisine' | 'management' | 'maintenance' | 'all';

export type Position = 'serveur' | 'barista' | 'chef' | 'manager' | 'caissier' | 'nettoyage' | 'all';

// Interfaces communes pour les données utilisateur
export interface BaseUser {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Interface pour les permissions
export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
  action: 'read' | 'write' | 'delete' | 'admin';
}

export interface UserPermissions {
  userId: number;
  permissions: Record<string, boolean>;
  roles: UserRole[];
}

// Interface pour les réponses API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Interface pour les filtres communs
export interface BaseFilter {
  search?: string;
  status?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Interface pour les statistiques
export interface BaseStats {
  total: number;
  active: number;
  inactive: number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
}

// Utilitaires de validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^(?:\+33|0)[1-9](?:[.\s-]?\d{2}){4}$/;
  return phoneRegex.test(phone);
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 8 && 
         /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password);
};

// Utilitaires pour les rôles
export const getRoleHierarchy = (): UserRole[] => {
  return ['directeur', 'manager', 'admin', 'employee'];
};

export const hasPermission = (userRole: UserRole, requiredRole: UserRole): boolean => {
  const hierarchy = getRoleHierarchy();
  const userIndex = hierarchy.indexOf(userRole);
  const requiredIndex = hierarchy.indexOf(requiredRole);
  return userIndex !== -1 && requiredIndex !== -1 && userIndex <= requiredIndex;
};

// Constantes pour les modules
export const ADMIN_MODULES = {
  DASHBOARD: 'dashboard',
  USERS: 'users',
  INVENTORY: 'inventory', 
  ORDERS: 'orders',
  RESERVATIONS: 'reservations',
  ANALYTICS: 'analytics',
  SETTINGS: 'settings',
  PERMISSIONS: 'permissions',
  REPORTS: 'reports',
  WORK_SCHEDULE: 'work_schedule'
} as const;

export type AdminModule = typeof ADMIN_MODULES[keyof typeof ADMIN_MODULES];

// Interface pour les composants de formulaire
export interface FormValidation {
  isValid: boolean;
  errors: Record<string, string>;
  warnings?: Record<string, string>;
}

// Interface pour les notifications
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actions?: {
    label: string;
    action: () => void;
  }[];
}

// Constantes pour les couleurs de statut
export const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  ok: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  low: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  critical: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  out: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
} as const;

export type StatusColor = keyof typeof STATUS_COLORS;

// Interface pour les hooks de mutation
export interface MutationState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

// Interface pour les composants de tableau
export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, item: T) => React.ReactNode;
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  onSort?: (key: keyof T, direction: 'asc' | 'desc') => void;
  onRowClick?: (item: T) => void;
  pagination?: {
    current: number;
    total: number;
    pageSize: number;
    onChange: (page: number) => void;
  };
}