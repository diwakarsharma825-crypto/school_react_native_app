import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, Loading } from '@/components/ui/states';
import { ThemedText } from '@/components/ui/ThemedText';
import { deleteHomework, fetchHomeworkDates, fetchHomeworkForDate, HomeworkEntry } from '@/data/teacher-api';
import { useTheme } from '@/hooks/use-theme';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function pad(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

export default function TeacherHomeworkScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { classId, sectionId } = useLocalSearchParams<{ classId: string; sectionId?: string }>();
  const classIdNum = Number(classId);
  const sectionIdNum = sectionId ? Number(sectionId) : undefined;

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(
    `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
  );
  const [homeworkDates, setHomeworkDates] = useState<string[]>([]);
  const [entries, setEntries] = useState<HomeworkEntry[]>([]);
  const [loadingDates, setLoadingDates] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoadingDates(true);
    fetchHomeworkDates(classIdNum, sectionIdNum, viewYear, viewMonth)
      .then(setHomeworkDates)
      .catch(() => setHomeworkDates([]))
      .finally(() => setLoadingDates(false));
  }, [classIdNum, sectionIdNum, viewYear, viewMonth]);

  function loadEntries(date: string) {
    setLoadingEntries(true);
    setError(false);
    fetchHomeworkForDate(classIdNum, sectionIdNum, date)
      .then(setEntries)
      .catch(() => setError(true))
      .finally(() => setLoadingEntries(false));
  }

  useEffect(() => {
    loadEntries(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const days = useMemo(() => {
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

  return (
    <Screen>
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
          {days.map((day, i) => {
            if (day === null) return <View key={i} style={styles.dayCell} />;
            const dateStr = `${viewYear}-${pad(viewMonth)}-${pad(day)}`;
            const hasHomework = homeworkDates.includes(dateStr);
            const isSelected = dateStr === selectedDate;
            return (
              <Pressable key={i} style={styles.dayCell} onPress={() => setSelectedDate(dateStr)}>
                <View style={[styles.dayCircle, isSelected && { backgroundColor: theme.tint }]}>
                  <ThemedText type="small" themeColor={isSelected ? 'textOnBrand' : 'text'}>
                    {day}
                  </ThemedText>
                </View>
                {hasHomework ? <View style={[styles.dot, { backgroundColor: theme.accent }]} /> : null}
              </Pressable>
            );
          })}
        </View>
        {loadingDates ? null : null}
      </Card>

      <View style={styles.entriesHeader}>
        <ThemedText type="smallBold">Homework — {selectedDate}</ThemedText>
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/teacher-homework-add',
              params: { classId: String(classIdNum), sectionId: sectionIdNum ? String(sectionIdNum) : '', date: selectedDate },
            })
          }
          style={[styles.addButton, { backgroundColor: theme.tint }]}
        >
          <Ionicons name="add" size={18} color={Brand.white} />
        </Pressable>
      </View>

      {loadingEntries ? (
        <Loading label="Loading…" />
      ) : error ? (
        <ErrorState message="Could not load homework." onRetry={() => loadEntries(selectedDate)} />
      ) : entries.length === 0 ? (
        <EmptyState message="No homework for this date yet." icon="book-outline" />
      ) : (
        entries.map((entry) => (
          <Card key={entry.id} style={styles.entryCard}>
            <View style={styles.entryHeader}>
              <ThemedText type="smallBold">{entry.subject}</ThemedText>
              <Pressable
                onPress={() => {
                  deleteHomework(entry.id).then(() => loadEntries(selectedDate));
                }}
                hitSlop={8}
              >
                <Ionicons name="trash-outline" size={16} color={Brand.red} />
              </Pressable>
            </View>
            {entry.description ? (
              <ThemedText type="small" themeColor="textSecondary" style={styles.entryDescription}>
                {entry.description}
              </ThemedText>
            ) : null}
            {entry.attachments.length > 0 ? (
              <View style={styles.attachmentRow}>
                {entry.attachments.map((att, i) => (
                  <Image key={i} source={{ uri: att.photo_url }} style={styles.attachmentThumb} contentFit="cover" />
                ))}
              </View>
            ) : null}
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  calendarCard: {
    marginBottom: Spacing.four,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
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
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
  dayCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 2,
  },
  entriesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryCard: {
    marginBottom: Spacing.three,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  entryDescription: {
    marginTop: Spacing.one,
  },
  attachmentRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  attachmentThumb: {
    width: 56,
    height: 56,
    borderRadius: Radius.sm,
  },
});
