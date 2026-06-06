import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { isAdmin, isDoctor } from '@/lib/roles';
import UserProfileMenu from '@/components/UserProfileMenu';
import ThemeToggle from '@/components/ThemeToggle';
import NotificationBell from '@/components/NotificationBell';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';

const NAV_LINKS = [
  { to: '/chat', label: 'AI Chat' },
  { to: '/forum', label: 'Forum' },
  { to: '/mother-chat', label: 'Mom Chat 💬' },
  { to: '/doctors', label: 'Doctors' },
  { to: '/articles', label: 'Library' },
];

function roleNavLinks(user) {
  if (isAdmin(user)) return [{ to: '/admin', label: 'Admin' }];
  if (isDoctor(user)) return [{ to: '/doctor', label: 'My practice' }];
  return [];
}

function authPath(path, isAuthenticated) {
  if (isAuthenticated) return path;
  return `/login?redirect=${encodeURIComponent(path)}`;
}

function isNavLinkActive(pathname, to) {
  if (to === '/doctors') {
    return pathname === '/doctors' || pathname.startsWith('/book');
  }
  if (to === '/chat' || to === '/forum') {
    return pathname === to;
  }
  return pathname === to || pathname.startsWith(`${to}/`);
}

function navLinkClasses(active, { mobile = false } = {}) {
  if (mobile) {
    return cn(
      'block py-3 text-base border-b border-rose-50 dark:border-gray-800 last:border-0 transition-colors',
      active
        ? 'text-rose-500 dark:text-rose-400 font-semibold bg-rose-50/80 dark:bg-rose-950/30 -mx-2 px-2 rounded-lg border-b-0'
        : 'text-gray-700 dark:text-gray-200 hover:text-rose-500 dark:hover:text-rose-400',
    );
  }
  return cn(
    'transition-colors whitespace-nowrap',
    active
      ? 'text-rose-500 dark:text-rose-400 font-semibold'
      : 'text-gray-600 dark:text-gray-300 hover:text-rose-500 dark:hover:text-rose-400',
  );
}

/** SheetClose only works inside the mobile Sheet — use this wrapper for menu links/buttons */
function MenuWrap({ inSheet, children }) {
  if (inSheet) {
    return <SheetClose asChild>{children}</SheetClose>;
  }
  return children;
}

function NavLinks({ isAuthenticated, user, onNavigate, className = '', pathname, includeSettings = false }) {
  const links = [
    ...NAV_LINKS,
    ...(includeSettings && isAuthenticated ? [{ to: '/settings', label: 'Settings' }] : []),
    ...roleNavLinks(user),
  ];
  return (
    <ul className={className}>
      {links.map(({ to, label }) => {
        const active = isNavLinkActive(pathname, to);
        return (
          <li key={to}>
            <MenuWrap inSheet={true}>
              <Link
                to={authPath(to, isAuthenticated)}
                onClick={onNavigate}
                className={navLinkClasses(active, { mobile: true })}
                aria-current={active ? 'page' : undefined}
              >
                {label}
              </Link>
            </MenuWrap>
          </li>
        );
      })}
    </ul>
  );
}

function AuthActions({ isAuthenticated, user, logout, mobile = false, onNavigate }) {
  if (isAuthenticated && user) {
    return (
      <div className={mobile ? 'pt-4 border-t border-rose-100 flex justify-center' : 'shrink-0'}>
        <UserProfileMenu user={user} onLogout={() => logout(false)} onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className={mobile ? 'flex flex-col gap-2 pt-4 border-t border-rose-100' : 'flex items-center gap-2 shrink-0'}>
      <MenuWrap inSheet={mobile}>
        <Link to="/login" className={mobile ? 'w-full' : undefined}>
          <Button
            variant="outline"
            size={mobile ? 'default' : 'sm'}
            className={`${mobile ? 'w-full rounded-full' : ''} border-slate-300 text-slate-700`}
          >
            Sign in
          </Button>
        </Link>
      </MenuWrap>
      <MenuWrap inSheet={mobile}>
        <Link to="/signup" className={mobile ? 'w-full' : undefined}>
          <Button
            size={mobile ? 'default' : 'sm'}
            className={`${mobile ? 'w-full rounded-full' : ''} bg-rose-500 hover:bg-rose-600 text-white`}
          >
            Sign up
          </Button>
        </Link>
      </MenuWrap>
    </div>
  );
}

export default function SiteNav() {
  const { user, isAuthenticated, logout, refreshUser } = useAuth();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const desktopLinks = [...NAV_LINKS, ...roleNavLinks(user)];
  const homeActive = pathname === '/';

  useEffect(() => {
    if (isAuthenticated) refreshUser?.();
  }, [isAuthenticated, refreshUser]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur border-b border-rose-100 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 min-w-0 shrink">
          <span className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-xl shadow-sm shadow-rose-200 shrink-0">
            🌸
          </span>
          <span
            className={cn(
              'text-lg sm:text-xl font-bold truncate transition-colors',
              homeActive
                ? 'text-rose-500 dark:text-rose-400'
                : 'text-rose-600 dark:text-rose-400 hover:text-rose-500',
            )}
          >
            Mama-Care
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          {desktopLinks.map(({ to, label }) => {
            const active = isNavLinkActive(pathname, to);
            return (
              <Link
                key={to}
                to={authPath(to, isAuthenticated)}
                className={navLinkClasses(active)}
                aria-current={active ? 'page' : undefined}
              >
                {label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <ThemeToggle />
          {isAuthenticated && user && <NotificationBell />}

          {/* Desktop auth */}
          <div className="hidden md:block">
            <AuthActions
              isAuthenticated={isAuthenticated}
              user={user}
              logout={logout}
            />
          </div>

          {/* Mobile menu */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden shrink-0 text-gray-700 dark:text-gray-200 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-gray-800"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </Button>
          <SheetContent side="right" className="w-[min(100vw-2rem,320px)] p-0 flex flex-col">
            <SheetHeader className="px-6 pt-6 pb-2 text-left border-b border-rose-100 dark:border-gray-800">
              <SheetTitle className="text-rose-600 dark:text-rose-400 font-bold">Menu</SheetTitle>
            </SheetHeader>
            <nav className="flex-1 overflow-y-auto px-6 py-2">
              <NavLinks
                isAuthenticated={isAuthenticated}
                user={user}
                pathname={pathname}
                includeSettings
                onNavigate={() => setMenuOpen(false)}
              />
            </nav>
            <div className="px-6 pb-6">
              <AuthActions
                isAuthenticated={isAuthenticated}
                user={user}
                onNavigate={() => setMenuOpen(false)}
                logout={() => {
                  setMenuOpen(false);
                  logout(false);
                }}
                mobile
              />
            </div>
          </SheetContent>
        </Sheet>
        </div>
      </div>
    </nav>
  );
}
