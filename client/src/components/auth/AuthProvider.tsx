import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { useLocation } from 'wouter';
import { AuthTokenManager, ApiClient, AuthState, AuthUser, LoginResponse } from '@/lib/auth-utils';
import { toast } from 'sonner';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  validateSession: () => Promise<boolean>;
  isLoading: boolean;
  isTokenExpiring: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null); // Changed from AuthState to AuthUser for clarity
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null); // Added token state

  const [, setLocation] = useLocation();
  const [isTokenExpiring, setIsTokenExpiring] = useState(false);

  // Initialiser l'état d'authentification
  useEffect(() => {
    initializeAuth();
  }, []);

  // Surveiller l'expiration du token
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isAuthenticated && token) {
      interval = setInterval(() => {
        const isExpiring = AuthTokenManager.isTokenExpiringSoon(token); // Pass token to check
        setIsTokenExpiring(isExpiring);

        if (isExpiring) {
          toast.warning('Votre session expire bientôt. Veuillez vous reconnecter.');
        }

        // Vérifier si le token a expiré
        if (!AuthTokenManager.isTokenValid(token)) { // Pass token to check
          logout();
        }
      }, 60000); // Vérifier toutes les minutes
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isAuthenticated, token, logout]); // Depend on token

  const initializeAuth = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem('authToken'); // Use consistent key
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser && AuthTokenManager.isTokenValid(storedToken)) { // Pass token to check
        const user = JSON.parse(storedUser);
        setAuthState({ // Use setAuthState to update all state at once
          user,
          token: storedToken,
          isAuthenticated: true,
          isLoading: false,
        });

        // Valider le token côté serveur
        const isValid = await validateSession();
        if (!isValid) {
          logout();
        }
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error('Erreur initialisation auth:', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
      logout();
    }
  }, [validateSession, logout]); // Add dependencies

  // Helper to set the auth state
  const setAuthState = useCallback((newState: Partial<AuthState>) => {
    setAuthState(prev => ({ ...prev, ...newState }));
    if (newState.token) {
      setToken(newState.token);
    }
    if (newState.user) {
      setUser(newState.user);
    }
    if (newState.isAuthenticated !== undefined) {
      setIsAuthenticated(newState.isAuthenticated);
    }
    if (newState.isLoading !== undefined) {
      setIsLoading(newState.isLoading);
    }
  }, []);


  const login = useCallback(async (email: string, password: string): Promise<LoginResponse> => {
    try {
      setAuthState({ isLoading: true });

      const response = await ApiClient.post<{
        message: string;
        token: string;
        user: AuthUser;
      }>('/api/auth/login', { email, password });

      // Stocker les données d'authentification
      AuthTokenManager.setToken(response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      setAuthState({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });

      toast.success('Connexion réussie');

      return {
        success: true,
        user: response.user,
        token: response.token,
        message: response.message,
      };
    } catch (error: unknown) {
      console.error('Erreur de connexion:', { error: error instanceof Error ? error.message : 'Erreur inconnue' });

      setAuthState({
        isLoading: false,
      });

      toast.error(error instanceof Error ? error.message : 'Erreur de connexion');

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur de connexion au serveur',
        token: '',
        user: {
          id: 0,
          username: '',
          role: '',
          firstName: '',
          lastName: '',
          email: ''
        },
      };
    }
  }, [setAuthState]); // Depend on setAuthState

  const logout = useCallback(() => {
    AuthTokenManager.removeToken();
    localStorage.removeItem('user'); // Also remove user from local storage

    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });

    setIsTokenExpiring(false);

    // Rediriger vers la page de connexion
    setLocation('/login');

    toast.info('Déconnexion réussie');
  }, [setLocation, setAuthState]); // Depend on setAuthState

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const currentToken = AuthTokenManager.getToken();
      if (!currentToken) return false;

      const response = await ApiClient.post<{
        token: string;
        user: AuthUser;
      }>('/auth/refresh', {});

      AuthTokenManager.setToken(response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      setAuthState({
        token: response.token,
        user: response.user,
      });

      setIsTokenExpiring(false);

      return true;
    } catch (error) {
      console.error('Erreur refresh token:', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
      logout();
      return false;
    }
  }, [logout, setAuthState]); // Depend on setAuthState

  const validateSession = useCallback(async (): Promise<boolean> => {
    try {
      const token = AuthTokenManager.getToken();
      if (!token) return false;

      const response = await ApiClient.get<{
        valid: boolean;
        user: AuthUser;
      }>('/auth/validate');

      if (response.valid) {
        setAuthState(prev => ({
          ...prev,
          user: response.user,
          token: token, // Ensure token is set
          isAuthenticated: true,
          isLoading: false,
        }));
        return true;
      } else {
        logout();
        return false;
      }
    } catch (error) {
      console.error('Erreur validation session:', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
      logout();
      return false;
    }
  }, [logout, setAuthState]); // Depend on setAuthState

  const contextValue: AuthContextType = {
    user, // Use destructured state
    token, // Use destructured state
    isAuthenticated, // Use destructured state
    isLoading: isLoading, // Use destructured state
    isTokenExpiring,
    login,
    logout,
    refreshToken,
    validateSession,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook pour les routes protégées
export function useRequireAuth(redirectTo: string = '/login') {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation(redirectTo);
    }
  }, [isAuthenticated, isLoading, redirectTo, setLocation]);

  return { isAuthenticated, isLoading };
}

