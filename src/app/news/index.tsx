import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { MediaCard } from '@/components/ui/MediaCard';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, Loading } from '@/components/ui/states';
import { fetchNews } from '@/data/api';
import { useFetch } from '@/hooks/use-fetch';

/** "See all" destination from the Home screen's Latest News section. */
export default function NewsListScreen() {
  const { data, loading, error, refetch } = useFetch(fetchNews);

  if (loading && !data) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading news…" />
      </Screen>
    );
  }

  return (
    <Screen refreshing={loading} onRefresh={refetch}>
      {error ? (
        <ErrorState message="Could not load news." onRetry={refetch} />
      ) : data && data.length > 0 ? (
        <View>
          {data.map((n) => (
            <MediaCard
              key={n.id}
              title={n.title}
              date={n.date}
              imageUrl={n.image_url}
              excerpt={n.news}
              category="News"
              onPress={() => router.push(`/news/${n.id}`)}
            />
          ))}
        </View>
      ) : (
        <EmptyState message="No news yet." icon="newspaper-outline" />
      )}
    </Screen>
  );
}
