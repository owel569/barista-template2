
import { useMemo, useCallback } from 'react';
import { usePermissions, type ModuleName, type PermissionAction } from './usePermissions';
import { useAuth } from './useAuth';

export interface PermissionGuardOptions {
  module: ModuleName;
  action: PermissionAction;
  fallback?: boolean;
  redirectTo?: string;
  showError?: boolean;
}

export interface PermissionGuardResult {
  allowed: boolean;
  loading: boolean;
  error: string | null;
  userRole: string | null;
  canAccess: boolean;
  reason?: string;
}

export interface AccessControlOptions {
  requireAll?: boolean;
  fallbackToRead?: boolean;
}

export const usePermissionGuard = (options: PermissionGuardOptions): PermissionGuardResult => {
  const { user, isAuthenticated } = useAuth();
  const { hasPermission, loading, error, userRole } = usePermissions();

  const result = useMemo((): PermissionGuardResult => {
    // Si pas authentifié
    if (!isAuthenticated) {
      return {
        allowed: false,
        loading: false,
        error: null,
        userRole: null,
        canAccess: false,
        reason: 'Utilisateur non authentifié'
      };
    }

    // Si en cours de chargement
    if (loading) {
      return {
        allowed: options.fallback ?? false,
        loading: true,
        error: null,
        userRole,
        canAccess: false,
        reason: 'Chargement des permissions'
      };
    }

    // Vérification de la permission
    const allowed = hasPermission(options.module, options.action);
    
    return {
      allowed,
      loading: false,
      error,
      userRole,
      canAccess: allowed,
      reason: allowed ? 'Accès autorisé' : `Permission manquante: ${options.action} sur ${options.module}`
    };
  }, [isAuthenticated, loading, hasPermission, options, error, userRole]);

  return result;
};

export const useAccessControl = () => {
  const { 
    hasPermission, 
    canView, 
    canCreate, 
    canEdit, 
    canDelete, 
    canManage,
    isAdmin,
    isManager,
    userRole 
  } = usePermissions();

  const checkAccess = useCallback((
    module: ModuleName, 
    actions: PermissionAction[], 
    options: AccessControlOptions = {}
  ): boolean => {
    if (!actions.length) return false;

    const { requireAll = false, fallbackToRead = true } = options;

    if (requireAll) {
      return actions.every(action => hasPermission(module, action));
    } else {
      const hasAnyPermission = actions.some(action => hasPermission(module, action));
      
      if (!hasAnyPermission && fallbackToRead) {
        return canView(module);
      }
      
      return hasAnyPermission;
    }
  }, [hasPermission, canView]);

  const getAccessSummary = useCallback((module: ModuleName) => {
    return {
      module,
      canView: canView(module),
      canCreate: canCreate(module),
      canEdit: canEdit(module),
      canDelete: canDelete(module),
      canManage: canManage(module),
      level: (() => {
        if (canManage(module)) return 'manage';
        if (canEdit(module) || canCreate(module)) return 'write';
        if (canView(module)) return 'read';
        return 'none';
      })()
    };
  }, [canView, canCreate, canEdit, canDelete, canManage]);

  return {
    checkAccess,
    getAccessSummary,
    hasPermission,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canManage,
    isAdmin,
    isManager,
    userRole
  };
};

export const useMultiplePermissions = (requirements: PermissionGuardOptions[]): boolean => {
  const { hasPermission } = usePermissions();
  
  return useMemo(() => {
    return requirements.every(req => hasPermission(req.module, req.action));
  }, [hasPermission, requirements]);
};
