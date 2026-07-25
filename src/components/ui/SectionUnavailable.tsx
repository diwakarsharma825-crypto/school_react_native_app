import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
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
        <View style={[styles.iconCircle, { backgroundColor: theme.backgroundSelected }]}>
          <Ionicons name="hourglass-outline" size={40} color={theme.tint} />
        </View>
        <ThemedText type="title" style={styles.title}>
          Coming Soon
        </ThemedText>
        <ThemedText type="default" themeColor="textSecondary" style={styles.message}>
          This section is being set up and isn&apos;t available just yet. Please check back
          soon.
        </ThemedText>
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
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.four,
  },
  title: {
    marginBottom: Spacing.two,
  },
  message: {
    textAlign: 'center',
    lineHeight: 21,
  },
});
