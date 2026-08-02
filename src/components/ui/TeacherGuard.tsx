import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback } from 'react';

import { useTeacherAuth } from '@/hooks/use-teacher-auth';
import { Loading } from './states';
import { Screen } from './Screen';

/** Wraps every teacher-only screen (Add Notice, Manage Events, Attendance,
 * etc.) — without this, a screen with no session guard at all would just
 * render broken/empty for a signed-out visitor instead of sending them to
 * teacher-login. Shows a loading state while the session is still being
 * checked so it never flashes the wrong screen first.
 *
 * The redirect only fires inside useFocusEffect, not on every render —
 * React Navigation keeps earlier stack screens mounted underneath the
 * current one (for back-swipe), so a plain "if (!loggedIn) router.replace"
 * in the render body was firing from screens the user had already
 * navigated away from, replacing them with the login screen in the
 * background. That's what surfaced as "teacher login keeps reappearing
 * after logout" — a background screen redirecting, not the visible one. */
export function TeacherGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { checking, loggedIn } = useTeacherAuth();

  useFocusEffect(
    useCallback(() => {
      if (!checking && !loggedIn) {
        router.replace('/teacher-login');
      }
    }, [checking, loggedIn, router])
  );

  if (checking || !loggedIn) {
    return (
      <Screen scroll={false}>
        <Loading label="Checking login…" />
      </Screen>
    );
  }

  return <>{children}</>;
}
