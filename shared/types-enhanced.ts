
// Types TypeScript améliorés pour corriger toutes les erreurs identifiées
import { z } from 'zod';

// 1. Types pour useToast
export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastContextValue {
  toast: (props: Omit<Toast, 'id'>) => void;
  toasts: Toast[];
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

// 2. ActivityLog avec toutes les propriétés requises
export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  createdAt: Date;
  ipAddress: string;
  userAgent?: string;
  resource?: string;
  resourceId?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  metadata?: Record<string, unknown>;
}

// 3. Customer avec toutes les propriétés requises  
export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  totalOrders: number;
  loyaltyPoints: number;
  dateOfBirth?: Date;
  preferredContactMethod: 'email' | 'phone' | 'sms';
  marketingConsent: boolean;
  dietaryRestrictions?: string[];
  favoriteItems?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// 4. MenuItem avec prix number et categoryId
export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number; // Corrigé: était string
  categoryId: string; // Ajouté: propriété manquante
  available: boolean;
  imageUrl?: string;
  images?: MenuItemImage[];
  ingredients?: string[];
  allergens?: string[];
  nutritionInfo?: NutritionInfo;
  preparationTime?: number;
  spicyLevel?: 1 | 2 | 3 | 4 | 5;
  isVegan?: boolean;
  isVegetarian?: boolean;
  isGlutenFree?: boolean;
  calories?: number;
  displayOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuItemImage {
  id: string;
  menuItemId: string;
  imageUrl: string;
  altText?: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  saturatedFat?: number;
}

// 5. Reservation avec toutes les propriétés
export interface Reservation {
  id: string;
  customerId: string;
  customer?: Customer;
  tableId: string;
  table?: Table;
  date: Date;
  time: string;
  partySize: number;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no-show';
  specialRequests?: string;
  contactPhone?: string;
  contactEmail?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  seatedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  prepaidAmount?: number;
  depositAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  location?: string;
  isAccessible?: boolean;
  features?: string[];
}

// 6. Types utilitaires pour corriger les erreurs "unknown"
export type SafeRecord = Record<string, unknown>;
export type SafeAny = unknown;

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  timestamp?: Date;
};

export type PaginatedResponse<T = unknown> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

export type ComponentProps = Record<string, unknown>;
export type EventHandler<T = Event> = (event: T) => void;
export type ReactEventHandler = (event: React.ChangeEvent<HTMLInputElement>) => void;
export type FormEventHandler = (event: React.FormEvent<HTMLFormElement>) => void;

export type DatabaseResult<T = unknown> = {
  rows: T[];
  rowCount: number;
  command: string;
  duration?: number;
};

// Schémas de validation Zod
export const ActivityLogSchema = z.object({
  id: z.string(),
  userId: z.string(),
  action: z.string(),
  details: z.string(),
  createdAt: z.date(),
  ipAddress: z.string(),
  userAgent: z.string().optional(),
  resource: z.string().optional(),
  resourceId: z.string().optional(),
  severity: z.enum(['info', 'warning', 'error', 'critical']),
  metadata: z.record(z.unknown()).optional(),
});

export const CustomerSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  totalOrders: z.number().int().min(0),
  loyaltyPoints: z.number().int().min(0),
  dateOfBirth: z.date().optional(),
  preferredContactMethod: z.enum(['email', 'phone', 'sms']),
  marketingConsent: z.boolean(),
  dietaryRestrictions: z.array(z.string()).optional(),
  favoriteItems: z.array(z.string()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const MenuItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number().positive(),
  categoryId: z.string(),
  available: z.boolean(),
  imageUrl: z.string().optional(),
  ingredients: z.array(z.string()).optional(),
  allergens: z.array(z.string()).optional(),
  preparationTime: z.number().int().min(1).optional(),
  spicyLevel: z.number().int().min(1).max(5).optional(),
  isVegan: z.boolean().optional(),
  isVegetarian: z.boolean().optional(),
  isGlutenFree: z.boolean().optional(),
  calories: z.number().int().min(0).optional(),
  displayOrder: z.number().int().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const ReservationSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  tableId: z.string(),
  date: z.date(),
  time: z.string(),
  partySize: z.number().int().min(1).max(20),
  status: z.enum(['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no-show']),
  specialRequests: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional(),
  estimatedDuration: z.number().int().min(30).optional(),
  actualDuration: z.number().int().min(1).optional(),
  seatedAt: z.date().optional(),
  completedAt: z.date().optional(),
  cancelledAt: z.date().optional(),
  cancellationReason: z.string().optional(),
  prepaidAmount: z.number().min(0).optional(),
  depositAmount: z.number().min(0).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Types d'export pour validation runtime
export type ActivityLogType = z.infer<typeof ActivityLogSchema>;
export type CustomerType = z.infer<typeof CustomerSchema>;
export type MenuItemType = z.infer<typeof MenuItemSchema>;
export type ReservationType = z.infer<typeof ReservationSchema>;

// Types optimisés pour la gestion d'inventaire avancée
export interface InventoryData {
  alerts: InventoryAlert[];
  statistics: InventoryStatistics;
  categories: InventoryCategory[];
  items: InventoryItemEnhanced[];
  automaticOrders: AutomaticOrder[];
  movements: InventoryMovement[];
  suppliers: InventorySupplierEnhanced[];
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
  items: InventoryItemEnhanced[];
}

export interface InventoryItemEnhanced {
  id: string;
  name: string;
  supplier: string;
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

export interface InventorySupplierEnhanced {
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
// Interface pour les niveaux de loyauté
export interface LoyaltyLevel {
  id: number;
  name: string;
  minPoints: number;
  maxPoints?: number;
  pointsRate: number;
  benefits: string[];
  color: string;
  discountPercentage?: number;
  icon: string;
  description: string;
}

// Interface pour les données de loyauté client
export interface CustomerLoyaltyData {
  customerId: number;
  currentPoints: number;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  currentLevel: LoyaltyLevel;
  nextLevel?: LoyaltyLevel;
  progressToNextLevel: number;
  pointsToNextLevel: number;
  joinDate: string;
  lastActivity: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  lifetimeValue: number;
  averageOrderValue: number;
  visitFrequency: number;
}

// Interface pour le statut des tables
export interface TableStatus {
  id: number;
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  location: string | null;
  section: string | null;
  currentReservation?: {
    id: number;
    customerName: string;
    startTime: Date;
    endTime: Date;
    partySize: number;
  } | undefined;
  nextReservation?: {
    id: number;
    customerName: string;
    startTime: Date;
    endTime: Date;
    partySize: number;
  } | undefined;
}

// Interface pour les métriques de cache
export interface CacheMetrics {
  hits: number;
  misses: number;
  invalidations: number;
  size: number;
  hitRate: number;
}
