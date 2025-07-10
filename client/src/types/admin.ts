// Types centralisés pour l'administration
export interface User {
  id: number;
  username: string;
  email?: string;
  role: 'directeur' | 'employe';
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date | null;
}

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  salary: number;
  hireDate: string;
  status: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  loyaltyPoints?: number;
  totalSpent?: number;
  lastVisit?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  categoryId: number;
  available: boolean;
  imageUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MenuCategory {
  id: number;
  name: string;
  description?: string;
  sortOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Order {
  id: number;
  customerId?: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  orderDate: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
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
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WorkShift {
  id: number;
  employeeId: number;
  date: string;
  startTime: string;
  endTime: string;
  position: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ActivityLog {
  id: number;
  userId: number;
  action: string;
  description: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface Permission {
  id: number;
  userId: number;
  module: string;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NotificationData {
  pendingReservations: number;
  newMessages: number;
  pendingOrders: number;
  lowStockItems: number;
}

// Interfaces pour systèmes avancés
export interface InventoryItem {
  id: number;
  name: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unitCost: number;
  supplier: string;
  lastRestocked?: string;
  status: 'ok' | 'low' | 'critical' | 'out';
}

export interface LoyaltyCustomer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  loyaltyPoints: number;
  totalSpent: number;
  level: 'Nouveau' | 'Régulier' | 'Fidèle' | 'VIP';
  lastVisit?: string;
}

export interface LoyaltyReward {
  id: number;
  name: string;
  description: string;
  pointsCost: number;
  type: 'discount' | 'free_item' | 'special_offer';
  value: number;
  active: boolean;
}

export interface Transaction {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
  reference?: string;
}

export interface Backup {
  id: number;
  name: string;
  type: 'auto' | 'manual';
  size: string;
  createdAt: string;
  status: 'completed' | 'failed' | 'in_progress';
}

export interface Report {
  id: number;
  name: string;
  type: 'sales' | 'customers' | 'products' | 'financial';
  period: string;
  createdAt: string;
  status: 'completed' | 'generating' | 'failed';
}

export interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'event' | 'maintenance' | 'meeting' | 'other';
  employeeId?: number;
}

export interface Supplier {
  id: number;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  rating: number;
  active: boolean;
}

export interface MaintenanceTask {
  id: number;
  equipment: string;
  description: string;
  type: 'preventive' | 'corrective' | 'emergency';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: number;
  scheduledDate: string;
  completedDate?: string;
  notes?: string;
}