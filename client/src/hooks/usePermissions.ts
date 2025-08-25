import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

// Types pour une meilleure type safety
export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'respond' | 'use' | 'all' | 'read' | 'write' | 'manage' | 'approve';
export type UserRole = 'directeur' | 'employe' | 'admin' | 'manager' | 'chef' | 'serveur' | 'caissier';
export type ModuleName = 'dashboard' | 'reservations' | 'orders' | 'customers' | 'menu' | 'messages' | 'employees' | 'settings' | 'inventory' | 'analytics' | 'maintenance' | 'accounting' | 'loyalty' | 'reports' | 'tables' | 'kitchen' | 'pos';

export interface Permission {
  id: number;
  resource: string;
  action: PermissionAction;
  module: ModuleName;
  enabled: boolean;
  conditions?: Record<string, any>;
}

export interface PermissionsMap {
  [key: string]: PermissionAction[];
}

// Interface utilisateur avec logique métier café
interface CafeUser {
  id: number;
  role: UserRole;
  permissions?: string[];
  departement?: string;
  level?: number;
  [key: string]: unknown;
}

// Permissions par défaut selon la logique métier complète du café
const DEFAULT_PERMISSIONS: Record<UserRole, PermissionsMap> = {
  directeur: {
    dashboard: ['all'],
    reservations: ['all'],
    orders: ['all'],
    customers: ['all'],
    menu: ['all'],
    messages: ['all'],
    employees: ['all'],
    settings: ['all'],
    inventory: ['all'],
    analytics: ['all'],
    accounting: ['all'],
    loyalty: ['all'],
    reports: ['all'],
    tables: ['all'],
    kitchen: ['view', 'manage'],
    pos: ['all'],
    maintenance: ['all']
  },
  admin: {
    dashboard: ['all'],
    reservations: ['all'],
    orders: ['all'],
    customers: ['all'],
    menu: ['all'],
    messages: ['all'],
    employees: ['all'],
    settings: ['all'],
    inventory: ['all'],
    analytics: ['all'],
    accounting: ['all'],
    loyalty: ['all'],
    reports: ['all'],
    tables: ['all'],
    kitchen: ['all'],
    pos: ['all'],
    maintenance: ['all']
  },
  manager: {
    dashboard: ['view', 'manage'],
    reservations: ['all'],
    orders: ['all'],
    customers: ['view', 'edit'],
    menu: ['view', 'edit'],
    messages: ['view', 'respond'],
    employees: ['view', 'edit'],
    settings: ['view'],
    inventory: ['view', 'edit'],
    analytics: ['view'],
    accounting: ['view'],
    loyalty: ['view', 'edit'],
    reports: ['view', 'create'],
    tables: ['all'],
    kitchen: ['view', 'manage'],
    pos: ['all']
  },
  chef: {
    dashboard: ['view'],
    reservations: ['view'],
    orders: ['view', 'edit'],
    customers: ['view'],
    menu: ['view', 'edit', 'create'],
    messages: ['view'],
    employees: ['view'],
    inventory: ['view', 'edit'],
    kitchen: ['all'],
    pos: ['view']
  },
  employe: {
    dashboard: ['view'],
    reservations: ['view', 'create', 'edit'],
    orders: ['view', 'create'],
    customers: ['view'],
    menu: ['view'],
    messages: ['view', 'respond'],
    employees: ['view'],
    settings: ['view'],
    inventory: ['view'],
    analytics: ['view'],
    tables: ['view', 'edit'],
    pos: ['view', 'use']
  },
  serveur: {
    dashboard: ['view'],
    reservations: ['view', 'create', 'edit'],
    orders: ['all'],
    customers: ['view', 'create'],
    menu: ['view'],
    messages: ['view'],
    tables: ['all'],
    pos: ['use']
  },
  caissier: {
    dashboard: ['view'],
    orders: ['view', 'create', 'edit'],
    customers: ['view', 'create'],
    menu: ['view'],
    pos: ['all'],
    loyalty: ['view', 'use']
  }
};

