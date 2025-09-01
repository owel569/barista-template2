
export interface OnlineOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  platform: 'website' | 'mobile_app' | 'phone';
  orderType: 'pickup' | 'delivery' | 'dine_in';
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  items: OrderItem[];
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'card' | 'paypal' | 'cash' | 'mobile';
  notes?: string;
  internalNote?: string;
  estimatedTime?: number;
  driverId?: number;
  driver?: Driver;
  stockChecked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  menuItemId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  customizations?: string[];
  notes?: string;
}

export interface CartItem {
  id: number;
  menuItem: MenuItem;
  quantity: number;
  customizations: Record<string, string>;
  notes: string; // Obligatoire pour éviter les erreurs
}

export interface MenuItem {
  id: number;
  name: string;
  price: number;
  description?: string;
  category?: string;
  categoryId?: number;
  imageUrl?: string;
  isAvailable?: boolean;
  isVegetarian?: boolean;
  isGlutenFree?: boolean;
  stock?: number;
}

export interface Driver {
  id: number;
  name: string;
  phone: string;
  available: boolean;
}

export interface Notification {
  id: number;
  type: 'new_order' | 'status_change' | 'stock_alert';
  message: string;
  orderId: number;
  read: boolean;
  createdAt: string;
}

export interface OrderSettings {
  onlineOrderingEnabled: boolean;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  onlinePaymentEnabled: boolean;
  minPrepTime: number;
  minDeliveryTime: number;
  deliveryFee: number;
  minDeliveryAmount: number;
}

export interface PlatformStats {
  website: { orders: number; revenue: number };
  mobile_app: { orders: number; revenue: number };
  phone: { orders: number; revenue: number };
}

// Types pour les réponses API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface OrderListResponse extends ApiResponse<OnlineOrder[]> {
  pagination?: PaginationInfo;
}

// Types pour les filtres
export interface OrderFilters {
  status?: OnlineOrder['status'] | 'all';
  platform?: OnlineOrder['platform'] | 'all';
  orderType?: OnlineOrder['orderType'];
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

// Export par défaut
export type { OnlineOrder as Order };
