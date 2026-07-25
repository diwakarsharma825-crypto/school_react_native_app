import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Radius, Spacing, TileColors } from '@/constants/theme';
import { SectionKey, useSections } from '@/hooks/use-sections';
import { Card } from '../ui/Card';
import { ThemedText } from '../ui/ThemedText';

interface QuickAction {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: { bg: string; fg: string };
  href: '/result' | '/notices' | '/disclosure' | '/contact';
  /** null = always shown (not an admin-togglable section). */
  section: SectionKey | null;
}

const ACTIONS: QuickAction[] = [
  { key: 'result', label: 'Result', icon: 'document-text', colors: TileColors.orange, href: '/result', section: 'result' },
  { key: 'notices', label: 'Notices', icon: 'megaphone', colors: TileColors.blue, href: '/notices', section: 'notices' },
  { key: 'disclosure', label: 'Disclosure', icon: 'shield-checkmark', colors: TileColors.green, href: '/disclosure', section: 'disclosure' },
  { key: 'contact', label: 'Contact', icon: 'call', colors: TileColors.red, href: '/contact', section: null },
];

export function QuickActionGrid() {
  const sections = useSections();
  const visible = ACTIONS.filter((a) => a.section === null || sections[a.section]);

  if (visible.length === 0) return null;

  return (
    <View style={styles.grid}>
      {visible.map((action) => (
        <Pressable
          key={action.key}
          style={[styles.tileWrap, { width: `${100 / visible.length - 2}%` }]}
          onPress={() => router.push(action.href)}
        >
          <Card style={styles.tile}>
            <View style={[styles.iconCircle, { backgroundColor: action.colors.bg }]}>
              <Ionicons name={action.icon} size={22} color={action.colors.fg} />
            </View>
            <ThemedText
              type="small"
              style={styles.label}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {action.label}
            </ThemedText>
          </Card>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: Spacing.three,
  },
  tileWrap: {
    width: '23.5%',
  },
  tile: {
    alignItems: 'center',
    padding: Spacing.two,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  label: {
    textAlign: 'center',
  },
});
