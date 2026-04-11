'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Comment } from '@/lib/types';
import Avatar from '@/components/ui/Avatar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Props {
  lessonId: number;
}

export default function CommentSection({ lessonId }: Props) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Comment[] }>(`/comments?lessonId=${lessonId}`);
      setComments((res as { data: Comment[] }).data ?? []);
    } catch {
      // non-critical
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => { load(); }, [load]);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    setPosting(true);
    setError('');
    try {
      const res = await api.post<{ data: Comment }>('/comments', { lessonId, content });
      const newComment = (res as { data: Comment }).data;
      setComments((prev) => [newComment, ...prev]);
      setText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment.');
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.delete(`/comments/${id}`);
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // ignore
    }
  }

  return (
    <div className="mt-10 pt-8 border-t border-gray-200">
      <h2 className="text-xl font-bold text-chess-dark mb-6">
        Comments {comments.length > 0 && <span className="text-gray-400 font-normal text-base">({comments.length})</span>}
      </h2>

      {/* Post form */}
      {user ? (
        <form onSubmit={handlePost} className="mb-8">
          <div className="flex gap-3">
            <div className="shrink-0">
              <Avatar user={user} size="sm" />
            </div>
            <div className="flex-1">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="Share your thoughts on this lesson..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-chess-gold resize-none"
              />
              {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">{text.length}/1000</span>
                <button
                  type="submit"
                  disabled={posting || !text.trim()}
                  className="px-4 py-2 bg-chess-dark text-white rounded-lg text-sm font-medium hover:bg-chess-accent disabled:opacity-50 flex items-center gap-2 transition-colors"
                >
                  {posting && <LoadingSpinner size="sm" />}
                  Post
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-gray-50 rounded-xl text-sm text-gray-600 text-center border border-gray-200">
          <a href="/login" className="text-chess-gold hover:underline font-medium">Log in</a> to leave a comment.
        </div>
      )}

      {/* Comment list */}
      {loading ? (
        <div className="flex justify-center py-8"><LoadingSpinner /></div>
      ) : comments.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-6">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-5">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="shrink-0">
                <Avatar
                  user={{ username: comment.user.username, avatarUrl: comment.user.avatarUrl }}
                  size="sm"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-medium text-sm text-gray-900">@{comment.user.username}</span>
                  {comment.user.displayName && (
                    <span className="text-xs text-gray-400">{comment.user.displayName}</span>
                  )}
                  <span className="text-xs text-gray-400">
                    {new Date(comment.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'short', day: 'numeric',
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap break-words">{comment.content}</p>
                {/* Delete for own comments or admin */}
                {user && (user.id === comment.userId || user.role === 'admin') && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-xs text-red-400 hover:text-red-600 mt-1 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
