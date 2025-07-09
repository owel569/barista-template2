import { useMemo } from 'react';
import { User } from '../../types/admin';

export function usePermissions(user: User | null) {
  return useMemo(() => {
    const isDirecteur = user?.role === 'directeur';
    const isEmploye = user?.role === 'employe';

    // Permissions par module selon le rôle
    const permissions = {
      dashboard: {
        canView: true,
        canCreate: false,
        canEdit: false,
        canDelete: false,
      },
      reservations: {
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: isDirecteur,
      },
      orders: {
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: isDirecteur,
      },
      customers: {
        canView: true,
        canCreate: isDirecteur,
        canEdit: isDirecteur,
        canDelete: isDirecteur,
      },
      employees: {
        canView: isDirecteur,
        canCreate: isDirecteur,
        canEdit: isDirecteur,
        canDelete: isDirecteur,
      },
      menu: {
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: isDirecteur,
      },
      messages: {
        canView: true,
        canCreate: false,
        canEdit: true,
        canDelete: isDirecteur,
      },
      settings: {
        canView: isDirecteur,
        canCreate: isDirecteur,
        canEdit: isDirecteur,
        canDelete: isDirecteur,
      },
      statistics: {
        canView: true,
        canCreate: false,
        canEdit: false,
        canDelete: false,
      },
      logs: {
        canView: isDirecteur,
        canCreate: false,
        canEdit: false,
        canDelete: isDirecteur,
      },
      permissions: {
        canView: isDirecteur,
        canCreate: isDirecteur,
        canEdit: isDirecteur,
        canDelete: isDirecteur,
      },
      inventory: {
        canView: true,
        canCreate: isDirecteur,
        canEdit: isDirecteur,
        canDelete: isDirecteur,
      },
      loyalty: {
        canView: true,
        canCreate: isDirecteur,
        canEdit: isDirecteur,
        canDelete: isDirecteur,
      },
      'work-schedule': {
        canView: true,
        canCreate: isDirecteur,
        canEdit: isDirecteur,
        canDelete: isDirecteur,
      },
    };

    // Fonctions helper
    const hasAccess = (module: string) => {
      return permissions[module as keyof typeof permissions]?.canView ?? false;
    };

    const canView = (module: string) => {
      return permissions[module as keyof typeof permissions]?.canView ?? false;
    };

    const canCreate = (module: string) => {
      return permissions[module as keyof typeof permissions]?.canCreate ?? false;
    };

    const canModify = (module: string) => {
      return permissions[module as keyof typeof permissions]?.canEdit ?? false;
    };

    const canDelete = (module: string) => {
      return permissions[module as keyof typeof permissions]?.canDelete ?? false;
    };

    return {
      isDirecteur,
      isEmploye,
      permissions,
      hasAccess,
      canView,
      canCreate,
      canModify,
      canDelete,
    };
  }, [user]);
}