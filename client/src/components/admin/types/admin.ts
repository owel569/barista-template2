export interface User {
  id: number;
  username: string;
  role: 'directeur' | 'employe';
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface Permission {
  module: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface MenuItem {
  icon: unknown;
  label: string;
  section: string;
  readonly?: boolean;
  directeurOnly?: boolean;
  badge?: number;
}

export interface NotificationData {
  id: string;
  type: 'reservation' | 'order' | 'message' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}
// Types et interfaces pour les modules d'administration

export type AdminModuleType = 
  | 'dashboard'
  | 'users' 
  | 'menu'
  | 'orders'
  | 'reservations'
  | 'analytics'
  | 'inventory'
  | 'reports'
  | 'settings'
  | 'permissions'
  | 'loyalty'
  | 'backup'
  | 'notifications'
  | 'delivery'
  | 'events'
  | 'feedback'
  | 'scheduling'
  | 'maintenance'
  | 'accounting';

export interface AdminModule {
  id: AdminModuleType;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  permissions: string[];
}

export interface AdminPermission {
  id: string;
  name: string;
  description: string;
  module: AdminModuleType;
  level: 'read' | 'write' | 'admin';
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
  permissions: string[];
  active: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface AdminActivity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: AdminModuleType;
  description: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error' | 'success';
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingReservations: number;
  lowStockItems: number;
}
