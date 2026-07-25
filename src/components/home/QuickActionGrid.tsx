import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Radius, Spacing, TileColors } from '@/constants/theme';
import { Card } from '../ui/Card';
import { ThemedText } from '../ui/ThemedText';

interface QuickAction {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: { bg: string; fg: string };
  href: '/result' | '/notices' | '/disclosure' | '/contact';
}

const ACTIONS: QuickAction[] = [
  { key: 'result', label: 'Result', icon: 'document-text', colors: TileColors.orange, href: '/result' },
  { key: 'notices', label: 'Notices', icon: 'megaphone', colors: TileColors.blue, href: '/notices' },
  { key: 'disclosure', label: 'Disclosure', icon: 'shield-checkmark', colors: TileColors.green, href: '/disclosure' },
  { key: 'contact', label: 'Contact', icon: 'call', colors: TileColors.red, href: '/contact' },
];

export function QuickActionGrid() {
  return (
    <View style={styles.grid}>
      {ACTIONS.map((action) => (
        <Pressable key={action.key} style={styles.tileWrap} onPress={() => router.push(action.href)}>
          <Card style={styles.tile}>
            <View style={[styles.iconCircle, { backgroundColor: action.colors.bg }]}>
              <Ionicons name={action.icon} size={22} color={action.colors.fg} />
            </View>
            <ThemedText type="small" style={styles.label}>
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
