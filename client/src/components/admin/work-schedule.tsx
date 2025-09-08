import React, { Suspense } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { ErrorBoundary } from 'react-error-boundary';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

// Type definition for view modes
export type ViewMode = 'calendar' | 'list' | 'analytics' | 'overview';

// Chargement différé du composant principal pour une meilleure performance
const LazyWorkSchedule = React.lazy(() => import('./work-schedule/WorkSchedule'));

// Composant de repli en cas d'erreur
function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-red-50 rounded-lg">
      <h2 className="text-xl font-semibold text-red-600">Une erreur est survenue</h2>
      <p className="text-red-500 text-center">{error.message}</p>
      <Button 
        variant="outline"
        onClick={resetErrorBoundary}
        className="text-red-600 border-red-300"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Réessayer
      </Button>
    </div>
  );
}

// Composant de chargement
function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[200px]" />
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-[100px]" />
          <Skeleton className="h-8 w-[100px]" />
        </div>
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

export default function WorkScheduleWrapper(): JSX.Element {
  const { userRole, loading: isPermissionsLoading } = usePermissions();

  // Options de configuration selon le rôle
  const viewOptions = {
    employe: {
      viewMode: 'personal' as const,
      editable: false,
      exportable: false
    },
    manager: {
      viewMode: 'team' as const,
      editable: true,
      exportable: true
    },
    admin: {
      viewMode: 'full' as const,
      editable: true,
      exportable: true
    },
    default: {
      viewMode: 'personal' as const,
      editable: false,
      exportable: false
    }
  };

  // Mapping des rôles pour correspondre aux types attendus par LazyWorkSchedule
  const mappedUserRole = (userRole: string | undefined): 'directeur' | 'employe' | undefined => {
    if (userRole === 'manager' || userRole === 'admin') {
      return 'directeur';
    }
    if (userRole === 'employee') {
      return 'employe';
    }
    return undefined; // Ou une valeur par défaut appropriée
  };

  const currentRole = mappedUserRole(userRole);

  const { viewMode, editable, exportable } = viewOptions[currentRole as keyof typeof viewOptions] || viewOptions.default;

  return (
    <div className="p-6">
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={() => window.location.reload()}
      >
        <Suspense fallback={<LoadingSkeleton />}>
          {isPermissionsLoading || !currentRole ? (
            <LoadingSkeleton />
          ) : (
            <LazyWorkSchedule 
              userRole={currentRole}
              viewMode={viewMode as ViewMode} // Utilisation du type ViewMode ici
              editable={editable}
              exportable={exportable}
              key={`${userRole}-${viewMode}`} // Force le re-render si le rôle change
            />
          )}
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}