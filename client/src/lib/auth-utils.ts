import { jwtDecode } from 'jwt-decode';

// Interface pour le payload du token JWT
interface TokenPayload {
  id: number;
  username: string;
  role: string;
  iat: number;
  exp: number;
}

// Gestionnaire centralisé pour les tokens
export class AuthTokenManager {
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly USER_KEY = 'user';
  private static readonly REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes

  // Récupérer le token depuis le stockage
  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY) || localStorage.getItem('token');
  }

  // Stocker le token
  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem('token', token); // Compatibilité
  }

  // Supprimer le token
  static removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem('token');
    localStorage.removeItem(this.USER_KEY);
  }

  // Vérifier si le token est valide
  static isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const decoded = jwtDecode<TokenPayload>(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp > currentTime;
    } catch (error) {
      console.error('Token invalide:', error);
      return false;
    }
  }

  // Vérifier si le token expire bientôt
  static isTokenExpiringSoon(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const decoded = jwtDecode<TokenPayload>(token);
      const currentTime = Date.now();
      const expTime = decoded.exp * 1000;
      return (expTime - currentTime) < this.REFRESH_THRESHOLD;
    } catch (error) {
      return false;
    }
  }

  // Décoder le token pour obtenir les informations utilisateur
  static decodeToken(): TokenPayload | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      return jwtDecode<TokenPayload>(token);
    } catch (error) {
      console.error('Erreur décodage token:', error);
      return null;
    }
  }

  // Obtenir le rôle utilisateur depuis le token
  static getUserRole(): string | null {
    const decoded = this.decodeToken();
    return decoded?.role || null;
  }

  // Vérifier si l'utilisateur a un rôle spécifique
  static hasRole(role: string): boolean {
    const userRole = this.getUserRole();
    return userRole === role;
  }

  // Vérifier si l'utilisateur est directeur
  static isDirector(): boolean {
    return this.hasRole('directeur');
  }

  // Vérifier si l'utilisateur est employé
  static isEmployee(): boolean {
    return this.hasRole('employe');
  }
}

// Intercepteur HTTP pour les requêtes API
export class ApiClient {
  private static readonly BASE_URL = '/api';

  // Effectuer une requête avec gestion automatique du token
  static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = AuthTokenManager.getToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Injecter le token si disponible
    if (token && AuthTokenManager.isTokenValid()) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = endpoint.startsWith('/') ? `${this.BASE_URL}${endpoint}` : `${this.BASE_URL}/${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Gérer les erreurs d'authentification
      if (response.status === 401) {
        AuthTokenManager.removeToken();
        window.location.href = '/login';
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur API:', error);
      throw error;
    }
  }

  // Méthodes HTTP spécifiques
  static get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  static post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Hook personnalisé pour les permissions
export function usePermissions() {
  const role = AuthTokenManager.getUserRole();
  const isDirector = AuthTokenManager.isDirector();
  const isEmployee = AuthTokenManager.isEmployee();

  return {
    role,
    isDirector,
    isEmployee,
    canCreate: isDirector || isEmployee,
    canEdit: isDirector || isEmployee,
    canDelete: isDirector,
    canManageEmployees: isDirector,
    canManageSettings: isDirector,
    canViewStatistics: isDirector,
    canManageInventory: isDirector,
    canManagePermissions: isDirector,
  };
}

// Types pour l'authentification
export interface AuthUser {
  id: number;
  username: string;
  role: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginResponse {
  success: boolean;
  user?: AuthUser;
  token?: string;
  message?: string;
  error?: string;
}