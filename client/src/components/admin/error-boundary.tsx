import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

interface FallbackComponentProps {
  error?: Error;
  resetError: () => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  override render(): React.ReactNode {
    if (this.state.hasError) {
      const resetError = (): void => {
        this.setState({ hasError: false });
      };

      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent {...(this.state.error ? { error: this.state.error } : {})} resetError={resetError} />;
      }

      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <CardTitle className="text-red-700 dark:text-red-400">
                Oups ! Une erreur s'est produite
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Le composant admin a rencontré un problème. Cela peut être dû à des données manquantes ou une erreur de connexion.
              </p>
              {this.state.error && (
                <details className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  <summary>Détails de l'erreur</summary>
                  <pre className="mt-2">{this.state.error.message}</pre>
                </details>
              )}
              <div className="flex gap-2 justify-center">
                <Button onClick={resetError} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réessayer
                </Button>
                <Button onClick={() => window.location.reload()}>
                  Recharger la page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Composant de fallback pour les erreurs de chargement
export const LoadingFallback: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[400px] w-full">
      <div className="text-center space-y-4 p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Chargement en cours
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Veuillez patienter pendant le chargement du composant...
          </p>
        </div>
      </div>
    </div>
  );
};

// Composant de fallback pour les composants non trouvés
interface NotFoundFallbackProps {
  moduleName?: string;
}

export const NotFoundFallback: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[400px] w-full">
      <div className="text-center space-y-4 p-6">
        <div className="text-gray-400 text-6xl">🔍</div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Composant non trouvé
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Le composant demandé n'existe pas ou n'est pas accessible.
          </p>
          <button
            onClick={() => window.location.href = '/admin'}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    </div>
  );
};