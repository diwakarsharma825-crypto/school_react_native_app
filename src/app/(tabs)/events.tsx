import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { MediaCard } from '@/components/ui/MediaCard';
import { Screen } from '@/components/ui/Screen';
import { SectionUnavailable } from '@/components/ui/SectionUnavailable';
import { EmptyState, ErrorState, Loading } from '@/components/ui/states';
import { fetchEvents } from '@/data/api';
import { useFetch } from '@/hooks/use-fetch';
import { useSectionEnabled } from '@/hooks/use-sections';

export default function EventsScreen() {
  const enabled = useSectionEnabled('events');
  const { data, loading, error, refetch } = useFetch(fetchEvents);

  if (!enabled) return <SectionUnavailable />;

  if (loading && !data) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading events…" />
      </Screen>
    );
  }

  return (
    <Screen refreshing={loading} onRefresh={refetch}>
      {error ? (
        <ErrorState message="Could not load events." onRetry={refetch} />
      ) : data && data.length > 0 ? (
        <View>
          {data.map((e) => (
            <MediaCard
              key={e.id}
              title={e.title}
              date={e.event_from}
              imageUrl={e.image_url}
              excerpt={e.note}
              category="Event"
              onPress={() => router.push(`/event/${e.id}`)}
            />
          ))}
        </View>
      ) : (
        <EmptyState message="No events scheduled right now." icon="calendar-outline" />
      )}
    </Screen>
  );
}
