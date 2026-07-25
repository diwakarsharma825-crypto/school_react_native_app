import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Brand, Radius, Shadow, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, Loading } from '@/components/ui/states';
import { SectionUnavailable } from '@/components/ui/SectionUnavailable';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@/hooks/use-theme';
import { fetchHolidays, fetchNews, fetchNotices } from '@/data/api';
import { useFetch } from '@/hooks/use-fetch';
import { useSectionEnabled } from '@/hooks/use-sections';
import { formatDate, stripHtml } from '@/lib/format';

type TabKey = 'news' | 'notice' | 'holiday';

const TABS: { key: TabKey; label: string; color: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'news', label: 'News', color: Brand.blueLight, icon: 'newspaper-outline' },
  { key: 'notice', label: 'Notice', color: Brand.saffron, icon: 'alert-circle-outline' },
  { key: 'holiday', label: 'Holiday', color: Brand.green, icon: 'sunny-outline' },
];

const TRUNCATE_LENGTH = 140;

/** The real app's Notices/Announcements screen — three source endpoints
 * (News, Notices, Holidays) behind a segmented tab switcher. */
export default function NoticesScreen() {
  const theme = useTheme();
  const enabled = useSectionEnabled('notices');
  const [active, setActive] = useState<TabKey>('notice');
  const [expandedIds, setExpandedIds] = useState<Set<number | string>>(new Set());

  const news = useFetch(fetchNews);
  const notices = useFetch(fetchNotices);
  const holidays = useFetch(fetchHolidays);

  const activeTab = TABS.find((t) => t.key === active)!;
  const current = active === 'news' ? news : active === 'notice' ? notices : holidays;

  const items = useMemo(() => {
    if (active === 'news') {
      return (news.data ?? []).map((n) => ({ id: n.id, title: n.title, date: n.date, detail: stripHtml(n.news ?? '') }));
    }
    if (active === 'notice') {
      return (notices.data ?? []).map((n) => ({ id: n.id, title: n.title, date: n.date, detail: stripHtml(n.notice ?? '') }));
    }
    return (holidays.data ?? []).map((h) => ({ id: h.id, title: h.title, date: h.date_from, detail: stripHtml(h.note ?? '') }));
  }, [active, news.data, notices.data, holidays.data]);

  if (!enabled) return <SectionUnavailable />;

  const loading = current.loading;
  const error = current.error;

  function toggleExpanded(id: number | string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

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
              <Ionicons name={tab.icon} size={14} color={isActive ? tab.color : theme.textSecondary} />
              <ThemedText type={isActive ? 'smallBold' : 'small'} themeColor={isActive ? 'text' : 'textSecondary'}>
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
          {items.map((item) => {
            const isLong = item.detail.length > TRUNCATE_LENGTH;
            const expanded = expandedIds.has(item.id);
            const shownDetail =
              expanded || !isLong ? item.detail : `${item.detail.slice(0, TRUNCATE_LENGTH).trim()}…`;
            return (
              <Card key={item.id} style={[styles.card, { borderLeftColor: activeTab.color, borderLeftWidth: 4 }]}>
                <ThemedText type="smallBold">{item.title}</ThemedText>
                <View style={styles.dateRow}>
                  <Ionicons name="calendar-outline" size={13} color={activeTab.color} />
                  <ThemedText type="small" style={[styles.date, { color: activeTab.color }]}>
                    {formatDate(item.date)}
                  </ThemedText>
                </View>
                {shownDetail ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {shownDetail}
                  </ThemedText>
                ) : null}
                {isLong ? (
                  <Pressable onPress={() => toggleExpanded(item.id)} hitSlop={8}>
                    <ThemedText type="smallBold" themeColor="tint" style={styles.readMore}>
                      {expanded ? 'Read less ⌃' : 'Read more ⌄'}
                    </ThemedText>
                  </Pressable>
                ) : null}
              </Card>
            );
          })}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.two,
    borderRadius: Radius.sm,
  },
  list: {
    gap: Spacing.two,
  },
  card: {
    marginBottom: Spacing.two,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginVertical: Spacing.half,
  },
  date: {},
  readMore: {
    marginTop: Spacing.one,
  },
});
