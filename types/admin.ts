export interface User {
  id: number;
  username: string;
  role: 'directeur' | 'employe';
  createdAt: string;
  lastLogin?: string;
}

export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  preferredContactMethod: 'email' | 'phone' | 'sms';
  notes?: string;
  totalSpent?: number | string;
  totalOrders?: number;
  lastVisit?: string;
  createdAt: string;
}

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  hireDate: string;
  salary: number | string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number | string;
  categoryId: number;
  available: boolean;
  imageUrl?: string;
  createdAt: string;
}

export interface MenuCategory {
  id: number;
  name: string;
  description?: string;
  sortOrder: number;
  createdAt: string;
}

export interface Order {
  id: number;
  customerId?: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  totalAmount: number | string;
  status: 'en_attente' | 'en_preparation' | 'pret' | 'livre' | 'annule';
  notes?: string;
  createdAt: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  menuItemId: number;
  quantity: number;
  price: number | string;
  notes?: string;
}

export interface Reservation {
  id: number;
  customerId?: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  date: string;
  time: string;
  partySize: number;
  tableId?: number;
  status: 'confirme' | 'en_attente' | 'annule';
  specialRequests?: string;
  createdAt: string;
}

export interface ContactMessage {
  id: number;
  name?: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'nouveau' | 'non_lu' | 'lu' | 'traite' | 'archive';
  response?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: number;
  userId: number;
  action: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface Table {
  id: number;
  number: number;
  capacity: number;
  location: string;
  available: boolean;
  createdAt: string;
}

export interface WorkShift {
  id: number;
  employeeId: number;
  date: string;
  startTime: string;
  endTime: string;
  position: string;
  notes?: string;
  createdAt: string;
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
}