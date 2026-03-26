'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';

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
  { href: '/admin/categories', label: 'Categories', icon: '📂' },
  { href: '/admin/levels', label: 'Levels', icon: '📏' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
];

const collaboratorNav: NavItem[] = [
  { href: '/collaborator', label: 'Overview', icon: '📊' },
  { href: '/collaborator/lessons', label: 'My Lessons', icon: '📚' },
  { href: '/collaborator/blog', label: 'My Blog Posts', icon: '✍️' },
];

const userNav: NavItem[] = [
  { href: '/dashboard', label: 'My Dashboard', icon: '🏠' },
  { href: '/library', label: 'My Library', icon: '🔖' },
  { href: '/profile', label: 'My Profile', icon: '👤' },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems =
    user?.role === 'admin' ? adminNav : user?.role === 'collaborator' ? collaboratorNav : userNav;

  return (
    <aside className="w-64 bg-chess-dark text-white min-h-screen p-4">
      <div className="mb-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-chess-cream">
          <span className="text-xl">♟</span> ChessLearn
        </Link>
        <p className="text-gray-400 text-xs mt-1 capitalize">{user?.role} Dashboard</p>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const exactRoutes = ['/admin', '/collaborator', '/dashboard'];
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
      <div className="mt-8 pt-4 border-t border-gray-700">
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
          ← Back to site
        </Link>
      </div>
    </aside>
  );
}
