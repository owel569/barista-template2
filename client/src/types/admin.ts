import { LucideIconComponent } from './icons';

export interface User {
  id: string;
  role: 'directeur' | 'employe' | 'admin' | 'manager' | 'staff' | 'customer' | 'employee';
  permissions?: Permission[];
  profile?: {
    address?: string;
    avatarUrl?: string;
    bio?: string;
  };
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  username?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}

export interface UserProfile {
  id: string;
  userId: string;
  avatar?: string;
  bio?: string;
  preferences: Record<string, unknown>;
  notifications: NotificationPreferences;
}

export interface UserPermissions {
  modules: ModulePermissions;
  actions: string[];
  restrictions?: Record<string, unknown>;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
  categories: {
    orders: boolean;
    reservations: boolean;
    system: boolean;
    marketing: boolean;
  };
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
  ipAddress?: string;
  userAgent?: string;
}

export interface NotificationData {
  id: number;
  type: 'reservation' | 'order' | 'message' | 'system' | 'alert';
  title: string;
  message: string;
  read: boolean;
  timestamp: Date;
  data?: Record<string, unknown>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expiresAt?: Date;
}

export interface DashboardStats {
  todayReservations: number;
  activeOrders: number;
  totalClients: number;
  monthlyRevenue: number;
  occupancyRate: number;
  averageOrderValue: number;
  customerSatisfaction: number;
  inventoryAlerts: number;
}

export interface ModulePermissions {
  [module: string]: {
    view: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    export?: boolean;
    import?: boolean;
    admin?: boolean;
  };
}

export const DEFAULT_DIRECTEUR_PERMISSIONS: ModulePermissions = {
  dashboard: { view: true, create: true, update: true, delete: true, export: true, admin: true },
  reservations: { view: true, create: true, update: true, delete: true, export: true },
  orders: { view: true, create: true, update: true, delete: true, export: true },
  customers: { view: true, create: true, update: true, delete: true, export: true },
  menu: { view: true, create: true, update: true, delete: true, export: true, import: true },
  messages: { view: true, create: true, update: true, delete: true },
  employees: { view: true, create: true, update: true, delete: true, admin: true },
  settings: { view: true, create: true, update: true, delete: true, admin: true },
  statistics: { view: true, create: true, update: true, delete: true, export: true },
  logs: { view: true, create: true, update: true, delete: true, export: true },
  permissions: { view: true, create: true, update: true, delete: true, admin: true },
  inventory: { view: true, create: true, update: true, delete: true, export: true, import: true },
  loyalty: { view: true, create: true, update: true, delete: true },
  notifications: { view: true, create: true, update: true, delete: true },
  reports: { view: true, create: true, update: true, delete: true, export: true },
  maintenance: { view: true, create: true, update: true, delete: true },
  quality: { view: true, create: true, update: true, delete: true }
};

