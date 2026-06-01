import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { getUsername, getFlowerName } from '@/lib/displayName';
import UserAvatar from '@/components/UserAvatar';
import { Button } from '@/components/ui/button';
import { isAdmin, isDoctor } from '@/lib/roles';

export default function Settings() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const username = getUsername(user);
  const flowerName = getFlowerName(user);

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

        <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-4">
            <UserAvatar user={user} size="lg" />
            <div className="min-w-0">
              <p className="font-semibold text-gray-900">{username}</p>
              <p className="text-sm text-gray-500 truncate">{user.email}</p>
            </div>
          </div>

          {flowerName && (
            <p className="text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
              Your flower name is: <span className="font-semibold">🌸 {flowerName}</span>
              <span className="block text-xs text-rose-600/80 mt-1 font-normal">
                Used in Forum and Mom Chat so others do not see your real name.
              </span>
            </p>
          )}

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Account type</span>
              <span className="font-medium text-gray-800 capitalize">{user.role || 'user'}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {isAdmin(user) && (
              <Link to="/admin">
                <Button variant="outline" className="w-full rounded-full">
                  Admin dashboard
                </Button>
              </Link>
            )}
            {isDoctor(user) && (
              <Link to="/doctor">
                <Button variant="outline" className="w-full rounded-full">
                  Doctor dashboard
                </Button>
              </Link>
            )}
            <Button
              variant="outline"
              className="w-full rounded-full border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => logout(false)}
            >
              Sign out
            </Button>
          </div>
        </div>

        <p className="text-center mt-6">
          <Link to="/" className="text-sm text-rose-500 hover:text-rose-600">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
