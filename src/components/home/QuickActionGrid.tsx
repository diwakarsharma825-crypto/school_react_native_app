import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Radius, Spacing, TileColors } from '@/constants/theme';
import { useLayout } from '@/hooks/use-layout';
import { useSections } from '@/hooks/use-sections';
import { useTheme } from '@/hooks/use-theme';
import { TARGET_ROUTES, TARGET_SECTION_KEY } from '@/lib/layout';
import { useLanguage } from '@/lib/i18n';
import { Card } from '../ui/Card';
import { ThemedText } from '../ui/ThemedText';

export function QuickActionGrid() {
  const sections = useSections();
  const theme = useTheme();
  const { homeTiles } = useLayout();
  const { t } = useLanguage();

  if (homeTiles.length === 0) return null;

  const translateTileLabel = (rawLabel: string) => {
    const key = rawLabel.toLowerCase().trim();
    if (key === 'result') return t('result');
    if (key === 'events') return t('events');
    if (key === 'gallery') return t('gallery');
    if (key === 'more') return t('more');
    if (key === 'homework') return t('homework');
    if (key === 'attendance') return t('attendance');
    if (key === 'notices') return t('notices');
    if (key === 'syllabus') return t('syllabus');
    if (key === 'subjects') return t('Subjects');
    if (key === 'promotion') return t('Promotion');
    if (key === 'teachers') return t('teachers');
    if (key === 'disclosures') return t('disclosures');
    return t(rawLabel);
  };

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
                {translateTileLabel(tile.label)}
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
