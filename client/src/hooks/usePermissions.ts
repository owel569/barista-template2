import { useState, useEffect } from 'react';

interface UserPermissions {
  role: 'directeur' | 'employe';
  modules: {
    [key: string]: {
      canView: boolean;
      canCreate: boolean;
      canUpdate: boolean;
      canDelete: boolean;
    };
  };
}

export function usePermissions() {
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    // Récupérer les informations utilisateur depuis le token
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userRole = payload.role || 'employe';

      // Définir les permissions selon le rôle
      const defaultPermissions: UserPermissions = {
        role: userRole,
        modules: {}
      };

      if (userRole === 'directeur') {
        // Directeur : tous les droits sur tous les modules
        const modules = [
          'dashboard', 'reservations', 'orders', 'customers', 'menu', 
          'messages', 'employees', 'settings', 'statistics', 'logs',
          'permissions', 'inventory', 'loyalty', 'accounting', 'backups',
          'reports', 'calendar', 'suppliers', 'maintenance', 'notifications'
        ];
        
        modules.forEach(module => {
          defaultPermissions.modules[module] = {
            canView: true,
            canCreate: true,
            canUpdate: true,
            canDelete: true
          };
        });
      } else {
        // Employé : permissions limitées
        defaultPermissions.modules = {
          dashboard: { canView: true, canCreate: false, canUpdate: false, canDelete: false },
          reservations: { canView: true, canCreate: true, canUpdate: true, canDelete: false },
          orders: { canView: true, canCreate: true, canUpdate: true, canDelete: false },
          customers: { canView: true, canCreate: false, canUpdate: false, canDelete: false },
          menu: { canView: true, canCreate: true, canUpdate: true, canDelete: false },
          messages: { canView: true, canCreate: false, canUpdate: true, canDelete: false },
          statistics: { canView: true, canCreate: false, canUpdate: false, canDelete: false },
          inventory: { canView: true, canCreate: false, canUpdate: true, canDelete: false },
          loyalty: { canView: true, canCreate: false, canUpdate: true, canDelete: false },
          // Modules non accessibles aux employés
          employees: { canView: false, canCreate: false, canUpdate: false, canDelete: false },
          settings: { canView: false, canCreate: false, canUpdate: false, canDelete: false },
          logs: { canView: false, canCreate: false, canUpdate: false, canDelete: false },
          permissions: { canView: false, canCreate: false, canUpdate: false, canDelete: false },
          accounting: { canView: false, canCreate: false, canUpdate: false, canDelete: false },
          backups: { canView: false, canCreate: false, canUpdate: false, canDelete: false },
          reports: { canView: false, canCreate: false, canUpdate: false, canDelete: false },
          calendar: { canView: true, canCreate: false, canUpdate: false, canDelete: false },
          suppliers: { canView: false, canCreate: false, canUpdate: false, canDelete: false },
          maintenance: { canView: false, canCreate: false, canUpdate: false, canDelete: false },
          notifications: { canView: true, canCreate: false, canUpdate: false, canDelete: false }
        };
      }

      setPermissions(defaultPermissions);
    } catch (error) {
      console.error('Erreur lors du décodage du token:', error);
    }
    
    setIsLoading(false);
  }, []);

  const hasPermission = (module: string, action: 'view' | 'create' | 'update' | 'delete') => {
    if (!permissions) return false;
    const modulePermissions = permissions.modules[module];
    if (!modulePermissions) return false;
    
    switch (action) {
      case 'view': return modulePermissions.canView;
      case 'create': return modulePermissions.canCreate;
      case 'update': return modulePermissions.canUpdate;
      case 'delete': return modulePermissions.canDelete;
      default: return false;
    }
  };

  const isDirecteur = permissions?.role === 'directeur';
  const isEmploye = permissions?.role === 'employe';

  return {
    permissions,
    isLoading,
    hasPermission,
    isDirecteur,
    isEmploye
  };
}