// Rôles avec accès complet
const FULL_ACCESS_ROLES: UserRole[] = ['directeur', 'admin'];
const MANAGEMENT_ROLES: UserRole[] = ['directeur', 'admin', 'manager'];

interface PermissionsCache {
  [key: string]: {
    permissions: Permission[];
    timestamp: number;
    ttl: number;
  };
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const permissionsCache: PermissionsCache = {};

// Hook principal avec logique métier complète
export const usePermissions = (userParam?: CafeUser | null) => {
  const { user: contextUser, token } = useAuth();
  const user = (userParam || contextUser) as CafeUser | null;
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = useCallback(async () => {
    if (!user || !token) {
      setPermissions([]);
      setIsLoading(false);
      return;
    }

    const cacheKey = `${user.id}_${user.role}_${user.departement || 'default'}`;
    const cached = permissionsCache[cacheKey];

    // Vérifier le cache
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      setPermissions(cached.permissions);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/permissions/user/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // Fallback vers les permissions par défaut si l'API échoue
        console.warn('API permissions indisponible, utilisation des permissions par défaut');
        const defaultPerms = generateDefaultPermissions(user);
        setPermissions(defaultPerms);
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      // Mettre en cache
      permissionsCache[cacheKey] = {
        permissions: data,
        timestamp: Date.now(),
        ttl: CACHE_TTL
      };

      setPermissions(data);
    } catch (err) {
      console.error('Erreur permissions:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');

      // Fallback vers les permissions par défaut
      const defaultPerms = generateDefaultPermissions(user);
      setPermissions(defaultPerms);
    } finally {
      setIsLoading(false);
    }
  }, [user, token]);

  // Générer les permissions par défaut basées sur le rôle
  const generateDefaultPermissions = (user: CafeUser): Permission[] => {
    const rolePermissions = DEFAULT_PERMISSIONS[user.role] || DEFAULT_PERMISSIONS.employe;
    const permissions: Permission[] = [];
    let id = 1;

    Object.entries(rolePermissions).forEach(([module, actions]) => {
      actions.forEach(action => {
        permissions.push({
          id: id++,
          resource: module,
          action: action as PermissionAction,
          module: module as ModuleName,
          enabled: true
        });
      });
    });

    return permissions;
  };

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // Logique métier avancée pour les permissions
  const hasPermission = useCallback((permission: string, action: PermissionAction = 'view'): boolean => {
    if (!user) return false;
    if (FULL_ACCESS_ROLES.includes(user.role as UserRole)) return true;

    // Logique spécifique par module selon la hiérarchie du café
    switch (permission) {
      case 'customers':
        if (action === 'delete') return FULL_ACCESS_ROLES.includes(user.role as UserRole);
        if (action === 'edit') return MANAGEMENT_ROLES.includes(user.role as UserRole);
        return true; // Tous peuvent voir les clients

      case 'employees':
        if (['create', 'edit', 'delete'].includes(action)) {
          return MANAGEMENT_ROLES.includes(user.role as UserRole);
        }
        return true; // Tous peuvent voir les employés

      case 'inventory':
        if (['create', 'edit', 'delete'].includes(action)) {
          return ['directeur', 'admin', 'manager', 'chef'].includes(user.role as UserRole);
        }
        return true;

      case 'menu':
        if (['create', 'edit', 'delete'].includes(action)) {
          return ['directeur', 'admin', 'manager', 'chef'].includes(user.role as UserRole);
        }
        return true;

      case 'orders':
        if (action === 'delete') return MANAGEMENT_ROLES.includes(user.role as UserRole);
        return ['directeur', 'admin', 'manager', 'employe', 'serveur', 'caissier'].includes(user.role as UserRole);

      case 'accounting':
      case 'analytics':
      case 'reports':
        return MANAGEMENT_ROLES.includes(user.role as UserRole);

      case 'settings':
        return FULL_ACCESS_ROLES.includes(user.role as UserRole);

      default:
        return permissions.some(p => 
          p.resource === permission && 
          p.enabled &&
          (p.action === 'all' || p.action === action)
        );
    }
  }, [user, permissions]);

