import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { AchieverCard } from '@/components/home/AchieverCard';
import { Carousel } from '@/components/home/Carousel';
import { EventSpotlightCard } from '@/components/home/EventSpotlightCard';
import { PrincipalCard } from '@/components/home/PrincipalCard';
import { QuickActionGrid } from '@/components/home/QuickActionGrid';
import { StatsRow } from '@/components/home/StatsRow';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ThemedText } from '@/components/ui/ThemedText';
import { EmptyState, ErrorState, Loading } from '@/components/ui/states';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { toAchiever } from '@/data/achievers';
import { fetchHome, fetchSettings, fetchTopAchievers } from '@/data/api';
import { useFetch } from '@/hooks/use-fetch';
import { useSectionEnabled } from '@/hooks/use-sections';
import { useTheme } from '@/hooks/use-theme';
import { stripHtml } from '@/lib/format';
import { getPendingRegistration, PendingRegistration } from '@/lib/homework-access';

function PendingApprovalBanner({ pending }: { pending: PendingRegistration }) {
  const theme = useTheme();
  return (
    <View style={[bannerStyles.card, { backgroundColor: theme.surface }, Shadow.card]}>
      <Ionicons name="time-outline" size={22} color={theme.tint} />
      <View style={bannerStyles.text}>
        <ThemedText type="smallBold">Registration pending</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {pending.name}
          {pending.className ? ` (${pending.className})` : ''}&apos;s profile will be visible here once your class
          teacher approves it.
        </ThemedText>
      </View>
    </View>
  );
}

const bannerStyles = {
  card: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.three,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    marginBottom: Spacing.four,
  },
  text: {
    flex: 1,
    gap: 2,
  },
};

export default function HomeScreen() {
  const home = useFetch(fetchHome);
  const settings = useFetch(fetchSettings);
  const achievers = useFetch(fetchTopAchievers);
  const eventsEnabled = useSectionEnabled('events');
  const topStudentsEnabled = useSectionEnabled('top_students');
  const [pendingRegistration, setPendingRegistration] = useState<PendingRegistration | null>(null);

  // Re-checked every time Home comes into focus — cleared automatically
  // once the student's account is activated and they actually log in
  // (see saveHomeworkChildren()), so this naturally disappears on its own.
  useFocusEffect(
    useCallback(() => {
      getPendingRegistration().then(setPendingRegistration);
    }, [])
  );

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
              name={settings.data.principal_name}
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
                        coverMedia={e.cover_media}
                        images={e.images}
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
