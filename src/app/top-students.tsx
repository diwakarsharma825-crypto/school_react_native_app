import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { AchieverCard } from '@/components/home/AchieverCard';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, Loading } from '@/components/ui/states';
import { SectionUnavailable } from '@/components/ui/SectionUnavailable';
import { ThemedText } from '@/components/ui/ThemedText';
import { ACHIEVERS } from '@/data/achievers';
import { fetchStats } from '@/data/api';
import { useFetch } from '@/hooks/use-fetch';
import { useSectionEnabled } from '@/hooks/use-sections';

export default function TopStudentsScreen() {
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
          <View key={a.name} style={styles.gridItem}>
            <AchieverCard achiever={a} paletteIndex={i} />
          </View>
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
  gridItem: {
    flexBasis: '47%',
    flexGrow: 1,
  },
});
