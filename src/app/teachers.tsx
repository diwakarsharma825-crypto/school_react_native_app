import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AvatarFgPalette, AvatarPalette, Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, Loading } from '@/components/ui/states';
import { SectionUnavailable } from '@/components/ui/SectionUnavailable';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@/hooks/use-theme';
import { fetchTeachers } from '@/data/api';
import { useFetch } from '@/hooks/use-fetch';
import { useSectionEnabled } from '@/hooks/use-sections';
import { Teacher } from '@/data/types';

function initialsFor(name: string | null | undefined) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const initials = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '');
  return initials.join('') || '?';
}

function TeacherCard({ teacher, index }: { teacher: Teacher; index: number }) {
  const theme = useTheme();
  const bg = AvatarPalette[index % AvatarPalette.length];
  const fg = AvatarFgPalette[index % AvatarFgPalette.length];

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        {teacher.photo_url ? (
          <Image source={{ uri: teacher.photo_url }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: bg }]}>
            <ThemedText type="smallBold" style={{ color: fg }}>
              {initialsFor(teacher.teacher_name)}
            </ThemedText>
          </View>
        )}
        <View style={styles.headerText}>
          <ThemedText type="subtitle">{teacher.teacher_name}</ThemedText>
          {teacher.designation || teacher.type ? (
            <ThemedText type="smallBold" themeColor="accent" style={styles.role}>
              {teacher.designation || teacher.type}
            </ThemedText>
          ) : null}
        </View>
      </View>
      <View style={[styles.divider, { backgroundColor: theme.border }]} />
      {teacher.qualification ? (
        <View style={styles.infoRow}>
          <Ionicons name="school-outline" size={16} color={theme.textSecondary} />
          <ThemedText type="small" themeColor="textSecondary" style={styles.infoLabel}>
            Qualification
          </ThemedText>
          <ThemedText type="small" style={styles.infoValue}>
            {teacher.qualification}
          </ThemedText>
        </View>
      ) : null}
      {teacher.total_experience ? (
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
          <ThemedText type="small" themeColor="textSecondary" style={styles.infoLabel}>
            Experience
          </ThemedText>
          <ThemedText type="small" style={styles.infoValue}>
            {teacher.total_experience}
          </ThemedText>
        </View>
      ) : null}
    </Card>
  );
}

export default function TeachersScreen() {
  const enabled = useSectionEnabled('teachers');
  const { data, loading, error, refetch } = useFetch(fetchTeachers);

  if (!enabled) return <SectionUnavailable />;

  if (loading && !data) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading teachers…" />
      </Screen>
    );
  }

  return (
    <Screen refreshing={loading} onRefresh={refetch}>
      {error ? (
        <ErrorState message="Could not load teachers." onRetry={refetch} />
      ) : data && data.length > 0 ? (
        <>
          <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
            {data.length} dedicated educators guiding our students.
          </ThemedText>
          {data.map((teacher, idx) => (
            <TeacherCard key={teacher.id} teacher={teacher} index={idx} />
          ))}
        </>
      ) : (
        <EmptyState message="No teachers to show yet." icon="people-outline" />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    marginBottom: Spacing.three,
  },
  card: {
    marginBottom: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: Radius.pill,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: Spacing.three,
  },
  role: {
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: Spacing.two,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  infoLabel: {
    marginLeft: Spacing.two,
    width: 100,
  },
  infoValue: {
    flex: 1,
  },
});
