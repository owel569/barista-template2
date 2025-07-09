import { useMemo } from 'react';

export function usePermissions(userRole: 'directeur' | 'employe') {
  const permissions = useMemo(() => {
    const basePermissions = {
      dashboard: { view: true, edit: false, delete: false, create: false },
      reservations: { view: true, edit: true, delete: false, create: true },
      orders: { view: true, edit: true, delete: false, create: true },
      customers: { view: true, edit: false, delete: false, create: false },
      menu: { view: true, edit: true, delete: false, create: true },
      messages: { view: true, edit: true, delete: false, create: true },
      employees: { view: false, edit: false, delete: false, create: false },
      settings: { view: false, edit: false, delete: false, create: false },
      statistics: { view: true, edit: false, delete: false, create: false },
      logs: { view: true, edit: false, delete: false, create: false },
      permissions: { view: false, edit: false, delete: false, create: false },
      inventory: { view: true, edit: true, delete: false, create: true },
      loyalty: { view: true, edit: true, delete: false, create: true },
      notifications: { view: true, edit: false, delete: false, create: false }
    };

    if (userRole === 'directeur') {
      // Le directeur a tous les droits
      Object.keys(basePermissions).forEach(module => {
        basePermissions[module as keyof typeof basePermissions] = {
          view: true,
          edit: true,
          delete: true,
          create: true
        };
      });
    }

    return basePermissions;
  }, [userRole]);

  const hasPermission = (module: string, action: 'view' | 'edit' | 'delete' | 'create') => {
    if (userRole === 'directeur') return true;
    
    const modulePermissions = permissions[module as keyof typeof permissions];
    if (!modulePermissions) return false;
    
    return modulePermissions[action];
  };

  const canAccess = (module: string) => {
    return hasPermission(module, 'view');
  };

  return {
    permissions,
    hasPermission,
    canAccess,
    userRole
  };
}