export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface UserPermissions {
  canView: (resource: string) => boolean;
  canCreate: (resource: string) => boolean;
  canEdit: (resource: string) => boolean;
  canDelete: (resource: string) => boolean;
  can: (permission: string) => boolean;
}

export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard_view',
  
  // Menu management
  MENU_VIEW: 'menu_view',
  MENU_CREATE: 'menu_create',
  MENU_EDIT: 'menu_edit',
  MENU_DELETE: 'menu_delete',
  
  // User management
  USER_VIEW: 'user_view',
  USER_CREATE: 'user_create',
  USER_EDIT: 'user_edit',
  USER_DELETE: 'user_delete',
  
  // Reservations
  RESERVATION_VIEW: 'reservation_view',
  RESERVATION_CREATE: 'reservation_create',
  RESERVATION_EDIT: 'reservation_edit',
  RESERVATION_DELETE: 'reservation_delete',
  
  // Customers
  CUSTOMER_VIEW: 'customer_view',
  CUSTOMER_CREATE: 'customer_create',
  CUSTOMER_EDIT: 'customer_edit',
  CUSTOMER_DELETE: 'customer_delete',
  
  // Analytics
  ANALYTICS_VIEW: 'analytics_view',
  
  // System
  SYSTEM_CONFIG: 'system_config',
} as const;

export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export function hasPermission(userPermissions: string[], permission: PermissionKey): boolean {
  return userPermissions.includes(permission);
}

export function createPermissionChecker(userPermissions: string[]): UserPermissions {
  return {
    canView: (resource: string) => hasPermission(userPermissions, `${resource}_view` as PermissionKey),
    canCreate: (resource: string) => hasPermission(userPermissions, `${resource}_create` as PermissionKey),
    canEdit: (resource: string) => hasPermission(userPermissions, `${resource}_edit` as PermissionKey),
    canDelete: (resource: string) => hasPermission(userPermissions, `${resource}_delete` as PermissionKey),
    can: (permission: string) => hasPermission(userPermissions, permission as PermissionKey),
  };
}