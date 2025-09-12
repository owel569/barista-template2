import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchJson } from '@/lib/fetch';
import { useAuth } from './useAuth';

export type UserRole = 'directeur' | 'admin' | 'manager' | 'barista' | 'employee' | 'staff';
export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'view';
export type ModuleName =
  | 'dashboard' | 'orders' | 'menu' | 'inventory' | 'customers' | 'employees'
  | 'reservations' | 'analytics' | 'reports' | 'settings' | 'permissions'
  | 'loyalty' | 'maintenance' | 'accounting' | 'backup' | 'quality'
  | 'suppliers' | 'calendar' | 'messages' | 'notifications' | 'pos'
  | 'delivery' | 'events' | 'feedback' | 'scheduling' | 'tables' | 'users';

interface Permission {
  module: ModuleName;
  actions: PermissionAction[];
}

interface PermissionsCache {
  permissions: Permission[];
  timestamp: number;
  ttl: number;
  userId?: number | string;
}

interface PermissionResponse {
  success: boolean;
  permissions: Permission[];
  message?: string;
}

// Added interface for the return type of the usePermissions hook
interface UsePermissionsReturn {
  permissions: Permission[];
  userRole: UserRole | null;
  loading: boolean;
  isLoading: boolean; // Alias pour loading
  error: string | null;
  hasPermission: (module: string, action: string) => boolean;
  canView: (module: ModuleName) => boolean;
  canEdit: (module: ModuleName) => boolean;
  canDelete: (module: ModuleName) => boolean;
  canCreate: (module: ModuleName) => boolean;
  canManage: (module: ModuleName) => boolean;
  isAdmin: boolean;
  isManager: boolean;
  isStaff: boolean;
  refreshPermissions: () => Promise<void>;
  getUserAccessLevel: () => 'admin' | 'manager' | 'staff' | 'basic';
}

// Simplified user interface based on JWT payload
interface UserJWT {
  id: string;
  role: string;
  permissions?: string[];
}

const PERMISSIONS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY = 'user_permissions_cache';

// Permissions par défaut optimisées
const DEFAULT_PERMISSIONS: Record<UserRole, Permission[]> = {
  directeur: [
    { module: 'dashboard', actions: ['create', 'read', 'update', 'delete', 'manage', 'view'] },
    { module: 'orders', actions: ['create', 'read', 'update', 'delete', 'manage', 'view'] },
    { module: 'menu', actions: ['create', 'read', 'update', 'delete', 'manage', 'view'] },
    { module: 'inventory', actions: ['create', 'read', 'update', 'delete', 'manage', 'view'] },
    { module: 'customers', actions: ['create', 'read', 'update', 'delete', 'manage', 'view'] },
    { module: 'employees', actions: ['create', 'read', 'update', 'delete', 'manage', 'view'] },
    { module: 'reservations', actions: ['create', 'read', 'update', 'delete', 'manage', 'view'] },
    { module: 'analytics', actions: ['create', 'read', 'update', 'delete', 'manage', 'view'] },
    { module: 'reports', actions: ['create', 'read', 'update', 'delete', 'manage', 'view'] },
    { module: 'settings', actions: ['create', 'read', 'update', 'delete', 'manage', 'view'] },
    { module: 'permissions', actions: ['create', 'read', 'update', 'delete', 'manage', 'view'] }
  ],
  admin: [
    { module: 'dashboard', actions: ['read', 'view', 'manage'] },
    { module: 'orders', actions: ['create', 'read', 'update', 'manage'] },
    { module: 'menu', actions: ['create', 'read', 'update'] },
    { module: 'inventory', actions: ['create', 'read', 'update', 'manage'] },
    { module: 'customers', actions: ['create', 'read', 'update'] },
    { module: 'employees', actions: ['read', 'update'] },
    { module: 'reservations', actions: ['create', 'read', 'update', 'manage'] },
    { module: 'analytics', actions: ['read', 'view'] },
    { module: 'reports', actions: ['read', 'view'] },
    { module: 'settings', actions: ['read', 'update'] }
  ],
  manager: [
    { module: 'dashboard', actions: ['read', 'view'] },
    { module: 'orders', actions: ['create', 'read', 'update'] },
    { module: 'menu', actions: ['read', 'update'] },
    { module: 'inventory', actions: ['read', 'update'] },
    { module: 'customers', actions: ['read', 'update'] },
    { module: 'reservations', actions: ['create', 'read', 'update'] }
  ],
  barista: [
    { module: 'dashboard', actions: ['read', 'view'] },
    { module: 'orders', actions: ['read', 'update'] },
    { module: 'menu', actions: ['read'] },
    { module: 'inventory', actions: ['read'] }
  ],
  employee: [
    { module: 'dashboard', actions: ['read'] },
    { module: 'orders', actions: ['read'] }
  ],
  staff: [
    { module: 'dashboard', actions: ['read'] },
    { module: 'orders', actions: ['read'] }
  ]
};

