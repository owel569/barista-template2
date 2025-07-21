
import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '@/types/admin';
import { STORAGE_KEYS } from '@/constants/storage';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (usernameOrToken: string, passwordOrUser?: string | User) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  isDirector: boolean;
  isLoading: boolean;
  refreshUserData: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => ({ success: false, error: 'Not implemented' }),
  logout: () => {},
  isAuthenticated: false,
  isDirector: false,
  isLoading: true,
  refreshUserData: async () => {}
});

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Récupérer les données d'authentification du localStorage au démarrage
    const savedToken = localStorage.getItem('token') || localStorage.getItem(STORAGE_KEYS.token);
    const savedUser = localStorage.getItem('user') || localStorage.getItem(STORAGE_KEYS.user);

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

  const login = async (usernameOrToken: string, password?: string | User) => {
    try {
      setIsLoading(true);
      
      // Si c'est un appel direct avec token et user (pour compatibilité)
      if (typeof password === 'object' && password.id) {
        const newToken = usernameOrToken;
        const newUser = password as User;
        
        setToken(newToken);
        setUser(newUser);
        
        // Stockage unifié
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        localStorage.setItem(STORAGE_KEYS.token, newToken);
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(newUser));
        
        return { success: true };
      }
      
      // Sinon, c'est un appel de connexion avec username/password
      const username = usernameOrToken;
      const pass = password as string;
      
      console.log('Tentative de connexion pour:', username);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password: pass }),
      });

      console.log('Réponse statut:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Données de connexion reçues:', { user: data.user, hasToken: !!data.token });
        
        const newUser = data.user;
        const newToken = data.token;
        
        setUser(newUser);
        setToken(newToken);
        
        // Stockage unifié
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        localStorage.setItem(STORAGE_KEYS.token, newToken);
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(newUser));
        
        return { success: true };
      } else {
        const errorData = await response.json();
        console.error('Erreur de connexion détaillée:', errorData);
        return { success: false, error: errorData.message || 'Erreur de connexion' };
      }
    } catch (error) {
      console.error('Erreur de connexion détaillée:', error);
      return { success: false, error: 'Erreur de connexion au serveur' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    // Nettoyage complet des données d'authentification
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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

// Hook pour utiliser le contexte d'authentification
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthProvider };
