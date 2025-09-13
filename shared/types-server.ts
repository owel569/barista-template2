// Types serveur consolidés avec sécurité renforcée
import { z } from 'zod';

// ==========================================
// INTERFACES DE BASE SÉCURISÉES
// ==========================================

export interface SafeError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: Record<string, unknown>;
  timestamp: Date;
  requestId?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: SafeError;
  requestId: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ==========================================
// TYPES D'AUTHENTIFICATION SÉCURISÉS
// ==========================================

export interface TokenPayload {
  userId: number;
  username: string;
  role: 'directeur' | 'gerant' | 'employe' | 'customer';
  permissions: string[];
  exp: number;
  iat: number;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'directeur' | 'gerant' | 'employe' | 'customer';
  isActive: boolean;
  permissions: string[];
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error?: string | null;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: AuthUser;
  message?: string;
  expiresAt?: Date;
}

// ==========================================
// TYPES MÉTIER AVEC VALIDATION STRICTE
// ==========================================

export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  postalCode?: string;
  dateOfBirth?: Date;
  loyaltyPoints: number;
  totalSpent: number;
  totalOrders: number;
  preferredContactMethod: 'email' | 'phone' | 'sms';
  dietaryRestrictions?: string[];
  allergies?: string[];
  notes?: string;
  isActive: boolean;
  lastVisit?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuCategory {
  id: number;
  name: string;
  description?: string;
  slug: string;
  imageUrl?: string;
  isActive: boolean;
  sortOrder: number;
  itemsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  categoryId: number;
  category?: MenuCategory;
  slug: string;
  imageUrl?: string;
  images?: MenuItemImage[];
  isAvailable: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  allergens: string[];
  ingredients?: string[];
  nutritionalInfo?: NutritionInfo;
  preparationTime?: number;
  calories?: number;
  spicyLevel?: 1 | 2 | 3 | 4 | 5;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuItemImage {
  id: number;
  menuItemId: number;
  imageUrl: string;
  altText?: string;
  isPrimary: boolean;
  sortOrder: number;
  uploadMethod: 'url' | 'upload' | 'generated';
  fileSize?: number;
  mimeType?: string;
  createdAt: Date;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  saturatedFat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  cholesterol?: number;
}

export interface Reservation {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: Date;
  time: string;
  partySize: number;
  tableId?: number;
  table?: Table;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  notes?: string;
  specialRequests?: string;
  customerId?: number;
  customer?: Customer;
  confirmedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Table {
  id: number;
  number: string;
  capacity: number;
  location: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerId?: number;
  customer?: Customer;
  tableId?: number;
  table?: Table;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: 'cash' | 'card' | 'mobile' | 'other';
  notes?: string;
  preparationTime?: number;
  servedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: number;
  orderId: number;
  menuItemId: number;
  menuItem?: MenuItem;
  quantity: number;
  unitPrice: number;
  total: number;
  notes?: string;
  modifiers?: OrderItemModifier[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItemModifier {
  id: number;
  orderItemId: number;
  name: string;
  price: number;
  createdAt: Date;
}

// ==========================================
// TYPES D'ACTIVITÉ ET JOURNALISATION
// ==========================================

export interface ActivityLog {
  id: number;
  userId: number;
  user?: AuthUser;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress: string;
  userAgent?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  createdAt: Date;
}

// ==========================================
// TYPES DE PERMISSIONS
// ==========================================

export interface Permission {
  id: number;
  name: string;
  resource: string;
  action: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: number;
  name: string;
  displayName: string;
  description?: string;
  permissions: Permission[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// TYPES D'ANALYTICS ET STATISTIQUES
// ==========================================

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  topSellingItems: MenuItem[];
  recentOrders: Order[];
  reservationsToday: Reservation[];
  period: {
    startDate: Date;
    endDate: Date;
  };
  trends: {
    revenue: number;
    orders: number;
    customers: number;
  };
}

export interface RevenueData {
  date: Date;
  revenue: number;
  orders: number;
  averageOrderValue: number;
}

export interface PopularItem {
  menuItemId: number;
  menuItem: MenuItem;
  quantity: number;
  revenue: number;
  percentage: number;
}

// ==========================================
// SCHÉMAS ZOD POUR VALIDATION
// ==========================================

export const customerCreateSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  address: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  dateOfBirth: z.string().optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  notes: z.string().max(500).optional(),
});

export const reservationCreateSchema = z.object({
  customerName: z.string().min(2).max(100),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(10).max(20),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  partySize: z.number().int().min(1).max(20),
  tableId: z.number().int().positive().optional(),
  notes: z.string().max(500).optional(),
  specialRequests: z.string().max(500).optional(),
});

export const menuItemCreateSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  price: z.number().positive(),
  categoryId: z.number().int().positive(),
  imageUrl: z.string().url().optional(),
  isAvailable: z.boolean().default(true),
  isVegetarian: z.boolean().default(false),
  isVegan: z.boolean().default(false),
  isGlutenFree: z.boolean().default(false),
  allergens: z.array(z.string()).default([]),
  ingredients: z.array(z.string()).optional(),
  preparationTime: z.number().int().positive().optional(),
  calories: z.number().int().positive().optional(),
  spicyLevel: z.number().int().min(1).max(5).optional(),
});

// Types inférés des schémas
export type CustomerCreate = z.infer<typeof customerCreateSchema>;
export type ReservationCreate = z.infer<typeof reservationCreateSchema>;
export type MenuItemCreate = z.infer<typeof menuItemCreateSchema>;

// ==========================================
// CONSTANTES DE SÉCURITÉ
// ==========================================

export const SECURITY_CONSTANTS = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_TIMEOUT_MINUTES: 15,
  TOKEN_EXPIRY_HOURS: 24,
  PASSWORD_MIN_LENGTH: 8,
  SESSION_TIMEOUT_MINUTES: 60,
  MAX_FILE_SIZE_MB: 5,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
} as const;

