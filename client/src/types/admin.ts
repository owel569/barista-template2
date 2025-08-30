export interface User {
  id: number;
  username: string;
  role: 'directeur' | 'employe';
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  active?: boolean;
  lastLogin?: Date;
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
  action: string;
  entity: string;
  entityId?: number;
  timestamp: Date;
  details?: string;
  user?: User;
}

export interface NotificationData {
  id: number;
  type: 'reservation' | 'order' | 'message' | 'system';
  title: string;
  message: string;
  read: boolean;
  timestamp: Date;
  data?: unknown;
}

export interface DashboardStats {
  todayReservations: number;
  activeOrders: number;
  totalClients: number;
  monthlyRevenue: number;
  occupancyRate: number;
}

export interface ModulePermissions {
  [module: string]: {
    view: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
  };
}

export const DEFAULT_DIRECTEUR_PERMISSIONS: ModulePermissions = {
  dashboard: { view: true, create: true, update: true, delete: true },
  reservations: { view: true, create: true, update: true, delete: true },
  orders: { view: true, create: true, update: true, delete: true },
  customers: { view: true, create: true, update: true, delete: true },
  menu: { view: true, create: true, update: true, delete: true },
  messages: { view: true, create: true, update: true, delete: true },
  employees: { view: true, create: true, update: true, delete: true },
  settings: { view: true, create: true, update: true, delete: true },
  statistics: { view: true, create: true, update: true, delete: true },
  logs: { view: true, create: true, update: true, delete: true },
  permissions: { view: true, create: true, update: true, delete: true },
  inventory: { view: true, create: true, update: true, delete: true },
  loyalty: { view: true, create: true, update: true, delete: true },
  notifications: { view: true, create: true, update: true, delete: true }
};

export const DEFAULT_EMPLOYE_PERMISSIONS: ModulePermissions = {
  dashboard: { view: true, create: false, update: false, delete: false },
  reservations: { view: true, create: true, update: true, delete: false },
  orders: { view: true, create: false, update: true, delete: false },
  customers: { view: true, create: false, update: false, delete: false },
  menu: { view: true, create: true, update: true, delete: false },
  messages: { view: true, create: false, update: true, delete: false },
  employees: { view: false, create: false, update: false, delete: false },
  settings: { view: false, create: false, update: false, delete: false },
  statistics: { view: false, create: false, update: false, delete: false },
  logs: { view: false, create: false, update: false, delete: false },
  permissions: { view: false, create: false, update: false, delete: false },
  inventory: { view: true, create: false, update: true, delete: false },
  loyalty: { view: true, create: false, update: false, delete: false },
  notifications: { view: true, create: false, update: false, delete: false }
};
export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  categoryId: number;
  imageUrl?: string;
  available: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuCategory {
  id: number;
  name: string;
  description?: string;
  slug: string;
  displayOrder: number;
  createdAt: Date;
}

export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  loyaltyPoints: number;
  createdAt: Date;
}

export interface User {
  id: number;
  username: string;
  role: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  createdAt: Date;
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
  salary: number;
  status: 'active' | 'inactive';
}

export interface WorkShift {
  id: number;
  employeeId: number;
  date: string;
  startTime: string;
  endTime: string;
  position: string;
  notes?: string;
}

export interface EmployeeFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  hireDate: string;
  salary: number;
  status?: 'active' | 'inactive';
}
export interface DashboardProps {
  className?: string;
  user?: AuthenticatedUser;
  children?: React.ReactNode;
}

// Types avec signatures d'index pour éviter les erreurs 'any'
export interface IndexedObject {
  [key: string]: unknown;
}

export interface StringIndexedObject {
  [key: string]: string;
}

export interface NumberIndexedObject {
  [key: string]: number;
}

// Types pour l'administration
export interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

// Types pour les messages de contact
export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  repliedAt?: string;
  notes?: string;
}

// Types pour les équipements
export interface Equipment {
  id: number;
  name: string;
  type: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  warrantyExpiry: string;
  status: 'operational' | 'maintenance' | 'repair' | 'retired';
  location: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Types pour les tâches de maintenance
export interface MaintenanceTask {
  id: number;
  title: string;
  description: string;
  equipmentId: number;
  assignedTo: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  scheduledDate: string;
  completedDate?: string;
  estimatedDuration: number;
  actualDuration?: number;
  cost?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Types pour le contrôle qualité
export interface QualityCheck {
  id: number;
  date: string;
  category: string;
  item: string;
  inspector: string;
  score: number;
  maxScore: number;
  status: 'excellent' | 'good' | 'average' | 'poor';
  notes?: string;
  photos?: string[];
  correctionActions: string[];
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

// Types pour les commandes en ligne
export interface OnlineOrder {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'card' | 'cash' | 'transfer';
  orderType: 'delivery' | 'pickup';
  deliveryAddress?: string;
  scheduledTime?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  customizations?: string[];
  notes?: string;
}