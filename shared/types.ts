
// Types fondamentaux pour l'application Barista Café
export type AppRole = 'directeur' | 'gerant' | 'employe' | 'customer';

export interface User {
  id: number;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  dateOfBirth?: Date;
  role: AppRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCredentials {
  email: string;
  password: string;
}

export interface UserRegistration extends UserCredentials {
  username: string;
  firstName?: string;
  lastName?: string;
  role?: AppRole;
}

export interface AuthUser {
  id: number;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: AppRole;
  isActive: boolean;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  token?: string;
  message?: string;
}

// Types pour les permissions
export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
  action: string;
  roles: AppRole[];
}

export interface RolePermissions {
  directeur: string[];
  gerant: string[];
  employe: string[];
  customer: string[];
}

// Types pour les menus
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  isAvailable: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  allergens?: string[];
  preparationTime?: number;
  calories?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
}

// Types pour les commandes
export interface Order {
  id: string;
  customerId: number;
  tableId?: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  paymentMethod?: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes?: string;
  customerInfo?: CustomerInfo;
  deliveryAddress?: string;
  estimatedDeliveryTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  customizations?: string;
  notes?: string;
}

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'preparing' 
  | 'ready' 
  | 'served' 
  | 'delivered' 
  | 'cancelled';

export type PaymentMethod = 'cash' | 'card' | 'mobile' | 'online';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface CustomerInfo {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  age?: number;
  gender?: string;
}

// Types pour les réservations
export interface Reservation {
  id: string;
  customerId: number;
  tableId: string;
  date: Date;
  time: string;
  partySize: number;
  status: ReservationStatus;
  specialRequests?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ReservationStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'seated' 
  | 'completed' 
  | 'cancelled' 
  | 'no-show';

// Types pour les tables
export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  location?: string;
  isActive: boolean;
  qrCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';

// Types pour les statistiques
export interface Statistics {
  period: {
    start: Date;
    end: Date;
    type: 'day' | 'week' | 'month' | 'year' | 'custom';
  };
  revenue: {
    total: number;
    average: number;
    growth: number;
    byCategory: Record<string, number>;
    byDay: Array<{ date: string; amount: number }>;
  };
  orders: {
    total: number;
    completed: number;
    cancelled: number;
    averageValue: number;
    byStatus: Record<OrderStatus, number>;
  };
  customers: {
    total: number;
    new: number;
    returning: number;
    retention: number;
  };
  products: {
    topSelling: Array<{
      id: string;
      name: string;
      quantity: number;
      revenue: number;
    }>;
    lowStock: Array<{
      id: string;
      name: string;
      stock: number;
    }>;
  };
}

// Types pour l'inventaire
export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  costPerUnit: number;
  supplierId?: string;
  expirationDate?: Date;
  location?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Types pour les employés et horaires
export interface Employee {
  id: string;
  userId: number;
  position: string;
  department: string;
  hireDate: Date;
  salary?: number;
  isActive: boolean;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkSchedule {
  id: string;
  employeeId: string;
  date: Date;
  startTime: string;
  endTime: string;
  breakTime?: number;
  position: string;
  status: ScheduleStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ScheduleStatus = 'scheduled' | 'confirmed' | 'completed' | 'absent' | 'cancelled';

// Types pour les validations API
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

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Types utilitaires
export type WithId<T> = T & { id: string };
export type WithTimestamps<T> = T & {
  createdAt: Date;
  updatedAt: Date;
};
export type CreateInput<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateInput<T> = Partial<CreateInput<T>>;

// Types pour les filtres et recherche
export interface FilterOptions {
  search?: string;
  category?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

// Types pour les événements WebSocket
export interface WebSocketEvent {
  type: string;
  data: unknown;
  timestamp: Date;
  userId?: number;
}

// Types pour les notifications
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  userId?: number;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  expiresAt?: Date;
}

// Constantes pour les rôles et permissions
export const ROLES: Record<AppRole, string> = {
  directeur: 'Directeur',
  gerant: 'Gérant',
  employe: 'Employé',
  customer: 'Client'
} as const;

export const ROLE_HIERARCHY: Record<AppRole, number> = {
  directeur: 4,
  gerant: 3,
  employe: 2,
  customer: 1
} as const;

export const DEFAULT_PERMISSIONS: RolePermissions = {
  directeur: ['*'], // Accès complet
  gerant: [
    'dashboard:read',
    'orders:*',
    'reservations:*',
    'menu:*',
    'inventory:read',
    'employees:read',
    'statistics:read'
  ],
  employe: [
    'dashboard:read',
    'orders:read',
    'orders:update',
    'reservations:read',
    'reservations:update',
    'menu:read'
  ],
  customer: [
    'menu:read',
    'orders:create',
    'reservations:create',
    'profile:read',
    'profile:update'
  ]
} as const;
