export interface FetchJsonInit extends RequestInit {
  timeoutMs?: number;
}

export async function fetchJson<T = any>(input: string, init: FetchJsonInit = {}): Promise<T> {
  const { timeoutMs, signal, headers, body, ...rest } = init;
  const controller = new AbortController();
  const id = timeoutMs ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const response = await fetch(input, {
      ...rest,
      headers,
      ...(body !== undefined ? { body } : {}),
      signal: signal ?? controller.signal,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    }
    return (await response.text()) as unknown as T;
  } finally {
    if (id) clearTimeout(id);
  }
}
