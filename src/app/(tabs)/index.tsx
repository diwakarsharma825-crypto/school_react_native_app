import { router } from 'expo-router';
import React, { useCallback } from 'react';
import { ScrollView, View } from 'react-native';

import { Carousel } from '@/components/home/Carousel';
import { PrincipalCard } from '@/components/home/PrincipalCard';
import { QuickActionGrid } from '@/components/home/QuickActionGrid';
import { StatsRow } from '@/components/home/StatsRow';
import { MediaCard } from '@/components/ui/MediaCard';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState, ErrorState, Loading } from '@/components/ui/states';
import { Spacing } from '@/constants/theme';
import { fetchHome, fetchSettings } from '@/data/api';
import { useFetch } from '@/hooks/use-fetch';
import { stripHtml } from '@/lib/format';

export default function HomeScreen() {
  const home = useFetch(fetchHome);
  const settings = useFetch(fetchSettings);

  const refreshAll = useCallback(() => {
    home.refetch();
    settings.refetch();
  }, [home, settings]);

  const initialLoading = home.loading && !home.data;
  const refreshing = !initialLoading && (home.loading || settings.loading);

  if (initialLoading) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading home…" />
      </Screen>
    );
  }

  return (
    <Screen refreshing={refreshing} onRefresh={refreshAll}>
      {home.error ? (
        <ErrorState message="Could not load the home page." onRetry={home.refetch} />
      ) : home.data ? (
        <>
          {home.data.sliders.length > 0 ? (
            <Carousel sliders={home.data.sliders} />
          ) : (
            <EmptyState message="No banners available." />
          )}

          <QuickActionGrid />

          <SectionHeader title="Principal's Message" />
          {settings.data?.principle_text ? (
            <PrincipalCard
              photoUrl={settings.data.principle_image_url ?? null}
              message={stripHtml(settings.data.principle_text)}
            />
          ) : (
            <EmptyState message="Message unavailable." />
          )}

          <StatsRow stats={home.data.stats} />

          <SectionHeader title="Latest News" onSeeAll={() => router.push('/news')} />
          {home.data.news.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {home.data.news.map((n) => (
                <MediaCard
                  key={n.id}
                  title={n.title}
                  date={n.date}
                  imageUrl={n.image_url}
                  excerpt={n.news}
                  category="News"
                  width={220}
                  onPress={() => router.push(`/news/${n.id}`)}
                />
              ))}
            </ScrollView>
          ) : (
            <EmptyState message="No news yet." />
          )}

          <SectionHeader title="Latest Events" onSeeAll={() => router.push('/(tabs)/events')} />
          {home.data.events.length > 0 ? (
            <View style={{ marginBottom: Spacing.four }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {home.data.events.map((e) => (
                  <MediaCard
                    key={e.id}
                    title={e.title}
                    date={e.event_from}
                    imageUrl={e.image_url}
                    excerpt={e.note}
                    category="Event"
                    width={220}
                    onPress={() => router.push(`/event/${e.id}`)}
                  />
                ))}
              </ScrollView>
            </View>
          ) : (
            <EmptyState message="No upcoming events." />
          )}
        </>
      ) : (
        <EmptyState message="Nothing to show yet." />
      )}
    </Screen>
  );
}
