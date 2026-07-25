import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Radius, Spacing, TileColors } from '@/constants/theme';
import { useLayout } from '@/hooks/use-layout';
import { useSections } from '@/hooks/use-sections';
import { useTheme } from '@/hooks/use-theme';
import { TARGET_ROUTES, TARGET_SECTION_KEY } from '@/lib/layout';
import { Card } from '../ui/Card';
import { ThemedText } from '../ui/ThemedText';

// Tiles come from App Control → App Layout (admin-configured) and are always
// shown, even when the tile's target section is turned off — the app
// shouldn't feel like features vanished. Tapping a disabled one just opens
// its "Coming Soon" state instead of the real screen; a small lock badge
// previews that before the tap.
export function QuickActionGrid() {
  const sections = useSections();
  const theme = useTheme();
  const { homeTiles } = useLayout();

  if (homeTiles.length === 0) return null;

  return (
    <View style={styles.grid}>
      {homeTiles.map((tile) => {
        const sectionKey = TARGET_SECTION_KEY[tile.target];
        const enabled = !sectionKey || sections[sectionKey];
        const bg = tile.colorBg ?? TileColors.blue.bg;
        const fg = tile.colorFg ?? TileColors.blue.fg;
        return (
          <Pressable
            key={`${tile.target}-${tile.label}`}
            style={[styles.tileWrap, { width: `${100 / homeTiles.length - 2}%` }]}
            onPress={() => {
              if (tile.target === 'url' && tile.targetUrl) {
                Linking.openURL(tile.targetUrl);
              } else if (tile.target !== 'url') {
                router.push(TARGET_ROUTES[tile.target]);
              }
            }}
          >
            <Card style={styles.tile}>
              <View style={[styles.iconCircle, { backgroundColor: bg }]}>
                <Ionicons name={tile.icon as keyof typeof Ionicons.glyphMap} size={22} color={fg} />
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
                {tile.label}
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
