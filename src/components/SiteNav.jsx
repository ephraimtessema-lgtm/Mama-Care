import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { isAdmin, isDoctor } from '@/lib/roles';
import UserProfileMenu from '@/components/UserProfileMenu';
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

/** SheetClose only works inside the mobile Sheet — use this wrapper for menu links/buttons */
function MenuWrap({ inSheet, children }) {
  if (inSheet) {
    return <SheetClose asChild>{children}</SheetClose>;
  }
  return children;
}

function NavLinks({ isAuthenticated, user, onNavigate, className = '' }) {
  const links = [...NAV_LINKS, ...roleNavLinks(user)];
  return (
    <ul className={className}>
      {links.map(({ to, label }) => (
        <li key={to}>
          <MenuWrap inSheet={true}>
            <Link
              to={authPath(to, isAuthenticated)}
              onClick={onNavigate}
              className="block py-3 text-base text-gray-700 hover:text-rose-500 border-b border-rose-50 last:border-0 transition-colors"
            >
              {label}
            </Link>
          </MenuWrap>
        </li>
      ))}
    </ul>
  );
}

function AuthActions({ isAuthenticated, user, logout, mobile = false }) {
  if (isAuthenticated && user) {
    return (
      <div className={mobile ? 'pt-4 border-t border-rose-100 flex justify-center' : 'shrink-0'}>
        <UserProfileMenu user={user} onLogout={() => logout(false)} />
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
  const [menuOpen, setMenuOpen] = useState(false);
  const desktopLinks = [...NAV_LINKS, ...roleNavLinks(user)];

  useEffect(() => {
    if (isAuthenticated) refreshUser?.();
  }, [isAuthenticated, refreshUser]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-rose-100">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 min-w-0 shrink">
          <span className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-xl shadow-sm shadow-rose-200 shrink-0">
            🌸
          </span>
          <span className="text-lg sm:text-xl font-bold text-rose-600 truncate">Mama-Care</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
          {desktopLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={authPath(to, isAuthenticated)}
              className="hover:text-rose-500 transition-colors whitespace-nowrap"
            >
              {label}
            </Link>
          ))}
        </div>

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
            className="md:hidden shrink-0 text-gray-700 hover:text-rose-500 hover:bg-rose-50"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </Button>
          <SheetContent side="right" className="w-[min(100vw-2rem,320px)] p-0 flex flex-col">
            <SheetHeader className="px-6 pt-6 pb-2 text-left border-b border-rose-100">
              <SheetTitle className="text-rose-600 font-bold">Menu</SheetTitle>
            </SheetHeader>
            <nav className="flex-1 overflow-y-auto px-6 py-2">
              <NavLinks
                isAuthenticated={isAuthenticated}
                user={user}
                onNavigate={() => setMenuOpen(false)}
              />
            </nav>
            <div className="px-6 pb-6">
              <AuthActions
                isAuthenticated={isAuthenticated}
                user={user}
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
    </nav>
  );
}
