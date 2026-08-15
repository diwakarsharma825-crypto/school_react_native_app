import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { HomeworkDetailModal } from '@/components/ui/HomeworkDetailModal';
import { ProfileHeaderBar } from '@/components/ui/ProfileHeaderBar';
import { Screen } from '@/components/ui/Screen';
import { SendNotificationModal } from '@/components/ui/SendNotificationModal';
import { SelectField } from '@/components/ui/SelectField';
import { EmptyState, ErrorState, Loading } from '@/components/ui/states';
import { ThemedText } from '@/components/ui/ThemedText';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { fetchCurrentAcademicYear } from '@/data/api';
import { ExportPdfButton } from '@/components/ui/ExportPdfButton';
import { exportToPdf } from '@/lib/pdf-export';
import {
  deleteHomework,
  fetchHomeworkDates,
  fetchHomeworkForDate,
  fetchPendingRegistrations,
  fetchTeacherStudents,
  HomeworkEntry,
  PendingRegistration,
  registerTeacherPushToken,
  RosterStudent,
  TeacherProfile,
} from '@/data/teacher-api';
import { useTeacherAuth } from '@/hooks/use-teacher-auth';
import { useTheme } from '@/hooks/use-theme';
import { useSectionEnabled } from '@/hooks/use-sections';
import { getFcmPushToken } from '@/lib/notifications';

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

type Tab = 'students' | 'homework';