  const hasWritePermission = useCallback((resource: string): boolean => {
    return hasPermission(resource, 'edit') || hasPermission(resource, 'write') || hasPermission(resource, 'all');
  }, [hasPermission]);

  const canAccess = useCallback((module: ModuleName): boolean => {
    const modulePermissions: Record<ModuleName, string> = {
      'dashboard': 'dashboard',
      'orders': 'orders',
      'reservations': 'reservations',
      'menu': 'menu',
      'customers': 'customers',
      'employees': 'employees',
      'inventory': 'inventory',
      'maintenance': 'maintenance',
      'analytics': 'analytics',
      'settings': 'settings',
      'messages': 'messages',
      'accounting': 'accounting',
      'loyalty': 'loyalty',
      'reports': 'reports',
      'tables': 'tables',
      'kitchen': 'kitchen',
      'pos': 'pos'
    };

    return hasPermission(modulePermissions[module] || module);
  }, [hasPermission]);

  // Méthodes spécialisées pour le café
  const canManageKitchen = useCallback((): boolean => {
    return ['directeur', 'admin', 'chef', 'manager'].includes(user?.role as UserRole);
  }, [user]);

  const canHandleCash = useCallback((): boolean => {
    return ['directeur', 'admin', 'manager', 'caissier'].includes(user?.role as UserRole);
  }, [user]);

  const canManageStaff = useCallback((): boolean => {
    return MANAGEMENT_ROLES.includes(user?.role as UserRole);
  }, [user]);

  const canViewFinancials = useCallback((): boolean => {
    return MANAGEMENT_ROLES.includes(user?.role as UserRole);
  }, [user]);

  // Méthode générique can() pour éviter la répétition
  const can = useCallback((module: ModuleName, action: PermissionAction): boolean => {
    if (!user) return false;
    if (FULL_ACCESS_ROLES.includes(user.role as UserRole)) return true;

    // Vérifier les permissions spécifiques
    const hasSpecificPermission = permissions.some(p => 
      p.resource === module && 
      p.enabled &&
      (p.action === 'all' || p.action === action)
    );

    if (hasSpecificPermission) return true;

    // Fallback vers la logique par défaut
    return hasPermission(module, action);
  }, [user, permissions, hasPermission]);

  // Méthodes spécifiques pour une meilleure DX
  const canView = useCallback((module: ModuleName): boolean => can(module, 'view'), [can]);
  const canCreate = useCallback((module: ModuleName): boolean => can(module, 'create'), [can]);
  const canEdit = useCallback((module: ModuleName): boolean => can(module, 'edit'), [can]);
  const canDelete = useCallback((module: ModuleName): boolean => can(module, 'delete'), [can]);
  const canRespond = useCallback((module: ModuleName): boolean => can(module, 'respond'), [can]);
  const canManage = useCallback((module: ModuleName): boolean => can(module, 'manage'), [can]);
  const canApprove = useCallback((module: ModuleName): boolean => can(module, 'approve'), [can]);

  // Résumé des permissions pour l'UI
  const permissionsSummary = useMemo(() => {
    const summary = {
      total: permissions.length,
      readOnly: permissions.filter(p => p.action === 'view' || p.action === 'read').length,
      writeAccess: permissions.filter(p => ['write', 'edit', 'create'].includes(p.action)).length,
      fullAccess: permissions.filter(p => p.action === 'all').length,
      role: user?.role || 'unknown',
      isManager: MANAGEMENT_ROLES.includes(user?.role as UserRole),
      isFullAccess: FULL_ACCESS_ROLES.includes(user?.role as UserRole),
      moduleAccess: {} as Record<ModuleName, boolean>
    };

    // Calculer l'accès par module
    Object.values(ModuleName).forEach(module => {
      summary.moduleAccess[module as ModuleName] = canAccess(module as ModuleName);
    });

    return summary;
  }, [permissions, user, canAccess]);

