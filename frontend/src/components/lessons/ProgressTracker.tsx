'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

export default function ProgressTracker({ slug }: { slug: string }) {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      api.post(`/lessons/${slug}/progress`, {}).catch(() => {});
    }
  }, [user, slug]);

  return null;
}
