// Types pour le système d'administration
export interface Notification {
  id: string;
  type: 'reservation' | 'order' | 'message' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  data?: any;
}

export interface User {
  id: number;
  username: string;
  role: 'directeur' | 'employe';
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Permission {
  id: number;
  userId: number;
  module: string;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export interface ActivityLog {
  id: number;
  userId: number;
  username: string;
  action: string;
  entity: string;
  entityId?: number;
  details: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface Reservation {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  date: string;
  time: string;
  guests: number;
  tableId?: number;
  specialRequests?: string;
  status: string;
  notificationSent?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Order {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  tableId?: number;
  status: string;
  totalAmount: number;
  orderType: string;
  specialRequests?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ContactMessage {
  id: number;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  subject: string;
  message: string;
  phone?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  preferredContactMethod?: string;
  notes?: string;
  totalOrders: number;
  totalSpent: number | string;
  lastVisit?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  department: string;
  salary?: number;
  hireDate: string;
  status: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: string;
  categoryId: number;
  available: boolean;
  image?: string;
  allergens?: string;
  nutritionalInfo?: string;
  preparationTime?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Settings {
  restaurantName: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  openingHours: {
    [key: string]: { open: string; close: string; closed: boolean };
  };
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  theme: {
    primaryColor: string;
    secondaryColor: string;
    darkMode: boolean;
  };
}

export interface DashboardStats {
  todayReservations: number;
  monthlyRevenue: number;
  activeOrders: number;
  occupancyRate: number;
  reservationStatus: Array<{ status: string; count: number; }>;
  dailyReservations: Array<{ date: string; count: number; }>;
}

export interface ModulePermissions {
  [module: string]: {
    canView: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  };
}

export interface UserWithPermissions extends User {
  permissions: ModulePermissions;
}