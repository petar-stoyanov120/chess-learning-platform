'use client';

import Avatar from '@/components/ui/Avatar';
import { ClassroomProgress } from '@/lib/types';

interface StudentProgressTableProps {
  progress: ClassroomProgress[];
  onRemove?: (userId: number) => void;
}

export default function StudentProgressTable({ progress, onRemove }: StudentProgressTableProps) {
  if (progress.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-4xl mb-3">👩‍🎓</p>
        <p className="text-sm">No students yet. Share your invite code to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-2 text-gray-500 font-medium">Student</th>
            <th className="text-left py-3 px-2 text-gray-500 font-medium">Progress</th>
            <th className="text-right py-3 px-2 text-gray-500 font-medium">Lessons</th>
            {onRemove && <th className="py-3 px-2" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {progress.map((p) => (
            <tr key={p.user.id} className="hover:bg-gray-50">
              <td className="py-3 px-2">
                <div className="flex items-center gap-2">
                  <Avatar user={p.user} size="sm" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {p.user.displayName || p.user.username}
                    </p>
                    <p className="text-xs text-gray-400">@{p.user.username}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-[120px]">
                    <div
                      className={`h-full rounded-full transition-all ${
                        p.percent === 100 ? 'bg-green-500' : 'bg-chess-gold'
                      }`}
                      style={{ width: `${p.percent}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${p.percent === 100 ? 'text-green-600' : 'text-gray-500'}`}>
                    {p.percent}%
                  </span>
                </div>
              </td>
              <td className="py-3 px-2 text-right text-gray-600">
                {p.completedCount}/{p.totalCount}
              </td>
              {onRemove && (
                <td className="py-3 px-2 text-right">
                  <button
                    onClick={() => onRemove(p.user.id)}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors"
                  >
                    Remove
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
