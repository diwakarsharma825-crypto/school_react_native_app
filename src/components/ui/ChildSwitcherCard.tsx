import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useMemo, useRef } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { HomeworkAccess } from '@/lib/homework-access';
import { ThemedText } from './ThemedText';

interface ChildSwitcherCardProps {
  siblings: HomeworkAccess[];
  activeSrn: string;
  onSwitch: (srn: string) => void;
  sessionLabel?: string;
}

const SWIPE_THRESHOLD = 50;

/** Active-child header used across every student screen (Homework,
 * Attendance, Apply Leave, Fees) — always shows who's currently selected
 * (photo/icon + name + class + SRN), and for accounts with siblings linked,
 * swiping the card left/right switches the active child with a slide
 * animation. The dot row below doubles as direct tap-to-select and as a
 * position indicator, same pattern as the home banner carousel. */
export function ChildSwitcherCard({ siblings, activeSrn, onSwitch, sessionLabel }: ChildSwitcherCardProps) {
  const theme = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const activeIndex = Math.max(0, siblings.findIndex((c) => c.srn === activeSrn));
  const active = siblings[activeIndex] ?? siblings[0];
  const hasSiblings = siblings.length > 1;

  function animateTo(index: number) {
    const clamped = Math.max(0, Math.min(siblings.length - 1, index));
    const target = siblings[clamped];
    if (!target || target.srn === activeSrn) {
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
      return;
    }
    Animated.parallel([
      Animated.timing(translateX, { toValue: clamped > activeIndex ? -24 : 24, duration: 120, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      onSwitch(target.srn);
      translateX.setValue(clamped > activeIndex ? 24 : -24);
      Animated.parallel([
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true, friction: 8 }),
        Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
      ]).start();
    });
  }

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => hasSiblings && Math.abs(gesture.dx) > 12 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderMove: (_, gesture) => translateX.setValue(gesture.dx),
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx <= -SWIPE_THRESHOLD) {
            animateTo(activeIndex + 1);
          } else if (gesture.dx >= SWIPE_THRESHOLD) {
            animateTo(activeIndex - 1);
          } else {
            Animated.spring(translateX, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
          }
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeIndex, hasSiblings, siblings]
  );

  if (!active) return null;

  const classLabel = `${/\bclass\b/i.test(active.className) ? active.className : `Class ${active.className}`}${
    active.section ? ` - ${active.section}` : ''
  } · SRN ${active.srn}`;

  return (
    <View style={styles.wrap}>
      <Animated.View
        {...(hasSiblings ? panResponder.panHandlers : {})}
        style={[
          styles.bar,
          { backgroundColor: theme.surface, borderColor: theme.border },
          { transform: [{ translateX }], opacity },
        ]}
      >
        {active.photoUrl ? (
          <Image source={{ uri: active.photoUrl }} style={styles.avatarPhoto} contentFit="cover" />
        ) : (
          <View style={[styles.avatar, { backgroundColor: theme.backgroundSelected }]}>
            <Ionicons name="school" size={20} color={theme.tint} />
          </View>
        )}
        <View style={styles.textCol}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {active.name}
          </ThemedText>
          {active.phone ? (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {active.phone}
            </ThemedText>
          ) : null}
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {classLabel}
          </ThemedText>
          {sessionLabel ? (
            <ThemedText type="small" themeColor="tint">
              Session: {sessionLabel}
            </ThemedText>
          ) : null}
        </View>
        {hasSiblings ? (
          <Pressable
            onPress={() => animateTo((activeIndex + 1) % siblings.length)}
            hitSlop={10}
            style={[styles.switchButton, { backgroundColor: theme.backgroundSelected }]}
          >
            <Ionicons name="swap-horizontal" size={16} color={theme.tint} />
            <ThemedText type="small" themeColor="tint" style={styles.switchLabel}>
              Switch
            </ThemedText>
          </Pressable>
        ) : null}
      </Animated.View>

      {hasSiblings ? (
        <View style={styles.dotsRow}>
          {siblings.map((c) => (
            <Pressable key={c.srn} onPress={() => animateTo(siblings.indexOf(c))} hitSlop={6} style={styles.dotTouch}>
              <View style={[styles.dot, { backgroundColor: c.srn === activeSrn ? theme.tint : theme.border }]} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: Spacing.four,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
  },
  avatarPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.three,
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.pill,
  },
  switchLabel: {
    fontWeight: '600',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  dotTouch: {
    padding: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
