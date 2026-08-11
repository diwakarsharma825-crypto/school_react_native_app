import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { Stats } from '@/data/types';
import { ThemedText } from '../ui/ThemedText';

interface StatsRowProps {
  stats: Stats;
}

const COUNT_DURATION_MS = 900;

function useCountUp(value: number) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let raf: ReturnType<typeof requestAnimationFrame>;
    const start = Date.now();
    function tick() {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / COUNT_DURATION_MS, 1);
      setCount(Math.round(progress * value));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }
    tick();
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return count;
}

function GlanceColumn({
  icon,
  value,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  const count = useCountUp(value);
  return (
    <View style={styles.column}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={22} color="#fff" />
      </View>
      <ThemedText type="title" themeColor="textOnBrand" style={styles.value}>
        {count}
      </ThemedText>
      <ThemedText type="small" themeColor="textOnBrand" style={styles.label}>
        {label}
      </ThemedText>
      <Pressable style={[styles.viewPill, { backgroundColor: theme.accent }]} onPress={onPress}>
        <ThemedText type="small" style={styles.viewPillText}>
          View →
        </ThemedText>
      </Pressable>
    </View>
  );
}
export function StatsRow({ stats }: StatsRowProps) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.tint }]}>
      <View style={styles.headingRow}>
        <View style={styles.dash} />
        <ThemedText type="smallBold" themeColor="textOnBrand" style={styles.heading}>
          OUR SCHOOL AT A GLANCE
        </ThemedText>
        <View style={styles.dash} />
      </View>
      <View style={styles.row}>
        <GlanceColumn
          icon="school"
          value={stats.total_students}
          label="Students"
          onPress={() => router.push('/top-students')}
        />
        <GlanceColumn
          icon="people"
          value={stats.total_teachers}
          label="Teachers"
          onPress={() => router.push('/teachers')}
        />
        <GlanceColumn
          icon="calendar"
          value={stats.total_events}
          label="Events"
          onPress={() => router.push('/(tabs)/events')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.four,
    marginTop: Spacing.three,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  dash: {
    width: 20,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: Spacing.two,
  },
  heading: {
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  value: {
    marginBottom: 2,
  },
  label: {
    opacity: 0.85,
    marginBottom: Spacing.two,
  },
  viewPill: {
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
  },
  viewPillText: {
    color: '#fff',
  },
});
