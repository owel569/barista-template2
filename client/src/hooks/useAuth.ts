
import { useState, useEffect, useCallback } from 'react';

// Types professionnels pour l'authentification
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'staff' | 'customer';
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
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
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  clearError: () => void;
}

export function useAuth(): AuthContextType {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  // Vérification du token au démarrage
  useEffect(() => {
    const checkAuthStatus = async (): Promise<void> => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setAuthState(prev => ({ ...prev, isLoading: false }));
          return;
        }

        const response = await fetch('/api/auth/verify', {
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
            error: null
          });
        } else {
          localStorage.removeItem('auth_token');
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Erreur vérification auth:', error);
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
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      const data = await response.json() as { user: User; token: string } | { error: string };

      if (response.ok && 'user' in data) {
        localStorage.setItem('auth_token', data.token);
        setAuthState({
          user: data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null
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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json() as { user: User; token: string } | { error: string };

      if (response.ok && 'user' in result) {
        localStorage.setItem('auth_token', result.token);
        setAuthState({
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
          error: null
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

  const logout = useCallback(async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      localStorage.removeItem('auth_token');
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    }
  }, []);

  const updateUser = useCallback(async (userData: Partial<User>): Promise<void> => {
    if (!authState.user) throw new Error('Utilisateur non connecté');

    try {
      const response = await fetch('/api/auth/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(userData)
      });

      const updatedUser = await response.json() as User;

      if (response.ok) {
        setAuthState(prev => ({
          ...prev,
          user: updatedUser
        }));
      } else {
        throw new Error('Erreur de mise à jour');
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erreur de mise à jour'
      }));
      throw error;
    }
  }, [authState.user]);

  const clearError = useCallback((): void => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...authState,
    login,
    register,
    logout,
    updateUser,
    clearError
  };
}
