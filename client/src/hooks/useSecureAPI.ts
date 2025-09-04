
import { useCallback } from 'react';
import { useAuth } from './useAuth';
import { sanitizeData } from '@/lib/validation-utils';

interface APIOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  requireAuth?: boolean;
}

export const useSecureAPI = () => {
  const { user } = useAuth();

  const secureRequest = useCallback(async <T>(
    endpoint: string, 
    options: APIOptions = {}
  ): Promise<T> => {
    const {
      method = 'GET',
      headers = {},
      body,
      requireAuth = true
    } = options;

    // Validation de l'authentification
    if (requireAuth && !user) {
      throw new Error('Authentification requise');
    }

    // Sanitisation des données
    const sanitizedBody = body ? sanitizeData(body) : undefined;

    // Headers sécurisés
    const secureHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...headers
    };

    // Ajoute le header d'auth si présent
    const token = (user as any)?.token as string | undefined;
    if (token !== undefined) {
      (secureHeaders as Record<string, string>).Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(endpoint, {
        method,
        headers: secureHeaders,
        body: sanitizedBody !== undefined ? JSON.stringify(sanitizedBody) : null,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      return sanitizeData(data);
    } catch (error) {
      console.error('Erreur API sécurisée:', error);
      throw error;
    }
  }, [user]);

  return { secureRequest };
};
