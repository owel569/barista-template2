import { useContext } from 'react';
import { AuthContext } from '@/contexts/auth-context';
import { DEFAULT_DIRECTEUR_PERMISSIONS, DEFAULT_EMPLOYE_PERMISSIONS, type ModulePermissions } from '@/types/admin';

export const usePermissions = () => {
  const { user } = useContext(AuthContext);

  const getPermissions = (): ModulePermissions => {
    if (!user) return {};
    
    if (user.role === 'directeur') {
      return DEFAULT_DIRECTEUR_PERMISSIONS;
    } else if (user.role === 'employe') {
      return DEFAULT_EMPLOYE_PERMISSIONS;
    }
    
    return {};
  };

  const hasPermission = (module: string, action: 'view' | 'create' | 'update' | 'delete'): boolean => {
    const permissions = getPermissions();
    return permissions[module]?.[action] ?? false;
  };

  const canAccess = (module: string): boolean => {
    return hasPermission(module, 'view');
  };

  const canCreate = (module: string): boolean => {
    return hasPermission(module, 'create');
  };

  const canUpdate = (module: string): boolean => {
    return hasPermission(module, 'update');
  };

  const canDelete = (module: string): boolean => {
    return hasPermission(module, 'delete');
  };

  return {
    permissions: getPermissions(),
    hasPermission,
    canAccess,
    canCreate,
    canUpdate,
    canDelete,
    isDirecteur: user?.role === 'directeur',
    isEmploye: user?.role === 'employe'
  };
};