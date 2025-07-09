// Types pour l'interface d'administration

export interface User {
  id: number;
  username: string;
  role: 'directeur' | 'employe';
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  categoryId: number;
  available: boolean;
  imageUrl?: string;
  category?: MenuCategory;
  createdAt: string;
  updatedAt: string;
}

export interface MenuCategory {
  id: number;
  name: string;
  description?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Reservation {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  time: string;
  guests: number;
  tableId?: number;
  specialRequests?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  preorderTotal?: string;
  notificationSent: boolean;
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
  status: 'nouveau' | 'non_lu' | 'lu' | 'traite' | 'archive';
  createdAt: string;
  updatedAt?: string;
}

export interface Order {
  id: number;
  customerId?: number;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  status: 'en_attente' | 'en_preparation' | 'pret' | 'livre' | 'annule';
  totalAmount: number;
  paymentStatus: 'en_attente' | 'paye' | 'rembourse';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  orderId: number;
  menuItemId: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  specialRequests?: string;
  menuItem?: MenuItem;
}

export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  loyaltyPoints?: number;
  totalSpent?: number;
  totalOrders?: number;
  lastVisit?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  salary: string;
  hireDate: string;
  status: 'active' | 'inactive' | 'terminated';
  emergencyContact?: string;
  emergencyPhone?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface WorkShift {
  id: number;
  employeeId: number;
  date: string;
  startTime: string;
  endTime: string;
  position: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  employee?: Employee;
  createdAt: string;
  updatedAt?: string;
}

export interface ActivityLog {
  id: number;
  userId: number;
  action: string;
  entity: string;
  entityId?: number;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: User;
}

export interface Permission {
  id: number;
  userId: number;
  module: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt?: string;
  user?: User;
}

export interface Notification {
  id: string;
  type: 'reservation' | 'order' | 'message' | 'employee' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  data?: any;
}

export interface DashboardStats {
  todayReservations: number;
  monthlyRevenue: number;
  activeOrders: number;
  occupancyRate: number;
  reservationStatus: Array<{ status: string; count: number; }>;
  dailyReservations: Array<{ date: string; count: number; }>;
}

export interface Table {
  id: number;
  number: number;
  capacity: number;
  location?: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// Types pour les formulaires
export interface UserFormData {
  username: string;
  password?: string;
  role: 'directeur' | 'employe';
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface MenuItemFormData {
  name: string;
  description: string;
  price: string;
  categoryId: number;
  available: boolean;
  imageUrl?: string;
}

export interface ReservationFormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  time: string;
  guests: number;
  tableId?: number;
  specialRequests?: string;
  status: string;
}

export interface CustomerFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes?: string;
}

export interface EmployeeFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  salary: string;
  hireDate: string;
  status: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  notes?: string;
}

export interface WorkShiftFormData {
  employeeId: number;
  date: string;
  startTime: string;
  endTime: string;
  position: string;
  status: string;
  notes?: string;
}

// Types pour les statistiques
export interface RevenueStats {
  date: string;
  revenue: number;
}

export interface ReservationStats {
  date: string;
  count: number;
}

export interface OrderStats {
  status: string;
  count: number;
}

export interface CustomerAnalytics {
  customer: Customer;
  totalSpent: number;
  totalOrders: number;
}

// Types pour les permissions
export interface UserPermissions {
  [module: string]: {
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
}

// Types pour les paramètres
export interface RestaurantSettings {
  restaurantName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  openingHours: {
    [day: string]: {
      open: string;
      close: string;
      closed: boolean;
    };
  };
  maxReservationsPerSlot: number;
  reservationTimeSlots: string[];
  currency: string;
  taxRate: number;
  defaultLanguage: string;
  notificationSettings: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    reservationReminders: boolean;
    orderUpdates: boolean;
  };
}