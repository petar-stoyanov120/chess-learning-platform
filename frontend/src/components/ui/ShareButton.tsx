'use client';

interface ShareButtonProps {
  label?: string;
}

export default function ShareButton({ label = '🔗 Share' }: ShareButtonProps) {
  async function handleShare() {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied!');
    }
  }

  return (
    <button onClick={handleShare} className="text-sm text-chess-gold hover:underline">
      {label}
    </button>
  );
}
