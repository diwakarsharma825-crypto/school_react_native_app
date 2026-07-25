import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AvatarFgPalette, AvatarPalette, Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, Loading } from '@/components/ui/states';
import { SectionUnavailable } from '@/components/ui/SectionUnavailable';
import { ThemedText } from '@/components/ui/ThemedText';
import { fetchStats } from '@/data/api';
import { useFetch } from '@/hooks/use-fetch';
import { useSectionEnabled } from '@/hooks/use-sections';

// NOTE: gap-filled screen — the real app doesn't expose a dedicated
// "top students" endpoint (the backend's /students list has no ranking or
// achievement field). We show the school's student headline count from
// /stats with a note, keeping the same card language as Teachers, rather
// than fabricating a ranked list the API can't back up.
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
        {data.total_students} students across Nursery to Class XII.
      </ThemedText>
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.avatar, { backgroundColor: AvatarPalette[0] }]}>
            <ThemedText type="smallBold" style={{ color: AvatarFgPalette[0] }}>
              ★
            </ThemedText>
          </View>
          <View style={styles.text}>
            <ThemedText type="smallBold">Achievers list coming soon</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Individual toppers are announced via Notices and Latest News after each exam session.
            </ThemedText>
          </View>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    marginBottom: Spacing.three,
  },
  card: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
  },
  text: {
    flex: 1,
  },
});
