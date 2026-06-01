import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { isAdmin, isDoctor } from '@/lib/roles';

export default function AccessDenied({ requiredRole = 'authorized' }) {
  const { user } = useAuth();

  return (
    <div className="flex flex-1 items-center justify-center min-h-[50vh] px-4 py-12 bg-rose-50">
      <div className="max-w-md w-full bg-white rounded-2xl border border-rose-100 shadow-lg p-8 text-center">
        <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Access denied</h1>
        <p className="text-sm text-gray-600 mb-6">
          This page requires <strong>{requiredRole}</strong> access. You are signed in as{' '}
          <strong>{user?.role || 'user'}</strong>.
        </p>
        <div className="flex flex-col gap-2">
          <Link to="/">
            <Button className="w-full rounded-full bg-rose-500 hover:bg-rose-600">Back to home</Button>
          </Link>
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
        </div>
      </div>
    </div>
  );
}
