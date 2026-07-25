import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AvatarFgPalette, AvatarPalette, Brand, Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, Loading } from '@/components/ui/states';
import { SectionUnavailable } from '@/components/ui/SectionUnavailable';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@/hooks/use-theme';
import { fetchStats } from '@/data/api';
import { useFetch } from '@/hooks/use-fetch';
import { useSectionEnabled } from '@/hooks/use-sections';

// NOTE: the backend has no dedicated top-students/ranking endpoint (the
// /students list carries no score/position field) — this screen shows the
// same static achiever highlights the original app shipped with, matching
// its layout exactly. Swap this for a real feed once the backend adds one.
const ACHIEVERS = [
  { name: 'Akhsay', classLabel: '12th', position: 'Second Position', score: 475, total: 500, percent: 95 },
  { name: 'Ruby', classLabel: '12th', position: 'Third Position', score: 470, total: 500, percent: 94 },
];

export default function TopStudentsScreen() {
  const theme = useTheme();
  const enabled = useSectionEnabled('top_students');
  const { data, loading, error, refetch } = useFetch(fetchStats);

  if (!enabled) return <SectionUnavailable />;

  if (loading && !data) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading students…" />
      </Screen>
    );
  }

  if (error || !data) {
    return (
      <Screen scroll={false}>
        <ErrorState message="Could not load student information." onRetry={refetch} />
      </Screen>
    );
  }

  return (
    <Screen refreshing={loading} onRefresh={refetch}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
        Celebrating our top-performing students at {data.total_students ? `${data.total_students}+ students strong` : 'Saarthak GIMSSS'}.
      </ThemedText>
      <View style={styles.grid}>
        {ACHIEVERS.map((a, i) => (
          <Card key={a.name} style={styles.achieverCard}>
            <View style={[styles.photo, { backgroundColor: AvatarPalette[i % AvatarPalette.length] }]}>
              <Ionicons name="person" size={34} color={AvatarFgPalette[i % AvatarFgPalette.length]} />
              <View style={[styles.classBadge, { backgroundColor: theme.surface }]}>
                <ThemedText type="small" style={styles.classBadgeLabel}>
                  {a.classLabel}
                </ThemedText>
              </View>
            </View>
            <View style={styles.achieverBody}>
              <ThemedText type="smallBold">{a.name}</ThemedText>
              <View style={styles.positionRow}>
                <ThemedText type="small">🏆 {a.position}</ThemedText>
              </View>
              <View style={styles.scoreRow}>
                <ThemedText type="default">
                  {a.score} / {a.total}
                </ThemedText>
                <View style={[styles.percentPill, { backgroundColor: Brand.blue }]}>
                  <ThemedText type="small" style={styles.percentLabel}>
                    {a.percent}%
                  </ThemedText>
                </View>
              </View>
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    marginBottom: Spacing.three,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  achieverCard: {
    flexBasis: '47%',
    flexGrow: 1,
    padding: 0,
    overflow: 'hidden',
  },
  photo: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classBadge: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  classBadgeLabel: {
    fontWeight: '700',
  },
  achieverBody: {
    padding: Spacing.three,
    gap: 4,
  },
  positionRow: {
    flexDirection: 'row',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.one,
  },
  percentPill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  percentLabel: {
    color: Brand.white,
    fontWeight: '700',
  },
});
