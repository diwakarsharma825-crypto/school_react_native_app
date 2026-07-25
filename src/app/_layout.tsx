import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ALL_SECTIONS_ENABLED, AppStatus, fetchAppStatus, registerDevice } from '@/data/app-status';
import { LockScreen } from '@/components/ui/LockScreen';
import { DetailHeader } from '@/components/ui/DetailHeader';
import { SectionsProvider } from '@/hooks/use-sections';

export default function RootLayout() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const [status, setStatus] = useState<AppStatus | null>(null);
  const [checking, setChecking] = useState(true);

  const checkStatus = useCallback(async () => {
    setChecking(true);
    try {
      const result = await fetchAppStatus();
      setStatus(result);
    } catch {
      // If the check itself fails (offline, backend down), fail open —
      // don't lock users out of the whole app over a network hiccup.
      setStatus({
        enabled: true,
        reason: null,
        title: null,
        message: null,
        devName: null,
        phone: null,
        email: null,
        whatsapp: null,
        enabledSections: ALL_SECTIONS_ENABLED,
      });
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
    registerDevice();
  }, [checkStatus]);

  if (checking && !status) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.blueDark }}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
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
          <Stack.Screen name="result" options={{ header: () => <DetailHeader title="Check Result" /> }} />
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
