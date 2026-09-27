import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ClassAITeacherModal } from '@/components/ai/ClassAITeacherModal';
import { Card } from '@/components/ui/Card';
import { ChildSwitcherCard } from '@/components/ui/ChildSwitcherCard';
import { Screen } from '@/components/ui/Screen';
import { Loading } from '@/components/ui/states';
import { ThemedText } from '@/components/ui/ThemedText';
import { Radius, Spacing } from '@/constants/theme';
import { fetchCurrentAcademicYear } from '@/data/api';
import {
  fetchStudentAttendance,
  fetchStudentFeeInvoices,
  fetchStudentLeaveApplications,
} from '@/data/homework-api';
import { SectionKey, useSections } from '@/hooks/use-sections';
import { useStudentAuth } from '@/hooks/use-student-auth';
import { useTheme } from '@/hooks/use-theme';

interface QuickLink {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  bg: string;
  fg: string;
  route: string;
  sectionKey?: SectionKey;
}

const QUICK_LINKS: QuickLink[] = [
  { label: 'AI Teacher', icon: 'school-outline', bg: '#D1FAE5', fg: '#059669', route: 'ai_teacher' },
  { label: 'Homework', icon: 'book-outline', bg: '#EBF8FF', fg: '#2B6CB0', route: '/homework', sectionKey: 'homework' },
  { label: 'Attendance', icon: 'checkmark-done-outline', bg: '#E6FFFA', fg: '#234E52', route: '/student-attendance', sectionKey: 'attendance' },
  { label: 'Apply Leave', icon: 'calendar-clear-outline', bg: '#FEFCBF', fg: '#744210', route: '/apply-leave', sectionKey: 'leave' },
  { label: 'Fees', icon: 'cash-outline', bg: '#FED7D7', fg: '#742A2A', route: '/fees', sectionKey: 'fees' },
  { label: 'Result', icon: 'school-outline', bg: '#E9D8FD', fg: '#553C9A', route: '/result', sectionKey: 'result' },
  { label: 'Syllabus', icon: 'journal-outline', bg: '#EBF8FF', fg: '#2B6CB0', route: '/syllabus', sectionKey: 'syllabus' },
  { label: 'Classmates', icon: 'people-outline', bg: '#E6FFFA', fg: '#234E52', route: '/classmates', sectionKey: 'classmates' },
];

export default function StudentDashboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const sections = useSections();
  const { checking, loggedIn, access, allChildren, switchChild } = useStudentAuth();

  const [sessionLabel, setSessionLabel] = useState<string | undefined>(undefined);
  const [attendancePercent, setAttendancePercent] = useState<number | null>(null);
  const [feeDue, setFeeDue] = useState<number | null>(null);
  const [pendingLeaves, setPendingLeaves] = useState<number | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [aiTeacherVisible, setAiTeacherVisible] = useState(false);

  useEffect(() => {
    fetchCurrentAcademicYear()
      .then((r) => setSessionLabel(r.label))
      .catch(() => setSessionLabel(undefined));
  }, []);

  const loadStats = useCallback(async () => {
    if (!loggedIn || !access || !access.srn) {
      setLoadingStats(false);
      return;
    }
    setLoadingStats(true);
    try {
      const studentSrn = access.srn;
      const [att, fees, leaves] = await Promise.all([
        fetchStudentAttendance(studentSrn).catch(() => null),
        fetchStudentFeeInvoices(studentSrn).catch(() => null),
        fetchStudentLeaveApplications(studentSrn).catch(() => null),
      ]);

      if (att && Array.isArray(att) && att.length > 0) {
        const presentCount = att.filter(
          (a) => a.status === 'P' || a.status === 'Present' || a.status === '1'
        ).length;
        const pct = Math.round((presentCount / att.length) * 100);
        setAttendancePercent(pct);
      } else {
        setAttendancePercent(null);
      }

      if (fees && Array.isArray(fees)) {
        const totalDue = fees
          .filter((f: any) => f.status === 'due')
          .reduce((sum: number, f: any) => sum + Number(f.amount || 0), 0);
        setFeeDue(totalDue);
      } else {
        setFeeDue(null);
      }

      if (leaves && Array.isArray(leaves)) {
        const pendingCount = leaves.filter((l: any) => l.status === 'pending').length;
        setPendingLeaves(pendingCount);
      } else {
        setPendingLeaves(null);
      }
    } finally {
      setLoadingStats(false);
    }
  }, [loggedIn, access]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  if (checking) return <Loading />;
  if (!loggedIn || !access) return null;

  return (
    <Screen>
      <ChildSwitcherCard
        siblings={allChildren}
        activeSrn={access.srn}
        onSwitch={switchChild}
        sessionLabel={sessionLabel}
      />

      {/* Summary Stats Row */}
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

      {/* Hero AI Teacher Banner */}
      <Pressable onPress={() => setAiTeacherVisible(true)} style={{ marginBottom: Spacing.four }}>
        <Card style={styles.aiHeroCard}>
          <View style={styles.aiHeroHeader}>
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={14} color="#059669" />
              <ThemedText type="smallBold" style={{ color: '#059669', fontSize: 11 }}>
                24/7 Grok AI Tutor
              </ThemedText>
            </View>
            <View style={styles.langBadges}>
              <ThemedText style={{ fontSize: 11 }}>🇮🇳 🇬🇧 🗣️</ThemedText>
            </View>
          </View>

          <View style={styles.aiHeroBody}>
            <View style={{ flex: 1, gap: 4 }}>
              <ThemedText type="subtitle" style={{ fontSize: 16, fontWeight: '700' }}>
                Class AI Teacher & Scanner 📚
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Scan chapter pages, listen to Hindi/English audio explanations & solve interactive quizzes!
              </ThemedText>
            </View>
            <View style={styles.aiHeroButton}>
              <Ionicons name="scan-outline" size={20} color="#FFFFFF" />
            </View>
          </View>
        </Card>
      </Pressable>

      {(() => {
        const visibleQuickLinks = QUICK_LINKS.filter((link) => !link.sectionKey || sections[link.sectionKey] !== false);
        if (visibleQuickLinks.length === 0) return null;
        return (
          <>
            <ThemedText type="smallBold" style={styles.sectionTitle}>
              Quick Links
            </ThemedText>
            <View style={styles.grid}>
              {visibleQuickLinks.map((link) => (
                <Pressable
                  key={link.route}
                  style={styles.tileWrap}
                  onPress={() => {
                    if (link.route === 'ai_teacher') {
                      setAiTeacherVisible(true);
                    } else {
                      router.push(link.route as any);
                    }
                  }}
                >
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
          </>
        );
      })()}

      <ClassAITeacherModal
        visible={aiTeacherVisible}
        onClose={() => setAiTeacherVisible(false)}
        initialClassName={access?.className || 'Class 1st'}
      />
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
  aiHeroCard: {
    padding: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.25)',
    backgroundColor: 'rgba(5, 150, 105, 0.05)',
    gap: 8,
  },
  aiHeroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(5, 150, 105, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  langBadges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiHeroBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  aiHeroButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
});
