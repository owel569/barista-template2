import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { AuthTokenManager, ApiClient } from '@/lib/auth-utils';

interface AuthState {
  token: string | null;
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    user: null,
    isAuthenticated: false,
    isLoading: true
  });
  const [, setLocation] = useLocation();

  // Initialiser l'état d'authentification
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = AuthTokenManager.getToken();
        const storedUser = localStorage.getItem('user');

        if (token && storedUser && AuthTokenManager.isTokenValid()) {
          const user = JSON.parse(storedUser);
          setAuthState({
            token,
            user,
            isAuthenticated: true,
            isLoading: false
          });
        } else {
          // Token invalide ou expiré
          AuthTokenManager.removeToken();
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Erreur initialisation auth:', error);
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initAuth();
  }, []);

  // Fonction de login
  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await ApiClient.post('/auth/login', { username, password });

      // Stocker les données d'authentification
      AuthTokenManager.setToken(response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      setAuthState({
        token: response.token,
        user: response.user,
        isAuthenticated: true,
        isLoading: false
      });

      return { success: true, user: response.user };
    } catch (error: any) {
      return { success: false, error: error.message || 'Erreur de connexion au serveur' };
    }
  }, []);

  // Fonction de logout
  const logout = useCallback(() => {
    AuthTokenManager.removeToken();
    localStorage.removeItem('user');
    setAuthState({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false
    });
    setLocation('/login');
  }, [setLocation]);

  // Vérifier si le token est valide
  const validateToken = useCallback(async () => {
    if (!authState.token) return false;

    try {
      await ApiClient.get('/auth/validate');
      return true;
    } catch (error) {
      logout();
      return false;
    }
  }, [authState.token, logout]);

  // Intercepteur pour les requêtes API
  const apiRequest = useCallback(async (url: string, options: RequestInit = {}) => {
    try {
      return await ApiClient.request(url, options);
    } catch (error: any) {
      // Gérer les erreurs d'authentification
      if (error.message.includes('Session expirée')) {
        logout();
      }
      throw error;
    }
  }, [logout]);

  return {
    ...authState,
    login,
    logout,
    validateToken,
    apiRequest
  };
};