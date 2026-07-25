import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Radius, Shadow, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, Loading } from '@/components/ui/states';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@/hooks/use-theme';
import { fetchHolidays, fetchNews, fetchNotices } from '@/data/api';
import { useFetch } from '@/hooks/use-fetch';
import { formatDate, stripHtml } from '@/lib/format';

type TabKey = 'news' | 'notice' | 'holiday';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'news', label: 'News' },
  { key: 'notice', label: 'Notice' },
  { key: 'holiday', label: 'Holiday' },
];

/** The real app's Notices/Announcements screen — three source endpoints
 * (News, Notices, Holidays) behind a segmented tab switcher. */
export default function NoticesScreen() {
  const theme = useTheme();
  const [active, setActive] = useState<TabKey>('notice');

  const news = useFetch(fetchNews);
  const notices = useFetch(fetchNotices);
  const holidays = useFetch(fetchHolidays);

  const current = active === 'news' ? news : active === 'notice' ? notices : holidays;

  const items = useMemo(() => {
    if (active === 'news') {
      return (news.data ?? []).map((n) => ({ id: n.id, title: n.title, date: n.date, detail: n.news ?? '' }));
    }
    if (active === 'notice') {
      return (notices.data ?? []).map((n) => ({ id: n.id, title: n.title, date: n.date, detail: n.notice ?? '' }));
    }
    return (holidays.data ?? []).map((h) => ({ id: h.id, title: h.title, date: h.date_from, detail: h.note ?? '' }));
  }, [active, news.data, notices.data, holidays.data]);

  const loading = current.loading;
  const error = current.error;

  return (
    <Screen refreshing={loading} onRefresh={current.refetch}>
      <View style={[styles.segment, { backgroundColor: theme.backgroundElement }]}>
        {TABS.map((tab) => {
          const isActive = tab.key === active;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActive(tab.key)}
              style={[styles.segmentItem, isActive && { backgroundColor: theme.surface, ...Shadow.card }]}
            >
              <ThemedText type={isActive ? 'smallBold' : 'small'} themeColor={isActive ? 'tint' : 'textSecondary'}>
                {tab.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {loading && items.length === 0 ? (
        <Loading label="Loading…" />
      ) : error ? (
        <ErrorState message="Could not load this section." onRetry={current.refetch} />
      ) : items.length > 0 ? (
        <View style={styles.list}>
          {items.map((item) => (
            <Card key={item.id} style={styles.card}>
              <ThemedText type="smallBold">{item.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.date}>
                {formatDate(item.date)}
              </ThemedText>
              {item.detail ? <ThemedText type="small">{stripHtml(item.detail)}</ThemedText> : null}
            </Card>
          ))}
        </View>
      ) : (
        <EmptyState message="No items in this category." icon="megaphone-outline" />
      )}
    </Screen>
  );
}

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
