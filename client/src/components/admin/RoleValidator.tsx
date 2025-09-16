
import React, { ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';

type UserRole = 'directeur' | 'gerant' | 'employe';

interface RoleValidatorProps {
  userRole?: string | null;
  allowedRoles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

interface User {
  id: number;
  role: UserRole;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

export const RoleValidator: React.FC<RoleValidatorProps> = ({
  userRole,
  allowedRoles,
  children,
  fallback
}) => {
  // Validation stricte du rôle
  const isValidRole = (role: any): role is UserRole => {
    return role && ['directeur', 'gerant', 'employe'].includes(role);
  };

  const validatedRole = isValidRole(userRole) ? userRole : null;
  const hasAccess = validatedRole && allowedRoles.includes(validatedRole);

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="p-6">
        <Alert className="border-amber-200 bg-amber-50" data-testid="role-access-denied">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <div className="font-medium mb-2">Accès restreint</div>
            <div className="text-sm">
              Rôles autorisés : {allowedRoles.join(', ')}
              <br />
              Votre rôle : {validatedRole || 'Non défini'}
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
};

export const validateUserRole = (role: any): UserRole | null => {
  if (role && ['directeur', 'gerant', 'employe'].includes(role)) {
    return role as UserRole;
  }
  return null;
};

export const getRoleHierarchy = (): Record<UserRole, number> => {
  return {
    'directeur': 3,
    'gerant': 2,
    'employe': 1
  };
};

export const hasMinimumRole = (userRole: UserRole, minimumRole: UserRole): boolean => {
  const hierarchy = getRoleHierarchy();
  return hierarchy[userRole] >= hierarchy[minimumRole];
};
