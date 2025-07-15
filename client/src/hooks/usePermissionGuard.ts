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
      AccessDeniedComponent: () => (
        <div className="p-4 text-center">
          <div className="text-red-600 dark:text-red-400 mb-2">
            Accès refusé
          </div>
          <div className="text-gray-600 dark:text-gray-400 text-sm">
            Vous n'avez pas les permissions nécessaires pour accéder à cette fonctionnalité.
          </div>
        </div>
      )
    };
  }

  return {
    canAccess: true,
    AccessDeniedComponent: null
  };
}