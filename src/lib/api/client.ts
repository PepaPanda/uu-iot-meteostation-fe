import { API_BASE } from '$lib/config';

type ApiOptions = RequestInit & {
  auth?: boolean;
};

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include'
  });

  if (!res.ok) {
    let message = `API error ${res.status}`;

    try {
      const error = await res.json();
      message = error.message ?? error.error ?? message;
    } catch {
      // Response body is not JSON.
    }

    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}