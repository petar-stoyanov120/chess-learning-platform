'use client';

import { LocationNotice, LocationNoticeStatus } from '@/lib/types';

interface LocationNoticeListProps {
  notices: LocationNotice[];
  isCoach?: boolean;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
  onDelete?: (id: number) => void;
}

const statusConfig: Record<LocationNoticeStatus, { label: string; className: string }> = {
  published: { label: 'Published', className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  pending:   { label: 'Pending',   className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  approved:  { label: 'Approved',  className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  rejected:  { label: 'Rejected',  className: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300' },
  expired:   { label: 'Expired',   className: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400' },
};

export default function LocationNoticeList({
  notices,
  isCoach = false,
  onApprove,
  onReject,
  onDelete,
}: LocationNoticeListProps) {
  if (notices.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
        No notices yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notices.map((notice) => {
        const sc = statusConfig[notice.status] ?? statusConfig.published;
        const isPending = notice.status === 'pending';
        const expiresIn = notice.expiresAt
          ? Math.max(0, Math.round((new Date(notice.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)))
          : null;

        return (
          <div
            key={notice.id}
            className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-xl p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">{notice.title}</h4>
                  {isCoach && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.className}`}>
                      {sc.label}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{notice.content}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    {notice.author?.displayName || notice.author?.username}
                  </span>
                  <span>·</span>
                  <span>{new Date(notice.createdAt).toLocaleDateString()}</span>
                  {isPending && expiresIn !== null && (
                    <>
                      <span>·</span>
                      <span className="text-amber-600 dark:text-amber-400">
                        Expires in {expiresIn}h
                      </span>
                    </>
                  )}
                  {notice.reviewer && (
                    <>
                      <span>·</span>
                      <span>
                        {notice.status === 'approved' ? 'Approved' : 'Rejected'} by {notice.reviewer.displayName || notice.reviewer.username}
                      </span>
                    </>
                  )}
                </div>
              </div>
              {/* Coach actions */}
              {isCoach && (
                <div className="flex items-center gap-2 shrink-0">
                  {isPending && onApprove && (
                    <button
                      onClick={() => onApprove(notice.id)}
                      className="text-xs px-2 py-1 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 transition-colors font-medium"
                    >
                      Approve
                    </button>
                  )}
                  {isPending && onReject && (
                    <button
                      onClick={() => onReject(notice.id)}
                      className="text-xs px-2 py-1 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 transition-colors font-medium"
                    >
                      Reject
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(notice.id)}
                      className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
