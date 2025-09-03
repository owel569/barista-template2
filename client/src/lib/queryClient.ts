import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      queryFn: async ({ queryKey }) => {
        const response = await fetch(queryKey[0] as string);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      },
    },
  },
});

// Configuration de l'API base URL - utilise les routes relatives pour Replit
const API_BASE_URL = '/api';

export async function apiRequest(endpoint: string, options?: RequestInit): Promise<any>;
export async function apiRequest(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', endpoint: string, options?: RequestInit): Promise<any>;
export async function apiRequest(arg1: string, arg2?: string | RequestInit, arg3?: RequestInit): Promise<any> {
  const METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
  let endpoint: string;
  let options: RequestInit = {};

  if (METHODS.has(arg1.toUpperCase()) && typeof arg2 === 'string') {
    endpoint = arg2;
    options = { ...(arg3 || {}), method: arg1.toUpperCase() };
  } else {
    endpoint = arg1;
    options = (arg2 as RequestInit) || {};
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  } as HeadersInit;

  const { body, headers: _ignoredHeaders, ...rest } = options;
  const init: RequestInit = {
    ...rest,
    headers,
  };
  if (body !== undefined) {
    init.body = body;
  }

  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}