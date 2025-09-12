
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
        this.setState({ hasError: false, error: undefined } as ErrorBoundaryState);
      };
      
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        const fallbackProps: FallbackComponentProps = {
          error: this.state.error,
          resetError
        };
        return <FallbackComponent {...fallbackProps} />;
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
export function LoadingFallback(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
        <p className="text-gray-600 dark:text-gray-400">Chargement du module admin...</p>
      </div>
    </div>
  );
}

// Composant de fallback pour les composants non trouvés
interface NotFoundFallbackProps {
  moduleName?: string;
}

export function NotFoundFallback({ moduleName }: NotFoundFallbackProps): React.JSX.Element {
  return (
    <div className="min-h-96 flex items-center justify-center p-8">
      <Card className="max-w-md w-full">
        <CardContent className="text-center py-8">
          <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Module non disponible</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Le module {moduleName || 'demandé'} n'est pas encore implémenté ou est en cours de développement.
          </p>
          <Button onClick={() => window.history.back()} variant="outline">
            Retour
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
