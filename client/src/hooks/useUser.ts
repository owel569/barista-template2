
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

interface User {
  id: number | string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role: 'directeur' | 'employe' | 'admin' | 'manager' | 'barista' | 'employee' | 'staff' | 'customer';
  isActive?: boolean;
  lastLogin?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UseUserReturn {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const auth = useAuth();

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
        if (!token) {
          setIsLoading(false);
          return;
        }

        const response = await fetch('/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('auth_token');
        }
      } catch (error) {
        console.error('Erreur vérification token:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('auth_token');
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, []);

  const logout = useCallback(async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      if (token) {
        await fetch('/api/auth/logout', {
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
      localStorage.removeItem('token');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(async (userData: Partial<User>) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Token non trouvé');
      }

      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        localStorage.setItem('user_data', JSON.stringify(updatedUser));
      } else {
        throw new Error('Erreur lors de la mise à jour du profil');
      }
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      throw error;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      if (!token) {
        return;
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        localStorage.setItem('user_data', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Erreur rafraîchissement utilisateur:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    user,
    isLoading,
    setUser,
    logout,
    updateProfile,
    refreshUser
  };
}
