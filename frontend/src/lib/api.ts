'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401 && accessToken) {
    // Try to refresh
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshRes.ok) {
        const data = await refreshRes.json();
        accessToken = data.data.accessToken;
        headers['Authorization'] = `Bearer ${accessToken}`;

        // Retry original request
        const retryRes = await fetch(`${API_URL}${path}`, { ...options, headers });
        if (!retryRes.ok) {
          const error = await retryRes.json().catch(() => ({ error: 'Request failed' }));
          throw new Error(error.error || 'Request failed');
        }
        return retryRes.json() as Promise<T>;
      } else {
        // Refresh failed - clear tokens
        accessToken = null;
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        throw new Error('Session expired. Please log in again.');
      }
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
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
    const res = await fetch(`${API_URL}/uploads/image`, {
      method: 'POST',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      body: formData,
    });
    if (!res.ok) throw new Error('Image upload failed.');
    return res.json();
  },
};
