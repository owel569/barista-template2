
import { useState, useEffect, useMemo } from 'react';
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
}

const PERMISSIONS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
    { module: 'permissions', actions: ['create', 'read', 'update', 'delete', 'manage', 'view'] },
    { module: 'loyalty', actions: ['create', 'read', 'update', 'delete', 'manage', 'view'] },
    { module: 'maintenance', actions: ['create', 'read', 'update', 'delete', 'manage', 'view'] },
    { module: 'accounting', actions: ['create', 'read', 'update', 'delete', 'manage', 'view'] },
    { module: 'backup', actions: ['create', 'read', 'update', 'delete', 'manage', 'view'] },
    { module: 'quality', actions: ['create', 'read', 'update', 'delete', 'manage', 'view'] },
    { module: 'suppliers', actions: ['create', 'read', 'update', 'delete', 'manage', 'view'] },
    { module: 'calendar', actions: ['create', 'read', 'update', 'delete', 'manage', 'view'] },
    { module: 'messages', actions: ['create', 'read', 'update', 'delete', 'manage', 'view'] },
    { module: 'notifications', actions: ['create', 'read', 'update', 'delete', 'manage', 'view'] },
    { module: 'pos', actions: ['create', 'read', 'update', 'delete', 'manage', 'view'] },
    { module: 'delivery', actions: ['create', 'read', 'update', 'delete', 'manage', 'view'] },
    { module: 'events', actions: ['create', 'read', 'update', 'delete', 'manage', 'view'] },
    { module: 'feedback', actions: ['create', 'read', 'update', 'delete', 'manage', 'view'] },
    { module: 'scheduling', actions: ['create', 'read', 'update', 'delete', 'manage', 'view'] },
    { module: 'tables', actions: ['create', 'read', 'update', 'delete', 'manage', 'view'] }
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
    { module: 'settings', actions: ['read', 'update'] },
    { module: 'loyalty', actions: ['create', 'read', 'update'] },
    { module: 'quality', actions: ['create', 'read', 'update'] },
    { module: 'pos', actions: ['create', 'read', 'update', 'manage'] },
    { module: 'delivery', actions: ['create', 'read', 'update'] },
    { module: 'tables', actions: ['create', 'read', 'update'] }
  ],
  manager: [
    { module: 'dashboard', actions: ['read', 'view'] },
    { module: 'orders', actions: ['create', 'read', 'update'] },
    { module: 'menu', actions: ['read', 'update'] },
    { module: 'inventory', actions: ['read', 'update'] },
    { module: 'customers', actions: ['read', 'update'] },
    { module: 'reservations', actions: ['create', 'read', 'update'] },
    { module: 'pos', actions: ['create', 'read', 'update'] },
    { module: 'delivery', actions: ['read', 'update'] },
    { module: 'tables', actions: ['read', 'update'] }
  ],
  barista: [
    { module: 'dashboard', actions: ['read', 'view'] },
    { module: 'orders', actions: ['read', 'update'] },
    { module: 'menu', actions: ['read'] },
    { module: 'inventory', actions: ['read'] },
    { module: 'pos', actions: ['create', 'read'] }
  ],
  employee: [
    { module: 'dashboard', actions: ['read'] },
    { module: 'orders', actions: ['read'] },
    { module: 'pos', actions: ['read'] }
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

  const userRole = useMemo(() => {
    if (!user) return null;
    return (user.role as UserRole) || 'employee';
  }, [user]);

  const fetchPermissions = async () => {
    if (!isAuthenticated || !userRole) return;

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('barista_auth_token');
      
      const response = await fetch('/api/permissions/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des permissions');
      }

      const data = await response.json();
      
      const permissions = data.success && data.permissions ? data.permissions : DEFAULT_PERMISSIONS[userRole] || [];
      
      setPermissionsCache({
        permissions,
        timestamp: Date.now(),
        ttl: PERMISSIONS_CACHE_TTL
      });
    } catch (err) {
      console.warn('Erreur permissions API, utilisation des permissions par défaut:', err);
      setError('Utilisation des permissions par défaut');
      
      // Fallback vers les permissions par défaut
      setPermissionsCache({
        permissions: DEFAULT_PERMISSIONS[userRole] || [],
        timestamp: Date.now(),
        ttl: PERMISSIONS_CACHE_TTL
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !userRole) return;

    const now = Date.now();
    const isCacheValid = permissionsCache && 
      (now - permissionsCache.timestamp) < permissionsCache.ttl;

    if (!isCacheValid) {
      fetchPermissions();
    }
  }, [isAuthenticated, userRole]);

  const getCurrentPermissions = (): Permission[] => {
    if (permissionsCache) {
      return permissionsCache.permissions;
    }
    return userRole ? DEFAULT_PERMISSIONS[userRole] || [] : [];
  };

  const hasPermission = (module: ModuleName, action: PermissionAction): boolean => {
    if (!isAuthenticated || !userRole) return false;

    // Directeur et admin ont accès complet
    if (userRole === 'directeur' || userRole === 'admin') return true;

    const permissions = getCurrentPermissions();
    const modulePermission = permissions.find(p => p.module === module);
    
    return modulePermission ? modulePermission.actions.includes(action) : false;
  };

  const canView = (module: ModuleName): boolean => {
    return hasPermission(module, 'view') || hasPermission(module, 'read');
  };

  const canCreate = (module: ModuleName): boolean => {
    return hasPermission(module, 'create');
  };

  const canEdit = (module: ModuleName): boolean => {
    return hasPermission(module, 'update') || hasPermission(module, 'manage');
  };

  const canDelete = (module: ModuleName): boolean => {
    return hasPermission(module, 'delete') || hasPermission(module, 'manage');
  };

  const canManage = (module: ModuleName): boolean => {
    return hasPermission(module, 'manage');
  };

  const getAvailableModules = (): ModuleName[] => {
    const permissions = getCurrentPermissions();
    return permissions.map(p => p.module);
  };

  const isAdmin = (): boolean => {
    return userRole === 'directeur' || userRole === 'admin';
  };

  const isManager = (): boolean => {
    return userRole === 'directeur' || userRole === 'admin' || userRole === 'manager';
  };

  const getPermissionLevel = (module: ModuleName): 'none' | 'read' | 'write' | 'manage' => {
    if (!isAuthenticated || !userRole) return 'none';
    
    if (userRole === 'directeur') return 'manage';
    
    const permissions = getCurrentPermissions();
    const modulePermission = permissions.find(p => p.module === module);
    
    if (!modulePermission) return 'none';
    
    if (modulePermission.actions.includes('manage')) return 'manage';
    if (modulePermission.actions.includes('create') || modulePermission.actions.includes('update')) return 'write';
    if (modulePermission.actions.includes('read') || modulePermission.actions.includes('view')) return 'read';
    
    return 'none';
  };

  const canAccessFeature = (feature: string): boolean => {
    const featureModuleMap: Record<string, ModuleName> = {
      'export': 'reports',
      'advanced-analytics': 'analytics',
      'user-management': 'employees',
      'system-settings': 'settings',
      'backup': 'backup',
      'maintenance': 'maintenance'
    };
    
    const module = featureModuleMap[feature];
    return module ? canView(module) : false;
  };

  const getUserAccessLevel = (): 'basic' | 'advanced' | 'admin' | 'super' => {
    if (userRole === 'directeur') return 'super';
    if (userRole === 'admin') return 'admin';
    if (userRole === 'manager') return 'advanced';
    return 'basic';
  };

  return {
    permissions: getCurrentPermissions(),
    userRole,
    loading,
    error,
    hasPermission,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canManage,
    getAvailableModules,
    isAdmin,
    isManager,
    getPermissionLevel,
    canAccessFeature,
    getUserAccessLevel,
    refreshPermissions: fetchPermissions
  };
};
