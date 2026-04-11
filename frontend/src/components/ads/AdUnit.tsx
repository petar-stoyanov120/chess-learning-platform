'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

interface AdUnitProps {
  slot: string;
  format?: 'auto' | 'rectangle' | 'leaderboard' | 'vertical';
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Google AdSense ad unit component.
 * Only renders when NEXT_PUBLIC_ADSENSE_ID environment variable is set.
 * Safe to include in any page — it silently no-ops in development.
 */
export default function AdUnit({ slot, format = 'auto', className = '', style }: AdUnitProps) {
  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_ID;
  const pushed = useRef(false);

  useEffect(() => {
    if (!adsenseId || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSense not available yet
    }
  }, [adsenseId]);

  if (!adsenseId) return null;

  return (
    <div className={`ad-unit overflow-hidden ${className}`} style={style}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client={adsenseId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
