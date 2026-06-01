import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppLayout from '@/components/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleRoute from '@/components/RoleRoute';
import LoginRequired from '@/components/LoginRequired';
import { ROLES } from '@/lib/roles';
import Landing from './pages/Landing';
import Forum from './pages/Forum';
import Doctors from './pages/Doctors';
import BookAppointment from './pages/BookAppointment';
import Articles from './pages/Articles';
import AdminDashboard from './pages/AdminDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import MotherChat from './pages/MotherChat';
import MotherPrivateChat from './pages/MotherPrivateChat';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import Settings from './pages/Settings';
import { getSavedLanguage } from '@/lib/userSettings';
import { applyAppLanguage } from '@/lib/runtimeLanguage';

const AiChat = lazy(() => import('./pages/AiChat'));

function PageLoader() {
  return (
    <div className="flex flex-1 items-center justify-center min-h-[50vh] bg-rose-50 dark:bg-gray-950">
      <div className="text-center">
        <div className="text-4xl mb-3 animate-pulse">🌸</div>
        <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto" />
      </div>
    </div>
  );
}

function AuthLoading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-rose-50 dark:bg-gray-950 z-50">
      <div className="text-center">
        <div className="text-4xl mb-3 animate-pulse">🌸</div>
        <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto" />
      </div>
    </div>
  );
}

const AppRoutes = () => {
  const { isLoadingAuth, authError } = useAuth();

  if (isLoadingAuth) {
    return <AuthLoading />;
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          <Route element={<ProtectedRoute unauthenticatedElement={<LoginRequired />} />}>
            <Route path="/chat" element={<AiChat />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/mother-chat" element={<MotherChat />} />
            <Route path="/mother-chat/dm/:partnerId" element={<MotherPrivateChat />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/book" element={<BookAppointment />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={ROLES.ADMIN} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={ROLES.DOCTOR} />}>
            <Route path="/doctor" element={<DoctorDashboard />} />
          </Route>

          <Route path="*" element={<PageNotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

function App() {
  useEffect(() => {
    const saved = getSavedLanguage();
    if (saved && saved !== 'en') {
      applyAppLanguage(saved);
    } else {
      document.documentElement.lang = 'en';
    }
  }, []);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AppRoutes />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
