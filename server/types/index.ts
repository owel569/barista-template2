
// Types centralisés pour le serveur
export * from './auth';
export * from './express';

// Types pour les permissions
export interface Permission {
  id: number;
  userId: number;
  module: string;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

// Types pour les réponses API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Types pour la pagination
export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Types pour les logs d'activité
export interface ActivityLog {
  id: string;
  userId: number;
  username: string;
  action: string;
  description: string;
  timestamp: string;
  ipAddress: string;
  entity?: string;
  entityId?: number;
  details?: string;
}
export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  conditions?: Record<string, unknown>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BusinessLogicConfig {
  restaurant: {
    name: string;
    currency: string;
    taxRate: number;
    serviceCharge: number;
    loyaltyPointsRate: number;
  };
  operatingHours: {
    open: string;
    close: string;
    daysOpen: number[];
  };
  reservationRules: {
    maxPartySize: number;
    maxAdvanceBooking: number;
    minAdvanceBooking: number;
    defaultDuration: number;
  };
}
