import { useMemo } from 'react';
import { User } from '@/types/admin';

export interface PermissionConfig {
  canView: (module: string) => boolean;
  canCreate: (module: string) => boolean;
  canModify: (module: string) => boolean;
  canDelete: (module: string) => boolean;
}

export function usePermissions(user: User | null): PermissionConfig {
  return useMemo(() => {
    if (!user) {
      return {
        canView: () => false,
        canCreate: () => false,
        canModify: () => false,
        canDelete: () => false,
      };
    }

    const isDirecteur = user.role === 'directeur';

    return {
      canView: (module: string) => {
        // Tous les modules sont visibles sauf pour les employés sur certains modules
        if (isDirecteur) return true;
        
        // Modules interdits aux employés
        const forbiddenModules = ['employees', 'settings', 'users', 'statistics', 'activity-logs'];
        return !forbiddenModules.includes(module);
      },

      canCreate: (module: string) => {
        if (isDirecteur) return true;
        
        // Employés peuvent créer dans certains modules
        const allowedModules = ['reservations', 'orders', 'menu'];
        return allowedModules.includes(module);
      },

      canModify: (module: string) => {
        if (isDirecteur) return true;
        
        // Employés peuvent modifier dans certains modules
        const allowedModules = ['reservations', 'orders', 'menu', 'messages'];
        
        // Clients en lecture seule pour les employés
        if (module === 'customers') return false;
        
        return allowedModules.includes(module);
      },

      canDelete: (module: string) => {
        // Seuls les directeurs peuvent supprimer
        return isDirecteur;
      },
    };
  }, [user]);
}