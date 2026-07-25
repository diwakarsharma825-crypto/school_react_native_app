import * as SystemUI from 'expo-system-ui';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemeModeProvider } from '@/hooks/use-theme-mode';
import { ALL_SECTIONS_ENABLED, AppStatus, fetchAppStatus, registerDevice } from '@/data/app-status';
import { getAppVersion } from '@/lib/device';
import { isOnboardingComplete } from '@/lib/onboarding';
import { configureNotificationHandler, ensureNotificationChannel } from '@/lib/notifications';
import { isUpdateRequired } from '@/lib/version';
import { LockScreen } from '@/components/ui/LockScreen';
import { UpdateRequiredScreen } from '@/components/ui/UpdateRequiredScreen';
import { DetailHeader } from '@/components/ui/DetailHeader';
import { SectionsProvider } from '@/hooks/use-sections';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';

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
};

function RootLayoutInner() {
  const theme = useTheme();
  const [status, setStatus] = useState<AppStatus | null>(null);
  const [checking, setChecking] = useState(true);
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

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
    ensureNotificationChannel();
  }, [checkStatus]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.background).catch(() => {});
  }, [theme.background]);

  if ((checking && !status) || onboarded === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.blueDark }}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  if (status && isUpdateRequired(getAppVersion(), status.minVersion)) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <UpdateRequiredScreen storeUrl={status.storeUrl} />
      </SafeAreaProvider>
    );
  }

  if (status && !status.enabled) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <LockScreen status={status} onRetry={checkStatus} retrying={checking} />
      </SafeAreaProvider>
    );
  }

  if (!onboarded) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <OnboardingFlow onDone={() => setOnboarded(true)} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SectionsProvider value={status?.enabledSections ?? ALL_SECTIONS_ENABLED}>
        <StatusBar style="light" />
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
          <Stack.Screen name="notices" options={{ header: () => <DetailHeader title="Notices" /> }} />
          <Stack.Screen name="result" options={{ header: () => <DetailHeader title="Result / Report Card" /> }} />
          <Stack.Screen name="contact" options={{ header: () => <DetailHeader title="Contact Us" /> }} />
          <Stack.Screen name="about" options={{ header: () => <DetailHeader title="About Us" /> }} />
          <Stack.Screen name="teachers" options={{ header: () => <DetailHeader title="Our Teachers" /> }} />
          <Stack.Screen name="top-students" options={{ header: () => <DetailHeader title="Top Students" /> }} />
          <Stack.Screen name="disclosure" options={{ header: () => <DetailHeader title="Mandatory Disclosure" /> }} />
          <Stack.Screen name="notifications" options={{ header: () => <DetailHeader title="Notifications" /> }} />
          <Stack.Screen name="gallery/[id]" options={{ header: () => <DetailHeader title="Album" /> }} />
        </Stack>
      </SectionsProvider>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeModeProvider>
      <RootLayoutInner />
    </ThemeModeProvider>
  );
}
