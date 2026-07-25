import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Screen } from './Screen';
import { ThemedText } from './ThemedText';

/** Shown when a section the admin has turned off is opened — the nav tile
 * for it stays visible (so the app doesn't feel like features vanished),
 * tapping through just lands here instead of the real content. */
export function SectionUnavailable() {
  const theme = useTheme();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });

  return (
    <Screen scroll={false}>
      <View style={styles.wrap}>
        <View style={styles.badgeWrap}>
          <Animated.View
            style={[
              styles.pulseRing,
              { backgroundColor: theme.tint, opacity: ringOpacity, transform: [{ scale: ringScale }] },
            ]}
          />
          <LinearGradient colors={[theme.tint, Brand.blueLight]} style={styles.badgeRing}>
            <View style={[styles.iconCircle, { backgroundColor: theme.surface }]}>
              <Ionicons name="rocket-outline" size={40} color={theme.tint} />
            </View>
          </LinearGradient>
        </View>

        <View style={[styles.pill, { backgroundColor: theme.backgroundSelected }]}>
          <Ionicons name="sparkles-outline" size={13} color={theme.accent} />
          <ThemedText type="small" themeColor="tint" style={styles.pillLabel}>
            In the works
          </ThemedText>
        </View>

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
  badgeWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.four,
  },
  pulseRing: {
    position: 'absolute',
    width: 116,
    height: 116,
    borderRadius: Radius.pill,
  },
  badgeRing: {
    width: 116,
    height: 116,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    marginBottom: Spacing.three,
  },
  pillLabel: {
    fontWeight: '700',
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
