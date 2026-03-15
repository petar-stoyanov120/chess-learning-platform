'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { AuthUser } from './types';
import { api, setAccessToken } from './api';

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
    const refreshToken = localStorage.getItem('refreshToken');
    const storedUser = localStorage.getItem('user');
    if (!refreshToken || !storedUser) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (res.ok) {
        const data = await res.json();
        setAccessToken(data.data.accessToken);
        dispatch({ type: 'SET_USER', payload: data.data.user });
      } else {
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
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
    const res = await api.post<{ data: { accessToken: string; refreshToken: string; user: AuthUser } }>(
      '/auth/login',
      { email, password }
    );
    setAccessToken((res as { data: { accessToken: string; refreshToken: string; user: AuthUser } }).data.accessToken);
    localStorage.setItem('refreshToken', (res as { data: { accessToken: string; refreshToken: string; user: AuthUser } }).data.refreshToken);
    localStorage.setItem('user', JSON.stringify((res as { data: { accessToken: string; refreshToken: string; user: AuthUser } }).data.user));
    dispatch({ type: 'SET_USER', payload: (res as { data: { accessToken: string; refreshToken: string; user: AuthUser } }).data.user });
  };

  const register = async (email: string, username: string, password: string) => {
    const res = await api.post<{ data: { accessToken: string; refreshToken: string; user: AuthUser } }>(
      '/auth/register',
      { email, username, password }
    );
    setAccessToken((res as { data: { accessToken: string; refreshToken: string; user: AuthUser } }).data.accessToken);
    localStorage.setItem('refreshToken', (res as { data: { accessToken: string; refreshToken: string; user: AuthUser } }).data.refreshToken);
    localStorage.setItem('user', JSON.stringify((res as { data: { accessToken: string; refreshToken: string; user: AuthUser } }).data.user));
    dispatch({ type: 'SET_USER', payload: (res as { data: { accessToken: string; refreshToken: string; user: AuthUser } }).data.user });
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      await api.post('/auth/logout', { refreshToken }).catch(() => {});
    }
    setAccessToken(null);
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
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
