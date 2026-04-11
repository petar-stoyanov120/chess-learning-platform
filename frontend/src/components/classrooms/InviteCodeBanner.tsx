'use client';

import { useState } from 'react';

interface InviteCodeBannerProps {
  inviteCode: string;
  classroomName: string;
}

export default function InviteCodeBanner({ inviteCode, classroomName }: InviteCodeBannerProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const joinUrl = `${window.location.origin}/classrooms/join?code=${inviteCode}`;
    await navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleCopyCode() {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <p className="text-sm font-medium text-amber-800 mb-2">Invite Students</p>
      <p className="text-xs text-amber-600 mb-3">
        Share this code or link so students can join <strong>{classroomName}</strong>:
      </p>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-amber-300 rounded-lg px-3 py-2">
          <span className="font-mono font-bold text-lg tracking-widest text-chess-dark">{inviteCode}</span>
          <button
            onClick={handleCopyCode}
            className="text-xs text-amber-600 hover:text-amber-800 transition-colors ml-1"
            title="Copy code"
          >
            📋
          </button>
        </div>
        <button
          onClick={handleCopy}
          className="text-sm bg-chess-dark text-white px-4 py-2 rounded-lg hover:bg-chess-gold transition-colors font-medium"
        >
          {copied ? '✓ Copied!' : 'Copy Invite Link'}
        </button>
      </div>
    </div>
  );
}
