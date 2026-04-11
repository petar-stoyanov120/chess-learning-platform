'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import LocationNoticeForm from '@/components/locations/LocationNoticeForm';

export default function NewNoticePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  async function handleSubmit(data: { title: string; content: string }) {
    await api.post(`/locations/${id}/notices`, data);
    router.push(`/collaborator/locations/${id}?tab=notices`);
  }

  if (!user) return null;

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-2 mb-1">
        <Link
          href={`/collaborator/locations/${id}`}
          className="text-sm text-gray-400 hover:text-chess-gold transition-colors"
        >
          ← Location Board
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-chess-dark dark:text-white mb-2">Post a Notice</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Post a notice, homework, or update to the location board. If you are not the assigned coach
        for this location, your notice will be sent for approval first.
      </p>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
        <LocationNoticeForm
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/collaborator/locations/${id}`)}
          submitLabel="Post Notice"
        />
      </div>
    </div>
  );
}