export const DEFAULT_EMPLOYE_PERMISSIONS: ModulePermissions = {
  dashboard: { view: true, create: false, update: false, delete: false },
  reservations: { view: true, create: true, update: true, delete: false },
  orders: { view: true, create: true, update: true, delete: false },
  customers: { view: true, create: false, update: false, delete: false },
  menu: { view: true, create: false, update: false, delete: false },
  messages: { view: true, create: false, update: true, delete: false },
  employees: { view: false, create: false, update: false, delete: false },
  settings: { view: false, create: false, update: false, delete: false },
  statistics: { view: false, create: false, update: false, delete: false },
  logs: { view: false, create: false, update: false, delete: false },
  permissions: { view: false, create: false, update: false, delete: false },
  inventory: { view: true, create: false, update: true, delete: false },
  loyalty: { view: true, create: false, update: false, delete: false },
  notifications: { view: true, create: false, update: false, delete: false },
  reports: { view: false, create: false, update: false, delete: false },
  maintenance: { view: true, create: false, update: false, delete: false },
  quality: { view: true, create: false, update: false, delete: false }
};

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  categoryId: number;
  imageUrl?: string;
  available: boolean;
  allergens?: string[];
  nutritionalInfo?: NutritionalInfo;
  preparationTime?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface MenuCategory {
  id: number;
  name: string;
  description?: string;
  slug: string;
  displayOrder: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface CustomerAddress {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface CustomerPreferences {
  dietaryRestrictions: string[];
  favoriteItems: number[];
  communicationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  orderPreferences: {
    defaultDeliveryAddress?: CustomerAddress;
    preferredPaymentMethod?: string;
    specialInstructions?: string;
  };
}

export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: Date;
  address?: CustomerAddress;
  loyaltyPoints: number;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate?: Date;
  preferences: CustomerPreferences;
  createdAt: Date;
  updatedAt: Date;
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
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';
  skills: string[];
  certifications: Certification[];
  emergencyContact?: EmergencyContact;
  schedule?: WorkSchedule;
}

export interface Certification {
  name: string;
  issuedBy: string;
  issuedDate: Date;
  expiryDate?: Date;
  certificateUrl?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface WorkShift {
  id: number;
  employeeId: number;
  date: string;
  startTime: string;
  endTime: string;
  position: string;
  notes?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  breakTime?: number;
  overtime?: number;
}

export interface WorkSchedule {
  id: number;
  employeeId: number;
  weekStartDate: string;
  shifts: WorkShift[];
  totalHours: number;
  overtimeHours: number;
  status: 'draft' | 'published' | 'confirmed';
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
  skills?: string[];
  emergencyContact?: EmergencyContact;
}

export interface DashboardModule {
  id: string;
  name: string;
  icon: LucideIconComponent;
  description: string;
  path: string;
  permissions: string[];
  category: 'core' | 'analytics' | 'management' | 'tools';
  isActive: boolean;
  order: number;
}

export interface DashboardProps {
  className?: string;
  user?: AuthenticatedUser;
  children?: React.ReactNode;
}

export interface AuthenticatedUser extends User {
  token: string;
  refreshToken?: string;
  tokenExpiry: Date;
  sessionId: string;
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
  lastActivity: string;
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
  attachments?: MessageAttachment[];
  createdAt: string;
  updatedAt: string;
  repliedAt?: string;
  response?: string;
  notes?: string;
}

export interface MessageAttachment {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  url: string;
}

// Types pour l'équipement
export interface Equipment {
  id: number;
  name: string;
  type: string;
  model: string;
  brand: string;
  serialNumber: string;
  purchaseDate: string;
  purchasePrice: number;
  warrantyExpiry: string;
  status: 'operational' | 'maintenance' | 'repair' | 'retired';
  location: string;
  specifications: Record<string, unknown>;
  maintenanceHistory: MaintenanceRecord[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceRecord {
  id: number;
  date: string;
  type: 'preventive' | 'corrective' | 'emergency';
  description: string;
  cost: number;
  performedBy: string;
  nextMaintenanceDate?: string;
}

// Types pour les tâches de maintenance
export interface MaintenanceTask {
  id: number;
  title: string;
  description: string;
  equipmentId: number;
  equipment?: Equipment;
  assignedTo: string;
  assignedEmployee?: Employee;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'delayed';
  scheduledDate: string;
  completedDate?: string;
  estimatedDuration: number;
  actualDuration?: number;
  cost?: number;
  parts?: MaintenancePart[];
  photos?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenancePart {
  id: number;
  name: string;
  partNumber: string;
  quantity: number;
  unitCost: number;
  supplier?: string;
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
  status: 'excellent' | 'good' | 'average' | 'poor' | 'failed';
  criteria: QualityCriteria[];
  notes?: string;
  photos?: string[];
  correctionActions: CorrectionAction[];
  followUpDate?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QualityCriteria {
  name: string;
  weight: number;
  score: number;
  maxScore: number;
  comments?: string;
}

export interface CorrectionAction {
  action: string;
  assignedTo: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  completedDate?: string;
}

// Types pour les commandes en ligne
export interface OnlineOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerId?: number;
  customer?: Customer;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
  paymentMethod: 'card' | 'cash' | 'transfer' | 'wallet';
  orderType: 'delivery' | 'pickup' | 'dine_in';
  deliveryAddress?: DeliveryAddress;
  scheduledTime?: string;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  specialInstructions?: string;
  notes?: string;
  rating?: number;
  review?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  menuItemId: number;
  menuItem?: MenuItem;
  name: string;
  price: number;
  quantity: number;
  customizations?: OrderCustomization[];
  specialInstructions?: string;
  subtotal: number;
}

export interface OrderCustomization {
  type: string;
  name: string;
  price: number;
}

export interface DeliveryAddress {
  street: string;
  apartment?: string;
  city: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  instructions?: string;
}

// Types pour les rapports et analytics
export interface ReportConfig {
  id: string;
  name: string;
  type: 'sales' | 'inventory' | 'customer' | 'employee' | 'financial';
  dateRange: DateRange;
  filters: Record<string, unknown>;
  groupBy: string[];
  metrics: string[];
  format: 'table' | 'chart' | 'summary';
}

export interface DateRange {
  start: Date;
  end: Date;
  preset?: 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
}

export interface ReportData {
  headers: string[];
  rows: unknown[][];
  summary?: Record<string, unknown>;
  chartData?: ChartData;
}

export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  data: Array<Record<string, unknown>>;
  xAxis: string;
  yAxis: string[];
  colors?: string[];
}

// Export des types principaux pour faciliter l'importation
export type {
  User as AdminUser,
  Employee,
  Customer,
  MenuItem,
  MenuCategory,
  OnlineOrder,
  OrderItem,
  MaintenanceTask,
  Equipment,
  QualityCheck,
  ContactMessage,
  NotificationData,
  DashboardStats,
  ModulePermissions,
  ActivityLog
};