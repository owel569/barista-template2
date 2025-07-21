import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { AuthTokenManager, ApiClient, AuthState, AuthUser, LoginResponse } from '@/lib/auth-utils';
import { toast } from 'sonner';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<LoginResponse>;
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
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const [, setLocation] = useLocation();
  const [isTokenExpiring, setIsTokenExpiring] = useState(false);

  // Initialiser l'état d'authentification
  useEffect(() => {
    initializeAuth();
  }, []);

  // Surveiller l'expiration du token
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (authState.isAuthenticated && authState.token) {
      interval = setInterval(() => {
        const isExpiring = AuthTokenManager.isTokenExpiringSoon();
        setIsTokenExpiring(isExpiring);
        
        if (isExpiring) {
          toast.warning('Votre session expire bientôt. Veuillez vous reconnecter.');
        }
        
        // Vérifier si le token a expiré
        if (!AuthTokenManager.isTokenValid()) {
          logout();
        }
      }, 60000); // Vérifier toutes les minutes
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [authState.isAuthenticated, authState.token]);

  const initializeAuth = useCallback(async () => {
    try {
      const token = AuthTokenManager.getToken();
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser && AuthTokenManager.isTokenValid()) {
        const user = JSON.parse(storedUser);
        setAuthState({
          user,
          token,
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
      console.error('Erreur initialisation auth:', error);
      logout();
    }
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<LoginResponse> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const response = await ApiClient.post<{
        message: string;
        token: string;
        user: AuthUser;
      }>('/auth/login', { username, password });
      
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
      console.error('Erreur de connexion:', error);
      
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
      }));
      
      toast.error(error.message || 'Erreur de connexion');
      
      return {
        success: false,
        error: error.message || 'Erreur de connexion au serveur',
      };
    }
  }, []);

  const logout = useCallback(() => {
    AuthTokenManager.removeToken();
    
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
  }, [setLocation]);

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
      
      setAuthState(prev => ({
        ...prev,
        token: response.token,
        user: response.user,
      }));
      
      setIsTokenExpiring(false);
      
      return true;
    } catch (error) {
      console.error('Erreur refresh token:', error);
      logout();
      return false;
    }
  }, [logout]);

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
        }));
        return true;
      } else {
        logout();
        return false;
      }
    } catch (error) {
      console.error('Erreur validation session:', error);
      logout();
      return false;
    }
  }, [logout]);

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    refreshToken,
    validateSession,
    isLoading: authState.isLoading,
    isTokenExpiring,
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

// Hook pour les permissions
export function usePermissions() {
  const { user } = useAuth();
  
  const permissions = {
    role: user?.role || null,
    isDirector: user?.role === 'directeur',
    isEmployee: user?.role === 'employe',
    canCreate: user?.role === 'directeur' || user?.role === 'employe',
    canEdit: user?.role === 'directeur' || user?.role === 'employe',
    canDelete: user?.role === 'directeur',
    canManageEmployees: user?.role === 'directeur',
    canManageSettings: user?.role === 'directeur',
    canViewStatistics: user?.role === 'directeur',
    canManageInventory: user?.role === 'directeur',
    canManagePermissions: user?.role === 'directeur',
    canManageReports: user?.role === 'directeur',
    canManageBackups: user?.role === 'directeur',
    canAccessAdvancedFeatures: user?.role === 'directeur',
  };
  
  return permissions;
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
  
  if (requiredRole && user?.role !== requiredRole) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Permissions insuffisantes</h2>
          <p className="text-gray-600">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}

// Composant d'indicateur de session
export function SessionIndicator() {
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