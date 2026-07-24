import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, Loading } from '@/components/ui/states';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@/hooks/use-theme';
import { fetchAnnouncements } from '@/data/api';
import { useFetch } from '@/hooks/use-fetch';
import { formatDate } from '@/lib/format';
import { AnnouncementKind } from '@/data/types';

const TABS: { key: AnnouncementKind; label: string }[] = [
  { key: 'news', label: 'News' },
  { key: 'notice', label: 'Notice' },
  { key: 'holiday', label: 'Holiday' },
];

export default function AnnouncementsScreen() {
  const theme = useTheme();
  const { data, loading, error, refetch } = useFetch(fetchAnnouncements);
  const [active, setActive] = useState<AnnouncementKind>('news');

  const filtered = useMemo(() => (data ?? []).filter((a) => a.kind === active), [data, active]);

  if (loading && !data) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading announcements…" />
      </Screen>
    );
  }

  return (
    <Screen refreshing={loading} onRefresh={refetch}>
      <View style={[styles.segment, { backgroundColor: theme.backgroundElement }]}>
        {TABS.map((tab) => {
          const isActive = tab.key === active;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActive(tab.key)}
              style={[
                styles.segmentItem,
                isActive && { backgroundColor: theme.surface, ...styleShadow },
              ]}
            >
              <ThemedText type={isActive ? 'smallBold' : 'small'} themeColor={isActive ? 'tint' : 'textSecondary'}>
                {tab.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {error ? (
        <ErrorState message="Could not load announcements." onRetry={refetch} />
      ) : filtered.length > 0 ? (
        <View style={styles.list}>
          {filtered.map((item) => (
            <Card key={item.id} style={styles.card}>
              <ThemedText type="smallBold">{item.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.date}>
                {formatDate(item.date)}
              </ThemedText>
              <ThemedText type="small">{item.detail}</ThemedText>
            </Card>
          ))}
        </View>
      ) : (
        <EmptyState message="No items in this category." icon="megaphone-outline" />
      )}
    </Screen>
  );
}

const styleShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 3,
  elevation: 2,
};

const styles = StyleSheet.create({
  segment: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    padding: 4,
    marginBottom: Spacing.three,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Radius.sm,
  },
  list: {
    gap: Spacing.two,
  },
  card: {
    marginBottom: Spacing.two,
  },
  date: {
    marginVertical: Spacing.half,
  },
});
