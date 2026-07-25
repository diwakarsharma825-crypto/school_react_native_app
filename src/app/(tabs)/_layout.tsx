import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

import { AppHeader } from '@/components/ui/AppHeader';
import { TabHeader } from '@/components/ui/TabHeader';
import { useTheme } from '@/hooks/use-theme';
import { useSectionEnabled } from '@/hooks/use-sections';

export default function TabsLayout() {
  const theme = useTheme();
  const eventsEnabled = useSectionEnabled('events');
  const galleryEnabled = useSectionEnabled('gallery');

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.tint,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.border },
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
          href: eventsEnabled ? undefined : null,
          header: () => <TabHeader title="Events" />,
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: 'Gallery',
          href: galleryEnabled ? undefined : null,
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
