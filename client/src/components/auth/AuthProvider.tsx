import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react'
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isTokenExpiring, setIsTokenExpiring] = useState(false);

  const [, setLocation] = useLocation();

  // Define logout function
  const logout = useCallback(() => {
    console.log('🚪 Déconnexion en cours...');

    // Nettoyer toutes les clés de localStorage pour éviter les conflits
    AuthTokenManager.clear();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('barista_token');
    localStorage.removeItem('barista_user');

    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    setIsLoading(false);
    setIsTokenExpiring(false);

    setLocation('/login');
    toast.info('Déconnexion réussie');
  }, [setLocation]);

  // Define validateSession
  const validateSession = useCallback(async (): Promise<boolean> => {
    try {
      const currentToken = AuthTokenManager.getToken();
      if (!currentToken) return false;

      const response = await ApiClient.get<{
        valid: boolean;
        user: AuthUser;
      }>('/auth/validate');

      if (response.valid) {
        setUser(response.user);
        setToken(currentToken);
        setIsAuthenticated(true);
        setIsLoading(false);
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
  }, [logout]);

  // Initialiser l'état d'authentification
  const initializeAuth = useCallback(async () => {
    try {
      setIsLoading(true);

      // Vérifier les tokens depuis toutes les sources possibles pour compatibilité
      const storedToken = AuthTokenManager.getToken() || 
                         localStorage.getItem('token') || 
                         localStorage.getItem('auth_token');

      console.log('🔍 Initialisation auth - Token trouvé:', !!storedToken);

      if (storedToken) {
        // Vérifier que le token n'est pas malformé avant de l'utiliser
        try {
          // Validation basique du format JWT (3 parties séparées par des points)
          const tokenParts = storedToken.split('.');
          if (tokenParts.length !== 3) {
            console.warn('⚠️ Token malformé détecté (nombre de parties incorrect), nettoyage...');
            throw new Error('Token malformé');
          }

          // Vérifier que chaque partie est en base64 valide
          for (const part of tokenParts) {
            if (!part || part.length === 0) {
              console.warn('⚠️ Token malformé détecté (partie vide), nettoyage...');
              throw new Error('Token malformé');
            }
          }
        } catch (error) {
          console.error('❌ Token malformé détecté, nettoyage automatique...');
          logout();
          return;
        }
        // Stocker le token dans toutes les clés pour compatibilité
        AuthTokenManager.setToken(storedToken);
        localStorage.setItem('token', storedToken);

        try {
          console.log('📡 Validation token avec serveur...');
          const response = await ApiClient.get<{
            success: boolean;
            user: AuthUser;
          }>('/api/auth/me');

          console.log('📋 Réponse /api/auth/me:', response);

          if (response.success && response.user) {
            console.log('✅ Utilisateur validé:', { id: response.user.id, role: response.user.role, email: response.user.email });

            setUser(response.user);
            setToken(storedToken);
            setIsAuthenticated(true);

            // Stocker dans toutes les clés pour compatibilité
            AuthTokenManager.setUser(response.user);
            localStorage.setItem('user', JSON.stringify(response.user));

            setIsLoading(false);
            return;
          } else {
            console.warn('❌ Réponse invalide du serveur');
            throw new Error('Réponse invalide du serveur');
          }
        } catch (error) {
          console.error('❌ Erreur validation token:', error);

          // Essayer aussi avec l'ancien endpoint pour compatibilité
          try {
            console.log('🔄 Tentative avec /auth/verify...');
            const verifyResponse = await fetch('/api/auth/verify', {
              headers: {
                'Authorization': `Bearer ${storedToken}`
              }
            });

            if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json();
              console.log('📋 Réponse /auth/verify:', verifyData);

              if (verifyData.success && verifyData.user) {
                console.log('✅ Utilisateur validé via verify:', { id: verifyData.user.id, role: verifyData.user.role });

                setUser(verifyData.user);
                setToken(storedToken);
                setIsAuthenticated(true);

                AuthTokenManager.setUser(verifyData.user);
                localStorage.setItem('user', JSON.stringify(verifyData.user));

                setIsLoading(false);
                return;
              }
            }
          } catch (verifyError) {
            console.error('❌ Erreur avec /auth/verify:', verifyError);
          }
        }
      }

      // Si aucun token valide, nettoyer et déconnecter
      console.log('🧹 Nettoyage - aucun token valide');
      logout();
    } catch (error) {
      console.error('💥 Erreur critique initialisation auth:', error);
      logout();
    }
  }, [logout]);

  // Surveiller l'expiration du token
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isAuthenticated && token) {
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
      }, 60000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isAuthenticated, token, logout]);

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = useCallback(async (email: string, password: string): Promise<LoginResponse> => {
    try {
      setIsLoading(true);
      console.log('🔑 Tentative de connexion:', email);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      console.log('📡 Statut réponse login:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📋 Données login reçues:', { hasUser: !!data.data?.user, hasToken: !!data.data?.token, userRole: data.data?.user?.role, structure: Object.keys(data) });

        // Gestion flexible du format de réponse
        const user = data.data?.user || data.user;
        const token = data.data?.token || data.token;

        if (user && token) {
          console.log('✅ Login réussi pour:', { id: user.id, role: user.role, email: user.email });

          // Stocker dans toutes les clés pour compatibilité
          AuthTokenManager.setToken(token);
          AuthTokenManager.setUser(user);
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('auth_token', token);

          setUser(user);
          setToken(token);
          setIsAuthenticated(true);
          setIsLoading(false);

          toast.success('Connexion réussie');

          return {
            success: true,
            user: user,
            token: token,
            message: data.message || 'Connexion réussie',
          };
        } else {
          throw new Error('Données utilisateur ou token manquantes dans la réponse');
        }
      } else {
        const errorData = await response.json();
        console.error('❌ Erreur serveur:', errorData);
        throw new Error(errorData.message || 'Erreur de connexion');
      }
    } catch (error: unknown) {
      console.error('💥 Erreur de connexion:', error);
      setIsLoading(false);

      const errorMessage = error instanceof Error ? error.message : 'Erreur de connexion au serveur';
      toast.error(errorMessage);

      return {
        success: false,
        message: errorMessage,
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
  }, []);

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

      setToken(response.token);
      setUser(response.user);
      setIsTokenExpiring(false);

      return true;
    } catch (error) {
      console.error('Erreur refresh token:', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
      logout();
      return false;
    }
  }, [logout]);

  // Define checkAuth as a placeholder or implement actual logic
  const checkAuth = useCallback(async (): Promise<boolean> => {
    // This function might be intended for a more thorough auth check or session validation
    // For now, we'll use validateSession as a proxy
    return validateSession();
  }, [validateSession]);


  const contextValue = useMemo(() => ({
    user,
    token,
    isAuthenticated,
    isLoading,
    isTokenExpiring,
    login,
    logout,
    refreshToken,
    validateSession,
    checkAuth
  }), [user, token, isAuthenticated, isLoading, isTokenExpiring, login, logout, refreshToken, validateSession, checkAuth]);

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

