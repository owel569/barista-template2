// Types de base pour l'authentification
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: string[];
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'admin' | 'manager' | 'staff' | 'customer';

// Alias pour la compatibilité
export type UserRoleExtended = UserRole | 'employee' | 'directeur' | 'employe';


// Types pour les produits du menu
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  category?: MenuCategory;
  imageUrl?: string;
  isAvailable: boolean;
  preparationTime: number;
  allergens: string[];
  nutritionalInfo: NutritionalInfo;
  createdAt: string;
  updatedAt: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

// Types pour les commandes
export interface Order {
  id: string;
  customerId: string;
  customer?: Customer;
  tableId?: string;
  table?: Table;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  notes?: string;
  estimatedReadyTime?: string;
  actualReadyTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItem?: MenuItem;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  modifications?: string[];
  notes?: string;
}

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'preparing' 
  | 'ready' 
  | 'served' 
  | 'cancelled';

export type PaymentStatus = 
  | 'pending' 
  | 'paid' 
  | 'failed' 
  | 'refunded';

export type PaymentMethod = 
  | 'cash' 
  | 'card' 
  | 'mobile' 
  | 'online';

// Types pour les clients
export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  loyaltyPoints: number;
  totalOrders: number;
  totalSpent: number;
  preferredContactMethod: 'email' | 'phone' | 'sms';
  allergies?: string[];
  dietaryRestrictions?: string[];
  createdAt: string;
  updatedAt: string;
}

// Types pour les employés
export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: EmployeeRole;
  department: string;
  hireDate: string;
  salary: number;
  isActive: boolean;
  skills: string[];
  certifications: string[];
  emergencyContact: EmergencyContact;
  createdAt: string;
  updatedAt: string;
}

export type EmployeeRole = 
  | 'manager' 
  | 'chef' 
  | 'barista' 
  | 'server' 
  | 'cashier' 
  | 'cleaner';

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

// Types pour les réservations
export interface Reservation {
  id: string;
  customerId: string;
  customer?: Customer;
  tableId: string;
  table?: Table;
  date: string;
  time: string;
  partySize: number;
  status: ReservationStatus;
  notes?: string;
  specialRequests?: string[];
  confirmationCode: string;
  createdAt: string;
  updatedAt: string;
}

export type ReservationStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'seated' 
  | 'completed' 
  | 'cancelled' 
  | 'no_show';

