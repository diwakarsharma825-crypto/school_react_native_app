import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Screen } from './Screen';
import { ThemedText } from './ThemedText';

/** Shown when a section the admin has turned off is opened — the nav tile
 * for it stays visible (so the app doesn't feel like features vanished),
 * tapping through just lands here instead of the real content. */
export function SectionUnavailable() {
  const theme = useTheme();
  return (
    <Screen scroll={false}>
      <View style={styles.wrap}>
        <LinearGradient colors={[theme.tint, Brand.blueLight]} style={styles.badgeRing}>
          <View style={[styles.iconCircle, { backgroundColor: theme.surface }]}>
            <Ionicons name="rocket-outline" size={38} color={theme.tint} />
          </View>
        </LinearGradient>

        <ThemedText type="title" style={styles.title}>
          Coming Soon
        </ThemedText>
        <ThemedText type="default" themeColor="textSecondary" style={styles.message}>
          We&apos;re polishing this section to give you the best experience. It&apos;ll be
          switched on shortly — thanks for your patience!
        </ThemedText>

        <View style={styles.dotsRow}>
          <View style={[styles.dot, { backgroundColor: theme.accent }]} />
          <View style={[styles.dot, styles.dotMid, { backgroundColor: theme.tint }]} />
          <View style={[styles.dot, { backgroundColor: theme.accent }]} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
  },
  badgeRing: {
    width: 116,
    height: 116,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.four,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginBottom: Spacing.two,
  },
  message: {
    textAlign: 'center',
    lineHeight: 21,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.five,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.6,
  },
  dotMid: {
    width: 22,
    borderRadius: 4,
    opacity: 1,
  },
});
