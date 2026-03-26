'use client';

import { API_URL } from './constants';
export { API_URL };
export { getBaseUrl } from './url';

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|;\s*)csrfToken=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : '';
}

const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  if (MUTATING_METHODS.has(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      credentials: 'include',
    });
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error('Cannot connect to the server. Please check your internet connection or try again later.');
    }
    throw err;
  }

  if (res.status === 401 && accessToken) {
    // Try to refresh using the httpOnly cookie (sent automatically)
    const csrfForRefresh = getCsrfToken();
    const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfForRefresh ? { 'X-CSRF-Token': csrfForRefresh } : {}),
      },
      credentials: 'include',
    });

    if (refreshRes.ok) {
      const data = await refreshRes.json() as { data: { accessToken: string } };
      accessToken = data.data.accessToken;
      headers['Authorization'] = `Bearer ${accessToken}`;

      // Retry original request
      const retryRes = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
        credentials: 'include',
      });
      if (!retryRes.ok) {
        const error = await retryRes.json().catch(() => ({ error: 'Request failed' })) as { error?: string };
        throw new Error(error.error || 'Request failed');
      }
      return retryRes.json() as Promise<T>;
    } else {
      // Refresh failed — clear in-memory token and redirect
      accessToken = null;
      window.location.href = '/login';
      throw new Error('Session expired. Please log in again.');
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' })) as { error?: string };
    throw new Error(error.error || 'Request failed');
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  uploadImage: async (file: File): Promise<{ data: { url: string } }> => {
    const formData = new FormData();
    formData.append('image', file);
    const uploadHeaders: Record<string, string> = {};
    if (accessToken) uploadHeaders['Authorization'] = `Bearer ${accessToken}`;
    const csrfToken = getCsrfToken();
    if (csrfToken) uploadHeaders['X-CSRF-Token'] = csrfToken;
    const res = await fetch(`${API_URL}/uploads/image`, {
      method: 'POST',
      headers: uploadHeaders,
      body: formData,
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Image upload failed.');
    return res.json() as Promise<{ data: { url: string } }>;
  },
};