// Types pour les tables
export interface Table {
  id: string;
  number: number;
  capacity: number;
  location: string;
  status: TableStatus;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type TableStatus = 
  | 'available' 
  | 'occupied' 
  | 'reserved' 
  | 'maintenance';

export interface TableStatusInfo {
  id: number;
  number: number;
  capacity: number;
  location: string | null;
  section: string | null;
  status: TableStatus;
  currentReservation?: {
    id: number;
    customerName: string;
    startTime: Date;
    endTime: Date;
    partySize: number;
  };
  nextReservation?: {
    id: number;
    customerName: string;
    startTime: Date;
    endTime: Date;
    partySize: number;
  };
}

// Types pour l'inventaire
export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  unitCost: number;
  supplierId?: string;
  supplier?: Supplier;
  expirationDate?: string;
  batchNumber?: string;
  location: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: Address;
  paymentTerms: string;
  isActive: boolean;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

// Types pour les horaires de travail
export interface WorkShift {
  id: string;
  employeeId: string;
  employee?: Employee;
  date: string;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  position: string;
  status: ShiftStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ShiftStatus = 
  | 'scheduled' 
  | 'started' 
  | 'on_break' 
  | 'completed' 
  | 'missed';

// Types pour les analytics
export interface AnalyticsData {
  date: string;
  revenue: number;
  orders: number;
  customers: number;
  averageOrderValue: number;
  topProducts: ProductSales[];
  hourlyBreakdown: HourlyData[];
}

export interface ProductSales {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
  category: string;
}

export interface HourlyData {
  hour: number;
  orders: number;
  revenue: number;
  customers: number;
}

// Types pour les permissions
export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  isActive: boolean;
}

export interface RolePermission {
  roleId: string;
  permissionId: string;
  grantedAt: string;
  grantedBy: string;
}

// Types pour les événements et promotions
export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  eventType: EventType;
  isActive: boolean;
  maxParticipants?: number;
  currentParticipants: number;
  price?: number;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type EventType = 
  | 'workshop' 
  | 'tasting' 
  | 'live_music' 
  | 'special_menu' 
  | 'private_party';

export interface Promotion {
  id: string;
  name: string;
  description: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  minimumOrderAmount?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageLimit?: number;
  currentUsage: number;
  applicableItems?: string[];
  createdAt: string;
  updatedAt: string;
}

// Types pour les retours et commentaires
export interface Feedback {
  id: string;
  customerId: string;
  customer?: Customer;
  orderId?: string;
  order?: Order;
  rating: number;
  comment?: string;
  category: FeedbackCategory;
  status: FeedbackStatus;
  response?: string;
  respondedBy?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type FeedbackCategory = 
  | 'food_quality' 
  | 'service' 
  | 'ambiance' 
  | 'pricing' 
  | 'cleanliness' 
  | 'other';

export type FeedbackStatus = 
  | 'pending' 
  | 'reviewed' 
  | 'resolved' 
  | 'escalated';

// Types pour les logs d'activité
export interface ActivityLog {
  id: string;
  userId: string;
  user?: User;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

// Types pour les notifications
export interface Notification {
  id: string;
  userId: string;
  user?: User;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  isRead: boolean;
  actionUrl?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType = 
  | 'order' 
  | 'reservation' 
  | 'inventory' 
  | 'staff' 
  | 'system' 
  | 'promotion';

export type NotificationPriority = 
  | 'low' 
  | 'medium' 
  | 'high' 
  | 'urgent';

// Types utilitaires
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Types pour les statistiques
export interface DashboardStats {
  todayRevenue: number;
  todayOrders: number;
  todayCustomers: number;
  activeReservations: number;
  occupiedTables: number;
  pendingOrders: number;
  lowStockItems: number;
  staffOnDuty: number;
}

export interface RevenueStats {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
  growth: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
}

// Types pour Chart.js
export interface ChartConfiguration {
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'area';
  data: ChartData;
  options?: ChartOptions;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
}

export interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  plugins?: {
    legend?: {
      display?: boolean;
      position?: 'top' | 'bottom' | 'left' | 'right';
    };
    title?: {
      display?: boolean;
      text?: string;
    };
    tooltip?: {
      enabled?: boolean;
      mode?: string;
    };
  };
  scales?: Record<string, unknown>;
  elements?: Record<string, unknown>;
}

// Interfaces pour la gestion d'inventaire optimisée
export interface InventoryData {
  alerts: InventoryAlert[];
  statistics: InventoryStatistics;
  categories: InventoryCategory[];
  items: InventoryItem[];
  automaticOrders: AutomaticOrder[];
  movements: InventoryMovement[];
  suppliers: InventorySupplier[];
  predictions?: InventoryPrediction[];
}

export interface InventoryAlert {
  id: string;
  itemId: string;
  itemName: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  type: 'stock_low' | 'expiring' | 'out_of_stock';
  createdAt: string;
}

export interface InventoryStatistics {
  totalValue: number;
  lowStockItems: number;
  pendingOrders: number;
  monthlyConsumption: number;
  totalItems: number;
}

export interface InventoryCategory {
  id: string;
  name: string;
  items: InventoryItem[];
}

export interface InventoryItem {
  id: string;
  name: string;
  supplierName: string;
  status: 'critical' | 'warning' | 'normal';
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  daysRemaining?: number;
  cost: number;
  categoryId: string;
}

export interface InventoryMovement {
  id: string;
  item: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  unit: string;
  reason: string;
  user: string;
  date: string;
}

export interface InventorySupplier {
  id: string;
  name: string;
  categories: string[];
  deliveryTime: string;
  minimumOrder: number;
  reliability: number;
  rating: number;
  lastOrder: string;
}

export interface InventoryPrediction {
  name: string;
  currentStock: number;
  predictions: {
    '7d': { remaining: number };
    '14d': { remaining: number };
    '30d': { remaining: number };
  };
  recommendations: {
    urgency: 'high' | 'medium' | 'low';
    reorderDate: string;
    reorderQuantity: number;
    estimatedCost: number;
  };
}

export interface AutomaticOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  items: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    unitCost: number;
  }>;
  totalCost: number;
  status: 'pending' | 'approved' | 'ordered' | 'delivered';
  createdAt: string;
  estimatedDelivery: string;
}