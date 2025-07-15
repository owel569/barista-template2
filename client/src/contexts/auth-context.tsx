
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
    if (!savedToken) {
      console.log('Aucun token sauvegardé trouvé');
      return;
    }

    try {
      console.log('Rafraîchissement des données utilisateur...');
      
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${savedToken}`
        }
      });

      console.log('Réponse verification:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Données de vérification reçues:', data);
        
        if (data.valid && data.user && typeof data.user === 'object' && data.user.id) {
          setUser(data.user);
          localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data.user));
          console.log('✅ Données utilisateur rafraîchies');
        } else {
          throw new Error('Données utilisateur invalides reçues du serveur');
        }
      } else {
        console.warn('Token invalide côté serveur, déconnexion automatique');
        logout();
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des données utilisateur:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.warn('Erreur réseau, conservation de l\'état d\'authentification actuel');
      } else {
        console.warn('Erreur d\'authentification, déconnexion');
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
