
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
