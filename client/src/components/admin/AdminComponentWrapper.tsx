
import React, { ReactNode, ComponentType } from 'react';
import { RoleValidator } from './RoleValidator';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Skeleton } from '@/components/ui/skeleton';

type UserRole = 'directeur' | 'gerant' | 'employe';

interface AdminComponentWrapperProps {
  userRole?: string;
  user?: any;
  requiredRoles: UserRole[];
  component: ComponentType<any>;
  componentProps?: Record<string, any>;
  loading?: boolean;
  children?: ReactNode;
}

export const AdminComponentWrapper: React.FC<AdminComponentWrapperProps> = ({
  userRole,
  user,
  requiredRoles,
  component: Component,
  componentProps = {},
  loading = false,
  children
}) => {
  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <ErrorBoundary level="component" showDetails={false}>
      <RoleValidator userRole={userRole} allowedRoles={requiredRoles}>
        {children || (
          <Component 
            userRole={userRole} 
            user={user} 
            {...componentProps}
          />
        )}
      </RoleValidator>
    </ErrorBoundary>
  );
};

export default AdminComponentWrapper;
