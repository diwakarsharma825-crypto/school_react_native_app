import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, Loading } from '@/components/ui/states';
import { ThemedText } from '@/components/ui/ThemedText';
import { fetchNotifications } from '@/data/api';
import { useFetch } from '@/hooks/use-fetch';
import { formatDate, stripHtml } from '@/lib/format';

export default function NotificationsScreen() {
  const { data, loading, error, refetch } = useFetch(fetchNotifications);

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
            <Card key={n.id} style={styles.card}>
              {n.image_url ? <Image source={{ uri: n.image_url }} style={styles.image} contentFit="cover" /> : null}
              <ThemedText type="smallBold">{n.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.date}>
                {formatDate(n.created_at)}
              </ThemedText>
              <ThemedText type="small">{stripHtml(n.body)}</ThemedText>
            </Card>
          ))}
        </View>
      ) : (
        <EmptyState message="No notifications yet." icon="notifications-outline" />
      )}
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
