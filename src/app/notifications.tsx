import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { NotificationDetailModal } from '@/components/ui/NotificationDetailModal';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, Loading } from '@/components/ui/states';
import { ThemedText } from '@/components/ui/ThemedText';
import {
  AppNotification,
  fetchEvents,
  fetchNews,
  fetchNotices,
  fetchNotifications,
} from '@/data/api';
import { EventItem, NewsItem, Notice } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, stripHtml } from '@/lib/format';

export type NotificationCategory = 'Notification' | 'Notice' | 'Event' | 'News';

export interface UnifiedNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  date: string;
  imageUrl?: string | null;
}

const CATEGORY_COLORS: Record<NotificationCategory, { bg: string; fg: string }> = {
  Notification: { bg: '#DCE8F7', fg: '#123A6B' },
  Notice: { bg: '#E3EEFD', fg: '#2E6FBE' },
  Event: { bg: '#FBEFD3', fg: '#B8860B' },
  News: { bg: '#DFF1E1', fg: '#2E7D32' },
};

export default function NotificationsScreen() {
  const theme = useTheme();
  const [items, setItems] = useState<UnifiedNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<UnifiedNotification | null>(null);

  const loadAllNotifications = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [notifs, notices, events, news] = await Promise.all([
        fetchNotifications().catch(() => [] as AppNotification[]),
        fetchNotices().catch(() => [] as Notice[]),
        fetchEvents().catch(() => [] as EventItem[]),
        fetchNews().catch(() => [] as NewsItem[]),
      ]);

      const combined: UnifiedNotification[] = [];

      // 1. Direct App Notifications
      notifs.forEach((n) => {
        combined.push({
          id: `notif-${n.id}`,
          category: 'Notification',
          title: n.title,
          body: stripHtml(n.body),
          date: n.created_at,
          imageUrl: n.image_url,
        });
      });

      // 2. School Notices
      notices.forEach((n) => {
        combined.push({
          id: `notice-${n.id}`,
          category: 'Notice',
          title: n.title,
          body: stripHtml(n.description),
          date: n.date || new Date().toISOString(),
          imageUrl: n.image_url,
        });
      });

      // 3. School Events
      events.forEach((e) => {
        combined.push({
          id: `event-${e.id}`,
          category: 'Event',
          title: e.title,
          body: stripHtml(e.description || e.event_place ? `Venue: ${e.event_place}` : ''),
          date: e.event_from || new Date().toISOString(),
          imageUrl: e.image_url,
        });
      });

      // 4. News items
      news.forEach((nw) => {
        combined.push({
          id: `news-${nw.id}`,
          category: 'News',
          title: nw.title,
          body: stripHtml(nw.description),
          date: nw.date || new Date().toISOString(),
          imageUrl: nw.image_url,
        });
      });

      // Sort newest to oldest
      combined.sort((a, b) => {
        const timeA = new Date(a.date).getTime() || 0;
        const timeB = new Date(b.date).getTime() || 0;
        return timeB - timeA;
      });

      setItems(combined);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllNotifications();
  }, [loadAllNotifications]);

  if (loading && items.length === 0) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading notifications…" />
      </Screen>
    );
  }

  return (
    <Screen refreshing={loading} onRefresh={loadAllNotifications}>
      {error ? (
        <ErrorState message="Could not load notifications." onRetry={loadAllNotifications} />
      ) : items.length > 0 ? (
        <View style={styles.list}>
          {items.map((n) => {
            const catStyle = CATEGORY_COLORS[n.category] || CATEGORY_COLORS.Notification;
            return (
              <Pressable key={n.id} onPress={() => setSelected(n)}>
                <Card style={styles.card}>
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.badge, { backgroundColor: catStyle.bg }]}>
                      <ThemedText type="smallBold" style={{ color: catStyle.fg, fontSize: 11 }}>
                        {n.category}
                      </ThemedText>
                    </View>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.dateText}>
                      {formatDate(n.date)}
                    </ThemedText>
                  </View>

                  {n.imageUrl ? <Image source={{ uri: n.imageUrl }} style={styles.image} contentFit="cover" /> : null}

                  <ThemedText type="smallBold" style={styles.titleText}>
                    {n.title}
                  </ThemedText>

                  {n.body ? (
                    <ThemedText type="small" themeColor="textSecondary" numberOfLines={3} style={styles.bodyText}>
                      {n.body}
                    </ThemedText>
                  ) : null}
                </Card>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <EmptyState message="No notifications available." icon="notifications-outline" />
      )}

      {selected ? (
        <NotificationDetailModal
          visible
          onClose={() => setSelected(null)}
          title={`[${selected.category}] ${selected.title}`}
          date={formatDate(selected.date)}
          body={selected.body}
          imageUrl={selected.imageUrl}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.three,
  },
  card: {
    marginBottom: Spacing.three,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  dateText: {
    fontSize: 12,
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: Radius.md,
    marginBottom: Spacing.two,
  },
  titleText: {
    fontSize: 15,
    marginBottom: 4,
  },
  bodyText: {
    lineHeight: 18,
  },
});
