import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@/hooks/use-theme';

interface MenuItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: '/announcements' | '/result' | '/contact' | '/about';
}

const MENU_ITEMS: MenuItem[] = [
  { label: 'Announcements', icon: 'megaphone-outline', href: '/announcements' },
  { label: 'Check Result', icon: 'document-text-outline', href: '/result' },
  { label: 'Contact Us', icon: 'call-outline', href: '/contact' },
  { label: 'About Us', icon: 'information-circle-outline', href: '/about' },
];

export default function MoreScreen() {
  const theme = useTheme();

  return (
    <Screen>
      <ThemedText type="title" style={styles.heading}>
        More
      </ThemedText>
      <Card style={styles.listCard}>
        {MENU_ITEMS.map((item, idx) => (
          <Pressable
            key={item.href}
            onPress={() => router.push(item.href)}
            style={[styles.row, idx < MENU_ITEMS.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
          >
            <View style={styles.rowLeft}>
              <Ionicons name={item.icon} size={22} color={theme.tint} style={styles.rowIcon} />
              <ThemedText type="default">{item.label}</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </Pressable>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    marginBottom: Spacing.three,
  },
  listCard: {
    padding: 0,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowIcon: {
    marginRight: Spacing.three,
  },
});
