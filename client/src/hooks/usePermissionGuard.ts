
import { useMemo } from 'react';
import { usePermissions } from './usePermissions';
import { useAuth } from './useAuth';
import type { ModuleName, PermissionAction } from './usePermissions';

export interface PermissionGuardOptions {
  module: ModuleName;
  action: PermissionAction;
  fallback?: boolean;
  redirectTo?: string;
}

export interface PermissionGuardResult {
  hasAccess: boolean;
  isLoading: boolean;
  isForbidden: boolean;
  user: any;
  error: string | null;
}

export function usePermissionGuard(
  module: ModuleName,
  action: PermissionAction,
  options?: Partial<PermissionGuardOptions>
): PermissionGuardResult {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasPermission, loading: permissionsLoading, error } = usePermissions();

  const result = useMemo(() => {
    const isLoading = authLoading || permissionsLoading;
    
    if (isLoading) {
      return {
        hasAccess: false,
        isLoading: true,
        isForbidden: false,
        user,
        error: null
      };
    }

    if (!isAuthenticated || !user) {
      return {
        hasAccess: false,
        isLoading: false,
        isForbidden: true,
        user: null,
        error: 'Utilisateur non authentifié'
      };
    }

    const hasAccess = hasPermission(module, action);

    return {
      hasAccess,
      isLoading: false,
      isForbidden: !hasAccess,
      user,
      error: hasAccess ? null : 'Accès non autorisé'
    };
  }, [isAuthenticated, user, authLoading, permissionsLoading, hasPermission, module, action, error]);

  return result;
}

// Hook utilitaire pour les composants de garde
export function useAccessControl(module: ModuleName, action: PermissionAction) {
  const guard = usePermissionGuard(module, action);
  
  return {
    ...guard,
    canAccess: guard.hasAccess,
    AccessDeniedComponent: guard.isForbidden ? 
      () => null : 
      null
  };
}

// Hook pour vérifier plusieurs permissions
export function useMultiplePermissions(permissions: Array<{ module: ModuleName; action: PermissionAction }>) {
  const { hasPermission, loading, error } = usePermissions();
  const { isAuthenticated } = useAuth();

  const results = useMemo(() => {
    if (!isAuthenticated || loading) {
      return permissions.map(() => ({ hasAccess: false, isLoading: loading }));
    }

    return permissions.map(({ module, action }) => ({
      hasAccess: hasPermission(module, action),
      isLoading: false,
      module,
      action
    }));
  }, [permissions, hasPermission, isAuthenticated, loading]);

  return {
    permissions: results,
    loading,
    error,
    hasAllPermissions: results.every(p => p.hasAccess),
    hasAnyPermission: results.some(p => p.hasAccess)
  };
}
import { useEffect } from 'react';
import { usePermissions } from './usePermissions';
import { useAuth } from '@/components/auth/AuthProvider';

export interface PermissionGuardOptions {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
  redirectTo?: string;
  onUnauthorized?: () => void;
}

export function usePermissionGuard(options: PermissionGuardOptions) {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  
  const isAuthorized = hasPermission(options.resource, options.action);

  useEffect(() => {
    if (!user) {
      if (options.redirectTo) {
        window.location.href = options.redirectTo;
      } else if (options.onUnauthorized) {
        options.onUnauthorized();
      }
      return;
    }

    if (!isAuthorized) {
      if (options.onUnauthorized) {
        options.onUnauthorized();
      } else if (options.redirectTo) {
        window.location.href = options.redirectTo;
      } else {
        console.warn(`Permission denied: ${options.action} on ${options.resource}`);
      }
    }
  }, [user, isAuthorized, options]);

  return {
    isAuthorized,
    isAuthenticated: !!user,
  };
}
