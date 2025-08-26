import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';

// Types professionnels pour l'authentification
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'directeur' | 'admin' | 'manager' | 'barista' | 'employee' | 'staff' | 'customer';
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  profileImage?: string;
  phone?: string;
  lastLogin?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  apiRequest: (url: string, options?: RequestInit) => Promise<Response>;
}

// Utilitaires de sécurité
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem('token');
};

const setStoredToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
  // Compatibilité avec l'ancien système
  localStorage.setItem('token', token);
};

const removeStoredTokens = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem('token');
  localStorage.removeItem('barista_auth_token');
};

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function useAuth(): AuthContextType {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    token: null
  });

  // Fonction pour faire des requêtes API authentifiées
  const apiRequest = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
    const token = getStoredToken();

    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    };

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers
    });

    // Si le token est invalide, déconnecter l'utilisateur
    if (response.status === 401) {
      await logout();
      throw new Error('Session expirée');
    }

    return response;
  }, []);

  // Vérification du token au démarrage
  useEffect(() => {
    const checkAuthStatus = async (): Promise<void> => {
      try {
        const token = getStoredToken();
        if (!token) {
          setAuthState(prev => ({ ...prev, isLoading: false }));
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const userData = await response.json() as User;
          setAuthState({
            user: userData,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            token
          });
        } else {
          removeStoredTokens();
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Erreur vérification auth:', error);
        removeStoredTokens();
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Erreur de connexion'
        }));
      }
    };

    checkAuthStatus();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      const data = await response.json() as { user: User; token: string; refreshToken?: string } | { error: string };

      if (response.ok && 'user' in data) {
        setStoredToken(data.token);

        if (data.refreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
        }

        localStorage.setItem(USER_KEY, JSON.stringify(data.user));

        setAuthState({
          user: data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          token: data.token
        });
      } else {
        throw new Error('error' in data ? data.error : 'Erreur de connexion');
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur de connexion'
      }));
      throw error;
    }
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json() as { user: User; token: string } | { error: string };

      if (response.ok && 'user' in result) {
        setStoredToken(result.token);
        localStorage.setItem(USER_KEY, JSON.stringify(result.user));

        setAuthState({
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          token: result.token
        });
      } else {
        throw new Error('error' in result ? result.error : 'Erreur d\'inscription');
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur d\'inscription'
      }));
      throw error;
    }
  }, []);

  const refreshToken = useCallback(async (): Promise<void> => {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        throw new Error('Aucun token de rafraîchissement');
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });

      if (response.ok) {
        const { token, user } = await response.json();
        setStoredToken(token);
        setAuthState(prev => ({
          ...prev,
          token,
          user,
          error: null
        }));
      } else {
        await logout();
      }
    } catch (error) {
      console.error('Erreur rafraîchissement token:', error);
      await logout();
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      const token = getStoredToken();
      if (token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      removeStoredTokens();
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        token: null
      });
    }
  }, []);

  const updateUser = useCallback(async (userData: Partial<User>): Promise<void> => {
    try {
      const response = await apiRequest('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        const updatedUser = await response.json() as User;
        localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
        setAuthState(prev => ({
          ...prev,
          user: updatedUser
        }));
      } else {
        throw new Error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erreur de mise à jour'
      }));
      throw error;
    }
  }, [apiRequest]);

  const clearError = useCallback((): void => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...authState,
    login,
    register,
    logout,
    updateUser,
    refreshToken,
    clearError,
    apiRequest
  };
}

// Context pour l'authentification
const AuthContext = createContext<AuthContextType | null>(null);

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  return React.createElement(AuthContext.Provider, { value: auth }, children);
};