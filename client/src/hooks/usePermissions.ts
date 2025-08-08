
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';

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

// Interface pour l'utilisateur
interface User {
  id: number;
  role: UserRole;
  [key: string]: unknown;
}

// Permissions par défaut optimisées
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
    analytics: ['all']
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

export const usePermissions = (userParam?: User | null) => {
  const { user: contextUser, token } = useAuth();
  const user = (userParam || contextUser) as User | null;
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

  // Méthodes de vérification des permissions
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    if (ALL_ACCESS_ROLES.includes(user.role as UserRole)) return true;

    return permissions.some(p => 
      p.resource === permission && 
      (p.action === 'all' || p.action === 'read')
    );
  }, [user, permissions]);

  const hasWritePermission = useCallback((resource: string): boolean => {
    if (!user) return false;
    if (ALL_ACCESS_ROLES.includes(user.role as UserRole)) return true;

    return permissions.some(p => 
      p.resource === resource && 
      (p.action === 'all' || p.action === 'write')
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
      readOnly: permissions.filter(p => p.action === 'view').length,
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