export function usePermissions(): UserPermissions {
  const { user } = useAuth();

  return {
    role: user?.role || null,
    isDirector: user?.role === 'directeur',
    isEmployee: user?.role === 'employe',
    canCreate: true,
    canEdit: true,
    canDelete: user?.role === 'directeur',
    canManageEmployees: user?.role === 'directeur',
    canManageSettings: user?.role === 'directeur', // Corrected this line
    canViewStatistics: true,
    canManageInventory: user?.role === 'directeur',
    canManagePermissions: user?.role === 'directeur',
    canManageReports: user?.role === 'directeur',
    canManageBackups: user?.role === 'directeur',
    canAccessAdvancedFeatures: user?.role === 'directeur',
  };
}

// Types de validation
type ValidUserRole = 'directeur' | 'gerant' | 'employe';

const validateUserRole = (role: any): role is ValidUserRole => {
  return role && ['directeur', 'gerant', 'employe'].includes(role);
};

// Composant pour protéger les routes
interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string | string[];
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

  // Logic for role checking avec validation stricte
  if (requiredRole) {
    const userRole = user?.role;

    // Validation du rôle utilisateur
    if (!validateUserRole(userRole)) {
      console.error('Rôle utilisateur invalide:', { userRole, user });
      return fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Erreur de rôle</h2>
            <p className="text-gray-600">Rôle utilisateur invalide ou non défini.</p>
            <p className="text-gray-600">Veuillez contacter un administrateur.</p>
          </div>
        </div>
      );
    }

    const hasPermission = Array.isArray(requiredRole) 
      ? requiredRole.includes(userRole)
      : userRole === requiredRole || 
        (requiredRole === 'directeurgerant' && (userRole === 'gerant' || userRole === 'directeur'));

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