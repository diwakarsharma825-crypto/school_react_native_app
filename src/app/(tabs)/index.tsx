import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Card } from '@/components/ui/Card';

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

import { useLayout } from '@/hooks/use-layout';
import { useStudentAuth } from '@/hooks/use-student-auth';
import { useTeacherAuth } from '@/hooks/use-teacher-auth';
import StudentDashboardScreen from '@/app/student-dashboard';
import TeacherDashboardScreen from '@/app/teacher-dashboard';
import LoginChoiceScreen from '@/app/login';
import { useLanguage } from '@/lib/i18n';

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
  const theme = useTheme();
  const { instituteMode } = useLayout();
  const { loggedIn: studentLoggedIn } = useStudentAuth();
  const { loggedIn: teacherLoggedIn } = useTeacherAuth();
  const { t } = useLanguage();

  const home = useFetch(fetchHome);
  const settings = useFetch(fetchSettings);
  const achievers = useFetch(fetchTopAchievers);
  const eventsEnabled = useSectionEnabled('events');
  const topStudentsEnabled = useSectionEnabled('top_students');

  if (instituteMode) {
    if (studentLoggedIn) return <StudentDashboardScreen />;
    if (teacherLoggedIn) return <TeacherDashboardScreen />;
    return <LoginChoiceScreen />;
  }

  if (home.loading || settings.loading) return <Loading />;
  if (home.error || !home.data) return <ErrorState message={home.error ? (home.error.message || String(home.error)) : 'Failed to load'} onRetry={home.refetch} />;

  return (
    <Screen>
      {home.data.sliders && home.data.sliders.length > 0 ? (
        <Carousel sliders={home.data.sliders} />
      ) : null}
      <QuickActionGrid />

      <SectionHeader title={t('principal_message')} />
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
          <SectionHeader title={t('latest_events')} onSeeAll={() => router.push('/(tabs)/events')} />
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
          <SectionHeader title={t('top_students')} onSeeAll={() => router.push('/top-students')} />
          <View style={{ marginBottom: Spacing.four }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {(achievers.data ?? []).map(toAchiever).map((a, i) => (
                <AchieverCard key={a.name} achiever={a} paletteIndex={i} width={190} />
              ))}
            </ScrollView>
          </View>
        </>
      ) : null}
    </Screen>
  );
}
