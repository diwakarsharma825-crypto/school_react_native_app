import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { AchieverCard } from '@/components/home/AchieverCard';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, Loading } from '@/components/ui/states';
import { SectionUnavailable } from '@/components/ui/SectionUnavailable';
import { ThemedText } from '@/components/ui/ThemedText';
import { toAchiever } from '@/data/achievers';
import { fetchStats, fetchTopAchievers } from '@/data/api';
import { useFetch } from '@/hooks/use-fetch';
import { useSectionEnabled } from '@/hooks/use-sections';

export default function TopStudentsScreen() {
  const enabled = useSectionEnabled('top_students');
  const stats = useFetch(fetchStats);
  const achievers = useFetch(fetchTopAchievers);

  if (!enabled) return <SectionUnavailable />;

  const loading = (stats.loading && !stats.data) || (achievers.loading && !achievers.data);
  if (loading) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading students…" />
      </Screen>
    );
  }

  if (stats.error || !stats.data || achievers.error) {
    return (
      <Screen scroll={false}>
        <ErrorState message="Could not load student information." onRetry={() => { stats.refetch(); achievers.refetch(); }} />
      </Screen>
    );
  }

  const list = (achievers.data ?? []).map(toAchiever);

  return (
    <Screen refreshing={stats.loading || achievers.loading} onRefresh={() => { stats.refetch(); achievers.refetch(); }}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
        Celebrating our top-performing students at {stats.data.total_students ? `${stats.data.total_students}+ students strong` : 'our school'}.
      </ThemedText>
      {list.length > 0 ? (
        <View style={styles.grid}>
          {list.map((a, i) => (
            <View key={a.name} style={styles.gridItem}>
              <AchieverCard achiever={a} paletteIndex={i} />
            </View>
          ))}
        </View>
      ) : (
        <EmptyState message="No achievers added yet — check back soon." icon="trophy-outline" />
      )}
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
  gridItem: {
    flexBasis: '47%',
    flexGrow: 1,
  },
});
