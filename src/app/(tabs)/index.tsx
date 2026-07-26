import { router } from 'expo-router';
import React, { useCallback } from 'react';
import { ScrollView, View } from 'react-native';

import { AchieverCard } from '@/components/home/AchieverCard';
import { Carousel } from '@/components/home/Carousel';
import { EventSpotlightCard } from '@/components/home/EventSpotlightCard';
import { PrincipalCard } from '@/components/home/PrincipalCard';
import { QuickActionGrid } from '@/components/home/QuickActionGrid';
import { StatsRow } from '@/components/home/StatsRow';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState, ErrorState, Loading } from '@/components/ui/states';
import { Spacing } from '@/constants/theme';
import { toAchiever } from '@/data/achievers';
import { fetchHome, fetchSettings, fetchTopAchievers } from '@/data/api';
import { useFetch } from '@/hooks/use-fetch';
import { useSectionEnabled } from '@/hooks/use-sections';
import { stripHtml } from '@/lib/format';

export default function HomeScreen() {
  const home = useFetch(fetchHome);
  const settings = useFetch(fetchSettings);
  const achievers = useFetch(fetchTopAchievers);
  const eventsEnabled = useSectionEnabled('events');
  const topStudentsEnabled = useSectionEnabled('top_students');

  const refreshAll = useCallback(() => {
    home.refetch();
    settings.refetch();
    achievers.refetch();
  }, [home, settings, achievers]);

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

          {eventsEnabled ? (
            <>
              <SectionHeader title="Latest Events" onSeeAll={() => router.push('/(tabs)/events')} />
              {home.data.events.length > 0 ? (
                <View style={{ marginBottom: Spacing.four }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {home.data.events.map((e) => (
                      <EventSpotlightCard
                        key={e.id}
                        title={e.title}
                        date={e.event_from}
                        place={e.event_place}
                        imageUrl={e.image_url}
                        onPress={() => router.push(`/event/${e.id}`)}
                      />
                    ))}
                  </ScrollView>
                </View>
              ) : (
                <EmptyState message="No upcoming events." />
              )}
            </>
          ) : null}

          {topStudentsEnabled && (achievers.data ?? []).length > 0 ? (
            <>
              <SectionHeader title="Top Achievers" onSeeAll={() => router.push('/top-students')} />
              <View style={{ marginBottom: Spacing.four }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {(achievers.data ?? []).map(toAchiever).map((a, i) => (
                    <AchieverCard key={a.name} achiever={a} paletteIndex={i} width={190} />
                  ))}
                </ScrollView>
              </View>
            </>
          ) : null}
        </>
      ) : (
        <EmptyState message="Nothing to show yet." />
      )}
    </Screen>
  );
}
