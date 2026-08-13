import * as SystemUI from 'expo-system-ui';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useNetworkState } from 'expo-network';
import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { OfflineScreen } from '@/components/ui/OfflineScreen';
import { LaunchScreen } from '@/components/ui/LaunchScreen';
import { DynamicBottomBar } from '@/components/ui/DynamicBottomBar';
import { TrialBanner } from '@/components/ui/TrialBanner';

import { useTheme } from '@/hooks/use-theme';
import { BrandProvider } from '@/hooks/use-brand';
import { LayoutProvider } from '@/hooks/use-layout';
import { StudentAuthProvider } from '@/hooks/use-student-auth';
import { TeacherAuthProvider } from '@/hooks/use-teacher-auth';
import { ThemeModeProvider } from '@/hooks/use-theme-mode';
import {
  ALL_SECTIONS_ENABLED,
  AppStatus,
  DEFAULT_BOTTOM_TABS,
  DEFAULT_HOME_TILES,
  fetchAppStatus,
  registerDevice,
} from '@/data/app-status';
import { BASE_URL } from '@/data/api';
import { getAppVersion } from '@/lib/device';
import { isOnboardingComplete, isInstituteOnboardingComplete, markInstituteOnboardingComplete } from '@/lib/onboarding';
import { configureNotificationHandler, ensureNotificationChannel, getFcmPushToken } from '@/lib/notifications';
import { isUpdateRequired } from '@/lib/version';
import { LockScreen } from '@/components/ui/LockScreen';
import { UpdateRequiredScreen } from '@/components/ui/UpdateRequiredScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { DetailHeader } from '@/components/ui/DetailHeader';
import { SectionsProvider } from '@/hooks/use-sections';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { InstituteOnboarding } from '@/components/onboarding/InstituteOnboarding';

configureNotificationHandler();

const FAIL_OPEN_STATUS: AppStatus = {
  enabled: true,
  reason: null,
  title: null,
  message: null,
  devName: null,
  phone: null,
  email: null,
  whatsapp: null,
  enabledSections: ALL_SECTIONS_ENABLED,
  minVersion: null,
  storeUrl: null,
  appLogoUrl: null,
  primaryColor: null,
  accentColor: null,
  homeTiles: DEFAULT_HOME_TILES,
  bottomTabs: DEFAULT_BOTTOM_TABS,
  achieversDisplay: 'marks',
  trial: { startDate: '', totalDays: 7, remainingDays: 7, ended: false, features: [] },
};