function PendingRegistrationsSection({ classId, sectionId }: { classId: number; sectionId?: number }) {
  const theme = useTheme();
  const router = useRouter();
  const [pending, setPending] = useState<PendingRegistration[]>([]);

  function load() {
    fetchPendingRegistrations(classId, sectionId)
      .then(setPending)
      .catch(() => setPending([]));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, sectionId]);

  // Also reload on focus — coming back from the review/activate screen
  // shouldn't require a manual refresh to see the change.
  useFocusEffect(
    useCallback(() => {
      load();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [classId, sectionId])
  );

  function openReview(reg: PendingRegistration) {
    router.push({
      pathname: '/teacher-student-review',
      params: {
        id: String(reg.id),
        name: reg.name,
        className: reg.class,
        section: reg.section ?? undefined,
        srn: reg.srn ?? undefined,
        phone: reg.phone ?? undefined,
        gender: reg.gender ?? undefined,
        rollNo: reg.roll_no ?? undefined,
        fatherName: reg.father_name ?? undefined,
        motherName: reg.mother_name ?? undefined,
        photoUrl: reg.photo_url ?? undefined,
        active: String(reg.account_status),
      },
    } as any);
  }

  if (pending.length === 0) return null;

  return (
    <View style={[styles.pendingSection, { borderColor: theme.accent, backgroundColor: theme.backgroundSelected }]}>
      <ThemedText type="smallBold" style={styles.pendingTitle}>
        New student {pending.length === 1 ? 'registration' : 'registrations'} to verify
      </ThemedText>
      {pending.map((reg) => (
        <View key={reg.id} style={styles.pendingRow}>
          <View style={styles.pendingInfo}>
            <ThemedText type="smallBold">{reg.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {reg.class}
              {reg.section ? ` - ${reg.section}` : ''}
              {reg.phone ? ` · ${reg.phone}` : ''}
            </ThemedText>
          </View>
          <Pressable
            onPress={() => openReview(reg)}
            style={[styles.activateButton, { backgroundColor: theme.tint }]}
          >
            <ThemedText type="small" style={styles.activateButtonLabel}>
              Review
            </ThemedText>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

function StudentsTab({
  classId,
  sectionId,
  classLabel,
  sectionLabel,
}: {
  classId: number;
  sectionId?: number;
  classLabel: string;
  sectionLabel?: string;
}) {
  const theme = useTheme();
  const router = useRouter();
  const { profile } = useTeacherAuth();
  const canAlert = profile?.permissions?.alerts !== false;
  const canImportResult = profile?.permissions?.result !== false;
  const [students, setStudents] = useState<RosterStudent[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [notifyTarget, setNotifyTarget] = useState<{ ref: string; name: string } | null | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  function load() {
    setLoading(true);
    setError(false);
    fetchTeacherStudents(classId, sectionId)
      .then(setStudents)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, sectionId]);

  // Also reload on focus — coming back from the review/activate screen
  // shouldn't require a manual refresh to see the change.
  useFocusEffect(
    useCallback(() => {
      load();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [classId, sectionId])
  );

  const filtered = useMemo(() => {
    if (!students) return [];
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.father_name ?? '').toLowerCase().includes(q) ||
        (s.roll_no ?? '').toLowerCase().includes(q) ||
        (s.phone ?? '').includes(q)
    );
  }, [students, query]);

  const activeCount = students?.filter((s) => s.enrollment_status === 1).length ?? 0;
  const inactiveCount = (students?.length ?? 0) - activeCount;

  return (
    <>
      <PendingRegistrationsSection classId={classId} sectionId={sectionId} />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.one, marginBottom: Spacing.four }}>
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/teacher-add-student',
              params: { classId: String(classId), sectionId: sectionId ? String(sectionId) : '' },
            } as any)
          }
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: theme.tint,
            paddingHorizontal: 14,
            paddingVertical: 9,
            borderRadius: Radius.md,
          }}
        >
          <Ionicons name="person-add-outline" size={16} color={Brand.white} />
          <ThemedText type="smallBold" style={{ color: Brand.white }}>
            Add Student
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={() =>
            router.push({
              pathname: '/teacher-import-students',
              params: { classId: String(classId), sectionId: sectionId ? String(sectionId) : '' },
            } as any)
          }
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: theme.surface,
            borderColor: theme.tint,
            borderWidth: 1.5,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: Radius.md,
          }}
        >
          <Ionicons name="cloud-upload-outline" size={16} color={theme.tint} />
          <ThemedText type="smallBold" themeColor="tint">
            Import Excel
          </ThemedText>
        </Pressable>

        <ExportPdfButton
          variant="outline"
          style={{ borderRadius: Radius.md, paddingVertical: 8, paddingHorizontal: 14 }}
          onPress={() => {
            if (!filteredStudents || filteredStudents.length === 0) return;
            const images = filteredStudents.map((s) => s.photo_url).filter(Boolean) as string[];
            exportToPdf({
              title: `Class Roster Report - ${classLabel}${sectionLabel ? ` (${sectionLabel})` : ''}`,
              subtitle: `Total Students: ${filteredStudents.length}${query ? ` | Filter: "${query}"` : ''}`,
              columns: [
                { header: 'Roll No', key: 'roll_no', width: '15%' },
                { header: 'Student Name', key: 'name', width: '30%' },
                { header: 'SRN', key: 'srn', width: '15%' },
                { header: 'Father Name', key: 'father_name', width: '25%' },
                { header: 'Mobile Phone', key: 'phone', width: '15%' },
              ],
              rows: filteredStudents,
              images,
            });
          }}
        />

        {canAlert ? (
          <Pressable
            onPress={() => setNotifyTarget(null)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: theme.surface,
              borderColor: theme.tint,
              borderWidth: 1.5,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: Radius.md,
            }}
          >
            <Ionicons name="notifications-outline" size={16} color={theme.tint} />
            <ThemedText type="smallBold" themeColor="tint">
              Notify Class
            </ThemedText>
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => router.push('/teacher-promote' as any)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: theme.surface,
            borderColor: theme.tint,
            borderWidth: 1.5,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: Radius.md,
          }}
        >
          <Ionicons name="arrow-up-circle-outline" size={16} color={theme.tint} />
          <ThemedText type="smallBold" themeColor="tint">
            Batch Promotion
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={() => router.push('/teacher-subjects' as any)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: theme.surface,
            borderColor: theme.tint,
            borderWidth: 1.5,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: Radius.md,
          }}
        >
          <Ionicons name="book-outline" size={16} color={theme.tint} />
          <ThemedText type="smallBold" themeColor="tint">
            Manage Subjects
          </ThemedText>
        </Pressable>

        {canImportResult ? (
          <Pressable
            onPress={() => router.push('/teacher-import-result' as any)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: theme.surface,
              borderColor: theme.tint,
              borderWidth: 1.5,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: Radius.md,
            }}
          >
            <Ionicons name="document-attach-outline" size={16} color={theme.tint} />
            <ThemedText type="smallBold" themeColor="tint">
              Import Result
            </ThemedText>
          </Pressable>
        ) : null}
      </View>

      <SendNotificationModal
        visible={notifyTarget !== undefined}
        onClose={() => setNotifyTarget(undefined)}
        classId={classId}
        sectionId={sectionId}
        target={notifyTarget ?? null}
      />

      {loading ? (
        <Loading label="Loading students…" />
      ) : error ? (
        <ErrorState message="Could not load students." onRetry={load} />
      ) : !students || students.length === 0 ? (
        <EmptyState message="No students enrolled in this class yet." icon="people-outline" />
      ) : (
        <>
          <View style={[styles.searchBox, { borderColor: theme.border }]}>
            <Ionicons name="search" size={16} color={theme.textSecondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by name, roll no, father's name, mobile"
              placeholderTextColor={theme.textSecondary}
              style={[styles.searchInput, { color: theme.text }]}
            />
            {query ? (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.countRow}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.rosterCount}>
              {students.length} {students.length === 1 ? 'STUDENT' : 'STUDENTS'} ({activeCount} active · {inactiveCount} inactive)
            </ThemedText>
            <View style={[styles.viewToggle, { borderColor: theme.border }]}>
              <Pressable
                onPress={() => setViewMode('list')}
                style={[styles.viewToggleButton, viewMode === 'list' && { backgroundColor: theme.tint }]}
              >
                <Ionicons name="list" size={15} color={viewMode === 'list' ? Brand.white : theme.textSecondary} />
              </Pressable>
              <Pressable
                onPress={() => setViewMode('grid')}
                style={[styles.viewToggleButton, viewMode === 'grid' && { backgroundColor: theme.tint }]}
              >
                <Ionicons name="grid" size={15} color={viewMode === 'grid' ? Brand.white : theme.textSecondary} />
              </Pressable>
            </View>
          </View>

          {filtered.length === 0 ? (
            <EmptyState message="No students match your search." icon="search-outline" />
          ) : viewMode === 'grid' ? (
            <View style={styles.studentGrid}>
              {filtered.map((s) => {
                const active = s.enrollment_status === 1;
                const editable = typeof s.id === 'string' && s.id.startsWith('reg-');
                return (
                  <Pressable
                    key={s.id}
                    disabled={!editable}
                    onPress={() =>
                      router.push({
                        pathname: '/teacher-student-review',
                        params: {
                          id: String(s.id).replace('reg-', ''),
                          name: s.name,
                          className: classLabel,
                          section: sectionLabel,
                          srn: s.srn ?? undefined,
                          phone: s.phone ?? undefined,
                          gender: s.gender ?? undefined,
                          rollNo: s.roll_no ?? undefined,
                          fatherName: s.father_name ?? undefined,
                          motherName: s.mother_name ?? undefined,
                          photoUrl: s.photo_url ?? undefined,
                          active: String(s.enrollment_status),
                        },
                      } as any)
                    }
                    style={styles.gridCard}
                  >
                    {s.photo_url ? (
                      <Image source={{ uri: s.photo_url }} style={styles.gridPhoto} contentFit="cover" />
                    ) : (
                      <View style={[styles.gridPhoto, styles.studentPhotoFallback, { backgroundColor: theme.backgroundSelected }]}>
                        <Ionicons name="person" size={26} color={theme.textSecondary} />
                      </View>
                    )}
                    <View style={[styles.statusDot, { backgroundColor: active ? '#2E7D32' : '#C62828' }]} />
                    <ThemedText type="small" numberOfLines={1} style={styles.gridName}>
                      {s.name}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                      {s.roll_no ? `Roll ${s.roll_no}` : '—'}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            filtered.map((s) => {
              const active = s.enrollment_status === 1;
              const editable = typeof s.id === 'string' && s.id.startsWith('reg-');
              const rowContent = (
                <Card style={styles.studentRow}>
                  {s.photo_url ? (
                    <Image source={{ uri: s.photo_url }} style={styles.studentPhoto} contentFit="cover" />
                  ) : (
                    <View style={[styles.studentPhoto, styles.studentPhotoFallback, { backgroundColor: theme.backgroundSelected }]}>
                      <Ionicons name="person" size={18} color={theme.textSecondary} />
                    </View>
                  )}
                  <View style={styles.studentInfo}>
                    <View style={styles.studentNameRow}>
                      <ThemedText type="smallBold" style={styles.studentNameText}>
                        {s.name}
                      </ThemedText>
                      <View style={[styles.statusTag, { backgroundColor: active ? '#DFF1E1' : '#FBE2E2' }]}>
                        <ThemedText type="small" style={{ color: active ? '#2E7D32' : '#C62828' }}>
                          {active ? 'Active' : 'Inactive'}
                        </ThemedText>
                      </View>
                    </View>
                    {s.father_name ? (
                      <ThemedText type="small" themeColor="textSecondary">
                        Father: {s.father_name}
                      </ThemedText>
                    ) : null}
                    <ThemedText type="small" themeColor="textSecondary">
                      {s.roll_no ? `Roll No. ${s.roll_no}` : 'No roll number'}
                      {s.phone ? ` · ${s.phone}` : ''}
                    </ThemedText>
                  </View>
                  {canAlert ? (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        setNotifyTarget({ ref: String(s.id), name: s.name });
                      }}
                      hitSlop={8}
                      style={styles.notifyBellButton}
                    >
                      <Ionicons name="notifications-outline" size={18} color={theme.tint} />
                    </Pressable>
                  ) : null}
                  <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
                </Card>
              );
              return (
                <Pressable
                  key={s.id}
                  onPress={() =>
                    router.push({
                      pathname: '/teacher-student-review',
                      params: {
                        id: String(s.id).replace('reg-', ''),
                        name: s.name,
                        className: classLabel,
                        section: sectionLabel,
                        rollNo: s.roll_no ?? undefined,
                        fatherName: s.father_name ?? undefined,
                        motherName: s.mother_name ?? undefined,
                        photoUrl: s.photo_url ?? undefined,
                        active: String(s.enrollment_status),
                      },
                    } as any)
                  }
                >
                  {rowContent}
                </Pressable>
              );
            })
          )}
        </>
      )}
    </>
  );
}

function formatDateHeader(dateStr: string): string {
  if (!dateStr || dateStr === 'All') return 'All Dates';
  try {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const dt = new Date(y, m, d);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[dt.getDay()]}, ${d < 10 ? '0' + d : d} ${months[m]} ${y}`;
  } catch {
    return dateStr;
  }
}

function HomeworkTab({ classId, sectionId }: { classId: number; sectionId?: number }) {
  const theme = useTheme();
  const router = useRouter();
  const today = new Date();
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('All');
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [homeworkDates, setHomeworkDates] = useState<string[]>([]);
  const [entries, setEntries] = useState<HomeworkEntry[]>([]);
  const [allEntries, setAllEntries] = useState<HomeworkEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [error, setError] = useState(false);
  const [detailEntry, setDetailEntry] = useState<HomeworkEntry | null>(null);

  // Matches the backend guard: today or a future date is still editable,
  // only a date that's already passed is locked.
  const isEditableDate = selectedDate >= todayStr();

  useEffect(() => {
    fetchHomeworkDates(classId, sectionId, viewYear, viewMonth)
      .then(setHomeworkDates)
      .catch(() => setHomeworkDates([]));
  }, [classId, sectionId, viewYear, viewMonth]);

  function loadEntries(date: string) {
    setLoadingEntries(true);
    setError(false);
    fetchHomeworkForDate(classId, sectionId, date)
      .then(setEntries)
      .catch(() => setError(true))
      .finally(() => setLoadingEntries(false));
  }

  function loadAllEntries() {
    setLoadingEntries(true);
    setError(false);
    fetchHomeworkForDate(classId, sectionId, 'all')
      .then(setAllEntries)
      .catch(() => setError(true))
      .finally(() => setLoadingEntries(false));
  }

  useEffect(() => {
    if (viewMode === 'calendar') {
      loadEntries(selectedDate);
    } else {
      loadAllEntries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, viewMode]);

  useFocusEffect(
    useCallback(() => {
      fetchHomeworkDates(classId, sectionId, viewYear, viewMonth)
        .then(setHomeworkDates)
        .catch(() => setHomeworkDates([]));
      if (viewMode === 'calendar') {
        loadEntries(selectedDate);
      } else {
        loadAllEntries();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [classId, sectionId, viewYear, viewMonth, selectedDate, viewMode])
  );

  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    allEntries.forEach((e) => {
      if (e.subject) set.add(e.subject.trim());
    });
    return ['All', ...Array.from(set).sort()];
  }, [allEntries]);

  const availableDates = useMemo(() => {
    const set = new Set<string>();
    allEntries.forEach((e) => {
      if (e.homework_date) set.add(e.homework_date);
    });
    return ['All', ...Array.from(set).sort((a, b) => b.localeCompare(a))];
  }, [allEntries]);

  const filteredList = useMemo(() => {
    return allEntries.filter((e) => {
      if (selectedSubject !== 'All' && e.subject.toLowerCase() !== selectedSubject.toLowerCase()) {
        return false;
      }
      if (selectedDateFilter !== 'All' && e.homework_date !== selectedDateFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          e.subject.toLowerCase().includes(q) ||
          (e.chapter && e.chapter.toLowerCase().includes(q)) ||
          e.homework_date.includes(q) ||
          (e.description && e.description.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [allEntries, selectedSubject, selectedDateFilter, searchQuery]);

  const groupedList = useMemo(() => {
    const map = new Map<string, HomeworkEntry[]>();
    filteredList.forEach((e) => {
      const key = e.homework_date;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(e);
    });

    const sortedDates = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));
    return sortedDates.map((date) => ({ date, items: map.get(date)! }));
  }, [filteredList]);

  function confirmDelete(entry: HomeworkEntry) {
    Alert.alert('Delete homework?', `"${entry.subject}" will be permanently removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteHomework(entry.id)
            .then(() => {
              if (viewMode === 'calendar') loadEntries(selectedDate);
              else loadAllEntries();
            })
            .catch((e) => Alert.alert('Could not delete', e instanceof Error ? e.message : 'Please try again.'));
        },
      },
    ]);
  }

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
    <>
      {/* View Toggle Bar */}
      <View style={[styles.viewToggleContainer, { backgroundColor: theme.backgroundElement }]}>
        <Pressable
          onPress={() => setViewMode('calendar')}
          style={[
            styles.viewToggleButton,
            viewMode === 'calendar' && { backgroundColor: theme.surface },
          ]}
        >
          <Ionicons name="calendar-outline" size={16} color={viewMode === 'calendar' ? theme.tint : theme.textSecondary} />
          <ThemedText
            type="smallBold"
            style={{ color: viewMode === 'calendar' ? theme.tint : theme.textSecondary }}
          >
            Calendar View
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={() => setViewMode('list')}
          style={[
            styles.viewToggleButton,
            viewMode === 'list' && { backgroundColor: theme.surface },
          ]}
        >
          <Ionicons name="list-outline" size={16} color={viewMode === 'list' ? theme.tint : theme.textSecondary} />
          <ThemedText
            type="smallBold"
            style={{ color: viewMode === 'list' ? theme.tint : theme.textSecondary }}
          >
            List View
          </ThemedText>
        </Pressable>
      </View>

      {viewMode === 'calendar' ? (
        <>
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
            <ThemedText type="smallBold">Homework — {selectedDate}</ThemedText>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/teacher-homework-add',
                  params: { classId: String(classId), sectionId: sectionId ? String(sectionId) : '', date: selectedDate },
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
              <Pressable key={entry.id} onPress={() => setDetailEntry(entry)}>
                <Card style={styles.entryCard}>
                  <View style={styles.entryHeader}>
                    <View style={styles.badgeRow}>
                      <View style={[styles.subjectBadge, { backgroundColor: theme.tint }]}>
                        <ThemedText type="smallBold" style={{ color: Brand.white, fontSize: 12 }}>
                          {entry.subject}
                        </ThemedText>
                      </View>
                      {entry.chapter ? (
                        <View style={[styles.chapterBadge, { backgroundColor: theme.accent + '22', borderColor: theme.accent, borderWidth: 1 }]}>
                          <ThemedText type="smallBold" style={{ color: theme.accent, fontSize: 12 }}>
                            {entry.chapter}
                          </ThemedText>
                        </View>
                      ) : null}
                    </View>
                    {isEditableDate ? (
                      <View style={styles.entryActions}>
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            router.push({
                              pathname: '/teacher-homework-add',
                              params: {
                                classId: String(classId),
                                sectionId: sectionId ? String(sectionId) : '',
                                date: selectedDate,
                                homeworkId: String(entry.id),
                                initialSubject: entry.subject,
                                initialChapter: entry.chapter ?? '',
                                initialDescription: entry.description ?? '',
                                existingPhotos: entry.attachments.map((a) => a.photo_url).join('|'),
                              },
                            });
                          }}
                          hitSlop={8}
                          style={styles.entryActionButton}
                        >
                          <Ionicons name="create-outline" size={16} color={theme.tint} />
                        </Pressable>
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            confirmDelete(entry);
                          }}
                          hitSlop={8}
                          style={styles.entryActionButton}
                        >
                          <Ionicons name="trash-outline" size={16} color={Brand.red} />
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
                      {entry.attachments.slice(0, 4).map((att, i) => (
                        <Image key={i} source={{ uri: att.photo_url }} style={styles.attachmentThumb} contentFit="cover" />
                      ))}
                      {entry.attachments.length > 4 ? (
                        <View style={[styles.attachmentThumb, styles.attachmentMore, { backgroundColor: theme.backgroundSelected }]}>
                          <ThemedText type="small" themeColor="textSecondary">
                            +{entry.attachments.length - 4}
                          </ThemedText>
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </Card>
              </Pressable>
            ))
          )}
        </>
      ) : (
        /* Teacher List View */
        <>
          <View style={styles.listHeaderRow}>
            <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border, flex: 1 }]}>
              <Ionicons name="search-outline" size={18} color={theme.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by subject or chapter..."
                placeholderTextColor={theme.textSecondary}
                style={[styles.searchInput, { color: theme.text, outlineStyle: 'none' } as any]}
              />
              {searchQuery ? (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
                </Pressable>
              ) : null}
            </View>

            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/teacher-homework-add',
                  params: { classId: String(classId), sectionId: sectionId ? String(sectionId) : '', date: todayStr() },
                })
              }
              style={[styles.addButton, { backgroundColor: theme.tint, marginLeft: Spacing.two, marginBottom: Spacing.four }]}
            >
              <Ionicons name="add" size={18} color={Brand.white} />
            </Pressable>
          </View>

          {/* Filters Section */}
          {allEntries.length > 0 ? (
            <View style={styles.filterSection}>
              {availableSubjects.length > 2 ? (
                <>
                  <ThemedText type="smallBold" themeColor="textSecondary" style={styles.filterLabel}>
                    SUBJECT:
                  </ThemedText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                    {availableSubjects.map((subj) => {
                      const active = selectedSubject === subj;
                      return (
                        <Pressable
                          key={subj}
                          onPress={() => setSelectedSubject(subj)}
                          style={[
                            styles.filterPill,
                            active
                              ? { backgroundColor: theme.tint, borderColor: theme.tint }
                              : { backgroundColor: theme.surface, borderColor: theme.border },
                          ]}
                        >
                          <ThemedText
                            type="smallBold"
                            style={{ color: active ? Brand.white : theme.text, fontSize: 12 }}
                          >
                            {subj}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </>
              ) : null}

              {availableDates.length > 2 ? (
                <>
                  <ThemedText type="smallBold" themeColor="textSecondary" style={styles.filterLabel}>
                    DATE:
                  </ThemedText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                    {availableDates.map((dateVal) => {
                      const active = selectedDateFilter === dateVal;
                      return (
                        <Pressable
                          key={dateVal}
                          onPress={() => setSelectedDateFilter(dateVal)}
                          style={[
                            styles.filterPill,
                            active
                              ? { backgroundColor: theme.accent, borderColor: theme.accent }
                              : { backgroundColor: theme.surface, borderColor: theme.border },
                          ]}
                        >
                          <ThemedText
                            type="smallBold"
                            style={{ color: active ? Brand.white : theme.text, fontSize: 12 }}
                          >
                            {formatDateHeader(dateVal)}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </>
              ) : null}
            </View>
          ) : null}

          {loadingEntries ? (
            <Loading label="Loading homework list…" />
          ) : error ? (
            <ErrorState message="Could not load homework." onRetry={loadAllEntries} />
          ) : groupedList.length === 0 ? (
            <EmptyState
              message={
                searchQuery || selectedSubject !== 'All' || selectedDateFilter !== 'All'
                  ? 'No matching homework found.'
                  : 'No homework assigned yet.'
              }
              icon="book-outline"
            />
          ) : (
            groupedList.map((group) => (
              <View key={group.date} style={styles.dateGroupWrap}>
                <View style={styles.dateGroupHeader}>
                  <View style={[styles.dateGroupBadge, { backgroundColor: theme.backgroundSelected }]}>
                    <Ionicons name="calendar-outline" size={14} color={theme.tint} />
                    <ThemedText type="smallBold" style={{ color: theme.tint, marginLeft: 6 }}>
                      {formatDateHeader(group.date)}
                    </ThemedText>
                  </View>
                  <ThemedText type="small" themeColor="textSecondary">
                    {group.items.length} {group.items.length === 1 ? 'homework' : 'homeworks'}
                  </ThemedText>
                </View>

                {group.items.map((entry) => {
                  const canEditThis = entry.homework_date >= todayStr();
                  return (
                    <Pressable key={entry.id} onPress={() => setDetailEntry(entry)}>
                      <Card style={styles.entryCard}>
                        <View style={styles.entryHeader}>
                          <View style={styles.badgeRow}>
                            <View style={[styles.subjectBadge, { backgroundColor: theme.tint }]}>
                              <ThemedText type="smallBold" style={{ color: Brand.white, fontSize: 12 }}>
                                {entry.subject}
                              </ThemedText>
                            </View>
                            {entry.chapter ? (
                              <View style={[styles.chapterBadge, { backgroundColor: theme.accent + '22', borderColor: theme.accent, borderWidth: 1 }]}>
                                <ThemedText type="smallBold" style={{ color: theme.accent, fontSize: 12 }}>
                                  {entry.chapter}
                                </ThemedText>
                              </View>
                            ) : null}
                          </View>
                          {canEditThis ? (
                            <View style={styles.entryActions}>
                              <Pressable
                                onPress={(e) => {
                                  e.stopPropagation();
                                  router.push({
                                    pathname: '/teacher-homework-add',
                                    params: {
                                      classId: String(classId),
                                      sectionId: sectionId ? String(sectionId) : '',
                                      date: entry.homework_date,
                                      homeworkId: String(entry.id),
                                      initialSubject: entry.subject,
                                      initialChapter: entry.chapter ?? '',
                                      initialDescription: entry.description ?? '',
                                      existingPhotos: entry.attachments.map((a) => a.photo_url).join('|'),
                                    },
                                  });
                                }}
                                hitSlop={8}
                                style={styles.entryActionButton}
                              >
                                <Ionicons name="create-outline" size={16} color={theme.tint} />
                              </Pressable>
                              <Pressable
                                onPress={(e) => {
                                  e.stopPropagation();
                                  confirmDelete(entry);
                                }}
                                hitSlop={8}
                                style={styles.entryActionButton}
                              >
                                <Ionicons name="trash-outline" size={16} color={Brand.red} />
                              </Pressable>
                            </View>
                          ) : null}
                        </View>
                        {entry.description ? (
                          <ThemedText type="small" themeColor="textSecondary" style={styles.entryDescription} numberOfLines={3}>
                            {entry.description}
                          </ThemedText>
                        ) : null}
                        {entry.attachments.length > 0 ? (
                          <View style={styles.attachmentRow}>
                            {entry.attachments.slice(0, 4).map((att, i) => (
                              <Image key={i} source={{ uri: att.photo_url }} style={styles.attachmentThumb} contentFit="cover" />
                            ))}
                            {entry.attachments.length > 4 ? (
                              <View style={[styles.attachmentThumb, styles.attachmentMore, { backgroundColor: theme.backgroundSelected }]}>
                                <ThemedText type="small" themeColor="textSecondary">
                                  +{entry.attachments.length - 4}
                                </ThemedText>
                              </View>
                            ) : null}
                          </View>
                        ) : null}
                      </Card>
                    </Pressable>
                  );
                })}
              </View>
            ))
          )}
        </>
      )}

      {detailEntry ? (
        <HomeworkDetailModal
          visible
          onClose={() => setDetailEntry(null)}
          subject={detailEntry.subject}
          chapter={detailEntry.chapter}
          date={detailEntry.homework_date}
          description={detailEntry.description}
          photoUrls={detailEntry.attachments.map((a) => a.photo_url)}
          teacherName={detailEntry.teacher_name}
        />
      ) : null}
    </>
  );
}

interface TeacherQuickLink {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  bg: string;
  fg: string;
  route: string;
  permKey?: keyof NonNullable<TeacherProfile['permissions']>;
}

const TEACHER_QUICK_LINKS: TeacherQuickLink[] = [
  { label: 'Students', icon: 'people-outline', bg: '#E0F2FE', fg: '#0284C7', route: '/teacher-students' },
  { label: 'Homework', icon: 'book-outline', bg: '#E0E7FF', fg: '#4338CA', route: '/teacher-homework', permKey: 'homework' },
  { label: 'Attendance', icon: 'checkmark-done-outline', bg: '#DFF1E1', fg: '#2E7D32', route: '/teacher-attendance', permKey: 'attendance' },
  { label: 'Subjects', icon: 'library-outline', bg: '#FEF3C7', fg: '#D97706', route: '/teacher-subjects' },
  { label: 'Promotion', icon: 'trending-up-outline', bg: '#FCE7F3', fg: '#DB2777', route: '/teacher-promote' },
  { label: 'Syllabus', icon: 'document-text-outline', bg: '#CCFBF1', fg: '#0D9488', route: '/syllabus' },
  { label: 'Leaves', icon: 'calendar-clear-outline', bg: '#FBEFD3', fg: '#B8860B', route: '/teacher-leaves', permKey: 'leave' },
  { label: 'Fees', icon: 'cash-outline', bg: '#FBE2E2', fg: '#C62828', route: '/teacher-fees', permKey: 'fees' },
  { label: 'Notices', icon: 'megaphone-outline', bg: '#E3EEFD', fg: '#2E6FBE', route: '/teacher-notices', permKey: 'notices' },
  { label: 'Events', icon: 'calendar-outline', bg: '#EDE3FD', fg: '#6A3EBE', route: '/teacher-events', permKey: 'events' },
  { label: 'Export', icon: 'download-outline', bg: '#E7E7E7', fg: '#444B54', route: '/teacher-export' },
];

/** Teacher-side counterpart to the student dashboard's Quick Links grid —
 * same visual pattern, filtered by the teacher's per-section permissions
 * (see 10-teacher-app.md's "Per-teacher section permissions"), so a link
 * that's hidden from the role menu is hidden here too. */
function TeacherQuickLinks({ permissions }: { permissions?: TeacherProfile['permissions'] }) {
  const router = useRouter();
  const links = TEACHER_QUICK_LINKS.filter((l) => !l.permKey || permissions?.[l.permKey] !== false);

  if (links.length === 0) return null;

  return (
    <>
      <ThemedText type="smallBold" style={quickLinkStyles.sectionTitle}>
        Quick Links
      </ThemedText>
      <View style={quickLinkStyles.grid}>
        {links.map((link) => (
          <Pressable key={link.route} style={quickLinkStyles.tileWrap} onPress={() => router.push(link.route as any)}>
            <Card style={quickLinkStyles.tile}>
              <View style={[quickLinkStyles.iconCircle, { backgroundColor: link.bg }]}>
                <Ionicons name={link.icon} size={22} color={link.fg} />
              </View>
              <ThemedText type="small" style={quickLinkStyles.tileLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                {link.label}
              </ThemedText>
            </Card>
          </Pressable>
        ))}
      </View>
    </>
  );
}

const quickLinkStyles = StyleSheet.create({
  sectionTitle: {
    marginTop: Spacing.one,
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

export default function TeacherDashboardScreen() {
  const router = useRouter();
  const { profile, checking, loggedIn } = useTeacherAuth();
  const [classId, setClassId] = useState<string | null>(null);
  const theme = useTheme();
  const [sessionLabel, setSessionLabel] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetchCurrentAcademicYear()
      .then((r) => setSessionLabel(r.label))
      .catch(() => {});
  }, []);

  const classes = profile?.classes ?? [];

  useEffect(() => {
    if (classes.length > 0 && !classId) {
      setClassId(String(classes[0].class_id));
    }
  }, [classes, classId]);

  useEffect(() => {
    if (!loggedIn) return;
    getFcmPushToken()
      .then((token) => {
        if (token) registerTeacherPushToken(token);
      })
      .catch(() => {});
  }, [loggedIn]);

  useFocusEffect(
    useCallback(() => {
      if (checking) return;
      if (!loggedIn) {
        router.replace('/teacher-login');
      }
    }, [checking, loggedIn])
  );

  if (checking || !loggedIn || !profile) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading teacher dashboard…" />
      </Screen>
    );
  }

  const classOptions = classes.map((c) => ({
    label: `${c.class_name}${c.section_name ? ` - ${c.section_name}` : ''}`,
    value: String(c.class_id),
  }));

  const currentLabel = classOptions.find((c) => c.value === classId)?.label;

  return (
    <Screen>
      <ProfileHeaderBar
        icon="briefcase"
        name={profile?.name ?? 'Teacher'}
        contact={profile?.email ?? null}
        subtitle={currentLabel}
        sessionLabel={sessionLabel}
        menu={[]}
      />

      {classes.length > 0 ? (
        <SelectField label="Class" placeholder="Select class" value={classId} options={classOptions} onChange={setClassId} />
      ) : null}

      <TeacherQuickLinks permissions={profile?.permissions} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  toolbarRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
    marginBottom: Spacing.three,
  },
  addStudentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.three,
    borderRadius: Radius.pill,
  },
  addStudentButtonLabel: {
    color: Brand.white,
  },
  notifyClassButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
  },
  notifyBellButton: {
    marginRight: Spacing.two,
  },
  tabRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: Radius.pill,
    padding: 4,
    marginBottom: Spacing.four,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two + 2,
    borderRadius: Radius.pill,
  },
  pendingSection: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
    marginBottom: Spacing.four,
  },
  pendingTitle: {
    marginBottom: Spacing.two,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  pendingInfo: {
    flex: 1,
    gap: 2,
  },
  activateButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
  activateButtonLabel: {
    color: Brand.white,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    marginBottom: Spacing.three,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  countRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  viewToggle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  viewToggleButton: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 5,
  },
  studentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  gridCard: {
    width: '30%',
    alignItems: 'center',
    gap: 2,
  },
  gridPhoto: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: Spacing.one,
  },
  statusDot: {
    position: 'absolute',
    top: 0,
    right: '30%',
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  gridName: {
    fontWeight: '700',
    textAlign: 'center',
  },
  rosterCount: {
    letterSpacing: 0.5,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  studentPhoto: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  studentPhotoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentInfo: {
    flex: 1,
    gap: 2,
  },
  studentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  studentNameText: {
    flexShrink: 1,
  },
  statusTag: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
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
  entryActions: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  entryActionButton: {
    padding: 2,
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
  attachmentMore: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewToggleContainer: {
    flexDirection: 'row',
    borderRadius: Radius.pill,
    padding: 3,
    marginBottom: Spacing.three,
  },
  viewToggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three + 2,
    paddingVertical: Spacing.two,
    marginBottom: Spacing.four,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  subjectBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  chapterBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  filterSection: {
    marginBottom: Spacing.four,
    gap: Spacing.one,
  },
  filterLabel: {
    fontSize: 11,
    letterSpacing: 0.5,
    marginTop: Spacing.one,
  },
  filterScroll: {
    flexDirection: 'row',
    paddingVertical: Spacing.one,
  },
  filterPill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 1,
    borderRadius: Radius.pill,
    borderWidth: 1,
    marginRight: Spacing.two,
  },
  dateGroupWrap: {
    marginBottom: Spacing.four,
  },
  dateGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  dateGroupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.pill,
  },
});
