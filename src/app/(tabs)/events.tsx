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
import { ExportPdfButton } from '@/components/ui/ExportPdfButton';
import { exportToPdf } from '@/lib/pdf-export';

import { useLanguage } from '@/lib/i18n';

export default function EventsScreen() {
  const theme = useTheme();
  const enabled = useSectionEnabled('events');
  const { data, loading, error, refetch } = useFetch(fetchEvents);
  const { t } = useLanguage();

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
              title={t(e.title)}
              date={e.event_from}
              imageUrl={e.image_url}
              coverMedia={e.cover_media}
              excerpt={e.note ? t(e.note) : undefined}
              category={t('Event')}
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
