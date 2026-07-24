import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const theme = useTheme();
  const scheme = useColorScheme();

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
