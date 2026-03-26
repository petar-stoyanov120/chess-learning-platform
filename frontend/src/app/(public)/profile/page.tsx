'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api, API_URL } from '@/lib/api';
import { getCsrfToken } from '@/lib/api';
import { getAccessToken } from '@/lib/api';
import { useToast } from '@/lib/toast';
import Avatar from '@/components/ui/Avatar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ProfileData {
  id: number;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  role: { name: string };
  _count: { bookmarks: number; playlists: number; lessonProgress: number };
}

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      api.get<{ data: ProfileData }>('/auth/me').then((res) => {
        setProfile(res.data);
        setDisplayName(res.data.displayName || '');
      }).catch(() => {});
    }
  }, [user, isLoading, router]);

  async function handleSaveProfile() {
    setSaving(true);
    try {
      const res = await api.patch<{ data: ProfileData }>('/profile', { displayName: displayName.trim() || undefined });
      setProfile(res.data);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    }
    setSaving(false);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const headers: Record<string, string> = {};
      const token = getAccessToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const csrf = getCsrfToken();
      if (csrf) headers['X-CSRF-Token'] = csrf;

      const res = await fetch(`${API_URL}/profile/avatar`, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setProfile((prev) => prev ? { ...prev, avatarUrl: data.data.avatarUrl } : prev);
      toast.success('Avatar uploaded');
    } catch {
      toast.error('Failed to upload avatar');
    }
    e.target.value = '';
  }

  async function handleRemoveAvatar() {
    try {
      await api.delete('/profile/avatar');
      setProfile((prev) => prev ? { ...prev, avatarUrl: null } : prev);
      toast.success('Avatar removed');
    } catch {
      toast.error('Failed to remove avatar');
    }
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      toast.error('Password must contain at least one uppercase letter and one number');
      return;
    }

    setChangingPw(true);
    try {
      await api.patch('/auth/password', { currentPassword, newPassword, confirmPassword });
      toast.success('Password changed. Please log in again.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      // Force re-login after short delay
      setTimeout(() => { window.location.href = '/login'; }, 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to change password');
    }
    setChangingPw(false);
  }

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-chess-dark mb-8">My Profile</h1>

      {/* Avatar & Basic Info */}
      <div className="card p-6 mb-6">
        <div className="flex items-start gap-6">
          <div className="flex flex-col items-center gap-2">
            <Avatar user={profile} size="lg" />
            <label className="text-xs text-chess-gold cursor-pointer hover:underline">
              Upload photo
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarUpload} />
            </label>
            {profile.avatarUrl && (
              <button onClick={handleRemoveAvatar} className="text-xs text-red-500 hover:underline">
                Remove
              </button>
            )}
          </div>

          <div className="flex-1">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 mb-1">Display Name</label>
              <div className="flex gap-2">
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={100}
                  className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-chess-gold"
                  placeholder="Your display name"
                />
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="bg-chess-gold text-white px-4 py-2 rounded text-sm hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Username:</span>
                <p className="font-medium">@{profile.username}</p>
              </div>
              <div>
                <span className="text-gray-500">Email:</span>
                <p className="font-medium">{profile.email}</p>
              </div>
              <div>
                <span className="text-gray-500">Role:</span>
                <p className="font-medium capitalize">{profile.role.name}</p>
              </div>
              <div>
                <span className="text-gray-500">Member since:</span>
                <p className="font-medium">{new Date(profile.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-chess-dark">{profile._count.bookmarks}</p>
          <p className="text-sm text-gray-500">Bookmarks</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-chess-dark">{profile._count.playlists}</p>
          <p className="text-sm text-gray-500">Playlists</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-chess-dark">{profile._count.lessonProgress}</p>
          <p className="text-sm text-gray-500">Lessons Completed</p>
        </div>
      </div>

      {/* Change Password */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-chess-dark mb-4">Change Password</h2>
        <div className="space-y-3 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-chess-gold"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-chess-gold"
            />
            <p className="text-xs text-gray-400 mt-1">Min 8 chars, at least one uppercase and one number</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-chess-gold"
            />
          </div>
          <button
            onClick={handleChangePassword}
            disabled={changingPw || !currentPassword || !newPassword || !confirmPassword}
            className="bg-chess-dark text-white px-6 py-2 rounded text-sm hover:bg-chess-accent disabled:opacity-50 transition-colors"
          >
            {changingPw ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </div>
    </div>
  );
}
