import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

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
  fetchHomeworkSubmissions,
  getSavedSelectedClassId,
  HomeworkEntry,
  saveSelectedClassId,
} from '@/data/teacher-api';
import { SectionUnavailable } from '@/components/ui/SectionUnavailable';
import { useSectionEnabled } from '@/hooks/use-sections';
import { useTeacherAuth } from '@/hooks/use-teacher-auth';
import { useTheme } from '@/hooks/use-theme';
import { ExportPdfButton } from '@/components/ui/ExportPdfButton';
import { exportHomeworkToPdf, exportToPdf } from '@/lib/pdf-export';
import { TeacherReviewModal } from '@/components/ui/TeacherReviewModal';

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
  const enabled = useSectionEnabled('homework');
  const canReview = useSectionEnabled('homework_submission');

  if (!enabled) return <SectionUnavailable />;

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
  const [reviewSubmissionItem, setReviewSubmissionItem] = useState<any | null>(null);
  const [activeHomeworkSubmissions, setActiveHomeworkSubmissions] = useState<{ homeworkId: number; items: any[] } | null>(null);
  const [failedAvatarIds, setFailedAvatarIds] = useState<Record<number, boolean>>({});
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  async function handleOpenSubmissions(homeworkId: number) {
    setLoadingSubmissions(true);
    try {
      const subs = await fetchHomeworkSubmissions(homeworkId, profile?.token || undefined);
      setActiveHomeworkSubmissions({ homeworkId, items: subs });
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not fetch submissions.');
    } finally {
      setLoadingSubmissions(false);
    }
  }

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
                    <ThemedText type="smallBold" style={{ color: theme.dark ? '#F8FAFC' : theme.text }}>{entry.subject}</ThemedText>
                    {selectedClassObj ? (
                      <View style={[styles.classBadge, { backgroundColor: theme.dark ? 'rgba(56,189,248,0.15)' : '#EFF6FF', borderColor: theme.dark ? '#38BDF8' : 'transparent', borderWidth: theme.dark ? 1 : 0 }]}>
                        <ThemedText type="small" style={{ color: theme.dark ? '#38BDF8' : '#0284C7', fontSize: 11, fontWeight: '700' }}>
                          {selectedClassObj.class_name}{selectedClassObj.section_name ? ` - ${selectedClassObj.section_name}` : ''}
                        </ThemedText>
                      </View>
                    ) : null}
                  </View>
                  {entry.chapter ? (
                    <ThemedText type="small" style={{ marginTop: 2, color: theme.dark ? '#CBD5E1' : theme.textSecondary }}>
                      {entry.chapter}
                    </ThemedText>
                  ) : null}
                </View>

                {/* Edit & Delete are strictly hidden if not the current day! */}
                {isCurrentDay ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
                    <Pressable onPress={() => handleEdit(entry)} hitSlop={8}>
                      <Ionicons name="create-outline" size={18} color={theme.dark ? '#38BDF8' : theme.tint} />
                    </Pressable>
                    <Pressable onPress={() => handleDelete(entry)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </Pressable>
                  </View>
                ) : null}
              </View>

              {entry.description ? (
                <ThemedText type="small" style={[styles.entryDescription, { color: theme.dark ? '#E2E8F0' : theme.textSecondary }]} numberOfLines={2}>
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

              {/* Action Buttons: View Details AND Student Submissions & Reviews */}
              <View style={{ marginTop: Spacing.two, paddingTop: Spacing.two, borderTopWidth: 1, borderTopColor: theme.border, flexDirection: 'row', gap: Spacing.two, alignItems: 'center' }}>
                <Pressable
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    paddingVertical: 8,
                    paddingHorizontal: 8,
                    borderRadius: Radius.pill,
                    borderWidth: 1,
                    borderColor: theme.border,
                    backgroundColor: theme.surface,
                  }}
                  onPress={(e) => {
                    e.stopPropagation();
                    setDetailEntry(entry);
                  }}
                >
                  <Ionicons name="eye-outline" size={15} color={theme.text} />
                  <ThemedText style={{ fontSize: 11, fontWeight: '700', color: theme.text }} numberOfLines={1}>
                    View Details
                  </ThemedText>
                </Pressable>

                {canReview ? (
                  <Pressable
                    style={{
                      flex: 1.2,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      paddingVertical: 8,
                      paddingHorizontal: 8,
                      borderRadius: Radius.pill,
                      backgroundColor: theme.dark ? '#334155' : '#E2E8F0',
                    }}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleOpenSubmissions(entry.id);
                    }}
                  >
                    <Ionicons name="people-outline" size={15} color={theme.text} />
                    <ThemedText style={{ fontSize: 11, fontWeight: '700', color: theme.text }} numberOfLines={1}>
                      Submissions &amp; Reviews
                    </ThemedText>
                  </Pressable>
                ) : null}
              </View>
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
          description={detailEntry.description}
          photoUrls={detailEntry.attachments.map((a) => a.photo_url)}
          teacherName={profile?.name ?? undefined}
        />
      ) : null}

      {/* Submissions List Modal */}
      {activeHomeworkSubmissions && !reviewSubmissionItem ? (
        <Modal
          visible={!!activeHomeworkSubmissions && !reviewSubmissionItem}
          animationType="fade"
          transparent
          onRequestClose={() => setActiveHomeworkSubmissions(null)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: Spacing.md,
              ...(Platform.OS === 'web'
                ? ({
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 99999,
                    width: '100vw',
                    height: '100vh',
                  } as any)
                : {}),
            }}
          >
            <View
              style={{
                width: '100%',
                maxWidth: 520,
                maxHeight: '88%',
                backgroundColor: theme.surface,
                borderRadius: Radius.lg,
                borderWidth: 1,
                borderColor: theme.border,
                overflow: 'hidden',
                elevation: 24,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.35,
                shadowRadius: 16,
              }}
            >
              {/* Modal Header Banner */}
              <View
                style={{
                  backgroundColor: theme.tint,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                }}
              >
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', lineHeight: 20 }}>
                    Student Submissions ({activeHomeworkSubmissions.items.length})
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 3, lineHeight: 16 }}>
                    Review and grade completed student homework
                  </Text>
                </View>
                <Pressable
                  onPress={() => setActiveHomeworkSubmissions(null)}
                  hitSlop={8}
                  style={({ pressed }) => [{ padding: 4 }, pressed && { opacity: 0.7 }]}
                >
                  <Ionicons name="close-circle" size={26} color="#FFFFFF" />
                </Pressable>
              </View>

              <View style={{ padding: Spacing.md, flex: 1 }}>
                {activeHomeworkSubmissions.items.length === 0 ? (
                  <EmptyState message="No student submissions received for this homework yet." icon="document-text-outline" />
                ) : (
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 8 }}>
                    {activeHomeworkSubmissions.items.map((sub: any) => {
                      const rawPhoto = sub.student_photo;
                      const hasPhotoFailed = failedAvatarIds[sub.id];
                      const photoUrl = (rawPhoto && !hasPhotoFailed && rawPhoto !== 'null' && rawPhoto !== 'undefined')
                        ? (rawPhoto.startsWith('http') ? rawPhoto : `https://testing.saarthakgimsss12a.org/${rawPhoto.replace(/^\//, '')}`)
                        : null;

                      const initials = (sub.student_name || 'Student')
                        .split(' ')
                        .filter(Boolean)
                        .map((n: string) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2) || 'ST';

                      return (
                        <Card key={sub.id} style={{ padding: Spacing.md, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                              {photoUrl ? (
                                <Image
                                  source={{ uri: photoUrl }}
                                  onError={() => setFailedAvatarIds((prev) => ({ ...prev, [sub.id]: true }))}
                                  style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: theme.border }}
                                  contentFit="cover"
                                />
                              ) : (
                                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: theme.tint, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border }}>
                                  <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>
                                    {initials}
                                  </Text>
                                </View>
                              )}

                            <View>
                              <ThemedText type="smallBold" style={{ fontSize: 14 }}>
                                {sub.student_name || `Student SRN: ${sub.student_srn}`}
                              </ThemedText>
                              <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11 }}>
                                SRN: {sub.student_srn}
                              </ThemedText>
                            </View>
                          </View>

                          <View
                            style={{
                              backgroundColor: sub.status === 'reviewed' ? '#C6F6D5' : '#FEFCBF',
                              paddingHorizontal: 10,
                              paddingVertical: 4,
                              borderRadius: 12,
                            }}
                          >
                            <ThemedText style={{ color: sub.status === 'reviewed' ? '#22543D' : '#744210', fontSize: 10, fontWeight: '700' }}>
                              {sub.status === 'reviewed' ? `✓ ${sub.rating || 'Reviewed'}` : '⏳ Pending Review'}
                            </ThemedText>
                          </View>
                        </View>

                        {sub.description ? (
                          <View style={{ marginTop: 8, padding: 10, borderRadius: Radius.sm, backgroundColor: theme.dark ? '#1E293B' : '#F8FAFC', borderWidth: 1, borderColor: theme.border }}>
                            <ThemedText type="small" style={{ fontSize: 12, color: theme.text }}>
                              <ThemedText style={{ fontWeight: '700' }}>Student Note: </ThemedText>
                              {sub.description}
                            </ThemedText>
                          </View>
                        ) : null}

                        {sub.photos && sub.photos.length > 0 ? (
                          <View style={{ marginTop: 8 }}>
                            <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11, marginBottom: 4, fontWeight: '600' }}>
                              Attached Homework Photos ({sub.photos.length}) — Tap photo to expand:
                            </ThemedText>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                              {sub.photos.map((p: string, idx: number) => (
                                <Pressable key={idx} onPress={() => setPreviewPhotoUrl(p)}>
                                  <Image source={{ uri: p }} style={{ width: 75, height: 75, borderRadius: Radius.sm, borderWidth: 1, borderColor: theme.border }} contentFit="cover" />
                                </Pressable>
                              ))}
                            </ScrollView>
                          </View>
                        ) : null}

                        {/* Prominent Grade & Review Button */}
                        <Pressable
                          style={{
                            marginTop: 12,
                            backgroundColor: theme.tint,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            paddingVertical: 10,
                            paddingHorizontal: 16,
                            borderRadius: Radius.pill,
                          }}
                          onPress={() => setReviewSubmissionItem(sub)}
                        >
                          <Ionicons name={sub.status === 'reviewed' ? 'create-outline' : 'star-outline'} size={16} color="#FFFFFF" />
                          <ThemedText style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>
                            {sub.status === 'reviewed' ? 'Edit Review / Grade' : '⭐ Grade & Add Rating'}
                          </ThemedText>
                        </Pressable>
                      </Card>
                    );
                  })}
                </ScrollView>
              )}
              </View>
            </View>
          </View>
        </Modal>
      ) : null}

      {/* Full-Screen Image Preview Modal for Submissions */}
      {previewPhotoUrl ? (
        <Modal visible={!!previewPhotoUrl} transparent animationType="fade" onRequestClose={() => setPreviewPhotoUrl(null)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
            <Pressable style={{ position: 'absolute', top: 40, right: 20, zIndex: 10 }} onPress={() => setPreviewPhotoUrl(null)}>
              <Ionicons name="close-circle" size={36} color="#FFFFFF" />
            </Pressable>
            <Image source={{ uri: previewPhotoUrl }} style={{ width: '100%', height: '80%' }} contentFit="contain" />
          </View>
        </Modal>
      ) : null}

      {/* Review Submission Modal */}
      {reviewSubmissionItem ? (
        <TeacherReviewModal
          visible={!!reviewSubmissionItem}
          onClose={() => setReviewSubmissionItem(null)}
          submission={reviewSubmissionItem}
          teacherToken={profile?.token || ''}
          onSuccess={() => {
            if (activeHomeworkSubmissions?.homeworkId) {
              handleOpenSubmissions(activeHomeworkSubmissions.homeworkId);
            }
          }}
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
