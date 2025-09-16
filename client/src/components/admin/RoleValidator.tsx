import React, { ReactNode } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock } from 'lucide-react';

type UserRole = 'directeur' | 'gerant' | 'employe';

interface RoleValidatorProps {
  children: ReactNode;
  userRole?: string;
  allowedRoles: UserRole[];
  fallback?: ReactNode;
  showAccessDenied?: boolean;
}

export const RoleValidator: React.FC<RoleValidatorProps> = ({
  children,
  userRole,
  allowedRoles,
  fallback,
  showAccessDenied = true
}) => {
  const { user } = useAuth();

  // Déterminer le rôle de l'utilisateur
  const currentUserRole = userRole || user?.role;

  // Vérifier si l'utilisateur a un rôle autorisé
  const hasValidRole = currentUserRole && allowedRoles.includes(currentUserRole as UserRole);

  // Si pas de rôle valide, afficher le composant de fallback ou le message d'accès refusé
  if (!hasValidRole) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showAccessDenied) {
      return (
        <div className="p-6 max-w-2xl mx-auto">
          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
            <Shield className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <div className="space-y-2">
                <p className="font-medium">Accès restreint</p>
                <p className="text-sm">
                  Cette page est réservée aux utilisateurs avec les rôles suivants : {' '}
                  <span className="font-semibold">
                    {allowedRoles.join(', ')}
                  </span>
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Votre rôle actuel : {currentUserRole || 'Non défini'}
                </p>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return null;
  }

  // Si le rôle est valide, afficher les enfants
  return <>{children}</>;
};

export default RoleValidator;