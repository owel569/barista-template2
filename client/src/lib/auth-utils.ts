import { jwtDecode } from 'jwt-decode';

export interface TokenPayload {
  userId: number;
  username: string;
  role: string;
  exp: number;
}

export interface AuthUser {
  id: number;
  username: string;
  role: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: AuthUser;
  message?: string;
}

export class AuthTokenManager {
  private static TOKEN_KEY = 'barista_token';
  private static USER_KEY = 'barista_user';

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  static getUser(): AuthUser | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  static setUser(user: AuthUser): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  static removeUser(): void {
    localStorage.removeItem(this.USER_KEY);
  }

  static clear(): void {
    this.removeToken();
    this.removeUser();
  }

  static isTokenValid(): boolean {
    const token = this.getToken();
    return isTokenValid(token);
  }

  static isTokenExpiringSoon(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const decoded = jwtDecode<TokenPayload>(token);
      const currentTime = Date.now() / 1000;
      const timeUntilExpiry = decoded.exp - currentTime;
      // Token expires in less than 5 minutes (300 seconds)
      return timeUntilExpiry < 300;
    } catch {
      return false;
    }
  }
}

export class ApiClient {
  private static baseUrl = '';

  static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = AuthTokenManager.getToken();

    const { body, headers: optHeaders, ...rest } = options;
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(optHeaders || {}),
      },
      ...(body !== undefined ? { body } : {}),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  static async post<T>(endpoint: string, data?: Record<string, unknown>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      ...(data ? { body: JSON.stringify(data) } : {}),
    });
  }

  static async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  static async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      ...(data ? { body: JSON.stringify(data) } : {}),
    });
  }

  static async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export function isTokenValid(token: string | null): boolean {
  if (!token) return false;

  try {
    const decoded = jwtDecode<TokenPayload>(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  } catch (error) {
    return false;
  }
}

export function getTokenPayload(token: string | null): TokenPayload | null {
  if (!token) return null;

  try {
    return jwtDecode<TokenPayload>(token);
  } catch (error) {
    return null;
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem('token');
}

export function storeToken(token: string): void {
  localStorage.setItem('token', token);
}

export function clearToken(): void {
  localStorage.removeItem('token');
}

export const logOut = (): void => {
  AuthTokenManager.removeToken();
};

// Export usePermissions hook
export { usePermissions } from '../hooks/usePermissions';

export const apiRequest = async (
  method: string, 
  url: string, 
  options?: RequestInit & { body?: string }
): Promise<Response> => {
  const token = getStoredToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options?.headers,
  };

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: options?.body,
      ...options,
    });

    if (response.status === 401) {
      clearStoredToken();
      window.location.href = '/login';
      throw new Error('Non autorisé');
    }

    return response;
  } catch (error) {
    console.error('Erreur API:', error);
    throw error;
  }
};

// Helper function to clear stored token, assuming it exists globally or is imported elsewhere
// If clearStoredToken is not defined, it needs to be defined or replaced with clearToken()
const clearStoredToken = () => {
    // Assuming clearStoredToken is meant to be clearToken from AuthTokenManager or similar
    // If clearStoredToken is defined elsewhere, this needs to be adjusted.
    // For this example, we'll assume it's a placeholder for clearing auth token.
    clearToken(); 
};