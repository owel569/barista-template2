import { useState, useCallback, useMemo } from 'react';

// Types optimisés pour le système de permissions
interface Permission {
  id: number;
  name: string;
  action: string;
}

// Interface utilisateur authentifié (compatible avec AuthUser)
interface AuthUser {
  id: number;
  username?: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  permissions?: string[];
  isActive: boolean;
}

type UserRole = 'directeur' | 'gerant' | 'employe' | 'customer';

// Hook optimisé pour les permissions avec typage strict
export const usePermissions = (userParam?: AuthUser | null) => {
  const [permissions] = useState<Permission[]>([]);
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);

  const hasPermission = useCallback((permission: string): boolean => {
    // Logique de permissions basée sur les rôles et permissions utilisateur
    const user = userParam;
    
    // Validation stricte de l'utilisateur et du rôle
    if (!user || !user.role || !user.isActive) {
      console.warn('Utilisateur invalide ou inactif:', { user });
      return false;
    }
    
    // Validation du rôle
    if (!['directeur', 'gerant', 'employe'].includes(user.role)) {
      console.warn('Rôle utilisateur invalide:', user.role);
      return false;
    }
    
    // Vérifier d'abord les permissions explicites de l'utilisateur
    if (user.permissions && user.permissions.includes(permission)) {
      return true;
    }

    // Directeur a accès complet à tout
    if (user.role === 'directeur') return true;
    
    // Gérant a accès à la plupart des modules
    if (user.role === 'gerant') {
      const restrictedPermissions = [
        'system:delete', 'security:critical', 'permissions:delete',
        'backup:delete', 'users:delete'
      ];
      return !restrictedPermissions.includes(permission);
    }
    
    // Employé a accès aux opérations quotidiennes
    if (user.role === 'employe') {
      const allowedPermissions = [
        'dashboard:view', 'orders:view', 'orders:create', 'orders:edit',
        'customers:view', 'customers:create', 'inventory:view',
        'reservations:view', 'reservations:create', 'reservations:edit',
        'menu:view', 'tables:view', 'tables:edit',
        'pos:view', 'pos:create'
      ];
      return allowedPermissions.includes(permission) || 
             allowedPermissions.some(allowed => permission.startsWith(allowed.split(':')[0] + ':'));
    }
    
    // Customer a accès uniquement aux fonctions publiques
    if (user.role === 'customer') {
      const allowedPermissions = [
        'orders:create', 'reservations:create', 'menu:view', 
        'profile:view', 'profile:edit'
      ];
      return allowedPermissions.includes(permission);
    }
    
    return false;
  }, [userParam]);

  const hasWritePermission = useCallback((resource: string): boolean => {
    return hasPermission(`${resource}:write`);
  }, [hasPermission]);

  const canAccess = useCallback((module: string): boolean => {
    return hasPermission(`${module}:view`) || hasPermission(module);
  }, [hasPermission]);

  // Fonctions utilitaires pour les rôles
  const isAdmin = useCallback((): boolean => {
    return userParam?.role === 'directeur';
  }, [userParam]);

  const isManager = useCallback((): boolean => {
    return userParam?.role === 'gerant' || userParam?.role === 'directeur';
  }, [userParam]);

  const isEmployee = useCallback((): boolean => {
    return ['directeur', 'gerant', 'employe'].includes(userParam?.role || '');
  }, [userParam]);

  const canAccessAdmin = useCallback((): boolean => {
    return ['directeur', 'gerant', 'employe'].includes(userParam?.role || '');
  }, [userParam]);

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
    // Nouvelles fonctions utilitaires
    isAdmin,
    isManager,
    isEmployee,
    canAccessAdmin,
    // Informations utilisateur
    userRole: userParam?.role,
    userId: userParam?.id,
    isUserActive: userParam?.isActive ?? false
  };
};

// Export de compatibilité pour les anciens composants
export const useUserPermissionsCompat = usePermissions;

export default usePermissions;