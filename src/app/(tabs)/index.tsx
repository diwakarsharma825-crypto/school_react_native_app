import { router } from 'expo-router';
import React, { useCallback } from 'react';
import { View } from 'react-native';

import { Carousel } from '@/components/home/Carousel';
import { FacilityCard } from '@/components/home/FacilityCard';
import { PrincipalCard } from '@/components/home/PrincipalCard';
import { StatsRow } from '@/components/home/StatsRow';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState, ErrorState, Loading } from '@/components/ui/states';
import { MediaCard } from '@/components/ui/MediaCard';
import {
  fetchBanners,
  fetchEvents,
  fetchFacilities,
  fetchNews,
  fetchPrincipalMessage,
  fetchStats,
} from '@/data/api';
import { useFetch } from '@/hooks/use-fetch';
import { ScrollView } from 'react-native';
import { Spacing } from '@/constants/theme';

export default function HomeScreen() {
  const banners = useFetch(fetchBanners);
  const facilities = useFetch(fetchFacilities);
  const stats = useFetch(fetchStats);
  const principal = useFetch(fetchPrincipalMessage);
  const news = useFetch(fetchNews);
  const events = useFetch(fetchEvents);

  const refreshAll = useCallback(() => {
    banners.refetch();
    facilities.refetch();
    stats.refetch();
    principal.refetch();
    news.refetch();
    events.refetch();
  }, [banners, facilities, stats, principal, news, events]);

  const initialLoading =
    banners.loading && facilities.loading && stats.loading && principal.loading && news.loading && events.loading;
  const refreshing =
    !initialLoading &&
    (banners.loading || facilities.loading || stats.loading || principal.loading || news.loading || events.loading);

  if (initialLoading) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading home…" />
      </Screen>
    );
  }

  return (
    <Screen refreshing={refreshing} onRefresh={refreshAll}>
      {banners.error ? (
        <ErrorState message="Could not load banners." onRetry={banners.refetch} />
      ) : banners.data && banners.data.length > 0 ? (
        <Carousel banners={banners.data} />
      ) : (
        <EmptyState message="No banners available." />
      )}

      {stats.error ? (
        <ErrorState message="Could not load stats." onRetry={stats.refetch} />
      ) : stats.data && stats.data.length > 0 ? (
        <StatsRow stats={stats.data} />
      ) : null}

      <SectionHeader title="Our Facilities" />
      {facilities.error ? (
        <ErrorState message="Could not load facilities." onRetry={facilities.refetch} />
      ) : facilities.data && facilities.data.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {facilities.data.map((f) => (
            <FacilityCard key={f.id} facility={f} />
          ))}
        </ScrollView>
      ) : (
        <EmptyState message="No facilities to show." />
      )}

      <SectionHeader title="Principal's Message" />
      {principal.error ? (
        <ErrorState message="Could not load message." onRetry={principal.refetch} />
      ) : principal.data ? (
        <PrincipalCard principal={principal.data} />
      ) : (
        <EmptyState message="Message unavailable." />
      )}

      <SectionHeader title="Latest News" onSeeAll={() => router.push('/announcements')} />
      {news.error ? (
        <ErrorState message="Could not load news." onRetry={news.refetch} />
      ) : news.data && news.data.length > 0 ? (
        <View>
          {news.data.slice(0, 3).map((n) => (
            <MediaCard
              key={n.id}
              title={n.title}
              date={n.date}
              imageUrl={n.imageUrl}
              excerpt={n.excerpt}
              onPress={() => router.push(`/news/${n.id}`)}
            />
          ))}
        </View>
      ) : (
        <EmptyState message="No news yet." />
      )}

      <SectionHeader title="Upcoming Events" onSeeAll={() => router.push('/(tabs)/events')} />
      {events.error ? (
        <ErrorState message="Could not load events." onRetry={events.refetch} />
      ) : events.data && events.data.length > 0 ? (
        <View style={{ marginBottom: Spacing.four }}>
          {events.data.slice(0, 3).map((e) => (
            <MediaCard
              key={e.id}
              title={e.title}
              date={e.date}
              imageUrl={e.imageUrl}
              excerpt={e.excerpt}
              onPress={() => router.push(`/event/${e.id}`)}
            />
          ))}
        </View>
      ) : (
        <EmptyState message="No upcoming events." />
      )}
    </Screen>
  );
}
