
// Types consolidés pour l'ensemble de l'application
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'employe';
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  available: boolean;
  allergens?: string[];
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered';
  total: number;
  createdAt: Date;
}

export interface OrderItem {
  menuItemId: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface Reservation {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  date: Date;
  time: string;
  partySize: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes?: string;
}

export interface AnalyticsData {
  revenue: number;
  orders: number;
  customers: number;
  averageOrderValue: number;
  period: 'day' | 'week' | 'month' | 'year';
  date: Date;
}

export interface ScheduleShift {
  id: string;
  employeeId: string;
  date: Date;
  startTime: string;
  endTime: string;
  position: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
}

// Permissions et rôles
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYE: 'employe'
} as const;

export const PERMISSIONS = {
  // Gestion des utilisateurs
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  USERS_DELETE: 'users:delete',
  
  // Gestion des commandes
  ORDERS_READ: 'orders:read',
  ORDERS_WRITE: 'orders:write',
  ORDERS_DELETE: 'orders:delete',
  
  // Gestion du menu
  MENU_READ: 'menu:read',
  MENU_WRITE: 'menu:write',
  MENU_DELETE: 'menu:delete',
  
  // Analytics
  ANALYTICS_READ: 'analytics:read',
  ANALYTICS_EXPORT: 'analytics:export',
  
  // Administration
  ADMIN_SETTINGS: 'admin:settings',
  ADMIN_PERMISSIONS: 'admin:permissions'
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
export type Role = typeof ROLES[keyof typeof ROLES];
