
import { useState, useEffect } from 'react';
import { 
  DEFAULT_PERMISSIONS, 
  ALL_ACCESS_ROLES,
  type Role, 
  type PermissionAction, 
  type PermissionsMap 
} from '@/constants/permissions';
import { STORAGE_KEYS } from '@/constants/storage';

interface User {
  id: number;
  username: string;
  role: Role;
}

export function usePermissions(user: User | null) {
  const [permissions, setPermissions] = useState<PermissionsMap>({)});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && user.role) {
      // Le directeur a automatiquement tous les droits selon DEFAULT_PERMISSIONS
      if (user.role === 'directeur') {
        setPermissions(DEFAULT_PERMISSIONS.directeur);
      } else {
        // Pour les employés, charger les permissions depuis l'API ou utiliser les permissions par défaut
        loadUserPermissions(user.id, user.role);
      }
    } else {
      setPermissions({)});
    }
  }, [user]);

  const loadUserPermissions = async (userId: number, role: Role) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.token);
      if (!token) {
        setPermissions(DEFAULT_PERMISSIONS[role] || {});
        return;
      }
      
      const response = await fetch(`/api/admin/users/${userId}/permissions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userCustomPermissions = await response.json();
        if (userCustomPermissions && typeof userCustomPermissions === 'object') {
          setPermissions(userCustomPermissions);
        } else {
          throw new Error('Invalid permissions data');
        }
      } else {
        // Fallback vers les permissions par défaut
        setPermissions(DEFAULT_PERMISSIONS[role] || {)});
      }
    } catch (error) {
      console.error('Erreur lors du chargement des permissions:', error);
      // Fallback vers les permissions par défaut
      setPermissions(DEFAULT_PERMISSIONS[role] || {});
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = (module: string, action: PermissionAction): boolean => {
    if (!user) return false;
    
    // Stratégie fallback plus précise avec ALL_ACCESS_ROLES
    if (user && ALL_ACCESS_ROLES.includes(user.role)) return true;

    const modulePermissions = permissions[module] || [];
    return modulePermissions.includes(action);
  };

  // Méthode générique pour éviter la répétition
  const can = (module: string, action: PermissionAction): boolean => {
    return hasPermission(module, action);
  };

  const canView = (module: string): boolean => {
    return hasPermission(module, 'view');
  };

  const canCreate = (module: string): boolean => {
    return hasPermission(module, 'create');
  };

  const canEdit = (module: string): boolean => {
    return hasPermission(module, 'edit');
  };

  const canDelete = (module: string): boolean => {
    return hasPermission(module, 'delete');
  };

  const canRespond = (module: string): boolean => {
    return hasPermission(module, 'respond');
  };

  const canUse = (module: string): boolean => {
    return hasPermission(module, 'use');
  };

  // Fonction pour rafraîchir les permissions (utile après une modification)
  const refreshPermissions = () => {
    if (user && user.role !== 'directeur') {
      loadUserPermissions(user.id, user.role);
    }
  };

  return {
    permissions,
    isLoading,
    hasPermission,
    can,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canRespond,
    canUse,
    refreshPermissions,
    // Méthodes utilitaires
    isDirector: user?.role === 'directeur',
    isEmployee: user?.role === 'employe'
  };
}
