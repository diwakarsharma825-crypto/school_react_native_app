import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

import { AppHeader } from '@/components/ui/AppHeader';
import { TabHeader } from '@/components/ui/TabHeader';
import { useTheme } from '@/hooks/use-theme';

export default function TabsLayout() {
  const theme = useTheme();

  return (
    // The native tab bar is hidden — DynamicBottomBar (rendered once at the
    // app root) replaces it so bottom-tab slots can point at ANY screen,
    // not just these four files. Tabs itself is kept only for routing.
    <Tabs
      screenOptions={{
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Saarthak GIMSSS',
          tabBarLabel: 'Home',
          header: () => <AppHeader />,
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          header: () => <TabHeader title="Events" />,
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: 'Gallery',
          header: () => <TabHeader title="Gallery" />,
          tabBarIcon: ({ color, size }) => <Ionicons name="images" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          header: () => <TabHeader title="More" />,
          tabBarIcon: ({ color, size }) => <Ionicons name="menu" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
