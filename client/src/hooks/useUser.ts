
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';

interface User {
  id: number | string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role: 'directeur' | 'employe' | 'admin' | 'manager' | 'barista' | 'employee' | 'staff' | 'customer';
  isActive?: boolean;
  lastLogin?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  permissions?: string[];
  profileImage?: string;
}

interface UseUserReturn {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  isAuthenticated: boolean;
}

const TOKEN_KEYS = ['token', 'auth_token', 'barista_auth_token'] as const;

const getValidToken = (): string | null => {
  for (const key of TOKEN_KEYS) {
    const token = localStorage.getItem(key);
    if (token) return token;
  }
  return null;
};

const clearAllTokens = (): void => {
  TOKEN_KEYS.forEach(key => localStorage.removeItem(key));
  localStorage.removeItem('user_data');
};

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();

  // Utiliser l'utilisateur du contexte d'auth si disponible
  const contextUser = auth?.user as unknown as User | null;
  const isAuthenticated = useMemo(() => !!user || !!contextUser, [user, contextUser]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const apiRequest = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = getValidToken();
    if (!token) {
      throw new Error('Token non trouvé');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (response.status === 401) {
      clearAllTokens();
      setUser(null);
      throw new Error('Session expirée');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erreur ${response.status}`);
    }

    return response;
  }, []);

  const verifyToken = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = getValidToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await apiRequest('/api/auth/verify');
      const userData = await response.json();
      
      setUser(userData as unknown as User);
      localStorage.setItem('user_data', JSON.stringify(userData));
    } catch (error) {
      console.error('Erreur vérification token:', error);
      clearAllTokens();
      setUser(null);
      setError(error instanceof Error ? error.message : 'Erreur de vérification');
    } finally {
      setIsLoading(false);
    }
  }, [apiRequest]);

  const logout = useCallback(async () => {
    try {
      const token = getValidToken();
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch(() => {}); // Ignorer les erreurs de déconnexion
      }
    } finally {
      clearAllTokens();
      setUser(null);
      setError(null);
      
      // Utiliser l'auth context si disponible
      if (auth?.logout) {
        await auth.logout();
      }
    }
  }, [auth]);

  const updateProfile = useCallback(async (userData: Partial<User>) => {
    try {
      setError(null);
      const response = await apiRequest('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(userData)
      });

      const updatedUser = await response.json();
      setUser(updatedUser as unknown as User);
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
      
      // Synchroniser avec le contexte d'auth
      if (auth?.updateUser) {
        await auth.updateUser(updatedUser);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur de mise à jour';
      setError(errorMessage);
      throw error;
    }
  }, [apiRequest, auth]);

  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    try {
      setError(null);
      const response = await apiRequest('/api/auth/me');
      const userData = await response.json();
      
      setUser(userData as unknown as User);
      localStorage.setItem('user_data', JSON.stringify(userData));
    } catch (error) {
      console.error('Erreur rafraîchissement utilisateur:', error);
      setError(error instanceof Error ? error.message : 'Erreur de rafraîchissement');
    } finally {
      setIsLoading(false);
    }
  }, [apiRequest]);

  // Initialisation au montage
  useEffect(() => {
    // Essayer de récupérer l'utilisateur depuis le localStorage d'abord
    const storedUser = localStorage.getItem('user_data');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        localStorage.removeItem('user_data');
      }
    }

    // Puis vérifier le token
    verifyToken();
  }, [verifyToken]);

  // Synchroniser avec le contexte d'auth
  useEffect(() => {
    if (contextUser && !user) {
      setUser(contextUser);
    }
  }, [contextUser, user]);

  return {
    user: user || contextUser,
    isLoading,
    error,
    setUser,
    logout,
    updateProfile,
    refreshUser,
    clearError,
    isAuthenticated
  };
}
