
import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '@/types/admin';

// Centralisation des clés localStorage pour éviter les erreurs de typo
const STORAGE_KEYS = {
  token: 'auth_token',
  user: 'auth_user'
} as const;

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isDirector: boolean;
  isLoading: boolean;
  refreshUserData: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
  isDirector: false,
  isLoading: true,
  refreshUserData: async () => {}
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Récupérer les données d'authentification du localStorage au démarrage
    const savedToken = localStorage.getItem(STORAGE_KEYS.token);
    const savedUser = localStorage.getItem(STORAGE_KEYS.user);

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        
        // Validation supplémentaire de l'objet utilisateur
        if (!parsedUser || typeof parsedUser !== 'object' || !parsedUser.id) {
          throw new Error('Invalid user object structure');
        }
        
        setToken(savedToken);
        setUser(parsedUser);
      } catch (error) {
        console.error('Erreur lors de la récupération des données d\'authentification:', error);
        // Nettoyer le localStorage si les données sont corrompues
        localStorage.removeItem(STORAGE_KEYS.token);
        localStorage.removeItem(STORAGE_KEYS.user);
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem(STORAGE_KEYS.token, newToken);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
  };

  const refreshUserData = async () => {
    const savedToken = localStorage.getItem(STORAGE_KEYS.token);
    if (!savedToken) return;

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${savedToken}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        
        // Validation de la réponse
        if (userData && typeof userData === 'object' && userData.id) {
          setUser(userData);
          localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(userData));
        } else {
          throw new Error('Invalid user data received from server');
        }
      } else {
        // Token invalide côté serveur, nettoyer l'authentification
        console.warn('Token invalide côté serveur, déconnexion automatique');
        logout();
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des données utilisateur:', error);
      // En cas d'erreur réseau, garder l'utilisateur connecté avec les données existantes
      // Sauf si c'est une erreur d'authentification
      if (error instanceof TypeError) {
        // Erreur réseau, garder l'état actuel
        console.warn('Erreur réseau, conservation de l\'état d\'authentification actuel');
      } else {
        // Autre erreur, déconnecter l'utilisateur
        logout();
      }
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token && !!user && !isLoading,
    isDirector: user?.role === 'directeur',
    isLoading,
    refreshUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
