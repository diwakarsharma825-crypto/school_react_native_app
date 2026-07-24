import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Stat } from '@/data/types';
import { ThemedText } from '../ui/ThemedText';

interface StatsRowProps {
  stats: Stat[];
}

const COUNT_DURATION_MS = 900;

function StatTile({ stat }: { stat: Stat }) {
  const theme = useTheme();
  const [count, setCount] = useState(0);

  useEffect(() => {
    let raf: ReturnType<typeof requestAnimationFrame>;
    const start = Date.now();
    function tick() {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / COUNT_DURATION_MS, 1);
      setCount(Math.round(progress * stat.value));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }
    tick();
    return () => cancelAnimationFrame(raf);
  }, [stat.value]);

  return (
    <View style={[styles.tile, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Ionicons name={stat.icon as keyof typeof Ionicons.glyphMap} size={22} color={theme.tint} />
      <ThemedText type="title" style={styles.value}>
        {count}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {stat.label}
      </ThemedText>
    </View>
  );
}

export function StatsRow({ stats }: StatsRowProps) {
  return (
    <View style={styles.row}>
      {stats.map((stat) => (
        <StatTile key={stat.id} stat={stat} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: Spacing.three,
  },
  tile: {
    width: '48%',
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    marginBottom: Spacing.two,
  },
  value: {
    marginTop: Spacing.one,
  },
});
