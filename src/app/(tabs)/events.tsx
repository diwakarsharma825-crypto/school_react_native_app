import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';

import { MediaCard } from '@/components/ui/MediaCard';
import { Screen } from '@/components/ui/Screen';
import { SectionUnavailable } from '@/components/ui/SectionUnavailable';
import { EmptyState, ErrorState, Loading } from '@/components/ui/states';
import { ThemedText } from '@/components/ui/ThemedText';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { fetchEvents } from '@/data/api';
import { useFetch } from '@/hooks/use-fetch';
import { useSectionEnabled } from '@/hooks/use-sections';
import { useTheme } from '@/hooks/use-theme';
import { exportToPdf } from '@/lib/pdf-export';

export default function EventsScreen() {
  const theme = useTheme();
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
      {data && data.length > 0 ? (
        <View style={{ alignItems: 'flex-end', marginBottom: Spacing.three }}>
          <Pressable
            onPress={() => {
              const allImages = data.map((e) => e.image_url || e.cover_media?.url).filter(Boolean) as string[];
              exportToPdf({
                title: 'School Events & Activities Report',
                subtitle: `Total Events: ${data.length}`,
                columns: [
                  { header: 'Event Date', key: 'event_from', width: '25%' },
                  { header: 'Event Title', key: 'title', width: '35%' },
                  { header: 'Location / Note', key: 'note', width: '40%' },
                ],
                rows: data,
                images: allImages,
              });
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: theme.tint,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: Radius.pill,
            }}
          >
            <Ionicons name="document-text-outline" size={15} color={Brand.white} />
            <ThemedText type="smallBold" style={{ color: Brand.white }}>
              Export PDF
            </ThemedText>
          </Pressable>
        </View>
      ) : null}

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
              coverMedia={e.cover_media}
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
