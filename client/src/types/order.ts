
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
