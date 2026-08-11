import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { ChildSwitcherCard } from '@/components/ui/ChildSwitcherCard';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, Loading } from '@/components/ui/states';
import { ThemedText } from '@/components/ui/ThemedText';
import { AttendanceDay, AttendanceStatus, fetchStudentAttendance } from '@/data/homework-api';
import { useStudentAuth } from '@/hooks/use-student-auth';
import { useTheme } from '@/hooks/use-theme';
import { useSectionEnabled } from '@/hooks/use-sections';
import { SectionUnavailable } from '@/components/ui/SectionUnavailable';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function pad(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

const STATUS_META: Record<AttendanceStatus, { label: string; color: string; bg: string }> = {
  P: { label: 'Present', color: '#2E7D32', bg: '#DFF1E1' },
  A: { label: 'Absent', color: '#C62828', bg: '#FBE2E2' },
  L: { label: 'Leave', color: '#B8860B', bg: '#FBEFD3' },
};

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${d} ${MONTH_NAMES[m - 1]} ${y}`;
}

export default function StudentAttendanceScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { checking, loggedIn, access, allChildren, switchChild } = useStudentAuth();
  const enabled = useSectionEnabled('attendance');
  const [days, setDays] = useState<AttendanceDay[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [view, setView] = useState<'calendar' | 'list'>('calendar');

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);

  function load() {
    if (!access) return;
    const validSrn = access.srn && access.srn !== '0' && access.srn !== '0.0' ? access.srn : null;
    const identifier = validSrn || access.phone;
    if (!identifier) return;
    setLoading(true);
    setError(false);
    fetchStudentAttendance(identifier)
      .then(setDays)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(load, [access]);

  const byDate = useMemo(() => {
    const map: Record<string, AttendanceDay> = {};
    (days ?? []).forEach((d) => (map[d.date] = d));
    return map;
  }, [days]);

  const monthDays = useMemo(() => {
    const prefix = `${viewYear}-${pad(viewMonth)}-`;
    return (days ?? []).filter((d) => d.date.startsWith(prefix));
  }, [days, viewYear, viewMonth]);

  const monthCounts = useMemo(() => {
    const c = { P: 0, A: 0, L: 0 };
    monthDays.forEach((d) => c[d.status]++);
    const marked = c.P + c.A + c.L;
    const percent = marked > 0 ? Math.round((c.P / marked) * 100) : null;
    return { ...c, percent, marked };
  }, [monthDays]);

  const grid = useMemo(() => {
    const firstOfMonth = new Date(viewYear, viewMonth - 1, 1);
    const startWeekday = firstOfMonth.getDay();
    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
    const cells: (number | null)[] = Array.from({ length: startWeekday }, () => null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [viewYear, viewMonth]);

  function changeMonth(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setViewMonth(m);
    setViewYear(y);
  }

  useFocusEffect(
    useCallback(() => {
      if (!checking && !loggedIn) {
        router.replace('/homework');
      }
    }, [checking, loggedIn, router])
  );

  if (!enabled) return <SectionUnavailable />;

  if (checking || !loggedIn) {
    return (
      <Screen scroll={false}>
        <Loading label="Checking login…" />
      </Screen>
    );
  }

  if (loading && !days) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading attendance…" />
      </Screen>
    );
  }
  if (error) {
    return (
      <Screen scroll={false}>
        <ErrorState message="Could not load attendance." onRetry={load} />
      </Screen>
    );
  }

  return (
    <Screen>
      {allChildren.length > 1 && access ? (
        <ChildSwitcherCard siblings={allChildren} activeSrn={access.srn} onSwitch={switchChild} />
      ) : null}

      <View style={styles.summaryCard}>
        <View style={styles.summaryTop}>
          <View>
            <ThemedText type="title" themeColor="textOnBrand" style={styles.percentText}>
              {monthCounts.percent !== null ? `${monthCounts.percent}%` : '—'}
            </ThemedText>
            <ThemedText type="small" themeColor="textOnBrand" style={styles.summaryLabel}>
              Present this month
            </ThemedText>
          </View>
          <View style={styles.summaryPills}>
            <View style={[styles.pill, { backgroundColor: STATUS_META.P.bg }]}>
              <ThemedText type="small" style={{ color: STATUS_META.P.color }}>
                {monthCounts.P} Present
              </ThemedText>
            </View>
            <View style={[styles.pill, { backgroundColor: STATUS_META.A.bg }]}>
              <ThemedText type="small" style={{ color: STATUS_META.A.color }}>
                {monthCounts.A} Absent
              </ThemedText>
            </View>
            <View style={[styles.pill, { backgroundColor: STATUS_META.L.bg }]}>
              <ThemedText type="small" style={{ color: STATUS_META.L.color }}>
                {monthCounts.L} Leave
              </ThemedText>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.viewToggle, { borderColor: theme.border }]}>
        <Pressable
          onPress={() => setView('calendar')}
          style={[styles.viewToggleButton, view === 'calendar' && { backgroundColor: theme.tint }]}
        >
          <Ionicons name="calendar-outline" size={15} color={view === 'calendar' ? Brand.white : theme.textSecondary} />
          <ThemedText type="small" themeColor={view === 'calendar' ? 'textOnBrand' : 'textSecondary'}>
            Calendar
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() => setView('list')}
          style={[styles.viewToggleButton, view === 'list' && { backgroundColor: theme.tint }]}
        >
          <Ionicons name="list-outline" size={15} color={view === 'list' ? Brand.white : theme.textSecondary} />
          <ThemedText type="small" themeColor={view === 'list' ? 'textOnBrand' : 'textSecondary'}>
            List
          </ThemedText>
        </Pressable>
      </View>

      {view === 'calendar' ? (
        <Card style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <Pressable onPress={() => changeMonth(-1)} hitSlop={8}>
              <Ionicons name="chevron-back" size={20} color={theme.tint} />
            </Pressable>
            <ThemedText type="smallBold">
              {MONTH_NAMES[viewMonth - 1]} {viewYear}
            </ThemedText>
            <Pressable onPress={() => changeMonth(1)} hitSlop={8}>
              <Ionicons name="chevron-forward" size={20} color={theme.tint} />
            </Pressable>
          </View>

          <View style={styles.weekdayRow}>
            {WEEKDAY_LABELS.map((w, i) => (
              <ThemedText key={i} type="small" themeColor="textSecondary" style={styles.weekdayLabel}>
                {w}
              </ThemedText>
            ))}
          </View>

          <View style={styles.grid}>
            {grid.map((day, i) => {
              if (day === null) return <View key={i} style={styles.dayCell} />;
              const dateStr = `${viewYear}-${pad(viewMonth)}-${pad(day)}`;
              const record = byDate[dateStr];
              const meta = record ? STATUS_META[record.status] : null;
              return (
                <View key={i} style={styles.dayCell}>
                  <View style={[styles.dayCircle, meta && { backgroundColor: meta.bg }]}>
                    <ThemedText type="small" style={meta ? { color: meta.color, fontWeight: '700' } : undefined}>
                      {day}
                    </ThemedText>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.legendRow}>
            {(['P', 'A', 'L'] as AttendanceStatus[]).map((s) => (
              <View key={s} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: STATUS_META[s].color }]} />
                <ThemedText type="small" themeColor="textSecondary">
                  {STATUS_META[s].label}
                </ThemedText>
              </View>
            ))}
          </View>
        </Card>
      ) : !days || days.length === 0 ? (
        <EmptyState message="No attendance recorded yet." icon="checkmark-done-outline" />
      ) : (
        days.map((d) => {
          const meta = STATUS_META[d.status];
          return (
            <Card key={d.date} style={styles.listRow}>
              <View style={[styles.listStatusDot, { backgroundColor: meta.color }]} />
              <View style={styles.listInfo}>
                <ThemedText type="smallBold">{formatDate(d.date)}</ThemedText>
                {d.remarks ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {d.remarks}
                  </ThemedText>
                ) : null}
              </View>
              <View style={[styles.pill, { backgroundColor: meta.bg }]}>
                <ThemedText type="small" style={{ color: meta.color }}>
                  {meta.label}
                </ThemedText>
              </View>
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: Brand.blue,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    marginBottom: Spacing.three,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  percentText: {},
  summaryLabel: {
    opacity: 0.85,
  },
  summaryPills: {
    gap: Spacing.one,
  },
  pill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    alignItems: 'center',
  },
  viewToggle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: Radius.pill,
    padding: 3,
    marginBottom: Spacing.three,
    alignSelf: 'flex-start',
  },
  viewToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.pill,
  },
  calendarCard: {
    marginBottom: Spacing.four,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: Spacing.one,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    gap: Spacing.four,
    marginTop: Spacing.three,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.two,
  },
  listStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  listInfo: {
    flex: 1,
    gap: 2,
  },
});
