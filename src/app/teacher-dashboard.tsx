import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AchieverCard } from '@/components/home/AchieverCard';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { SelectField } from '@/components/ui/SelectField';
import { ErrorState, Loading } from '@/components/ui/states';
import { ThemedText } from '@/components/ui/ThemedText';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { toAchiever } from '@/data/achievers';
import { fetchTeacherDashboard, TeacherDashboard, teacherLogout } from '@/data/teacher-api';
import { useTeacherAuth } from '@/hooks/use-teacher-auth';
import { useTheme } from '@/hooks/use-theme';

export default function TeacherDashboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile, checking, loggedIn, setLoggedIn } = useTeacherAuth();
  const [classId, setClassId] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<TeacherDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const classes = profile?.classes ?? [];

  useEffect(() => {
    if (classes.length > 0 && !classId) {
      setClassId(String(classes[0].class_id));
    }
  }, [classes, classId]);

  const selected = classes.find((c) => String(c.class_id) === classId);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    setError(false);
    fetchTeacherDashboard(selected.class_id, selected.section_id ?? undefined)
      .then(setDashboard)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [selected]);

  if (checking) {
    return (
      <Screen scroll={false}>
        <Loading label="Checking login…" />
      </Screen>
    );
  }

  if (!loggedIn) {
    router.replace('/teacher-login');
    return null;
  }

  if (!profile?.completed) {
    router.replace('/teacher-profile-setup');
    return null;
  }

  const classOptions = classes.map((c) => ({
    label: `${c.class_name}${c.section_name ? ` - ${c.section_name}` : ''}`,
    value: String(c.class_id),
  }));

  return (
    <Screen refreshing={loading} onRefresh={() => selected && fetchTeacherDashboard(selected.class_id, selected.section_id ?? undefined).then(setDashboard)}>
      {classes.length > 1 ? (
        <SelectField label="Class" placeholder="Select class" value={classId} options={classOptions} onChange={setClassId} />
      ) : (
        <ThemedText type="subtitle" style={styles.singleClassLabel}>
          {classOptions[0]?.label}
        </ThemedText>
      )}

      {loading && !dashboard ? (
        <Loading label="Loading dashboard…" />
      ) : error ? (
        <ErrorState message="Could not load dashboard data." />
      ) : dashboard ? (
        <>
          <Card style={styles.statCard}>
            <Ionicons name="people-outline" size={24} color={theme.tint} />
            <View style={styles.statText}>
              <ThemedText type="title">{dashboard.student_count}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Students in this class
              </ThemedText>
            </View>
          </Card>

          {dashboard.top_achievers.length > 0 ? (
            <>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
                TOP ACHIEVERS
              </ThemedText>
              <View style={styles.achieverGrid}>
                {dashboard.top_achievers.map((a, i) => (
                  <View key={a.name} style={styles.achieverItem}>
                    <AchieverCard achiever={toAchiever(a)} paletteIndex={i} />
                  </View>
                ))}
              </View>
            </>
          ) : null}

          <Pressable
            onPress={() => router.push({ pathname: '/teacher-homework', params: { classId: String(selected?.class_id), sectionId: selected?.section_id ? String(selected.section_id) : '' } })}
            style={[styles.homeworkButton, { backgroundColor: theme.tint }]}
          >
            <Ionicons name="calendar-outline" size={20} color={Brand.white} />
            <ThemedText type="smallBold" style={styles.homeworkButtonLabel}>
              Homework Calendar
            </ThemedText>
          </Pressable>
        </>
      ) : null}

      <Pressable
        onPress={async () => {
          await teacherLogout();
          setLoggedIn(false);
          router.replace('/teacher-login');
        }}
        style={styles.logoutRow}
      >
        <ThemedText type="small" themeColor="textSecondary">
          Log out
        </ThemedText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  singleClassLabel: {
    marginBottom: Spacing.three,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  statText: {
    gap: 2,
  },
  sectionTitle: {
    marginBottom: Spacing.two,
    letterSpacing: 0.5,
  },
  achieverGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  achieverItem: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  homeworkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Radius.pill,
    marginBottom: Spacing.four,
  },
  homeworkButtonLabel: {
    color: Brand.white,
  },
  logoutRow: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
  },
});
