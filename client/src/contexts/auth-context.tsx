
import React, { createContext, useState, useEffect, type ReactNode } from "react";
import type { User } from "@/types/admin";
import { STORAGE_KEYS } from "@/constants/storage";

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
  login: async () => ({ success: false, error: "Not implemented" }),
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
    const savedToken = localStorage.getItem("token") || localStorage.getItem(STORAGE_KEYS.token);
    const savedUser = localStorage.getItem("user") || localStorage.getItem(STORAGE_KEYS.user);

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        
        // Validation supplémentaire de l'objet utilisateur
        if (parsedUser && typeof parsedUser === 'object' && parsedUser.id) {
          setToken(savedToken);
          setUser(parsedUser);
        }
      } catch (error) {
        // console.error('Erreur lors de la récupération des données d\'authentification:', error);
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
      if (typeof password === 'object' && password && 'id' in password) {
        const newToken = usernameOrToken;
        const newUser = password as User;
        
        setToken(newToken);
        setUser(newUser);
        
        // Stockage unifié
        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(newUser));
        localStorage.setItem(STORAGE_KEYS.token, newToken);
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(newUser));
        
        return { success: true };
      }
      
      // Sinon, c'est un appel de connexion avec username/password
      const username = usernameOrToken;
      const pass = password as string;
      
      // console.log('Tentative de connexion pour:', username);
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password: pass }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.token && data.user) {
        setToken(data.token);
        setUser(data.user);
        
        // Stockage unifié
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem(STORAGE_KEYS.token, data.token);
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data.user));
        
        return { success: true };
      } else {
        throw new Error(data.error || "Erreur de connexion");
      }
    } catch (error) {
      // console.error('Erreur de connexion:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Erreur de connexion" 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    
    // Nettoyage du localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
  };

  const refreshUserData = async () => {
    if (!token) return;
    
    try {
      const response = await fetch("/api/auth/me", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
          localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data.user));
        }
      }
    } catch (error) {
      // console.error('Erreur lors du rafraîchissement des données utilisateur:', error);
    }
  };

  const isAuthenticated = !!user && !!token;
  const isDirector = user?.role === 'directeur' || user?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      isAuthenticated,
      isDirector,
      isLoading,
      refreshUserData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook pour utiliser le contexte d'authentification
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error(`useAuth must be used within an AuthProvider`);
  }
  return context;
};