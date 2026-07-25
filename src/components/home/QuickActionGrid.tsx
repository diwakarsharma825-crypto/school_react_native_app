import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Radius, Spacing, TileColors } from '@/constants/theme';
import { SectionKey, useSections } from '@/hooks/use-sections';
import { useTheme } from '@/hooks/use-theme';
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

// Tiles are always shown (even when the admin has turned the section off) so
// the app doesn't feel like features vanished — tapping a disabled one just
// opens its "Coming Soon" state (SectionUnavailable) instead of the real
// screen; a small lock badge previews that before the tap.
export function QuickActionGrid() {
  const sections = useSections();
  const theme = useTheme();

  return (
    <View style={styles.grid}>
      {ACTIONS.map((action) => {
        const enabled = action.section === null || sections[action.section];
        return (
          <Pressable
            key={action.key}
            style={[styles.tileWrap, { width: `${100 / ACTIONS.length - 2}%` }]}
            onPress={() => router.push(action.href)}
          >
            <Card style={styles.tile}>
              <View style={[styles.iconCircle, { backgroundColor: action.colors.bg }]}>
                <Ionicons name={action.icon} size={22} color={action.colors.fg} />
              </View>
              {!enabled ? (
                <View style={[styles.lockBadge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Ionicons name="hourglass-outline" size={10} color={theme.textSecondary} />
                </View>
              ) : null}
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
        );
      })}
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
  lockBadge: {
    position: 'absolute',
    top: 0,
    right: 12,
    width: 18,
    height: 18,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    textAlign: 'center',
  },
});
