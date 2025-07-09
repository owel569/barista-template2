import { useState, useEffect } from 'react';

export interface UserPermissions {
  [module: string]: {
    canView: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  };
}

export function usePermissions(userRole?: 'directeur' | 'employe') {
  const [permissions, setPermissions] = useState<UserPermissions>({});

  useEffect(() => {
    // Définir les permissions par défaut selon le rôle
    const defaultPermissions: UserPermissions = {};
    
    if (userRole === 'directeur') {
      // Directeur a tous les droits sur tous les modules
      const modules = ['dashboard', 'reservations', 'orders', 'customers', 'menu', 'messages', 'employees', 'settings', 'statistics', 'logs', 'permissions', 'inventory', 'loyalty', 'work-schedule'];
      modules.forEach(module => {
        defaultPermissions[module] = {
          canView: true,
          canCreate: true,
          canUpdate: true,
          canDelete: true
        };
      });
    } else if (userRole === 'employe') {
      // Employé a des permissions limitées
      defaultPermissions['dashboard'] = { canView: true, canCreate: false, canUpdate: false, canDelete: false };
      defaultPermissions['reservations'] = { canView: true, canCreate: true, canUpdate: true, canDelete: false };
      defaultPermissions['orders'] = { canView: true, canCreate: true, canUpdate: true, canDelete: false };
      defaultPermissions['customers'] = { canView: true, canCreate: false, canUpdate: false, canDelete: false };
      defaultPermissions['menu'] = { canView: true, canCreate: true, canUpdate: true, canDelete: false };
      defaultPermissions['messages'] = { canView: true, canCreate: true, canUpdate: true, canDelete: false };
      defaultPermissions['statistics'] = { canView: true, canCreate: false, canUpdate: false, canDelete: false };
      defaultPermissions['logs'] = { canView: true, canCreate: false, canUpdate: false, canDelete: false };
      defaultPermissions['inventory'] = { canView: true, canCreate: false, canUpdate: false, canDelete: false };
      defaultPermissions['loyalty'] = { canView: true, canCreate: false, canUpdate: false, canDelete: false };
      defaultPermissions['work-schedule'] = { canView: true, canCreate: false, canUpdate: false, canDelete: false };
      
      // Modules interdits pour les employés
      defaultPermissions['employees'] = { canView: false, canCreate: false, canUpdate: false, canDelete: false };
      defaultPermissions['settings'] = { canView: false, canCreate: false, canUpdate: false, canDelete: false };
      defaultPermissions['permissions'] = { canView: false, canCreate: false, canUpdate: false, canDelete: false };
    }

    setPermissions(defaultPermissions);
  }, [userRole]);

  const hasPermission = (module: string, action: 'view' | 'create' | 'update' | 'delete'): boolean => {
    const modulePermissions = permissions[module];
    if (!modulePermissions) return false;

    switch (action) {
      case 'view':
        return modulePermissions.canView;
      case 'create':
        return modulePermissions.canCreate;
      case 'update':
        return modulePermissions.canUpdate;
      case 'delete':
        return modulePermissions.canDelete;
      default:
        return false;
    }
  };

  const canAccessModule = (module: string): boolean => {
    return hasPermission(module, 'view');
  };

  return {
    permissions,
    hasPermission,
    canAccessModule
  };
}