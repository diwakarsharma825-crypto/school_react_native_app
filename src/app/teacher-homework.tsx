import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { HomeworkDetailModal } from '@/components/ui/HomeworkDetailModal';
import { Screen } from '@/components/ui/Screen';
import { SelectField } from '@/components/ui/SelectField';
import { EmptyState, ErrorState, Loading } from '@/components/ui/states';
import { ThemedText } from '@/components/ui/ThemedText';
import {
  deleteHomework,
  fetchHomeworkDates,
  fetchHomeworkForDate,
  getSavedSelectedClassId,
  HomeworkEntry,
  saveSelectedClassId,
} from '@/data/teacher-api';
import { useTeacherAuth } from '@/hooks/use-teacher-auth';
import { useTheme } from '@/hooks/use-theme';
import { ExportPdfButton } from '@/components/ui/ExportPdfButton';
import { exportToPdf } from '@/lib/pdf-export';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function pad(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

function todayStr() {
  const t = new Date();
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
}

export default function TeacherHomeworkScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile } = useTeacherAuth();
  const classes = profile?.classes ?? [];

  const { classId: paramClassId, sectionId: paramSectionId } = useLocalSearchParams<{ classId?: string; sectionId?: string }>();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(paramClassId ?? null);

  useEffect(() => {
    if (!selectedClassId) {
      getSavedSelectedClassId().then((saved) => {
        if (saved && classes.some((c) => String(c.class_id) === saved)) {
          setSelectedClassId(saved);
        } else if (classes.length > 0) {
          setSelectedClassId(String(classes[0].class_id));
        }
      });
    }
  }, [classes, selectedClassId]);

  const classOptions = classes.map((c) => ({
    label: `${c.class_name}${c.section_name ? ` - ${c.section_name}` : ''}`,
    value: String(c.class_id),
  }));

  const selectedClassObj = classes.find((c) => String(c.class_id) === selectedClassId);
  const classIdNum = selectedClassId ? Number(selectedClassId) : 0;
  const sectionIdNum = selectedClassObj?.section_id ? Number(selectedClassObj.section_id) : (paramSectionId ? Number(paramSectionId) : undefined);

  function handleClassChange(val: string | null) {
    setSelectedClassId(val);
    if (val) saveSelectedClassId(val);
  }

  const today = new Date();
  const currentTodayDateStr = todayStr();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(currentTodayDateStr);
  const [homeworkDates, setHomeworkDates] = useState<string[]>([]);
  const [entries, setEntries] = useState<HomeworkEntry[]>([]);
  const [loadingDates, setLoadingDates] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [error, setError] = useState(false);

  // Selected Detail Modal State
  const [detailEntry, setDetailEntry] = useState<HomeworkEntry | null>(null);

  // Edit/Delete restricted to current day only!
  const isCurrentDay = selectedDate === currentTodayDateStr;

  function loadDates() {
    if (!classIdNum) return;
    setLoadingDates(true);
    fetchHomeworkDates(classIdNum, sectionIdNum, viewYear, viewMonth)
      .then(setHomeworkDates)
      .catch(() => setHomeworkDates([]))
      .finally(() => setLoadingDates(false));
  }

  function loadEntries(date: string) {
    if (!classIdNum) return;
    setLoadingEntries(true);
    setError(false);
    fetchHomeworkForDate(classIdNum, sectionIdNum, date)
      .then(setEntries)
      .catch(() => setError(true))
      .finally(() => setLoadingEntries(false));
  }

  useEffect(() => {
    loadDates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classIdNum, sectionIdNum, viewYear, viewMonth]);

  useEffect(() => {
    loadEntries(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classIdNum, sectionIdNum, selectedDate]);

  useFocusEffect(
    useCallback(() => {
      loadDates();
      loadEntries(selectedDate);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [classIdNum, sectionIdNum, selectedDate])
  );

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

  function handleDelete(entry: HomeworkEntry) {
    Alert.alert('Delete Homework', `Are you sure you want to delete homework for ${entry.subject}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteHomework(entry.id).then(() => {
            loadDates();
            loadEntries(selectedDate);
          });
        },
      },
    ]);
  }

  function handleEdit(entry: HomeworkEntry) {
    const photosStr = entry.attachments.map((a) => a.photo_url).join('|');
    router.push({
      pathname: '/teacher-homework-add',
      params: {
        classId: String(classIdNum),
        sectionId: sectionIdNum ? String(sectionIdNum) : '',
        date: selectedDate,
        homeworkId: String(entry.id),
        initialSubject: entry.subject,
        initialChapter: entry.chapter ?? '',
        initialDescription: entry.description ?? '',
        existingPhotos: photosStr,
      },
    });
  }

  return (
    <Screen>
      {/* Class Dropdown Selector at Top */}
      {classes.length > 0 ? (
        <SelectField
          label="Class"
          placeholder="Select Class"
          value={selectedClassId}
          options={classOptions}
          onChange={handleClassChange}
        />
      ) : null}

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
      </Card>

      <View style={styles.entriesHeader}>
        <View>
          <ThemedText type="smallBold">Homework — {selectedDate}</ThemedText>
          {selectedClassObj ? (
            <ThemedText type="small" themeColor="textSecondary">
              {selectedClassObj.class_name}{selectedClassObj.section_name ? ` (${selectedClassObj.section_name})` : ''}
            </ThemedText>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
          {entries.length > 0 ? (
            <ExportPdfButton
              variant="compact"
              onPress={() => {
                const images = entries.flatMap((e) => e.attachments.map((a) => a.photo_url));
                exportToPdf({
                  title: `Teacher Homework Report - Date: ${selectedDate}`,
                  subtitle: `Class: ${selectedClassObj?.class_name ?? ''} | Entries: ${entries.length}`,
                  columns: [
                    { header: 'Subject', key: 'subject', width: '20%' },
                    { header: 'Chapter / Title', key: 'chapter', width: '20%' },
                    { header: 'Description', key: 'description', width: '40%' },
                    { header: 'Attachment Link', key: 'attachmentLink', width: '20%' },
                  ],
                  rows: entries.map((e) => ({
                    ...e,
                    attachmentLink: e.attachments && e.attachments.length > 0 ? e.attachments[0].photo_url : 'No attachment',
                  })),
                  images,
                });
              }}
            />
          ) : null}
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/teacher-homework-add',
                params: { classId: String(classIdNum), sectionId: sectionIdNum ? String(sectionIdNum) : '', date: selectedDate },
              })
            }
            style={[styles.addButton, { backgroundColor: theme.dark ? '#2563EB' : theme.tint }]}
          >
            <Ionicons name="add" size={18} color={Brand.white} />
          </Pressable>
        </View>
      </View>

      {loadingEntries ? (
        <Loading label="Loading…" />
      ) : error ? (
        <ErrorState message="Could not load homework." onRetry={() => loadEntries(selectedDate)} />
      ) : entries.length === 0 ? (
        <EmptyState message="No homework for this date yet." icon="book-outline" />
      ) : (
        entries.map((entry) => (
          <Pressable key={entry.id} onPress={() => setDetailEntry(entry)}>
            <Card style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <View style={{ flex: 1, paddingRight: Spacing.two }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <ThemedText type="smallBold">{entry.subject}</ThemedText>
                    {selectedClassObj ? (
                      <View style={[styles.classBadge, { backgroundColor: theme.dark ? 'rgba(37,99,235,0.2)' : '#EFF6FF' }]}>
                        <ThemedText type="small" style={{ color: theme.tint, fontSize: 11, fontWeight: '600' }}>
                          {selectedClassObj.class_name}{selectedClassObj.section_name ? ` - ${selectedClassObj.section_name}` : ''}
                        </ThemedText>
                      </View>
                    ) : null}
                  </View>
                  {entry.chapter ? (
                    <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 2 }}>
                      {entry.chapter}
                    </ThemedText>
                  ) : null}
                </View>

                {/* Edit & Delete are strictly hidden if not the current day! */}
                {isCurrentDay ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
                    <Pressable onPress={() => handleEdit(entry)} hitSlop={8}>
                      <Ionicons name="create-outline" size={18} color={theme.tint} />
                    </Pressable>
                    <Pressable onPress={() => handleDelete(entry)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={18} color={Brand.red} />
                    </Pressable>
                  </View>
                ) : null}
              </View>

              {entry.description ? (
                <ThemedText type="small" themeColor="textSecondary" style={styles.entryDescription} numberOfLines={2}>
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
          </Pressable>
        ))
      )}

      {/* Homework Detail View Modal */}
      {detailEntry ? (
        <HomeworkDetailModal
          visible={!!detailEntry}
          onClose={() => setDetailEntry(null)}
          subject={detailEntry.subject}
          chapter={detailEntry.chapter ?? undefined}
          date={selectedDate}
          description={detailEntry.description ?? ''}
          photoUrls={detailEntry.attachments.map((a) => a.photo_url)}
          teacherName={profile?.name}
        />
      ) : null}
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
  classBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
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
