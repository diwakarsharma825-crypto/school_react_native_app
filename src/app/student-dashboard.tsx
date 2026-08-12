import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { ChildSwitcherCard } from '@/components/ui/ChildSwitcherCard';
import { Screen } from '@/components/ui/Screen';
import { Loading } from '@/components/ui/states';
import { ThemedText } from '@/components/ui/ThemedText';
import { fetchCurrentAcademicYear } from '@/data/api';
import {
  fetchStudentAttendance,
  fetchStudentFeeInvoices,
  fetchStudentLeaveApplications,
} from '@/data/homework-api';
import { useStudentAuth } from '@/hooks/use-student-auth';

interface QuickLink {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  bg: string;
  fg: string;
  route: string;
}

const QUICK_LINKS: QuickLink[] = [
  { label: 'Homework', icon: 'book-outline', bg: '#E3EEFD', fg: '#2E6FBE', route: '/homework' },
  { label: 'Attendance', icon: 'checkmark-done-outline', bg: '#DFF1E1', fg: '#2E7D32', route: '/student-attendance' },
  { label: 'Apply Leave', icon: 'calendar-clear-outline', bg: '#FBEFD3', fg: '#B8860B', route: '/apply-leave' },
  { label: 'Fees', icon: 'cash-outline', bg: '#FBE2E2', fg: '#C62828', route: '/fees' },
  { label: 'Result', icon: 'school-outline', bg: '#EDE3FD', fg: '#6A3EBE', route: '/result' },
];

/** Student-side landing screen, mirroring the teacher Dashboard and the
 * Home tab's own quick-action-grid pattern (04-design-system.md) rather
 * than inventing a new layout — active-child header, a few at-a-glance
 * stats, then quick links into every student feature. */
export default function StudentDashboardScreen() {
  const router = useRouter();
  const { checking, loggedIn, access, allChildren, switchChild } = useStudentAuth();

  const [sessionLabel, setSessionLabel] = useState<string | undefined>(undefined);
  const [attendancePercent, setAttendancePercent] = useState<number | null>(null);
  const [feeDue, setFeeDue] = useState<number | null>(null);
  const [pendingLeaves, setPendingLeaves] = useState<number | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    fetchCurrentAcademicYear()
      .then((r) => setSessionLabel(r.label))
      .catch(() => {});
  }, []);

  const loadStats = useCallback(() => {
    if (!access) return;
    setLoadingStats(true);
    const validSrn = access.srn && access.srn !== '0' && access.srn !== '0.0' ? access.srn : null;
    const identifier = validSrn || access.phone;
    if (!identifier) {
      setLoadingStats(false);
      return;
    }
    Promise.all([
      fetchStudentAttendance(identifier).catch(() => []),
      fetchStudentFeeInvoices(identifier).catch(() => []),
      fetchStudentLeaveApplications(identifier).catch(() => []),
    ]).then(([attendance, fees, leaves]) => {
      const now = new Date();
      const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-`;
      const monthDays = attendance.filter((d) => d.date.startsWith(prefix));
      const present = monthDays.filter((d) => d.status === 'P').length;
      setAttendancePercent(monthDays.length > 0 ? Math.round((present / monthDays.length) * 100) : null);
      setFeeDue(fees.filter((f) => f.status === 'due').reduce((sum, f) => sum + Number(f.amount), 0));
      setPendingLeaves(leaves.filter((l) => l.status === 'pending').length);
      setLoadingStats(false);
    });
  }, [access]);

  useFocusEffect(
    useCallback(() => {
      if (!checking && !loggedIn) {
        router.replace('/homework');
        return;
      }
      loadStats();
    }, [checking, loggedIn, router, loadStats])
  );

  if (checking || !loggedIn || !access) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading dashboard…" />
      </Screen>
    );
  }

  return (
    <Screen>
      {allChildren.length > 1 ? (
        <ChildSwitcherCard siblings={allChildren} activeSrn={access.srn} onSwitch={switchChild} sessionLabel={sessionLabel} />
      ) : (
        <Pressable onPress={() => router.push('/profile')}>
          <Card style={[styles.headerCard, { flexDirection: 'row', alignItems: 'center' }]}>
            {access.photoUrl ? (
              <Image source={{ uri: access.photoUrl }} style={{ width: 44, height: 44, borderRadius: 22, marginRight: 12 }} contentFit="cover" />
            ) : (
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: theme.backgroundSelected, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name="school" size={20} color={theme.tint} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <ThemedText type="smallBold">{access.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {`${/\bclass\b/i.test(access.className) ? access.className : `Class ${access.className}`}${
                  access.section ? ` - ${access.section}` : ''
                } · SRN ${access.srn}`}
              </ThemedText>
              {sessionLabel ? (
                <ThemedText type="small" themeColor="tint">
                  Session: {sessionLabel}
                </ThemedText>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </Card>
        </Pressable>
      )}

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <ThemedText type="title" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} style={styles.statValue}>
            {loadingStats || attendancePercent === null ? '—' : `${attendancePercent}%`}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Attendance
          </ThemedText>
        </Card>
        <Card style={styles.statCard}>
          <ThemedText type="title" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} style={styles.statValue}>
            {loadingStats || feeDue === null ? '—' : `₹${feeDue}`}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Fees Due
          </ThemedText>
        </Card>
        <Card style={styles.statCard}>
          <ThemedText type="title" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} style={styles.statValue}>
            {loadingStats || pendingLeaves === null ? '—' : pendingLeaves}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Leave Pending
          </ThemedText>
        </Card>
      </View>

      <ThemedText type="smallBold" style={styles.sectionTitle}>
        Quick Links
      </ThemedText>
      <View style={styles.grid}>
        {QUICK_LINKS.map((link) => (
          <Pressable key={link.route} style={styles.tileWrap} onPress={() => router.push(link.route as any)}>
            <Card style={styles.tile}>
              <View style={[styles.iconCircle, { backgroundColor: link.bg }]}>
                <Ionicons name={link.icon} size={22} color={link.fg} />
              </View>
              <ThemedText type="small" style={styles.tileLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                {link.label}
              </ThemedText>
            </Card>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    marginBottom: Spacing.four,
    gap: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.one,
  },
  statValue: {
    textAlign: 'center',
  },
  sectionTitle: {
    marginBottom: Spacing.two,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: Spacing.three,
  },
  tileWrap: {
    width: '30%',
    marginBottom: Spacing.three,
  },
  tile: {
    alignItems: 'center',
    padding: Spacing.two,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  tileLabel: {
    textAlign: 'center',
  },
});
