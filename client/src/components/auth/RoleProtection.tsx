/**
 * Composant de protection basé sur les rôles et permissions
 * Sécurité avancée pour l'interface admin
 */

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, Lock } from 'lucide-react';
import { 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions, 
  canAccessModule,
  ROLE_CONFIG,
  type Permission,
  type AuthenticatedUser,
  type PermissionCheckProps,
  type RoleProtectedProps,
  type AdminModule
} from '@/types/permissions';

/**
 * Vérification d'une permission unique
 */
export const PermissionCheck: React.FC<PermissionCheckProps> = ({
  user,
  permission,
  children,
  fallback
}) => {
  if (!hasPermission(user, permission)) {
    return fallback || (
      <Alert className="border-red-200 bg-red-50" data-testid={`permission-denied-${permission}`}>
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          Accès refusé - Permission <code className="bg-red-100 px-1 rounded">{permission}</code> requise
          {user && (
            <Badge className={`ml-2 ${ROLE_CONFIG[user.role].badge}`}>
              {ROLE_CONFIG[user.role].label}
            </Badge>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
};

/**
 * Protection basée sur plusieurs permissions
 */
export const RoleProtected: React.FC<RoleProtectedProps> = ({
  requiredPermissions,
  user,
  children,
  fallback,
  requireAll = true
}) => {
  const hasAccess = requireAll 
    ? hasAllPermissions(user, requiredPermissions)
    : hasAnyPermission(user, requiredPermissions);

  if (!hasAccess) {
    return fallback || (
      <div className="min-h-[200px] flex items-center justify-center" data-testid="role-access-denied">
        <Alert className="max-w-md border-amber-200 bg-amber-50">
          <Lock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <div className="font-medium mb-2">Accès restreint</div>
            <div className="text-sm">
              Permissions requises : 
              <div className="mt-1 space-x-1">
                {requiredPermissions.map(perm => (
                  <code key={perm} className="bg-amber-100 px-1 rounded text-xs">
                    {perm}
                  </code>
                ))}
              </div>
            </div>
            {user && (
              <div className="mt-2">
                Votre rôle : 
                <Badge className={`ml-1 ${ROLE_CONFIG[user.role].badge}`}>
                  {ROLE_CONFIG[user.role].label}
                </Badge>
              </div>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * Protection d'accès aux modules admin
 */
interface ModuleProtectionProps {
  module: AdminModule;
  user: AuthenticatedUser | null;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ModuleProtection: React.FC<ModuleProtectionProps> = ({
  module,
  user,
  children,
  fallback
}) => {
  if (!canAccessModule(user, module)) {
    return fallback || (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center" data-testid={`module-denied-${module}`}>
        <div className="text-center max-w-md p-8">
          <div className="bg-red-100 dark:bg-red-900/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Accès au Module Refusé
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Vous n'avez pas les permissions nécessaires pour accéder au module{' '}
            <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{module}</code>
          </p>
          {user && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                Votre rôle actuel :
              </p>
              <Badge className={ROLE_CONFIG[user.role].badge}>
                {ROLE_CONFIG[user.role].label}
              </Badge>
              <p className="text-xs text-gray-400 mt-2">
                {ROLE_CONFIG[user.role].description}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * Wrapper pour composants admin avec vérification automatique des permissions
 */
interface AdminWrapperProps {
  module: AdminModule;
  permissions?: Permission[];
  user: AuthenticatedUser | null;
  children: React.ReactNode;
  requireAll?: boolean;
}

export const AdminWrapper: React.FC<AdminWrapperProps> = ({
  module,
  permissions = [],
  user,
  children,
  requireAll = true
}) => {
  // Vérification du module d'abord
  if (!canAccessModule(user, module)) {
    return <ModuleProtection module={module} user={user} children={null} />;
  }

  // Ensuite vérification des permissions spécifiques si fournies
  if (permissions.length > 0) {
    return (
      <RoleProtected 
        requiredPermissions={permissions}
        user={user}
        requireAll={requireAll}
      >
        {children}
      </RoleProtected>
    );
  }

  return <>{children}</>;
};

/**
 * Hook personnalisé pour les permissions dans les composants
 */
export const usePermissions = (user: AuthenticatedUser | null) => {
  return {
    hasPermission: (permission: Permission) => hasPermission(user, permission),
    hasAnyPermission: (permissions: Permission[]) => hasAnyPermission(user, permissions),
    hasAllPermissions: (permissions: Permission[]) => hasAllPermissions(user, permissions),
    canAccessModule: (module: AdminModule) => canAccessModule(user, module),
    user,
    role: user?.role,
    roleConfig: user ? ROLE_CONFIG[user.role] : null
  };
};