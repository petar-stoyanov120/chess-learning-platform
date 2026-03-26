'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { AuthUser } from './types';
import { api, setAccessToken, getCsrfToken, API_URL } from './api';

// Single typed interface for all token responses (login, register, refresh)
interface AuthTokenResponse {
  data: { accessToken: string; user: AuthUser };
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
}

type AuthAction =
  | { type: 'SET_USER'; payload: AuthUser }
  | { type: 'CLEAR_USER' }
  | { type: 'SET_LOADING'; payload: boolean };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, isLoading: false };
    case 'CLEAR_USER':
      return { ...state, user: null, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, { user: null, isLoading: true });

  const restoreSession = useCallback(async () => {
    try {
      // The httpOnly refreshToken cookie is sent automatically by the browser.
      // POST /auth/refresh returns a new accessToken + user if the cookie is valid.
      const csrfToken = getCsrfToken();
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        credentials: 'include',
      });
      if (res.ok) {
        const data = (await res.json()) as AuthTokenResponse;
        setAccessToken(data.data.accessToken);
        dispatch({ type: 'SET_USER', payload: data.data.user });
      } else {
        dispatch({ type: 'CLEAR_USER' });
      }
    } catch {
      dispatch({ type: 'CLEAR_USER' });
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = async (email: string, password: string) => {
    const res = await api.post<AuthTokenResponse>('/auth/login', { email, password });
    // refreshToken is now set as an httpOnly cookie by the backend — not in the response body
    setAccessToken(res.data.accessToken);
    dispatch({ type: 'SET_USER', payload: res.data.user });
  };

  const register = async (email: string, username: string, password: string) => {
    const res = await api.post<AuthTokenResponse>('/auth/register', { email, username, password });
    setAccessToken(res.data.accessToken);
    dispatch({ type: 'SET_USER', payload: res.data.user });
  };

  const logout = async () => {
    // Cookie is sent automatically with credentials: 'include'; backend clears it
    await api.post('/auth/logout', {}).catch(() => {});
    setAccessToken(null);
    dispatch({ type: 'CLEAR_USER' });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
