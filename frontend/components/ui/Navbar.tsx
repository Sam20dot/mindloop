'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';

const NAV_LINKS = [
  { href: '/dashboard',       label: 'Dashboard',      icon: '🏠' },
  { href: '/learn',           label: 'Learn',          icon: '📚' },
  { href: '/library',         label: 'Library',        icon: '🗂️' },
  { href: '/career',          label: 'Career',         icon: '🗺️' },
  { href: '/cv',              label: 'My CV',          icon: '📄' },
  { href: '/opportunities',   label: 'Opportunities',  icon: '🎯' },
  { href: '/community',       label: 'Community',      icon: '💬' },
  { href: '/leaderboard',     label: 'Leaderboard',    icon: '🏆' },
];

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!session) return null;

  const user = (session as any).user;
  const points = user?.points ?? 0;
  const isAdmin = user?.role === 'admin';
  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <>
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold text-indigo-700 flex-shrink-0">
            MindLoop
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label, icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {icon} {label}
                </Link>
              );
            })}
            {isAdmin && (
              <Link href="/admin-dashboard"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === '/admin-dashboard' ? 'bg-red-50 text-red-700' : 'text-red-500 hover:bg-red-50'
                }`}>
                🛡 Admin
              </Link>
            )}
          </nav>

          {/* Right: points + avatar + mobile menu */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full">
              ⭐ {points.toLocaleString()} pts
            </span>
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/auth/login' })}
              className="hidden md:block text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              Sign out
            </button>
            {/* Mobile hamburger */}
            <button
              className="md:hidden p-1 rounded-lg text-gray-600 hover:bg-gray-100"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4 pt-2 space-y-1">
            {NAV_LINKS.map(({ href, label, icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{icon}</span>{label}
                </Link>
              );
            })}
            {isAdmin && (
              <Link href="/admin-dashboard" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50">
                🛡 Admin Dashboard
              </Link>
            )}
            <button
              onClick={() => signOut({ callbackUrl: '/auth/login' })}
              className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors mt-2"
            >
              🚪 Sign out
            </button>
          </div>
        )}
      </header>
    </>
  );
}
