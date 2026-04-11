'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getRoleDisplayName } from '@/lib/url';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const adminNav: NavItem[] = [
  { href: '/admin', label: 'Overview', icon: '📊' },
  { href: '/admin/approvals', label: 'Approvals', icon: '✅' },
  { href: '/admin/lessons', label: 'Lessons', icon: '📚' },
  { href: '/admin/blog', label: 'Blog Posts', icon: '✍️' },
  { href: '/admin/classrooms', label: 'All Classrooms', icon: '🏫' },
  { href: '/collaborator/classrooms', label: 'My Classrooms', icon: '🎓' },
  { href: '/admin/clubs', label: 'Clubs', icon: '♟' },
  { href: '/admin/categories', label: 'Categories', icon: '📂' },
  { href: '/admin/levels', label: 'Levels', icon: '📏' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
];

const clubAdminNav: NavItem[] = [
  { href: '/club-admin', label: 'Overview', icon: '📊' },
  { href: '/club-admin/coaches', label: 'Coaches', icon: '👥' },
  { href: '/collaborator/locations', label: 'Locations', icon: '📍' },
  { href: '/collaborator/classrooms', label: 'My Classrooms', icon: '🏫' },
  { href: '/collaborator/lessons', label: 'My Lessons', icon: '📚' },
  { href: '/collaborator/blog', label: 'My Blog Posts', icon: '✍️' },
];

const collaboratorNav: NavItem[] = [
  { href: '/collaborator', label: 'Overview', icon: '📊' },
  { href: '/collaborator/lessons', label: 'My Lessons', icon: '📚' },
  { href: '/collaborator/blog', label: 'My Blog Posts', icon: '✍️' },
  { href: '/collaborator/classrooms', label: 'My Classrooms', icon: '🏫' },
];

const coachNav: NavItem[] = [
  { href: '/collaborator/locations', label: 'My Locations', icon: '📍' },
  { href: '/collaborator/classrooms', label: 'My Groups', icon: '🏫' },
];

const userNav: NavItem[] = [
  { href: '/dashboard', label: 'My Dashboard', icon: '🏠' },
  { href: '/library', label: 'My Library', icon: '🔖' },
  { href: '/classrooms', label: 'My Classrooms', icon: '🏫' },
  { href: '/profile', label: 'My Profile', icon: '👤' },
];

const exactRoutes = ['/admin', '/collaborator', '/dashboard', '/club-admin'];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  let navItems: NavItem[];
  if (user?.role === 'admin') navItems = adminNav;
  else if (user?.role === 'club_admin') navItems = clubAdminNav;
  else if (user?.role === 'coach') navItems = coachNav;
  else if (user?.role === 'collaborator') navItems = collaboratorNav;
  else navItems = userNav;

  const clubName = user?.club?.name ?? undefined;
  const roleLabel = user?.role
    ? getRoleDisplayName(user.role as 'admin' | 'club_admin' | 'collaborator' | 'coach' | 'user', clubName)
    : '';

  return (
    <aside className="w-64 bg-chess-dark text-white min-h-screen p-4 flex flex-col">
      <div className="mb-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-chess-cream">
          <span className="text-xl">♟</span> ChessLearn
        </Link>
        <p className="text-gray-400 text-xs mt-1">{roleLabel} Dashboard</p>
        {clubName && (
          <p className="text-chess-gold text-xs mt-0.5 font-medium">{clubName}</p>
        )}
      </div>
      <nav className="space-y-1 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (!exactRoutes.includes(item.href) && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-chess-accent text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-4 pt-4 border-t border-gray-700">
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
          ← Back to site
        </Link>
      </div>
    </aside>
  );
}
