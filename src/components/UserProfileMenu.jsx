import { Link } from 'react-router-dom';
import { LogOut, Settings, Shield, Stethoscope } from 'lucide-react';
import UserAvatar from '@/components/UserAvatar';
import { getUsername, getFlowerName } from '@/lib/displayName';
import { isAdmin, isDoctor } from '@/lib/roles';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function UserProfileMenu({ user, onLogout, onNavigate }) {
  const username = getUsername(user);
  const flowerName = getFlowerName(user);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2"
          aria-label="Account menu"
        >
          <UserAvatar user={user} size="md" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-xl">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1.5 py-0.5">
            <span className="font-semibold text-gray-900">{username}</span>
            <span className="text-xs text-gray-500 font-normal truncate">{user.email}</span>
            {flowerName && (
              <p className="text-xs text-rose-600 bg-rose-50 rounded-lg px-2 py-1.5 mt-0.5 leading-snug">
                Your flower name is: <span className="font-medium">🌸 {flowerName}</span>
              </p>
            )}
            {(isAdmin(user) || isDoctor(user)) && (
              <span className="text-xs text-gray-400">
                {isAdmin(user) ? 'Administrator' : 'Doctor'}
              </span>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isAdmin(user) && (
          <DropdownMenuItem asChild>
            <Link to="/admin" className="cursor-pointer gap-2" onClick={() => onNavigate?.()}>
              <Shield className="w-4 h-4" />
              Admin dashboard
            </Link>
          </DropdownMenuItem>
        )}
        {isDoctor(user) && (
          <DropdownMenuItem asChild>
            <Link to="/doctor" className="cursor-pointer gap-2" onClick={() => onNavigate?.()}>
              <Stethoscope className="w-4 h-4" />
              Doctor dashboard
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link to="/settings" className="cursor-pointer gap-2" onClick={() => onNavigate?.()}>
            <Settings className="w-4 h-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer gap-2 text-red-600 focus:text-red-600 focus:bg-red-50"
          onClick={() => onLogout?.()}
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
