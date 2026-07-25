import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppStatus, fetchAppStatus, registerDevice } from '@/data/app-status';
import { LockScreen } from '@/components/ui/LockScreen';

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
      setStatus({ enabled: true, reason: null, title: null, message: null, devName: null, phone: null, email: null, whatsapp: null });
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
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Brand.blue },
          headerTintColor: theme.textOnBrand,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="event/[id]" options={{ title: 'Event' }} />
        <Stack.Screen name="news/[id]" options={{ title: 'News' }} />
        <Stack.Screen name="announcements" options={{ title: 'Announcements' }} />
        <Stack.Screen name="result" options={{ title: 'Result' }} />
        <Stack.Screen name="contact" options={{ title: 'Contact Us' }} />
        <Stack.Screen name="about" options={{ title: 'About Us' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
