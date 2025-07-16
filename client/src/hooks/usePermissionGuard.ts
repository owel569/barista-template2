// Hook inversé usePermissionGuard - Amélioration des attached_assets
import { usePermissions } from './usePermissions';
import { useAuth } from './useAuth';
import type { PermissionAction } from '@/constants/permissions';

export function usePermissionGuard(module: string, action: PermissionAction) {
  const { user } = useAuth();
  const { hasPermission } = usePermissions(user);

  const isForbidden = !hasPermission(module, action);
  const hasAccess = hasPermission(module, action);

  return {
    isForbidden,
    hasAccess,
    user,
    isLoading: false // TODO: ajouter le loading si nécessaire
  };
}

// Hook utilitaire pour les composants de garde
export function useAccessControl(module: string, action: PermissionAction) {
  const guard = usePermissionGuard(module, action);
  
  if (guard.isForbidden) {
    return {
      canAccess: false,
      AccessDeniedComponent: () => null as React.ReactElement
    };
  }

  return {
    canAccess: true,
    AccessDeniedComponent: null
  };
}