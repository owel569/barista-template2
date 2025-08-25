
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

// Types pour une meilleure type safety
export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'respond' | 'use' | 'all' | 'read' | 'write';
export type UserRole = 'directeur' | 'employe' | 'admin';
export type ModuleName = 'dashboard' | 'reservations' | 'orders' | 'customers' | 'menu' | 'messages' | 'employees' | 'settings' | 'inventory' | 'analytics' | 'maintenance';

export interface Permission {
  id: number;
  resource: string;
  action: PermissionAction;
  module: ModuleName;
  enabled: boolean;
}

export interface PermissionsMap {
  [key: string]: PermissionAction[];
}

// Interface pour l'utilisateur avec la logique métier
interface BasicUser {
  id: number;
  role: UserRole;
  [key: string]: unknown;
}

// Permissions par défaut selon la logique métier du café
const DEFAULT_PERMISSIONS: Record<UserRole, PermissionsMap> = {
  directeur: {
    dashboard: ['all'],
    reservations: ['all'],
    orders: ['all'],
    customers: ['all'], // Directeur a accès complet aux clients
    menu: ['all'],
    messages: ['all'],
    employees: ['all'],
    settings: ['all'],
    inventory: ['all'],
    analytics: ['all']
  },
  employe: {
    dashboard: ['view'],
    reservations: ['view', 'create', 'edit'],
    orders: ['view', 'create'],
    customers: ['view'], // Employé peut seulement voir les clients
    menu: ['view'],
    messages: ['view', 'respond'],
    employees: ['view'],
    settings: ['view'],
    inventory: ['view'],
    analytics: ['view']
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
    analytics: ['all']
  }
};

// Rôles avec accès complet
const ALL_ACCESS_ROLES: UserRole[] = ['directeur', 'admin'];

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
export const usePermissions = (userParam?: BasicUser | null) => {
  const { user: contextUser, token } = useAuth();
  const user = (userParam || contextUser) as BasicUser | null;
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = useCallback(async () => {
    if (!user || !token) {
      setPermissions([]);
      setIsLoading(false);
      return;
    }

    const cacheKey = `${user.id}_${user.role}`;
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
        throw new Error('Erreur lors du chargement des permissions');
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
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // Logique métier pour les permissions
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    if (ALL_ACCESS_ROLES.includes(user.role as UserRole)) return true;

    // Logique spécifique pour les customers selon le rôle
    if (permission === 'customers') {
      return user.role === 'directeur' || user.role === 'admin';
    }

    return permissions.some(p => 
      p.resource === permission && 
      (p.action === 'all' || p.action === 'read' || p.action === 'view')
    );
  }, [user, permissions]);

  const hasWritePermission = useCallback((resource: string): boolean => {
    if (!user) return false;
    if (ALL_ACCESS_ROLES.includes(user.role as UserRole)) return true;

    // Logique métier pour l'écriture sur les customers
    if (resource === 'customers') {
      return user.role === 'directeur' || user.role === 'admin';
    }

    return permissions.some(p => 
      p.resource === resource && 
      (p.action === 'all' || p.action === 'write' || p.action === 'create' || p.action === 'edit')
    );
  }, [user, permissions]);

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
      'messages': 'messages'
    };

    return hasPermission(modulePermissions[module] || module);
  }, [hasPermission]);

  // Méthode générique can() pour éviter la répétition
  const can = useCallback((module: ModuleName, action: PermissionAction): boolean => {
    if (!user) return false;
    if (ALL_ACCESS_ROLES.includes(user.role as UserRole)) return true;

    // Logique métier spécifique pour les customers
    if (module === 'customers') {
      switch (action) {
        case 'view':
        case 'read':
          return true; // Tous peuvent voir les clients
        case 'create':
        case 'edit':
        case 'delete':
        case 'write':
        case 'all':
          return user.role === 'directeur' || user.role === 'admin';
        default:
          return false;
      }
    }

    return permissions.some(p => 
      p.resource === module && 
      (p.action === 'all' || p.action === action)
    );
  }, [user, permissions]);

  // Méthodes spécifiques pour une meilleure DX
  const canView = useCallback((module: ModuleName): boolean => can(module, 'view'), [can]);
  const canCreate = useCallback((module: ModuleName): boolean => can(module, 'create'), [can]);
  const canEdit = useCallback((module: ModuleName): boolean => can(module, 'edit'), [can]);
  const canDelete = useCallback((module: ModuleName): boolean => can(module, 'delete'), [can]);
  const canRespond = useCallback((module: ModuleName): boolean => can(module, 'respond'), [can]);

  // Résumé des permissions pour l'UI
  const permissionsSummary = useMemo(() => {
    return {
      total: permissions.length,
      readOnly: permissions.filter(p => p.action === 'view' || p.action === 'read').length,
      writeAccess: permissions.filter(p => p.action === 'write' || p.action === 'all').length,
      fullAccess: permissions.filter(p => p.action === 'all').length
    };
  }, [permissions]);

  // Vérification du rôle directeur
  const isDirector = useMemo(() => {
    return user?.role === 'directeur' || user?.role === 'admin';
  }, [user]);

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
    permissionsSummary,
    isDirector,
    refreshPermissions: fetchPermissions
  };
};

// Interface simplifiée pour la compatibilité avec AuthProvider
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
export function useUserPermissions(): UserPermissions {
  const { user } = useAuth();
  
  const permissions: UserPermissions = {
    role: user?.role || null,
    isDirector: user?.role === 'directeur',
    isEmployee: user?.role === 'employe',
    canCreate: user?.role === 'directeur' || user?.role === 'employe',
    canEdit: user?.role === 'directeur' || user?.role === 'employe',
    canDelete: user?.role === 'directeur',
    canManageEmployees: user?.role === 'directeur',
    canManageSettings: user?.role === 'directeur',
    canViewStatistics: user?.role === 'directeur',
    canManageInventory: user?.role === 'directeur',
    canManagePermissions: user?.role === 'directeur',
    canManageReports: user?.role === 'directeur',
    canManageBackups: user?.role === 'directeur',
    canAccessAdvancedFeatures: user?.role === 'directeur',
    hasPermission: (permission: string): boolean => {
      const permissionMap: Record<string, boolean> = {
        'customers': user?.role === 'directeur', // Logique métier correcte
        'orders': user?.role === 'directeur' || user?.role === 'employe',
        'menu': user?.role === 'directeur' || user?.role === 'employe',
        'statistics': user?.role === 'directeur',
        'inventory': user?.role === 'directeur',
        'employees': user?.role === 'directeur',
        'settings': user?.role === 'directeur',
      };
      return permissionMap[permission] || false;
    }
  };
  
  return permissions;
}