  // Vérifications spécifiques du rôle
  const roleChecks = useMemo(() => ({
    isDirector: user?.role === 'directeur',
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager',
    isChef: user?.role === 'chef',
    isEmployee: user?.role === 'employe',
    isWaiter: user?.role === 'serveur',
    isCashier: user?.role === 'caissier',
    hasManagementAccess: MANAGEMENT_ROLES.includes(user?.role as UserRole),
    hasFullAccess: FULL_ACCESS_ROLES.includes(user?.role as UserRole)
  }), [user]);

  return {
    permissions,
    isLoading,
    error,
    hasPermission,
    hasWritePermission,
    canAccess,
    can,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canRespond,
    canManage,
    canApprove,
    canManageKitchen,
    canHandleCash,
    canManageStaff,
    canViewFinancials,
    permissionsSummary,
    roleChecks,
    refreshPermissions: fetchPermissions
  };
};

// Interface simplifiée pour la compatibilité (conservée pour éviter les breaking changes)
export interface UserPermissions {
  role: string | null;
  isDirector: boolean;
  isEmployee: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageEmployees: boolean;
  canManageSettings: boolean;
  canViewStatistics: boolean;
  canManageInventory: boolean;
  canManagePermissions: boolean;
  canManageReports: boolean;
  canManageBackups: boolean;
  canAccessAdvancedFeatures: boolean;
  hasPermission: (permission: string) => boolean;
}

// Hook simplifié pour la compatibilité (utilisé dans AuthProvider)
export function useUserPermissionsCompat(): UserPermissions {
  const { user } = useAuth();

  const permissions: UserPermissions = {
    role: user?.role || null,
    isDirector: user?.role === 'directeur',
    isEmployee: ['employe', 'serveur', 'caissier', 'chef'].includes(user?.role),
    canCreate: ['directeur', 'admin', 'manager', 'employe'].includes(user?.role),
    canEdit: ['directeur', 'admin', 'manager', 'employe'].includes(user?.role),
    canDelete: ['directeur', 'admin'].includes(user?.role),
    canManageEmployees: ['directeur', 'admin', 'manager'].includes(user?.role),
    canManageSettings: ['directeur', 'admin'].includes(user?.role),
    canViewStatistics: ['directeur', 'admin', 'manager'].includes(user?.role),
    canManageInventory: ['directeur', 'admin', 'manager', 'chef'].includes(user?.role),
    canManagePermissions: ['directeur', 'admin'].includes(user?.role),
    canManageReports: ['directeur', 'admin', 'manager'].includes(user?.role),
    canManageBackups: ['directeur', 'admin'].includes(user?.role),
    canAccessAdvancedFeatures: ['directeur', 'admin'].includes(user?.role),
    hasPermission: (permission: string): boolean => {
      const permissionMap: Record<string, boolean> = {
        'customers': ['directeur', 'admin', 'manager'].includes(user?.role),
        'orders': ['directeur', 'admin', 'manager', 'employe', 'serveur', 'caissier'].includes(user?.role),
        'menu': ['directeur', 'admin', 'manager', 'chef'].includes(user?.role),
        'statistics': ['directeur', 'admin', 'manager'].includes(user?.role),
        'inventory': ['directeur', 'admin', 'manager', 'chef'].includes(user?.role),
        'employees': ['directeur', 'admin', 'manager'].includes(user?.role),
        'settings': ['directeur', 'admin'].includes(user?.role),
        'accounting': ['directeur', 'admin', 'manager'].includes(user?.role),
        'analytics': ['directeur', 'admin', 'manager'].includes(user?.role),
        'kitchen': ['directeur', 'admin', 'chef', 'manager'].includes(user?.role),
        'pos': ['directeur', 'admin', 'caissier', 'serveur'].includes(user?.role)
      };
      return permissionMap[permission] || false;
    }
  };

  return permissions;
}