export const usePermissions = (): UsePermissionsReturn => {
  const { user: authUser, isAuthenticated, logout } = useAuth(); // authUser is the object from useAuth
  const [user, setUser] = useState<UserJWT | null>(null); // user is the parsed JWT payload
  const [permissionsCache, setPermissionsCache] = useState<PermissionsCache | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize user state from JWT on mount or when authUser changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const tokenPart = token.split('.')[1];
        if (!tokenPart) {
          throw new Error('Token JWT invalide');
        }
        const payload = JSON.parse(atob(tokenPart));
        setUser(payload as UserJWT);
      } catch (error) {
        console.error('Erreur décodage token:', error);
        setUser(null); // Clear user if token is invalid
      }
    } else {
      setUser(null); // Clear user if no token
    }
  }, [authUser]); // Re-run if authUser changes (e.g., login/logout)

  const userRole = useMemo((): UserRole | null => {
    if (!user?.role) return null;
    // Ensure the role from JWT is one of the defined UserRoles
    if (Object.values(DEFAULT_PERMISSIONS).some(perms => perms.some(p => p.module === user.role))) {
        return user.role as UserRole;
    }
    // Handle cases where the role from JWT might not be directly mapped or is different
    // For simplicity, we'll map known roles or return null if unknown
    switch (user.role) {
      case 'gerant': return 'manager'; // Mapping 'gerant' to 'manager' as per edited code
      case 'employe': return 'employee';
      default: return null; // Or handle other roles as needed
    }
  }, [user?.role]);

  // Cache management optimisé
  const getCachedPermissions = useCallback((): PermissionsCache | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const parsedCache: PermissionsCache = JSON.parse(cached);
      const now = Date.now();
      const isExpired = (now - parsedCache.timestamp) > parsedCache.ttl;
      const isWrongUser = parsedCache.userId !== user?.id; // Compare with parsed JWT user ID

      if (isExpired || isWrongUser) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      return parsedCache;
    } catch {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
  }, [user?.id]); // Dependency on user ID from JWT

  const setCachedPermissions = useCallback((permissions: Permission[]) => {
    const cache: PermissionsCache = {
      permissions,
      timestamp: Date.now(),
      ttl: PERMISSIONS_CACHE_TTL,
      userId: user?.id as unknown as number | string // Use user ID from JWT
    };

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      setPermissionsCache(cache);
    } catch (err) {
      console.warn('Impossible de sauvegarder le cache des permissions:', err);
      setPermissionsCache(cache);
    }
  }, [user?.id]); // Dependency on user ID from JWT

  // Fetch permissions with retry and fallback
  const fetchPermissions = useCallback(async (): Promise<void> => {
    // Use user?.id for checks, as it's derived from the JWT
    if (!isAuthenticated || !userRole || !user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token') ||
                   localStorage.getItem('auth_token') ||
                   localStorage.getItem('barista_auth_token');

      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      // Assuming the API endpoint might require the user ID or role from the JWT
      const data = await fetchJson<PermissionResponse>(`/api/permissions/user/${user.id}`, { // Adjusted API endpoint to include user ID
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeoutMs: 10000
      });

      if (data.success && Array.isArray(data.permissions)) {
        setCachedPermissions(data.permissions);
      } else {
        throw new Error(data.message || 'Format de réponse invalide');
      }
    } catch (err) {
      console.warn('Erreur permissions API, utilisation des permissions par défaut:', err);
      setError('Permissions par défaut utilisées');

      // Fallback to default permissions based on the derived userRole
      const defaultPerms = DEFAULT_PERMISSIONS[userRole] || [];
      setCachedPermissions(defaultPerms);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, userRole, user?.id, setCachedPermissions]); // Dependencies updated

  // Effect principal
  useEffect(() => {
    if (!user?.id || !userRole) { // Check for parsed user ID
      setPermissionsCache(null);
      // If user is logged out or role is not determined, clear local cache
      if (!isAuthenticated) {
         localStorage.removeItem(CACHE_KEY);
      }
      return;
    }

    const cachedPerms = getCachedPermissions();
    if (cachedPerms) {
      setPermissionsCache(cachedPerms);
    } else {
      fetchPermissions();
    }
  }, [isAuthenticated, userRole, user?.id, getCachedPermissions, fetchPermissions]); // Dependencies updated

  // Helpers optimisés - Replaced with simplified logic from edited code

  // hasPermission adapted to use the simplified logic from the edited code
  const hasPermission = useCallback((module: string, action: string): boolean => {
    if (!user) return false;

    // Super admin bypass
    if (user.role === 'directeur') return true;

    // Mapping module and action to the simplified permission string format
    const permissionString = `${action}_${module.toLowerCase()}`;

    // Manager role logic from edited code
    if (user.role === 'gerant') { // Using 'gerant' as in the edited code
      const restrictedPermissions = ['create_users', 'delete_users', 'manage_permissions'];
      return !restrictedPermissions.includes(permissionString);
    }

    // Employee role logic from edited code
    if (user.role === 'employe') { // Using 'employe' as in the edited code
      const allowedPermissions = ['view_orders', 'view_reservations', 'view_menu'];
      return allowedPermissions.includes(permissionString);
    }

    // Default for other roles (e.g., barista, staff) or if no specific logic is found
    // Here we fall back to checking against the 'permissions' array in the JWT if available
    if (user.permissions && Array.isArray(user.permissions)) {
        return user.permissions.includes(permissionString);
    }

    return false;
  }, [user]);

  // The following functions are kept from the original for compatibility,
  // but their implementation relies on the new hasPermission.

  const canView = useCallback((module: ModuleName): boolean => {
    return hasPermission(module, 'view') || hasPermission(module, 'read');
  }, [hasPermission]);

  const canCreate = useCallback((module: ModuleName): boolean => {
    return hasPermission(module, 'create');
  }, [hasPermission]);

  const canEdit = useCallback((module: ModuleName): boolean => {
    return hasPermission(module, 'update') || hasPermission(module, 'manage');
  }, [hasPermission]);

  const canDelete = useCallback((module: ModuleName): boolean => {
    return hasPermission(module, 'delete') || hasPermission(module, 'manage');
  }, [hasPermission]);

  const canManage = useCallback((module: ModuleName): boolean => {
    return hasPermission(module, 'manage');
  }, [hasPermission]);

  // This function remains from the original but will use the new hasPermission logic implicitly.
  // The `getPermissionLevel` might need adjustments if the simplified permission strings
  // don't map directly to the 'manage', 'write', 'read' levels. For now, it uses the
  // existing structure assuming `hasPermission` covers the checks.
  const getPermissionLevel = useCallback((module: ModuleName): 'none' | 'read' | 'write' | 'manage' => {
    if (!user) return 'none';

    if (user.role === 'directeur') return 'manage';

    // Simplified check based on the new hasPermission structure
    if (hasPermission(module, 'manage')) return 'manage';
    if (hasPermission(module, 'create') || hasPermission(module, 'update')) return 'write';
    if (hasPermission(module, 'read') || hasPermission(module, 'view')) return 'read';

    return 'none';
  }, [user, hasPermission]);


  // Helpers métier - adapted to use the new user role and simplified logic

  const isAdmin = useCallback((): boolean => {
    // Mapping roles from JWT to the concept of isAdmin
    return user?.role === 'directeur' || user?.role === 'admin';
  }, [user?.role]);

  const isManager = useCallback((): boolean => {
    // Mapping roles from JWT to the concept of isManager
    return user?.role === 'directeur' || user?.role === 'admin' || user?.role === 'manager' || user?.role === 'gerant';
  }, [user?.role]);

  const isStaff = useCallback((): boolean => {
    return user?.role === 'staff';
  }, [user?.role]);

  const refreshPermissions = useCallback(async (): Promise<void> => {
    localStorage.removeItem(CACHE_KEY);
    setPermissionsCache(null);
    // Fetching logic is now primarily based on JWT, but if an API fallback is intended,
    // the fetchPermissions call would still be relevant. Given the simplification,
    // we might not need to call fetchPermissions here if permissions are solely from JWT.
    // However, to maintain the structure, we keep it.
    await fetchPermissions();
  }, [fetchPermissions]);

  const getUserAccessLevel = useCallback((): 'admin' | 'manager' | 'staff' | 'basic' => {
    if (!user?.role) return 'basic';

    switch (user.role) {
      case 'directeur': return 'admin';
      case 'admin': return 'admin';
      case 'gerant': return 'manager'; // Mapping 'gerant' from JWT
      case 'manager': return 'manager';
      case 'staff': return 'staff';
      default: return 'basic';
    }
  }, [user?.role]);

  // Returning the current permissions derived from the cache or default,
  // along with the helper functions.
  const getCurrentPermissions = useCallback((): Permission[] => {
    if (permissionsCache?.permissions) {
      return permissionsCache.permissions;
    }
    // If no cache and userRole is determined, use default permissions.
    // Otherwise, return empty array.
    return userRole ? DEFAULT_PERMISSIONS[userRole] || [] : [];
  }, [permissionsCache?.permissions, userRole]);

  return {
    permissions: getCurrentPermissions(), // Still returning permissions array based on cache/default
    userRole,
    loading,
    isLoading: loading, // Alias for loading
    error,
    hasPermission,
    canView,
    canEdit,
    canDelete,
    canCreate,
    canManage,
    isAdmin: isAdmin(),
    isManager: isManager(),
    isStaff: isStaff(),
    refreshPermissions,
    getUserAccessLevel
  };
};

export default usePermissions;