import React, { Component, ErrorInfo, ReactNode, useState, useEffect } from 'react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { Alert, AlertDescription } from './alert';
import { cn } from '@/lib/utils';
import { RefreshCw, AlertTriangle, Bug, Home, Mail } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  className?: string;
  level?: 'page' | 'component' | 'critical';
}

class ErrorBoundaryClass extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log l'erreur
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Callback personnalisé
    this.props.onError?.(error, errorInfo);

    // En développement, log plus d'infos
    if (process.env.NODE_ENV === 'development') {
      console.group('🐛 Error Boundary Details');
      console.error('Error:', error);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Fallback personnalisé
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, errorId } = this.state;
      const { level = 'component', showDetails = false, className } = this.props;

      return (
        <div className={cn("p-4", className)}>
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-full",
                  level === 'critical' && "bg-red-100 text-red-600",
                  level === 'page' && "bg-orange-100 text-orange-600",
                  level === 'component' && "bg-yellow-100 text-yellow-600"
                )}>
                  {level === 'critical' ? (
                    <Bug className="h-6 w-6" />
                  ) : (
                    <AlertTriangle className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {level === 'critical' && "Erreur critique"}
                    {level === 'page' && "Erreur de page"}
                    {level === 'component' && "Erreur de composant"}
                  </CardTitle>
                  <CardDescription>
                    Une erreur inattendue s'est produite
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {error?.message || "Une erreur inconnue s'est produite"}
                </AlertDescription>
              </Alert>

              {showDetails && error && (
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium mb-2">
                    Détails techniques
                  </summary>
                  <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-auto">
                    <div className="mb-2">
                      <strong>ID d'erreur:</strong> {errorId}
                    </div>
                    <div className="mb-2">
                      <strong>Message:</strong> {error.message}
                    </div>
                    <div className="mb-2">
                      <strong>Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap">{error.stack}</pre>
                    </div>
                    {errorInfo?.componentStack && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 whitespace-pre-wrap">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="text-sm text-muted-foreground">
                ID d'erreur: <code className="bg-muted px-1 rounded">{errorId}</code>
              </div>
            </CardContent>

            <CardFooter className="flex gap-2 flex-wrap">
              <Button onClick={this.handleRetry} variant="default" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Réessayer
              </Button>
              
              {level === 'page' && (
                <Button onClick={this.handleReload} variant="outline" className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Recharger la page
                </Button>
              )}
              
              {level === 'critical' && (
                <Button onClick={this.handleGoHome} variant="outline" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Retour à l'accueil
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const subject = `Rapport d'erreur - ${errorId}`;
                  const body = `Bonjour,\n\nJe rencontre une erreur sur votre application.\n\nID d'erreur: ${errorId}\nMessage: ${error?.message}\n\nMerci.`;
                  window.open(`mailto:support@example.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
                }}
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Signaler
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Composant fonctionnel wrapper
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorBoundaryClass {...props} />;
}

// Hook pour gérer les erreurs dans les composants fonctionnels
export function useErrorHandler() {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const handleError = (error: Error | string) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    console.error('Error handled by useErrorHandler:', errorObj);
    setError(errorObj);
  };

  const clearError = () => setError(null);

  return { handleError, clearError };
}

// HOC pour wrapper automatiquement les composants
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Composant d'erreur simple pour les cas non critiques
export interface SimpleErrorProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function SimpleError({ 
  message = "Une erreur s'est produite", 
  onRetry, 
  className 
}: SimpleErrorProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">Oups !</h3>
      <p className="text-muted-foreground mb-4">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </Button>
      )}
    </div>
  );
}

// Gestionnaire d'erreurs global
export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private errors: Array<{ id: string; error: Error; timestamp: number; level: string }> = [];
  private listeners: Array<(errors: GlobalErrorHandler['errors']) => void> = [];

  static getInstance() {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }

  addError(error: Error, level: string = 'error') {
    const errorEntry = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      error,
      timestamp: Date.now(),
      level,
    };

    this.errors.push(errorEntry);
    
    // Limiter à 100 erreurs
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100);
    }

    this.notifyListeners();
    
    // Log selon le niveau
    if (level === 'critical') {
      console.error('🔴 Critical Error:', error);
    } else if (level === 'warning') {
      console.warn('🟡 Warning:', error);
    } else {
      console.error('🟠 Error:', error);
    }
  }

  subscribe(listener: (errors: GlobalErrorHandler['errors']) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.errors]));
  }

  getErrors() {
    return [...this.errors];
  }

  clearErrors() {
    this.errors = [];
    this.notifyListeners();
  }

  getErrorsByLevel(level: string) {
    return this.errors.filter(error => error.level === level);
  }
}

// Hook pour utiliser le gestionnaire d'erreurs global
export function useGlobalErrorHandler() {
  const [errors, setErrors] = useState<GlobalErrorHandler['errors']>([]);
  const errorHandler = GlobalErrorHandler.getInstance();

  useEffect(() => {
    const unsubscribe = errorHandler.subscribe(setErrors);
    setErrors(errorHandler.getErrors());
    return unsubscribe;
  }, [errorHandler]);

  const addError = (error: Error | string, level: string = 'error') => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    errorHandler.addError(errorObj, level);
  };

  const clearErrors = () => errorHandler.clearErrors();

  return {
    errors,
    addError,
    clearErrors,
    criticalErrors: errors.filter(e => e.level === 'critical'),
    warnings: errors.filter(e => e.level === 'warning'),
  };
}

export default ErrorBoundary;