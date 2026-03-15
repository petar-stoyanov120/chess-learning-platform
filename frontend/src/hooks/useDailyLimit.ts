'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface DailyLimitState {
  canPost: boolean;
  used: number;
  limit: number | null;
  remaining: number | null;
  loading: boolean;
}

export function useDailyLimit(): DailyLimitState {
  const { user } = useAuth();
  const [state, setState] = useState<DailyLimitState>({
    canPost: true,
    used: 0,
    limit: null,
    remaining: null,
    loading: true,
  });

  useEffect(() => {
    if (!user) {
      setState({ canPost: false, used: 0, limit: null, remaining: null, loading: false });
      return;
    }
    if (user.role === 'admin') {
      setState({ canPost: true, used: 0, limit: null, remaining: null, loading: false });
      return;
    }

    api.get<{ canPost: boolean; used: number; limit: number | null; remaining: number | null }>('/daily-limit')
      .then((res) => {
        const data = res as { canPost: boolean; used: number; limit: number | null; remaining: number | null };
        setState({ ...data, loading: false });
      })
      .catch(() => {
        setState({ canPost: true, used: 0, limit: null, remaining: null, loading: false });
      });
  }, [user]);

  return state;
}