export const VALIDATION_MESSAGES = {
  REQUIRED: 'Ce champ est requis',
  EMAIL_INVALID: 'Adresse email invalide',
  PHONE_INVALID: 'Numéro de téléphone invalide',
  PASSWORD_TOO_SHORT: 'Le mot de passe doit contenir au moins 8 caractères',
  NAME_TOO_SHORT: 'Le nom doit contenir au moins 2 caractères',
  PRICE_INVALID: 'Le prix doit être un nombre positif',
  QUANTITY_INVALID: 'La quantité doit être un nombre entier positif',
} as const;

// ==========================================
// HELPERS DE TYPE
// ==========================================

export type DatabaseEntity = {
  id: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateEntity<T extends DatabaseEntity> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateEntity<T extends DatabaseEntity> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;

// Rôles unifiés pour Barista Café (4-role system)
export type UserRole = 'directeur' | 'gerant' | 'employe' | 'customer';

// Legacy role alias pour compatibilité ascendante
export type LegacyRole = 'admin' | 'manager' | 'staff' | 'waiter' | 'chef' | 'employee' | 'serveur' | 'cuisinier';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'cancelled';
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type TableStatusType = 'available' | 'occupied' | 'reserved' | 'maintenance';
// Types d'interface pour les routes serveur

export interface TableStatus {
  id: number;
  number: number;
  capacity: number;
  location: string | null;
  section: string | null;
  status: TableStatusType;
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

export interface OrderStatistics {
  count: number;
  totalRevenue?: number;
  role?: string;
}

export interface RevenueData {
  date: Date;
  revenue: number;
  orders: number;
  averageOrderValue: number;
}

export interface LoyaltyTransaction {
  id: string;
  userId: string;
  type: 'earned' | 'redeemed';
  points: number;
  description: string;
  createdAt: Date;
}

export interface MarketingOpportunity {
  type: 'product_promotion' | 'customer_retention' | 'seasonal_campaign';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimatedImpact: number;
  recommendedActions: string[];
}

export interface StockAlert {
  id: number;
  itemId: number;
  itemName: string;
  currentStock: number;
  minStock: number;
  type: 'low_stock' | 'out_of_stock' | 'overstocked';
  severity: 'low' | 'medium' | 'high' | 'critical';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  message: string;
  createdAt: string;
}

export interface DatabaseTransaction {
  insert: (table: any) => {
    values: (data: any) => {
      onConflictDoNothing: () => {
        returning: () => Promise<any[]>;
      };
    };
  };
}

export interface CustomerOrder {
  id: string;
  userId: string;
  totalAmount: number;
  createdAt: string;
  status: string;
}

export interface UserAddress {
  id: string;
  userId: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}