function RootLayoutInner() {
  const theme = useTheme();
  const [status, setStatus] = useState<AppStatus | null>(null);
  const [checking, setChecking] = useState(true);
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const [instituteOnboarded, setInstituteOnboarded] = useState<boolean | null>(null);
  const [offline, setOffline] = useState(false);
  const networkState = useNetworkState();

  // expo-network's isConnected can report stale/incorrect state (especially
  // right after app resume on Android), so never trust it alone to show a
  // full-screen takeover — confirm with a real network request first.
  const probeConnectivity = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      await fetch(`${BASE_URL}/app_status`, { method: 'HEAD', signal: controller.signal });
      clearTimeout(timeout);
      return true;
    } catch {
      return false;
    }
  }, []);

  const checkStatus = useCallback(async () => {
    setChecking(true);
    try {
      const result = await fetchAppStatus();
      setStatus(result);
    } catch {
      // If the check itself fails (offline, backend down), fail open —
      // don't lock users out of the whole app over a network hiccup.
      setStatus(FAIL_OPEN_STATUS);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
    registerDevice();
    isOnboardingComplete().then(setOnboarded);
    isInstituteOnboardingComplete().then(setInstituteOnboarded);
    ensureNotificationChannel().then(() =>
      getFcmPushToken().then((pushToken) => {
        // Re-register with the push token once we have one — device_register
        // upserts by device_id and never blanks out already-stored profile
        // fields, so this is safe to call again right after the plain
        // registerDevice() above (which runs before permission may be granted).
        if (pushToken) registerDevice({ pushToken });
      })
    );
  }, [checkStatus]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.background).catch(() => {});
  }, [theme.background]);

  // Explicit false only — undefined means "not resolved yet", not "offline".
  // The hook alone is unreliable, so confirm with a real probe before
  // showing the takeover, and clear it immediately once we're back online
  // (the hook flipping true, or our own probe succeeding on retry).
  useEffect(() => {
    if (networkState.isConnected === false) {
      let cancelled = false;
      probeConnectivity().then((reachable) => {
        if (!cancelled) setOffline(!reachable);
      });
      return () => {
        cancelled = true;
      };
    }
    if (networkState.isConnected === true) {
      setOffline(false);
    }
  }, [networkState.isConnected, probeConnectivity]);

  const handleOfflineRetry = useCallback(async () => {
    setChecking(true);
    const reachable = await probeConnectivity();
    if (reachable) {
      setOffline(false);
      await checkStatus();
    }
    setChecking(false);
  }, [probeConnectivity, checkStatus]);

  return (
    <BrandProvider
      value={{
        logoUrl: status?.appLogoUrl ?? null,
        appTitle: status?.appTitle ?? null,
        primaryColor: status?.primaryColor ?? null,
        accentColor: status?.accentColor ?? null,
        splashColor: status?.splashColor ?? null,
        headerColor: status?.headerColor ?? null,
        achieversDisplay: status?.achieversDisplay ?? 'marks',
      }}
    >
      {offline ? (
        <SafeAreaProvider>
          <StatusBar style="light" />
          <OfflineScreen onRetry={handleOfflineRetry} retrying={checking} />
        </SafeAreaProvider>
      ) : (checking && !status) || onboarded === null || (status?.instituteMode && instituteOnboarded === null) ? (
        <LaunchScreen />
      ) : status && isUpdateRequired(getAppVersion(), status.minVersion) ? (
        <SafeAreaProvider>
          <StatusBar style="light" />
          <UpdateRequiredScreen storeUrl={status.storeUrl} />
        </SafeAreaProvider>
      ) : status && !status.enabled ? (
        <SafeAreaProvider>
          <StatusBar style="light" />
          <LockScreen status={status} onRetry={checkStatus} retrying={checking} />
        </SafeAreaProvider>
      ) : !onboarded && !status?.instituteMode ? (
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <OnboardingFlow
            onDone={() => {
              setOnboarded(true);
              setTimeout(() => {
                router.replace('/(tabs)');
              }, 50);
            }}
          />
        </SafeAreaProvider>
      ) : !instituteOnboarded && status?.instituteMode ? (
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <InstituteOnboarding
            onDone={async () => {
              await markInstituteOnboardingComplete();
              setInstituteOnboarded(true);
              setTimeout(() => {
                router.replace('/(tabs)');
              }, 50);
            }}
          />
        </SafeAreaProvider>
      ) : (
        <SafeAreaProvider>
          <LayoutProvider
            value={{
              homeTiles: status?.homeTiles ?? DEFAULT_HOME_TILES,
              bottomTabs: status?.bottomTabs ?? DEFAULT_BOTTOM_TABS,
              instituteMode: status?.instituteMode ?? false,
            }}
          >
            <SectionsProvider value={status?.enabledSections ?? ALL_SECTIONS_ENABLED}>
              <StatusBar style="light" />
              <View style={{ flex: 1, backgroundColor: theme.background }}>
                <Stack
                  screenOptions={{
                    header: () => <DetailHeader title="" />,
                    contentStyle: { backgroundColor: theme.background },
                  }}
                >
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="event/[id]" options={{ header: () => <DetailHeader title="Event" /> }} />
                  <Stack.Screen name="news/[id]" options={{ header: () => <DetailHeader title="News" /> }} />
                  <Stack.Screen name="news/index" options={{ header: () => <DetailHeader title="Latest News" /> }} />
                  <Stack.Screen name="announcements" options={{ headerShown: false }} />
                  <Stack.Screen name="notices" options={{ header: () => <DetailHeader title="Announcements" /> }} />
                  <Stack.Screen name="result" options={{ header: () => <DetailHeader title="Result / Report Card" /> }} />
                  <Stack.Screen name="contact" options={{ header: () => <DetailHeader title="Contact Us" /> }} />
                  <Stack.Screen name="about" options={{ header: () => <DetailHeader title="About Us" /> }} />
                  <Stack.Screen name="profile" options={{ header: () => <DetailHeader title="Profile" /> }} />
                  <Stack.Screen name="teachers" options={{ header: () => <DetailHeader title="Our Teachers" /> }} />
                  <Stack.Screen name="homework" options={{ header: () => <DetailHeader title="Homework" /> }} />
                  <Stack.Screen name="apply-leave" options={{ header: () => <DetailHeader title="Apply Leave" /> }} />
                  <Stack.Screen name="fees" options={{ header: () => <DetailHeader title="Fee Invoices" /> }} />
                  <Stack.Screen name="login" options={{ header: () => <AppHeader /> }} />
                  <Stack.Screen name="teacher-login" options={{ header: () => <DetailHeader title="Teacher Login" /> }} />
                  <Stack.Screen name="teacher-profile-setup" options={{ header: () => <DetailHeader title="Teacher Profile Setup" /> }} />
                  <Stack.Screen name="teacher-dashboard" options={{ header: () => <DetailHeader title="Teacher Dashboard" /> }} />
                  <Stack.Screen name="teacher-attendance" options={{ header: () => <DetailHeader title="Mark Attendance" /> }} />
                  <Stack.Screen name="teacher-homework" options={{ header: () => <DetailHeader title="Manage Homework" /> }} />
                  <Stack.Screen name="teacher-homework-add" options={{ header: () => <DetailHeader title="Add Homework" /> }} />
                  <Stack.Screen name="teacher-events" options={{ header: () => <DetailHeader title="Manage Events" /> }} />
                  <Stack.Screen name="teacher-event-add" options={{ header: () => <DetailHeader title="Add Event" /> }} />
                  <Stack.Screen name="teacher-notices" options={{ header: () => <DetailHeader title="Manage Notices" /> }} />
                  <Stack.Screen name="teacher-add-notice" options={{ header: () => <DetailHeader title="Add Notice" /> }} />
                  <Stack.Screen name="teacher-leaves" options={{ header: () => <DetailHeader title="Leave Applications" /> }} />
                  <Stack.Screen name="teacher-fees" options={{ header: () => <DetailHeader title="Fee Invoices" /> }} />
                  <Stack.Screen name="teacher-export" options={{ header: () => <DetailHeader title="Export Roster" /> }} />
                  <Stack.Screen name="teacher-storage" options={{ header: () => <DetailHeader title="Storage Usage" /> }} />
                  <Stack.Screen name="teacher-import-result" options={{ header: () => <DetailHeader title="Import Result" /> }} />
                  <Stack.Screen name="teacher-import-students" options={{ header: () => <DetailHeader title="Import Students (Excel)" /> }} />
                  <Stack.Screen name="teacher-student-review" options={{ header: () => <DetailHeader title="Review Student" /> }} />
                  <Stack.Screen name="teacher-add-student" options={{ header: () => <DetailHeader title="Add Student" /> }} />
                  <Stack.Screen name="student-dashboard" options={{ header: () => <DetailHeader title="Student Dashboard" /> }} />
                  <Stack.Screen name="teacher-students" options={{ header: () => <DetailHeader title="Student Roster" /> }} />
                  <Stack.Screen name="student-attendance" options={{ header: () => <DetailHeader title="Attendance Record" /> }} />
                </Stack>
              </View>
              <DynamicBottomBar />
              <TrialBanner trial={status?.trial ?? { startDate: '', totalDays: 7, remainingDays: 7, ended: false, features: [] }} />
            </SectionsProvider>
          </LayoutProvider>
        </SafeAreaProvider>
      )}
    </BrandProvider>
  );
}

export default function RootLayout() {
  return (
    <KeyboardProvider>
      <ThemeModeProvider>
        <TeacherAuthProvider>
          <StudentAuthProvider>
            <RootLayoutInner />
          </StudentAuthProvider>
        </TeacherAuthProvider>
      </ThemeModeProvider>
    </KeyboardProvider>
  );
}
