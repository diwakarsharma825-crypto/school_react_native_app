import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

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

/** Active-child header used across every student screen (Homework,
 * Attendance, Apply Leave, Fees). Shows the currently active child with an
 * "Active" badge, and — for accounts with more than one child on the same
 * mobile number — a single "Switch" button that moves to the next sibling
 * (which then shows the Active badge). No swipe/carousel: the switch is an
 * explicit tap only, per request. The switching flow itself is unchanged. */
export function ChildSwitcherCard({ siblings, activeSrn, onSwitch, sessionLabel }: ChildSwitcherCardProps) {
  const theme = useTheme();

  const activeIndex = Math.max(0, siblings.findIndex((c) => c.srn === activeSrn));
  const active = siblings[activeIndex] ?? siblings[0];
  const hasSiblings = siblings.length > 1;

  if (!active) return null;

  const classLabel = `${/\bclass\b/i.test(active.className) ? active.className : `Class ${active.className}`}${
    active.section ? ` - ${active.section}` : ''
  } · SRN ${active.srn}`;

  function switchNext() {
    if (!hasSiblings) return;
    const next = siblings[(activeIndex + 1) % siblings.length];
    if (next) onSwitch(next.srn);
  }

  const nameColor = theme.dark ? '#FFFFFF' : theme.text;
  const iconColor = theme.dark ? '#FFFFFF' : theme.tint;
  const iconBg = theme.dark ? theme.tint : theme.backgroundSelected;

  return (
    <View style={[styles.bar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {active.photoUrl ? (
        <Image source={{ uri: active.photoUrl }} style={styles.avatarPhoto} contentFit="cover" />
      ) : (
        <View style={[styles.avatar, { backgroundColor: iconBg }]}>
          <Ionicons name="school" size={20} color={iconColor} />
        </View>
      )}
      <View style={styles.textCol}>
        <View style={styles.nameRow}>
          <ThemedText type="smallBold" numberOfLines={1} style={[styles.name, { color: nameColor }]}>
            {active.name}
          </ThemedText>
          <View style={styles.activePill}>
            <View style={styles.activeDot} />
            <ThemedText type="small" style={styles.activeLabel}>
              Active
            </ThemedText>
          </View>
        </View>
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
        <Pressable onPress={switchNext} hitSlop={8} style={[styles.switchButton, { backgroundColor: iconBg }]}>
          <Ionicons name="swap-horizontal" size={16} color={iconColor} />
          <ThemedText type="small" style={[styles.switchLabel, { color: iconColor }]}>
            Switch
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    marginBottom: Spacing.four,
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  name: {
    flexShrink: 1,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DFF1E1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2E7D32',
  },
  activeLabel: {
    color: '#2E7D32',
    fontWeight: '700',
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.pill,
    marginLeft: Spacing.two,
  },
  switchLabel: {
    fontWeight: '600',
  },
});
