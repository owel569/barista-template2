import { useState, useEffect } from 'react';

interface Permission {
  module: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

interface User {
  id: number;
  username: string;
  role: 'directeur' | 'employe';
}

export function usePermissions(user: User | null) {
  const [permissions, setPermissions] = useState<Record<string, Permission>>({});

  useEffect(() => {
    if (!user) return;

    // Définir les permissions selon le rôle
    const defaultPermissions: Record<string, Permission> = {
      dashboard: { module: 'dashboard', canView: true, canCreate: false, canEdit: false, canDelete: false },
      reservations: { 
        module: 'reservations', 
        canView: true, 
        canCreate: true, 
        canEdit: true, 
        canDelete: user.role === 'directeur' 
      },
      orders: { 
        module: 'orders', 
        canView: true, 
        canCreate: true, 
        canEdit: true, 
        canDelete: user.role === 'directeur' 
      },
      customers: { 
        module: 'customers', 
        canView: true, 
        canCreate: user.role === 'directeur', 
        canEdit: user.role === 'directeur', 
        canDelete: user.role === 'directeur' 
      },
      menu: { 
        module: 'menu', 
        canView: true, 
        canCreate: true, 
        canEdit: true, 
        canDelete: user.role === 'directeur' 
      },
      messages: { 
        module: 'messages', 
        canView: true, 
        canCreate: false, 
        canEdit: true, 
        canDelete: user.role === 'directeur' 
      },
      employees: { 
        module: 'employees', 
        canView: user.role === 'directeur', 
        canCreate: user.role === 'directeur', 
        canEdit: user.role === 'directeur', 
        canDelete: user.role === 'directeur' 
      },
      settings: { 
        module: 'settings', 
        canView: user.role === 'directeur', 
        canCreate: user.role === 'directeur', 
        canEdit: user.role === 'directeur', 
        canDelete: user.role === 'directeur' 
      },
      statistics: { 
        module: 'statistics', 
        canView: user.role === 'directeur', 
        canCreate: false, 
        canEdit: false, 
        canDelete: false 
      },
      logs: { 
        module: 'logs', 
        canView: user.role === 'directeur', 
        canCreate: false, 
        canEdit: false, 
        canDelete: false 
      }
    };

    setPermissions(defaultPermissions);
  }, [user]);

  const hasPermission = (module: string, action: 'view' | 'create' | 'edit' | 'delete'): boolean => {
    const permission = permissions[module];
    if (!permission) return false;

    switch (action) {
      case 'view': return permission.canView;
      case 'create': return permission.canCreate;
      case 'edit': return permission.canEdit;
      case 'delete': return permission.canDelete;
      default: return false;
    }
  };

  return { 
    permissions, 
    hasPermission,
    canView: (module: string) => hasPermission(module, 'view'),
    canCreate: (module: string) => hasPermission(module, 'create'),
    canEdit: (module: string) => hasPermission(module, 'edit'),
    canDelete: (module: string) => hasPermission(module, 'delete')
  };
}