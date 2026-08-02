import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { getHomeworkAccess, getHomeworkChildren, HomeworkAccess, setActiveChildSrn } from '@/lib/homework-access';

interface StudentAuthState {
  checking: boolean;
  loggedIn: boolean;
  access: HomeworkAccess | null;
  /** Every sibling linked to this login — length 1 for an only child. */
  allChildren: HomeworkAccess[];
  refresh: () => Promise<void>;
  setAccess: (access: HomeworkAccess | null) => void;
  /** Switches which child's data every screen reads, without re-login. */
  switchChild: (srn: string) => Promise<void>;
}

const StudentAuthContext = createContext<StudentAuthState>({
  checking: true,
  loggedIn: false,
  access: null,
  allChildren: [],
  refresh: async () => {},
  setAccess: () => {},
  switchChild: async () => {},
});

/** Mirrors TeacherAuthProvider so the bottom bar (and anything else outside
 * the Homework screen itself) can tell whether a student is logged in — the
 * Homework screen previously read AsyncStorage locally with no way for
 * other components to know about it. */
export function StudentAuthProvider({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [access, setAccessState] = useState<HomeworkAccess | null>(null);
  const [allChildren, setAllChildren] = useState<HomeworkAccess[]>([]);

  const refresh = useCallback(async () => {
    const [a, list] = await Promise.all([getHomeworkAccess(), getHomeworkChildren()]);
    setAccessState(a);
    setAllChildren(list);
    setChecking(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setAccess = useCallback((a: HomeworkAccess | null) => {
    setAccessState(a);
  }, []);

  const switchChild = useCallback(
    async (srn: string) => {
      await setActiveChildSrn(srn);
      await refresh();
    },
    [refresh]
  );

  return (
    <StudentAuthContext.Provider value={{ checking, loggedIn: !!access, access, allChildren, refresh, setAccess, switchChild }}>
      {children}
    </StudentAuthContext.Provider>
  );
}

export function useStudentAuth(): StudentAuthState {
  return useContext(StudentAuthContext);
}
