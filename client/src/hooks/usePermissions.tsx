import { useState, useCallback, useMemo } from 'react';

// Types simplifiés intégrés pour éviter les imports problématiques
interface Permission {
  id: number;
  name: string;
  action: string;
}

interface MockUser {
  id: number;
  role: string;
}

type UserRole = 'directeur' | 'employe' | 'admin';

// Hook simplifié pour éviter les problèmes de dépendances
export const usePermissions = (userParam?: unknown) => {
  const [permissions] = useState<Permission[]>([]);
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);

  const hasPermission = useCallback((permission: string): boolean => {
    // Logique de permissions basée sur les rôles
    const user = userParam as MockUser | undefined;
    if (!user || !user.role) return false;
    
    // Admin a toutes les permissions
    if (user.role === 'admin') return true;
    
    // Directeur a la plupart des permissions
    if (user.role === 'directeur') {
      const restrictedPermissions = ['system:delete', 'security:critical'];
      return !restrictedPermissions.includes(permission);
    }
    
    // Employé a des permissions limitées
    if (user.role === 'employe') {
      const allowedPermissions = ['orders:read', 'customers:read', 'inventory:read'];
      return allowedPermissions.some(allowed => permission.startsWith(allowed));
    }
    
    return false;
  }, [userParam]);

  const hasWritePermission = useCallback((resource: string): boolean => {
    return hasPermission(`${resource}:write`);
  }, [hasPermission]);

  const canAccess = useCallback((module: string): boolean => {
    return hasPermission(module);
  }, [hasPermission]);

  const permissionsSummary = useMemo(() => ({
    total: permissions.length,
    readOnly: 0,
    writeAccess: 0,
    fullAccess: 0,
  }), [permissions]);

  const refreshPermissions = useCallback(async () => {
    // Fonction vide temporaire
  }, []);

  return {
    permissions,
    isLoading,
    error,
    hasPermission,
    hasWritePermission,
    canAccess,
    permissionsSummary,
    refreshPermissions,
  };
};

// Export de compatibilité pour les anciens composants
export const useUserPermissionsCompat = usePermissions;

export default usePermissions;