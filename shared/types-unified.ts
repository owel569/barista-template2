
/**
 * Types unifiés pour éviter les conflits entre fichiers
 * Ce fichier est la source unique de vérité pour tous les types partagés
 */

import { z } from 'zod';

// === TYPES NOTIFICATION UNIFIÉS ===
export interface NotificationUnified {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system' | 'reservation' | 'order';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  userId: number;
  createdAt: string;
  readAt?: string | null;
  scheduledFor?: string | null;
  expiresAt?: string | null;
  metadata?: Record<string, unknown> | null;
  status?: 'unread' | 'read' | 'archived';
  category?: 'order' | 'reservation' | 'system' | 'user' | 'payment' | 'inventory' | 'maintenance';
  channel?: 'web' | 'email' | 'sms' | 'push';
}

// === TYPES ACTIVITY LOG UNIFIÉS ===
export interface ActivityLogUnified {
  id: number;
  userId: number;
  action: string;
  entity: string;
  entityId?: number;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// === TYPES CUSTOMER UNIFIÉS ===
export interface CustomerUnified {
  id: number;
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

// === SCHÉMAS DE VALIDATION UNIFIÉS ===
export const NotificationUnifiedSchema = z.object({
  id: z.number(),
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  type: z.enum(['info', 'success', 'warning', 'error', 'system', 'reservation', 'order']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  isRead: z.boolean(),
  userId: z.number(),
  createdAt: z.string(),
  readAt: z.string().nullable().optional(),
  scheduledFor: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
  status: z.enum(['unread', 'read', 'archived']).optional(),
  category: z.enum(['order', 'reservation', 'system', 'user', 'payment', 'inventory', 'maintenance']).optional(),
  channel: z.enum(['web', 'email', 'sms', 'push']).optional(),
});

export const ActivityLogUnifiedSchema = z.object({
  id: z.number(),
  userId: z.number(),
  action: z.string(),
  entity: z.string(),
  entityId: z.number().optional(),
  details: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  createdAt: z.date(),
});

// === TYPES POUR L'EXPORT ===
export type NotificationType = z.infer<typeof NotificationUnifiedSchema>;
export type ActivityLogType = z.infer<typeof ActivityLogUnifiedSchema>;

// === TYPES UTILITAIRES ===
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
