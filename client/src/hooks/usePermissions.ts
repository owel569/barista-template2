import { useMemo } from 'react';
import { User, ModulePermissions } from '@/types/admin';

// Définir les permissions par défaut pour chaque rôle
const DEFAULT_PERMISSIONS: Record<'directeur' | 'employe', ModulePermissions> = {
  directeur: {
    dashboard: { canView: true, canCreate: true, canUpdate: true, canDelete: true },
    reservations: { canView: true, canCreate: true, canUpdate: true, canDelete: true },
    orders: { canView: true, canCreate: true, canUpdate: true, canDelete: true },
    customers: { canView: true, canCreate: true, canUpdate: true, canDelete: true },
    menu: { canView: true, canCreate: true, canUpdate: true, canDelete: true },
    messages: { canView: true, canCreate: true, canUpdate: true, canDelete: true },
    employees: { canView: true, canCreate: true, canUpdate: true, canDelete: true },
    settings: { canView: true, canCreate: true, canUpdate: true, canDelete: true },
    statistics: { canView: true, canCreate: true, canUpdate: true, canDelete: true },
    logs: { canView: true, canCreate: true, canUpdate: true, canDelete: true },
  },
  employe: {
    dashboard: { canView: true, canCreate: false, canUpdate: false, canDelete: false },
    reservations: { canView: true, canCreate: true, canUpdate: true, canDelete: false },
    orders: { canView: true, canCreate: false, canUpdate: true, canDelete: false },
    customers: { canView: true, canCreate: false, canUpdate: false, canDelete: false },
    menu: { canView: true, canCreate: true, canUpdate: true, canDelete: false },
    messages: { canView: true, canCreate: false, canUpdate: true, canDelete: false },
    employees: { canView: false, canCreate: false, canUpdate: false, canDelete: false },
    settings: { canView: false, canCreate: false, canUpdate: false, canDelete: false },
    statistics: { canView: false, canCreate: false, canUpdate: false, canDelete: false },
    logs: { canView: false, canCreate: false, canUpdate: false, canDelete: false },
  },
};

export function usePermissions(user: User | null) {
  const permissions = useMemo(() => {
    if (!user) return {};
    return DEFAULT_PERMISSIONS[user.role] || {};
  }, [user]);

  const hasPermission = (module: string, action: 'view' | 'create' | 'update' | 'delete'): boolean => {
    const modulePerms = permissions[module];
    if (!modulePerms) return false;

    const actionKey = `can${action.charAt(0).toUpperCase() + action.slice(1)}` as keyof typeof modulePerms;
    return Boolean(modulePerms[actionKey]);
  };

  const canAccess = (module: string): boolean => {
    return hasPermission(module, 'view');
  };

  const canModify = (module: string): boolean => {
    return hasPermission(module, 'create') || hasPermission(module, 'update');
  };

  const canDelete = (module: string): boolean => {
    return hasPermission(module, 'delete');
  };

  const isDirecteur = user?.role === 'directeur';
  const isEmploye = user?.role === 'employe';

  return {
    permissions,
    hasPermission,
    canAccess,
    canModify,
    canDelete,
    isDirecteur,
    isEmploye,
  };
}