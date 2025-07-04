// Types for admin interfaces

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  phone?: string;
  hireDate: string;
  salary: number;
  status: 'active' | 'inactive' | 'suspended';
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkShift {
  id: number;
  employeeId: number;
  date: string;
  startTime: string;
  endTime: string;
  position: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'responded';
  createdAt: string;
  updatedAt?: string;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number | string;
  categoryId: number;
  imageUrl?: string;
  available: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MenuCategory {
  id: number;
  name: string;
  description?: string;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  totalSpent?: number;
  totalOrders?: number;
  lastOrderDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Order {
  id: number;
  customerId?: number;
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  items?: OrderItem[];
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  menuItemId: number;
  quantity: number;
  price: number;
  menuItemName?: string;
  createdAt?: string;
}

export interface Reservation {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  date: string;
  time: string;
  partySize: number;
  tableId?: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  notificationSent?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Table {
  id: number;
  number: number;
  capacity: number;
  location?: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: number;
  username: string;
  role: 'directeur' | 'employe';
  firstName?: string;
  lastName?: string;
  email?: string;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ActivityLog {
  id: number;
  userId: number;
  username: string;
  action: string;
  target: string;
  details: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

export interface Notification {
  id: string;
  type: 'reservation' | 'order' | 'message' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  data?: any;
}

export interface Settings {
  restaurantName: string;
  address: string;
  phone: string;
  email: string;
  openingHours: {
    [key: string]: {
      open: string;
      close: string;
      closed: boolean;
    };
  };
  capacity: number;
  averageServiceTime: number;
  reservationAdvanceTime: number;
  enableOnlineOrdering: boolean;
  enableReservations: boolean;
  taxRate: number;
  currency: string;
  timezone: string;
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    newReservationAlert: boolean;
    newOrderAlert: boolean;
    newMessageAlert: boolean;
  };
}

export interface Statistics {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  avgOrderValue: number;
  revenueData: Array<{
    month: string;
    revenue: number;
    orders: number;
    customers: number;
  }>;
  productData: Array<{
    name: string;
    sales: number;
    revenue: number;
    growth: number;
  }>;
  timeData: Array<{
    hour: string;
    commandes: number;
    revenus: number;
  }>;
  categoryData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}