import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Loading } from '@/components/ui/states';
import { ThemedText } from '@/components/ui/ThemedText';
import { useStudentAuth } from '@/hooks/use-student-auth';
import { useTeacherAuth } from '@/hooks/use-teacher-auth';
import { useTheme } from '@/hooks/use-theme';

/** YYYY-MM-DD → "12 Aug 2015" for display; falls back to the raw value if
 * it isn't in the expected shape. */
function formatDob(value: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return value;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${Number(m[3])} ${months[Number(m[2]) - 1]} ${m[1]}`;
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  const theme = useTheme();
  const iconColor = theme.dark ? '#FFFFFF' : theme.tint;
  const iconBg = theme.dark ? theme.tint : theme.backgroundSelected;
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <View style={styles.infoText}>
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
        <ThemedText type="default">{value}</ThemedText>
      </View>
    </View>
  );
}

/** "Who am I" screen reached by tapping the name/avatar row at the top of
 * the Teacher/Student role menu. Shows every field the logged-in profile
 * carries. */
export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { checking: teacherChecking, loggedIn: teacherLoggedIn, profile: teacherProfile } = useTeacherAuth();
  const { checking: studentChecking, loggedIn: studentLoggedIn, access } = useStudentAuth();

  useFocusEffect(
    useCallback(() => {
      if (!teacherChecking && !studentChecking && !teacherLoggedIn && !studentLoggedIn) {
        router.replace('/login');
      }
    }, [teacherChecking, studentChecking, teacherLoggedIn, studentLoggedIn, router])
  );

  if (teacherChecking || studentChecking) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading profile…" />
      </Screen>
    );
  }

  if (teacherLoggedIn && teacherProfile) {
    return (
      <Screen>
        <Card style={styles.headerCard}>
          <View style={[styles.avatar, { backgroundColor: theme.dark ? theme.tint : theme.backgroundSelected }]}>
            <Ionicons name="briefcase" size={28} color={theme.dark ? '#FFFFFF' : theme.tint} />
          </View>
          <ThemedText type="subtitle" style={styles.name}>
            {teacherProfile.name ?? 'Teacher'}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {teacherProfile.email ?? '—'}
          </ThemedText>
          <Pressable
            onPress={() => router.push('/teacher-profile-setup' as any)}
            style={[styles.editButton, { borderColor: theme.tint }]}
          >
            <Ionicons name="pencil-outline" size={16} color={theme.tint} />
            <ThemedText type="smallBold" themeColor="tint">
              Edit Profile
            </ThemedText>
          </Pressable>
        </Card>

        <Card style={styles.section}>
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            Classes
          </ThemedText>
          {teacherProfile.classes.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              No classes assigned yet.
            </ThemedText>
          ) : (
            <View style={styles.chipRow}>
              {teacherProfile.classes.map((c, i) => (
                <View key={i} style={[styles.chip, { backgroundColor: theme.backgroundSelected }]}>
                  <ThemedText type="small">
                    {c.class_name}
                    {c.section_name ? ` - ${c.section_name}` : ''}
                    {c.stream ? ` (${c.stream})` : ''}
                  </ThemedText>
                </View>
              ))}
            </View>
          )}
        </Card>

        <Card style={styles.section}>
          <InfoRow icon="mail-outline" label="Email" value={teacherProfile.email ?? '—'} />
        </Card>
      </Screen>
    );
  }

  if (studentLoggedIn && access) {
    const classTitle = access.className.toLowerCase().startsWith('class')
      ? `${access.className}${access.section ? ` - ${access.section}` : ''}`
      : `Class ${access.className}${access.section ? ` - ${access.section}` : ''}`;

    return (
      <Screen>
        <Card style={styles.headerCard}>
          {access.photoUrl ? (
            <Image source={{ uri: access.photoUrl }} style={styles.avatarPhoto} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, { backgroundColor: theme.dark ? theme.tint : theme.backgroundSelected }]}>
              <Ionicons name="school" size={32} color={theme.dark ? '#FFFFFF' : theme.tint} />
            </View>
          )}
          <ThemedText type="subtitle" style={styles.name}>
            {access.name}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {classTitle}
          </ThemedText>
        </Card>

        <Card style={styles.section}>
          <InfoRow icon="id-card-outline" label="SRN" value={access.srn || '—'} />
          <InfoRow icon="numbers-outline" label="Roll No" value={access.rollNo || '—'} />
          <InfoRow icon="school-outline" label="Class & Section" value={classTitle} />
          <InfoRow icon="person-outline" label="Father's Name" value={access.fatherName || '—'} />
          <InfoRow icon="heart-outline" label="Mother's Name" value={access.motherName || '—'} />
          <InfoRow icon="call-outline" label="Phone" value={access.phone || '—'} />
          <InfoRow icon="people-outline" label="Gender" value={access.gender || '—'} />
          <InfoRow icon="calendar-outline" label="Date of Birth" value={access.dob ? formatDob(access.dob) : '—'} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <Loading label="Loading profile…" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    alignItems: 'center',
    paddingVertical: Spacing.five,
    marginBottom: Spacing.three,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  avatarPhoto: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: Spacing.three,
  },
  name: {
    marginBottom: 2,
    textAlign: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderWidth: 1.5,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    marginTop: Spacing.three,
  },
  section: {
    marginBottom: Spacing.three,
  },
  sectionTitle: {
    marginBottom: Spacing.two,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.pill,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    flex: 1,
    gap: 1,
  },
});
