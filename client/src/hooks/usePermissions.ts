import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './useAuth';

export type UserRole = 'directeur' | 'admin' | 'manager' | 'barista' | 'employee' | 'staff';
export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'view';
export type ModuleName = 
  | 'dashboard' | 'orders' | 'menu' | 'inventory' | 'customers' | 'employees' 
  | 'reservations' | 'analytics' | 'reports' | 'settings' | 'permissions'
  | 'loyalty' | 'maintenance' | 'accounting' | 'backup' | 'quality'
  | 'suppliers' | 'calendar' | 'messages' | 'notifications' | 'pos'
  | 'delivery' | 'events' | 'feedback' | 'scheduling' | 'tables';

interface Permission {
  module: ModuleName;
  actions: PermissionAction[];
}

interface PermissionsCache {
  permissions: Permission[];
  timestamp: number;
  ttl: number;
  userId?: number;
}

interface PermissionResponse {
  success: boolean;
  permissions: Permission[];
  message?: string;
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

export const usePermissions = () => {
  const { user, isAuthenticated } = useAuth();
  const [permissionsCache, setPermissionsCache] = useState<PermissionsCache | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userRole = useMemo((): UserRole | null => {
    if (!user?.role) return null;
    return user.role as UserRole;
  }, [user?.role]);

  // Cache management optimisé
  const getCachedPermissions = useCallback((): PermissionsCache | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const parsedCache: PermissionsCache = JSON.parse(cached);
      const now = Date.now();
      const isExpired = (now - parsedCache.timestamp) > parsedCache.ttl;
      const isWrongUser = parsedCache.userId !== user?.id;

      if (isExpired || isWrongUser) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      return parsedCache;
    } catch {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
  }, [user?.id]);

  const setCachedPermissions = useCallback((permissions: Permission[]) => {
    const cache: PermissionsCache = {
      permissions,
      timestamp: Date.now(),
      ttl: PERMISSIONS_CACHE_TTL,
      userId: user?.id
    };

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      setPermissionsCache(cache);
    } catch (err) {
      console.warn('Impossible de sauvegarder le cache des permissions:', err);
      setPermissionsCache(cache);
    }
  }, [user?.id]);

  // Fetch permissions avec retry et fallback
  const fetchPermissions = useCallback(async (): Promise<void> => {
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

      const response = await fetch('/api/permissions/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 secondes
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const data: PermissionResponse = await response.json();

      if (data.success && Array.isArray(data.permissions)) {
        setCachedPermissions(data.permissions);
      } else {
        throw new Error(data.message || 'Format de réponse invalide');
      }
    } catch (err) {
      console.warn('Erreur permissions API, utilisation des permissions par défaut:', err);
      setError('Permissions par défaut utilisées');

      // Fallback vers les permissions par défaut
      const defaultPerms = DEFAULT_PERMISSIONS[userRole] || [];
      setCachedPermissions(defaultPerms);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, userRole, user?.id, setCachedPermissions]);

  // Effect principal
  useEffect(() => {
    if (!isAuthenticated || !userRole) {
      setPermissionsCache(null);
      return;
    }

    const cachedPerms = getCachedPermissions();
    if (cachedPerms) {
      setPermissionsCache(cachedPerms);
    } else {
      fetchPermissions();
    }
  }, [isAuthenticated, userRole, getCachedPermissions, fetchPermissions]);

  // Helpers optimisés
  const getCurrentPermissions = useCallback((): Permission[] => {
    if (permissionsCache?.permissions) {
      return permissionsCache.permissions;
    }
    return userRole ? DEFAULT_PERMISSIONS[userRole] || [] : [];
  }, [permissionsCache?.permissions, userRole]);

  const hasPermission = useCallback((module: ModuleName, action: PermissionAction): boolean => {
    if (!isAuthenticated || !userRole) return false;

    // Super admin bypass
    if (userRole === 'directeur') return true;

    const permissions = getCurrentPermissions();
    const modulePermission = permissions.find(p => p.module === module);

    return modulePermission?.actions.includes(action) ?? false;
  }, [isAuthenticated, userRole, getCurrentPermissions]);

  // API optimisée
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

  const getPermissionLevel = useCallback((module: ModuleName): 'none' | 'read' | 'write' | 'manage' => {
    if (!isAuthenticated || !userRole) return 'none';

    if (userRole === 'directeur') return 'manage';

    const permissions = getCurrentPermissions();
    const modulePermission = permissions.find(p => p.module === module);

    if (!modulePermission) return 'none';

    if (modulePermission.actions.includes('manage')) return 'manage';
    if (modulePermission.actions.includes('create') || modulePermission.actions.includes('update')) return 'write';
    if (modulePermission.actions.includes('read') || modulePermission.actions.includes('view')) return 'read';

    return 'none';
  }, [isAuthenticated, userRole, getCurrentPermissions]);

  // Helpers métier
  const isAdmin = useCallback((): boolean => {
    return userRole === 'directeur' || userRole === 'admin';
  }, [userRole]);

  const isManager = useCallback((): boolean => {
    return userRole === 'directeur' || userRole === 'admin' || userRole === 'manager';
  }, [userRole]);

  const refreshPermissions = useCallback(async (): Promise<void> => {
    localStorage.removeItem(CACHE_KEY);
    setPermissionsCache(null);
    await fetchPermissions();
  }, [fetchPermissions]);

  return {
    // State
    permissions: getCurrentPermissions(),
    userRole,
    loading,
    error,

    // Core methods
    hasPermission,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canManage,

    // Helpers
    getPermissionLevel,
    isAdmin,
    isManager,

    // Actions
    refreshPermissions,

    // Meta
    getAvailableModules: () => getCurrentPermissions().map(p => p.module),
    getUserAccessLevel: (): 'super' | 'admin' | 'advanced' | 'basic' => {
      if (userRole === 'directeur') return 'super';
      if (userRole === 'admin') return 'admin';
      if (userRole === 'manager') return 'advanced';
      return 'basic';
    }
  };
};

export default usePermissions;