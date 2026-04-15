// PHP-backed authentication context
// Provides auth functionality using the PHP backend API
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [instituteId, setInstituteId] = useState(null);
  const [institute, setInstitute] = useState(null);
  const [moduleVisibility, setModuleVisibility] = useState({});

  const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

  const fetchModuleSettings = useCallback(async (currentInstituteId) => {
    // Minimal placeholder: module settings are optional; leave empty for now.
    setModuleVisibility({});
  }, []);

  const handleSession = useCallback(async (sessionObj) => {
    setSession(sessionObj);
    let currentUser = null;
    if (sessionObj && sessionObj.user) currentUser = sessionObj.user;
    // Normalize shape to keep user_metadata for compatibility
    if (currentUser && !currentUser.user_metadata) {
      currentUser = {
        ...currentUser,
        user_metadata: {
          role: currentUser.role ?? null,
          institute_id: currentUser.institute_id ?? null,
          full_name: currentUser.full_name ?? currentUser.name ?? null,
          ...(currentUser.user_metadata || {}),
        }
      };
    }
    setUser(currentUser);
    if (currentUser) {
      const userRole = currentUser.user_metadata?.role;
      const userInstituteId = currentUser.user_metadata?.institute_id;
      if (userRole === 'super_admin') {
        const selectedInstituteId = localStorage.getItem('selectedInstituteId');
        if (selectedInstituteId) {
          setInstituteId(selectedInstituteId);
          await fetchModuleSettings(selectedInstituteId);
        }
      } else if (userInstituteId) {
        setInstituteId(userInstituteId);
        // Optionally fetch institute info here
      }
    } else {
      setInstituteId(null);
      setInstitute(null);
      setModuleVisibility({});
    }
    setLoading(false);
  }, [fetchModuleSettings]);

  useEffect(() => {
    const getSession = async () => {
      try {
        const res = await fetch(`${apiBase}/auth/session`, { credentials: 'include' });
        const data = await res.json();
        const sessionObj = data?.user ? { user: data.user } : null;
        if (!sessionObj) {
          // fallback to local dev quick-login
          try {
            const stored = localStorage.getItem('vidya_user');
            if (stored) {
              const parsed = JSON.parse(stored);
              await handleSession({ user: parsed });
              return;
            }
          } catch (e) { /* ignore */ }
        }
        await handleSession(sessionObj);
      } catch (err) {
        console.warn('Failed to fetch session from backend:', err?.message || err);
        // fallback to localStorage quick-login
        try {
          const stored = localStorage.getItem('vidya_user');
          if (stored) {
            const parsed = JSON.parse(stored);
            await handleSession({ user: parsed });
            return;
          }
        } catch (e) {}
        await handleSession(null);
      }
    };
    getSession();
  }, [apiBase, handleSession]);

  const signIn = useCallback(async (email, password) => {
    try {
      const res = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data };
      }
      // Persist for dev quick-login
      try { localStorage.setItem('vidya_user', JSON.stringify(data.user)); } catch (e) {}
      await handleSession({ user: data.user });
      return { data };
    } catch (err) {
      return { error: { message: err.message } };
    }
  }, [apiBase, handleSession]);

  const signOut = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/auth/logout`, { method: 'POST', credentials: 'include' });
      try { localStorage.removeItem('vidya_user'); } catch (e) {}
      await handleSession(null);
      return { error: null };
    } catch (err) {
      return { error: { message: err.message } };
    }
  }, [apiBase, handleSession]);

  const selectInstituteForSuperAdmin = useCallback(async (newInstituteId) => {
    if (user?.user_metadata?.role !== 'super_admin') return;
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/auth/session`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { institute_id: newInstituteId } }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error?.message || 'Failed to update institute');
      await handleSession({ user: d.user });
      localStorage.setItem('selectedInstituteId', newInstituteId || '');
      setInstituteId(newInstituteId);
      return d.user;
    } catch (err) {
      toast({ variant: 'destructive', title: 'Failed to update institute', description: err.message });
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiBase, user, handleSession, toast]);

  const value = useMemo(() => ({ user, session, loading, instituteId, institute, moduleVisibility, setInstituteId: selectInstituteForSuperAdmin, signIn, signOut }), [user, session, loading, instituteId, institute, moduleVisibility, selectInstituteForSuperAdmin, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};