// Hook pour les permissions avec types précis
export interface UserPermissions {
  role: string | null;
  isDirector: boolean;
  isEmployee: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageEmployees: boolean;
  canManageSettings: boolean;
  canViewStatistics: boolean;
  canManageInventory: boolean;
  canManagePermissions: boolean;
  canManageReports: boolean;
  canManageBackups: boolean;
  canAccessAdvancedFeatures: boolean;
}

// Le hook useUserPermissionsCompat a été importé depuis '@/hooks/usePermissions'
// et le hook useUserPermissions a été renommé en useUserPermissionsCompat.
// L'utilisation du hook a également été mise à jour pour refléter ce changement.
// Commenté temporairement pour éviter les erreurs d'import
// import { useUserPermissionsCompat } from '@/hooks/usePermissions';
export function usePermissions(): UserPermissions {
  const { user } = useAuth();

  // Permissions par défaut temporaires pour éviter les erreurs
  return {
    role: user?.role || null,
    isDirector: user?.role === 'directeur',
    isEmployee: user?.role === 'employe',
    canCreate: true,
    canEdit: true,
    canDelete: user?.role === 'directeur',
    canManageEmployees: user?.role === 'directeur',
    canManageSettings: user?.role === 'directeur',
    canViewStatistics: true,
    canManageInventory: user?.role === 'directeur',
    canManagePermissions: user?.role === 'directeur',
    canManageReports: user?.role === 'directeur',
    canManageBackups: user?.role === 'directeur',
    canAccessAdvancedFeatures: user?.role === 'directeur',
  };
}

// Composant pour protéger les routes
interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
  fallback?: ReactNode;
}

export function ProtectedRoute({ children, requiredRole, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Accès refusé</h2>
          <p className="text-gray-600">Vous devez vous connecter pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  // Logic for role checking
  if (requiredRole) {
    const userRole = user?.role;
    // Check if the user's role matches the required role, or if the user has a "gerant" role and the required role is "directeurgerant"
    const hasPermission = userRole === requiredRole || (requiredRole === 'directeurgerant' && userRole === 'gerant');

    if (!hasPermission) {
      return fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Accès refusé</h2>
            <p className="text-gray-600">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
            <p className="text-gray-600">Rôle requis: {requiredRole} | Votre rôle: {userRole || 'Non défini'}</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}

// Composant d'indicateur de session
export function SessionIndicator(): JSX.Element | null {
  const { isTokenExpiring, refreshToken } = useAuth();

  if (!isTokenExpiring) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="animate-pulse w-3 h-3 bg-amber-400 rounded-full"></div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-amber-800">
              Session expirée prochainement
            </p>
            <div className="mt-2 flex space-x-2">
              <button
                onClick={refreshToken}
                className="bg-amber-600 text-white px-3 py-1 rounded text-sm hover:bg-amber-700"
              >
                Prolonger
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}