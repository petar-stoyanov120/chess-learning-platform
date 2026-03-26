'use client';

import Image from 'next/image';
import { getBaseUrl } from '@/lib/url';

interface AvatarProps {
  user: { username: string; avatarUrl?: string | null; displayName?: string | null };
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = { sm: 32, md: 48, lg: 96 };
const textMap = { sm: 'text-xs', md: 'text-sm', lg: 'text-2xl' };

function hashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 50%)`;
}

function getInitials(user: AvatarProps['user']): string {
  const name = user.displayName || user.username;
  return name.charAt(0).toUpperCase();
}

export default function Avatar({ user, size = 'md' }: AvatarProps) {
  const px = sizeMap[size];

  if (user.avatarUrl) {
    return (
      <Image
        src={`${getBaseUrl()}${user.avatarUrl}`}
        alt={user.displayName || user.username}
        width={px}
        height={px}
        className="rounded-full object-cover"
        style={{ width: px, height: px }}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-bold ${textMap[size]}`}
      style={{ width: px, height: px, backgroundColor: hashColor(user.username) }}
    >
      {getInitials(user)}
    </div>
  );
}
