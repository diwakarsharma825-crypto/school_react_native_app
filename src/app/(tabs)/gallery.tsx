import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, Loading } from '@/components/ui/states';
import { SectionUnavailable } from '@/components/ui/SectionUnavailable';
import { ThemedText } from '@/components/ui/ThemedText';
import { fetchGalleries } from '@/data/api';
import { useFetch } from '@/hooks/use-fetch';
import { useSectionEnabled } from '@/hooks/use-sections';
import { formatDate } from '@/lib/format';

const COLUMNS = 2;
const GAP = Spacing.three;

export default function GalleryScreen() {
  const enabled = useSectionEnabled('gallery');
  const { width: screenWidth } = useWindowDimensions();
  const contentWidth = Math.min(screenWidth, 720) - Spacing.three * 2;
  const tileWidth = (contentWidth - GAP * (COLUMNS - 1)) / COLUMNS;
  const { data, loading, error, refetch } = useFetch(fetchGalleries);

  if (!enabled) return <SectionUnavailable />;

  if (loading && !data) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading gallery…" />
      </Screen>
    );
  }

  return (
    <Screen refreshing={loading} onRefresh={refetch}>
      {error ? (
        <ErrorState message="Could not load gallery." onRetry={refetch} />
      ) : data && data.length > 0 ? (
        <View style={styles.grid}>
          {data.map((album) => (
            <Pressable key={album.id} onPress={() => router.push(`/gallery/${album.id}`)} style={{ width: tileWidth }}>
              <Card style={styles.card}>
                {album.cover_image_url ? (
                  <Image source={{ uri: album.cover_image_url }} style={styles.cover} contentFit="cover" />
                ) : (
                  <View style={[styles.cover, styles.coverFallback]} />
                )}
                <ThemedText type="smallBold" numberOfLines={2} style={styles.title}>
                  {album.title}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {album.image_count} photos
                  {album.created_at ? ` · ${formatDate(album.created_at.split(' ')[0])}` : ''}
                </ThemedText>
              </Card>
            </Pressable>
          ))}
        </View>
      ) : (
        <EmptyState message="No albums yet." icon="images-outline" />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: GAP,
  },
  card: {
    padding: Spacing.two,
    marginBottom: Spacing.three,
  },
  cover: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Radius.md,
    marginBottom: Spacing.two,
  },
  coverFallback: {
    backgroundColor: '#E1E5EA',
  },
  title: {
    marginBottom: Spacing.half,
  },
});
