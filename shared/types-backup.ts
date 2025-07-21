
// Types centralisés pour l'application restaurant
export interface MenuItemData {
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

export interface CategoryData {
  id: number;
  name: string;
  description?: string;
  slug: string;
  displayOrder: number;
  createdAt: Date;
}

export interface ReservationData {
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

export interface CustomerData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  loyaltyPoints: number;
  createdAt: Date;
}

export interface OrderData {
  id: number;
  customerId?: number;
  items: OrderItemData[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  orderType: 'dine_in' | 'takeaway' | 'delivery';
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItemData {
  id: number;
  orderId: number;
  menuItemId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface EmployeeData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

// Types pour l'inventaire professionnel
export interface InventoryAlert {
  type: 'critical' | 'warning' | 'info';
  message: string;
  severity: 'high' | 'medium' | 'low';
  item: string;
  priority: 'high' | 'medium' | 'low';
}

export interface InventoryStatistics {
  totalItems: number;
  lowStock: number;
  outOfStock: number;
  totalValue: number;
}

export interface InventoryItem {
  id: number;
  name: string;
  supplier: string;
  status: 'critical' | 'warning' | 'normal';
  currentStock: number;
  unit: string;
  category: string;
}

export interface InventoryCategory {
  name: string;
  items: InventoryItem[];
}

export interface InventoryMovement {
  id: number;
  type: 'in' | 'out' | 'adjustment';
  item: string;
  quantity: number;
  date: string;
  reason: string;
}

export interface InventorySupplier {
  id: number;
  name: string;
  contact: string;
  email: string;
  phone: string;
  products: string[];
}

export interface InventoryData {
  alerts: InventoryAlert[];
  statistics: InventoryStatistics;
  categories: InventoryCategory[];
  items: InventoryItem[];
  automaticOrders: Array<Record<string, unknown>>;
  movements: InventoryMovement[];
  suppliers: InventorySupplier[];
}

// Types pour l'analytics avancé
export interface CustomerAnalysis {
  id: number;
  firstName: string;
  lastName: string;
  lastVisit?: string;
  loyaltyPoints: number;
  totalSpent?: number;
}

export interface CustomerSegments {
  nouveaux: number;
  reguliers: number;
  vip: number;
}

export interface VisitPatterns {
  matin: number;
  apresmidi: number;
  soir: number;
}

export interface ChurnPrediction {
  id: number;
  name: string;
  churnRisk: 'high' | 'medium' | 'low';
  lastVisit?: string;
  loyaltyPoints: number;
}

export interface ExtendedEmployeeData extends EmployeeData {
  position: string;
  department: string;
  hireDate: string;
  salary: number;
  status: 'active' | 'inactive';
  permissions: PermissionData[];
}

export interface PermissionData {
  id: number;
  userId: number;
  module: string;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export interface TableData {
  id: number;
  number: number;
  capacity: number;
  location: string;
  available: boolean;
  createdAt: string;
}

export interface InventoryItemData {
  id: number;
  name: string;
  category: string;
  currentStock: number;
  minimumStock: number;
  unit: string;
  unitPrice: number;
  supplier?: string;
  lastRestocked?: Date;
}

export interface AnalyticsData {
  date: string;
  revenue: number;
  orders: number;
  customers: number;
  averageOrderValue: number;
  popularItems: Array<{
    itemId: number;
    itemName: string;
    quantitySold: number;
  }>;
}

// Types pour les événements WebSocket
export interface WebSocketEventData {
  type: 'order_update' | 'reservation_update' | 'inventory_alert' | 'system_notification';
  payload: OrderData | ReservationData | InventoryItemData | SystemNotification;
  timestamp: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  userId?: number;
  createdAt: Date;
}

// Types pour les formulaires
export interface ReservationFormData {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  date: string;
  time: string;
  partySize: number;
  specialRequests?: string;
}

export interface MenuItemFormData {
  name: string;
  description: string;
  price: number;
  categoryId: number;
  imageUrl?: string;
  available: boolean;
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
}

// Types pour les réponses API
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Interfaces manquantes ajoutées automatiquement
export interface ChartConfiguration {
  type: 'bar' | 'line' | 'pie' | 'doughnut';
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
}

export interface ChartOptions {
  responsive?: boolean;
  plugins?: {
    legend?: {
      position?: 'top' | 'bottom' | 'left' | 'right';
    };
    title?: {
      display?: boolean;
      text?: string;
    };
  };
  scales?: Record<string, unknown>;
}

export interface RealTimeMetrics {
  activeUsers: number;
  pendingOrders: number;
  revenue: number;
  capacity: number;
  lastUpdated: string;
}

export interface DatabaseStats {
  totalRecords: number;
  activeConnections: number;
  queryTime: number;
  cacheHitRate: number;
}
