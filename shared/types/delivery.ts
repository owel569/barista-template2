// Types partagés pour le système de livraison
export interface DeliveryItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Delivery {
  id: number;
  orderNumber: string;
  orderId: number;
  customerName: string;
  customerPhone: string;
  address: string;
  items: DeliveryItem[];
  total: number;
  status: DeliveryStatus;
  progress: number;
  estimatedTime: string;
  driver: string | null;
  driverId: number | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  id: number;
  name: string;
  phone: string;
  vehicleType: string;
  isAvailable: boolean;
  currentDeliveries: number;
  location: { lat: number; lng: number };
}

// Constantes typées pour les statuts
export const DELIVERY_STATUSES = [
  'pending', 'preparing', 'ready',
  'dispatched', 'in_transit', 'delivered', 'cancelled'
] as const;

export type DeliveryStatus = typeof DELIVERY_STATUSES[number];

// Types pour les réponses API
export interface DeliveryResponse {
  success: boolean;
  data: Delivery;
  message?: string;
}

export interface DeliveriesResponse {
  success: boolean;
  data: Delivery[];
  metadata: { count: number };
}

export interface DriversResponse {
  success: boolean;
  data: Driver[];
  metadata: { count: number };
}

export interface DeliveryStats {
  totalDeliveries: number;
  pendingDeliveries: number;
  activeDeliveries: number;
  completedDeliveries: number;
  cancelledDeliveries: number;
  availableDrivers: number;
  totalDrivers: number;
}

export interface DeliveryStatsResponse {
  success: boolean;
  data: DeliveryStats;
}