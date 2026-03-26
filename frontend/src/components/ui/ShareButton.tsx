'use client';

import { useToast } from '@/lib/toast';

interface ShareButtonProps {
  label?: string;
}

export default function ShareButton({ label = '🔗 Share' }: ShareButtonProps) {
  const toast = useToast();

  async function handleShare() {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied!', { duration: 2000 });
      } else {
        toast.error('Clipboard not available in this browser.');
      }
    } catch {
      toast.error('Could not copy link. Please copy it manually.');
    }
  }

  return (
    <button onClick={handleShare} className="text-sm text-chess-gold hover:underline">
      {label}
    </button>
  );
}
