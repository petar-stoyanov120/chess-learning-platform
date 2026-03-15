'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { PaginationMeta } from '@/lib/types';

interface PaginationProps {
  meta: PaginationMeta;
}

export default function Pagination({ meta }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`?${params.toString()}`);
  }

  if (meta.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => goToPage(meta.page - 1)}
        disabled={!meta.hasPrev}
        className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        ← Previous
      </button>

      <span className="text-sm text-gray-600 px-4">
        Page {meta.page} of {meta.totalPages}
      </span>

      <button
        onClick={() => goToPage(meta.page + 1)}
        disabled={!meta.hasNext}
        className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        Next →
      </button>
    </div>
  );
}
