// Types améliorés pour l'administration

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'staff' | 'customer' | 'directeur' | 'serveur' | 'barista' | 'cuisinier' | 'gerant' | 'caissier';
  permissions: string[];
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: number;
  userId: number;
  action: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
}

export interface SalesPrediction {
  date: string;
  predictedRevenue: number;
  confidence: number;
  factors: string[];
}

export interface AIInsight {
  id: string;
  type: "prediction" | "optimization" | "alert" | "recommendation";
  title: string;
  description: string;
  confidence: number;
  impact: "high" | "medium" | "low";
  category: string;
  timestamp: string;
  actionable: boolean;
  recommendations?: string[];
}

export interface AnalyticsData {
  revenue: number;
  orders: number;
  customers: number;
  averageOrderValue: number;
  growthRate: number;
  topProducts: Array<{
    name: string;
    sales: number;
    quantity: number;
  }>;
  recentTrends: Array<{
    date: string;
    value: number;
    metric: string;
  }>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  imageUrl?: string;
}

export interface Table {
  id: number;
  number: number;
  capacity: number;
  status: "available" | "occupied" | "reserved" | "maintenance";
  location?: string;
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
  partySize: number;
  tableId: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface Notification {
  id: number;
  type: "info" | "warning" | "error" | "success";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Report {
  id: string;
  name: string;
  type: "revenue" | "orders" | "customers" | "inventory" | "custom";
  format: "pdf" | "excel" | "csv";
  schedule?: string;
  recipients: string[];
  lastGenerated?: string;
  nextGeneration?: string;
  enabled: boolean;
}

export interface Permission {
  id: number;
  userId: number;
  module: string;
  permissions: string[];
  grantedAt: string;
  grantedBy: number;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  todayRevenue: number;
  todayOrders: number;
  pendingReservations: number;
  activeTables: number;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }>;
}

export interface FormField {
  name: string;
  label: string;
  type: "text" | "email" | "password" | "number" | "select" | "textarea" | "date" | "time";
  required: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  options?: Array<{
    value: string;
    label: string;
  }>;
}

// Types pour les filtres
export interface FilterOption {
  field: string;
  operator: "equals" | "contains" | "greater" | "less" | "between" | "in";
  value: string | number | string[] | number[];
}

export interface SortOption {
  field: string;
  direction: "asc" | "desc";
}

// Types pour la pagination
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Types pour les requêtes API
export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  filters?: FilterOption[];
  sort?: SortOption[];
}

// Types pour les erreurs
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

// Types pour les événements
export interface EventHandler<T = unknown> {
  (event: T): void;
}

// Types pour les callbacks
export interface Callback<T = unknown> {
  (data: T): void;
}

// Types pour les états de chargement
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  data: unknown | null;
}

// Types pour les validations
export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
}

// Types pour les configurations
export interface AppConfig {
  apiUrl: string;
  environment: "development" | "staging" | "production";
  features: Record<string, boolean>;
  limits: Record<string, number>;
}