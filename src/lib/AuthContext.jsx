import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { mapUser, getCurrentUser, logout as authLogout, redirectToLogin } from '@/api/auth';

const AuthContext = createContext();

async function userFromSession(sessionUser) {
  if (!sessionUser) return null;
  try {
    return await mapUser(sessionUser);
  } catch {
    return {
      id: sessionUser.id,
      email: sessionUser.email,
      email_confirmed_at: sessionUser.email_confirmed_at,
      full_name:
        sessionUser.user_metadata?.full_name ||
        sessionUser.user_metadata?.name ||
        sessionUser.email?.split('@')[0] ||
        '',
      flower_name: null,
      role: 'user',
      user_metadata: sessionUser.user_metadata,
    };
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const safetyTimerRef = useRef(null);

  const clearSafetyTimer = () => {
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  };

  const finishLoading = useCallback((authenticated, nextUser = null) => {
    clearSafetyTimer();
    setUser(nextUser);
    setIsAuthenticated(authenticated);
    setIsLoadingAuth(false);
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    let mounted = true;

    safetyTimerRef.current = setTimeout(() => {
      if (mounted) {
        setIsLoadingAuth(false);
        setAuthChecked(true);
      }
    }, 5000);

    const applySession = async (session) => {
      if (!mounted) return;
      if (!session?.user) {
        finishLoading(false, null);
        return;
      }
      try {
        setAuthError(null);
        const currentUser = await userFromSession(session.user);
        if (mounted) finishLoading(true, currentUser);
      } catch (error) {
        console.error('Auth session error:', error);
        if (mounted) finishLoading(false, null);
      }
    };

    // Single source of truth — defer to avoid Supabase auth deadlock
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => {
        if (mounted) applySession(session);
      }, 0);
    });

    return () => {
      mounted = false;
      clearSafetyTimer();
      subscription.unsubscribe();
    };
  }, [finishLoading]);

  const refreshUser = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      finishLoading(false, null);
      return null;
    }
    const currentUser = await userFromSession(session.user);
    finishLoading(true, currentUser);
    return currentUser;
  }, [finishLoading]);

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    try {
      setAuthError(null);
      const currentUser = await getCurrentUser();
      finishLoading(true, currentUser);
      return currentUser;
    } catch (error) {
      console.error('User auth check failed:', error);
      finishLoading(false, null);
      if (error?.status === 401 || error?.status === 403) {
        setAuthError({ type: 'auth_required', message: 'Authentication required' });
      }
      throw error;
    }
  }, [finishLoading]);

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    setAuthChecked(true);
    if (shouldRedirect) {
      authLogout(window.location.origin);
    } else {
      authLogout();
    }
  };

  const navigateToLogin = () => {
    redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings: null,
        authChecked,
        logout,
        navigateToLogin,
        checkUserAuth,
        refreshUser,
        checkAppState: checkUserAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
