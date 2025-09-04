
import React, { type ReactNode } from 'react';
// usePermissions sans argument; le contexte utilisateur est interne
import { usePermissions } from '@/hooks/usePermissions';
import { useContext } from 'react';
import { AuthContext } from '@/contexts/auth-context';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';
import type { PermissionAction } from '@/constants/permissions';

interface PermissionGuardProps {
  children: ReactNode;
  module: string;
  action: PermissionAction;
  fallback?: ReactNode;
  showMessage?: boolean;
}

export function PermissionGuard({ 
  children, 
  module, 
  action, 
  fallback,
  showMessage = true 
}: PermissionGuardProps) {
  const { user } = useContext(AuthContext);
  const { hasPermission, loading } = usePermissions();

  if (loading) {
    return <div>Vérification des permissions...</div>;
  }

  if (!hasPermission(module, action)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showMessage) {
      return (
        <Alert className="border-amber-200 bg-amber-50">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Vous n'avez pas les permissions nécessaires pour accéder à cette fonctionnalité.
            <br />
            <span className="text-sm text-gray-600">
              Module: {module} - Action: {action}
            </span>
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  }

  return <>{children}</>;
}

// Hook utilitaire pour vérifier les permissions dans les composants
export function usePermissionCheck(module: string, action: PermissionAction) {
  const { user } = useContext(AuthContext);
  const { hasPermission } = usePermissions(user);
  
  return hasPermission(module, action);
}
