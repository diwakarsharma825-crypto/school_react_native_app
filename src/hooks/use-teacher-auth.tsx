import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { fetchTeacherProfile, getTeacherToken, TeacherProfile } from '@/data/teacher-api';

interface TeacherAuthState {
  checking: boolean;
  loggedIn: boolean;
  profile: TeacherProfile | null;
  refresh: () => Promise<void>;
  setLoggedIn: (v: boolean) => void;
}

const TeacherAuthContext = createContext<TeacherAuthState>({
  checking: true,
  loggedIn: false,
  profile: null,
  refresh: async () => {},
  setLoggedIn: () => {},
});

export function TeacherAuthProvider({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [loggedIn, setLoggedInState] = useState(false);
  const [profile, setProfile] = useState<TeacherProfile | null>(null);

  const refresh = useCallback(async () => {
    const token = await getTeacherToken();
    if (!token) {
      setLoggedInState(false);
      setProfile(null);
      setChecking(false);
      return;
    }
    try {
      const p = await fetchTeacherProfile();
      setProfile(p);
      setLoggedInState(true);
    } catch {
      // Token rejected/expired — treat as logged out.
      setLoggedInState(false);
      setProfile(null);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setLoggedIn = useCallback(
    (v: boolean) => {
      setLoggedInState(v);
      if (v) refresh();
      else setProfile(null);
    },
    [refresh]
  );

  return (
    <TeacherAuthContext.Provider value={{ checking, loggedIn, profile, refresh, setLoggedIn }}>
      {children}
    </TeacherAuthContext.Provider>
  );
}

export function useTeacherAuth(): TeacherAuthState {
  return useContext(TeacherAuthContext);
}
