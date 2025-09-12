import React, { ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/components/auth/AuthProvider';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
  requireRole?: 'directeur' | 'employe';
  fallback?: ReactNode;
}

export default function ProtectedRoute({ 
  children, 
  redirectTo = '/admin/login',
  requireRole,
  fallback 
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();

  // Redirect to login if not authenticated after loading
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate(redirectTo);
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      fallback || (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center" data-testid="loading-auth">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Vérification de l'authentification...</p>
          </div>
        </div>
      )
    );
  }

  // Return null if not authenticated (will redirect via useEffect)
  if (!isAuthenticated) {
    return null;
  }

  // Check role requirement if specified
  if (requireRole && user?.role !== requireRole) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center" data-testid="access-denied">
        <div className="text-center p-8">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Accès refusé</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
          <p className="text-sm text-gray-500">
            Rôle requis: {requireRole} | Votre rôle: {user?.role || 'Non défini'}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}