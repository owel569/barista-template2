import { useState, useEffect } from 'react';

interface User {
  id: number;
  username: string;
  role: 'directeur' | 'employe';
}

export function useUser() : void {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  return {
    user,
    isLoading,
    setUser,
    logout
  };
}