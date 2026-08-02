import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { NotificationDetailModal } from '@/components/ui/NotificationDetailModal';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, Loading } from '@/components/ui/states';
import { ThemedText } from '@/components/ui/ThemedText';
import { AppNotification, fetchNotifications } from '@/data/api';
import { useFetch } from '@/hooks/use-fetch';
import { formatDate, stripHtml } from '@/lib/format';

export default function NotificationsScreen() {
  const { data, loading, error, refetch } = useFetch(fetchNotifications);
  const [selected, setSelected] = useState<AppNotification | null>(null);

  if (loading && !data) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading notifications…" />
      </Screen>
    );
  }

  return (
    <Screen refreshing={loading} onRefresh={refetch}>
      {error ? (
        <ErrorState message="Could not load notifications." onRetry={refetch} />
      ) : data && data.length > 0 ? (
        <View>
          {data.map((n) => (
            <Pressable key={n.id} onPress={() => setSelected(n)}>
              <Card style={styles.card}>
                {n.image_url ? <Image source={{ uri: n.image_url }} style={styles.image} contentFit="cover" /> : null}
                <ThemedText type="smallBold">{n.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.date}>
                  {formatDate(n.created_at)}
                </ThemedText>
                <ThemedText type="small" numberOfLines={2}>
                  {stripHtml(n.body)}
                </ThemedText>
              </Card>
            </Pressable>
          ))}
        </View>
      ) : (
        <EmptyState message="No notifications yet." icon="notifications-outline" />
      )}

      {selected ? (
        <NotificationDetailModal
          visible
          onClose={() => setSelected(null)}
          title={selected.title}
          date={formatDate(selected.created_at)}
          body={stripHtml(selected.body)}
          imageUrl={selected.image_url}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.three,
  },
  image: {
    width: '100%',
    height: 140,
    borderRadius: Radius.md,
    marginBottom: Spacing.two,
  },
  date: {
    marginVertical: Spacing.half,
  },
});
