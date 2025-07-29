import { ORDER_STATUSES } from '../constants/online-order';

export interface OnlineOrder {
  id: number;
  orderNumber: string;
  platform: string;
  status: typeof ORDER_STATUSES[number];
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  orderType: 'delivery' | 'pickup';
  deliveryAddress?: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  notes?: string;
  estimatedTime?: string;
  createdAt?: string;
  updatedAt?: string;
  items?: OrderItem[];
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  options?: string[];
  specialInstructions?: string;
} 