
export interface ApiRequestOptions {
  body?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string>;
}

export async function apiRequest<T = unknown>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  options?: ApiRequestOptions
): Promise<T> {
  const { body, headers = {}, params } = options || {};
  
  const url = new URL(endpoint, window.location.origin);
  
  // Add query parameters if provided
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  // Add body for POST, PUT methods
  if (body && (method === 'POST' || method === 'PUT')) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(url.toString(), config);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json() as T;
}
