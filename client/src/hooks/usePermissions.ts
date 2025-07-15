
import React from 'react';
import { useState, useEffect } from 'react';
import { DEFAULT_PERMISSIONS, type Role, type PermissionAction, type PermissionsMap } from '@/constants/permissions';

interface User {
  id: number;
  username: string;
  role: Role;
}

export function usePermissions(user: User | null) {
  const [permissions, setPermissions] = useState<PermissionsMap>({});
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
      setPermissions({});
    }
  }, [user]);

  const loadUserPermissions = async (userId: number, role: Role) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/users/${userId}/permissions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userCustomPermissions = await response.json();
        setPermissions(userCustomPermissions);
      } else {
        // Fallback vers les permissions par défaut
        setPermissions(DEFAULT_PERMISSIONS[role] || {});
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
    
    // Le directeur a TOUS les droits, toujours
    if (user.role === 'directeur') return true;

    const modulePermissions = permissions[module] || [];
    return modulePermissions.includes(action);
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
