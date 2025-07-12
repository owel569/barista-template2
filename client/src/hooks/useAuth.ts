import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'wouter';

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
  
  const [, navigate] = useNavigate();

  // Initialiser l'état d'authentification
  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      try {
        const parsedUser = JSON.parse(user);
        setAuthState({
          token,
          user: parsedUser,
          isAuthenticated: true,
          isLoading: false
        });
      } catch (error) {
        console.error('Erreur parsing user:', error);
        logout();
      }
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Fonction de login
  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Stocker les données d'authentification
        localStorage.setItem('token', data.token);
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        setAuthState({
          token: data.token,
          user: data.user,
          isAuthenticated: true,
          isLoading: false
        });
        
        return { success: true, user: data.user };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Erreur de connexion' };
      }
    } catch (error) {
      return { success: false, error: 'Erreur de connexion au serveur' };
    }
  }, []);

  // Fonction de logout
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    
    setAuthState({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false
    });
    
    navigate('/login');
  }, [navigate]);

  // Vérifier si le token est valide
  const validateToken = useCallback(async () => {
    if (!authState.token) return false;
    
    try {
      const response = await fetch('/api/auth/validate', {
        headers: {
          'Authorization': `Bearer ${authState.token}`
        }
      });
      
      if (response.ok) {
        return true;
      } else {
        logout();
        return false;
      }
    } catch (error) {
      logout();
      return false;
    }
  }, [authState.token, logout]);

  // Intercepteur pour les requêtes API
  const apiRequest = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = authState.token;
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });
      
      // Gérer les erreurs d'authentification
      if (response.status === 401) {
        logout();
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la requête');
      }
      
      return response;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Session expirée')) {
        throw error;
      }
      throw new Error('Erreur de connexion au serveur');
    }
  }, [authState.token, logout]);

  return {
    ...authState,
    login,
    logout,
    validateToken,
    apiRequest
  };
};