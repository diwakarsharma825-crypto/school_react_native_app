import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { fetchStudentSiblingsApi } from '@/data/homework-api';
import { getHomeworkAccess, getHomeworkChildren, HomeworkAccess, saveHomeworkChildren, setActiveChildSrn } from '@/lib/homework-access';

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
    let [a, list] = await Promise.all([getHomeworkAccess(), getHomeworkChildren()]);

    if (a?.phone) {
      try {
        const liveSiblings = await fetchStudentSiblingsApi(a.phone);
        if (liveSiblings && liveSiblings.length > 0) {
          const formatted: HomeworkAccess[] = liveSiblings.map((s) => ({
            name: s.name,
            srn: s.srn,
            rollNo: s.roll_no || undefined,
            fatherName: s.father_name || undefined,
            motherName: s.mother_name || undefined,
            className: s.class,
            section: s.section,
            phone: s.phone || a?.phone || '',
            gender: s.gender,
            dob: s.dob,
            photoUrl: s.photo_url,
          }));
          await saveHomeworkChildren(formatted);
          list = formatted;
          const updatedActive = formatted.find((c) => c.srn === a?.srn) ?? formatted[0];
          a = updatedActive;
        }
      } catch {}
    }

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
