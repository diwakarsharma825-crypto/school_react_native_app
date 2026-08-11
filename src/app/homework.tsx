import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { HomeworkDetailModal } from '@/components/ui/HomeworkDetailModal';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { ProfileHeaderBar } from '@/components/ui/ProfileHeaderBar';
import { ChildSwitcherCard } from '@/components/ui/ChildSwitcherCard';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, Loading } from '@/components/ui/states';
import { ThemedText } from '@/components/ui/ThemedText';
import { fetchCurrentAcademicYear } from '@/data/api';
import { registerDevice } from '@/data/app-status';
import { fetchHomeworkDates, fetchHomeworkForDate, HomeworkEntry, registerStudentPushToken, studentLogin } from '@/data/homework-api';
import { teacherLogout } from '@/data/teacher-api';
import { useStudentAuth } from '@/hooks/use-student-auth';
import { useTeacherAuth } from '@/hooks/use-teacher-auth';
import { getFcmPushToken } from '@/lib/notifications';
import { clearHomeworkAccess, HomeworkAccess, saveHomeworkChildren } from '@/lib/homework-access';
import { getCurrentDeviceLocation, requestAppPermissions } from '@/lib/permissions';
import { useBrand } from '@/hooks/use-brand';
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

function AccessForm({ onDone }: { onDone: () => void }) {
  const theme = useTheme();
  const router = useRouter();
  const { setLoggedIn: setTeacherLoggedIn } = useTeacherAuth();
  const { refresh: refreshStudentAuth } = useStudentAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function requestStudentPermissions(identifierValue: string, name?: string, className?: string, section?: string) {
    await requestAppPermissions().catch(() => null);
    const location = await getCurrentDeviceLocation().catch(() => null);
    const pushToken = await getFcmPushToken().catch(() => null);

    registerDevice({
      userType: 'student',
      fullName: name,
      studentClass: className,
      section,
      phone: identifierValue,
      pushToken,
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
    }).catch(() => {});

    if (pushToken) {
      registerStudentPushToken(identifierValue, pushToken).catch(() => {});
    }
  }

  async function handleLogin() {
    if (!identifier.trim() || !password) {
      setError('Please enter your SRN or mobile number, and your password.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const results = await studentLogin(identifier.trim(), password);
      const children: HomeworkAccess[] = results.map((result) => ({
        name: result.name,
        srn: result.srn,
        className: result.class,
        section: result.section,
        phone: result.phone,
        gender: result.gender,
        dob: result.dob,
        photoUrl: result.photo_url,
      }));
      await teacherLogout().catch(() => {});
      setTeacherLoggedIn(false);
      await saveHomeworkChildren(children);
      await refreshStudentAuth();
      onDone();
      requestStudentPermissions(
        identifier.trim(),
        children[0]?.name,
        children[0]?.className,
        children[0]?.section
      ).catch(() => {});
      router.replace('/student-dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  }

  const brand = useBrand();
  const [imgError, setImgError] = useState(false);
  const logoSource = !imgError && brand.logoUrl ? { uri: brand.logoUrl } : defaultLogo;
  const displayTitle = brand.appTitle || 'Saarthak GIMSSS';

  return (
    <Card>
      <View style={styles.brandHeader}>
        <Image
          source={logoSource}
          onError={() => setImgError(true)}
          style={styles.brandLogo}
          contentFit="contain"
        />
        <ThemedText type="smallBold" style={styles.brandTitle} numberOfLines={1}>
          {displayTitle}
        </ThemedText>
      </View>
      <ThemedText type="subtitle" style={styles.formTitle}>
        Student Login
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.formSubtitle}>
        Use your SRN or mobile number and the password your school gave you. Saved on this
        device so you only need to do this once — until the app is uninstalled.
      </ThemedText>

      <ThemedText type="smallBold" style={styles.fieldLabel}>
        SRN or Mobile Number
      </ThemedText>
      <TextInput
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
        placeholder="SRN or mobile number"
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { borderColor: theme.border, color: theme.text }]}
      />

      <ThemedText type="smallBold" style={styles.fieldLabel}>
        Password
      </ThemedText>
      <PasswordInput value={password} onChangeText={setPassword} placeholder="Password" />

      {error ? (
        <ThemedText type="small" style={styles.error}>
          {error}
        </ThemedText>
      ) : null}

      <Pressable
        onPress={handleLogin}
        disabled={submitting}
        style={[styles.button, { backgroundColor: theme.tint, opacity: submitting ? 0.6 : 1 }]}
      >
        <ThemedText type="smallBold" style={styles.buttonLabel}>
          {submitting ? 'Logging in…' : 'Log In'}
        </ThemedText>
      </Pressable>
    </Card>
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

function HomeworkCalendar({ access, onLogout }: { access: HomeworkAccess; onLogout: () => void }) {
  const theme = useTheme();
  const { allChildren, switchChild } = useStudentAuth();
  const today = new Date();
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('All');
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(
    `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
  );
  const [homeworkDates, setHomeworkDates] = useState<string[]>([]);
  const [entries, setEntries] = useState<HomeworkEntry[]>([]);
  const [allEntries, setAllEntries] = useState<HomeworkEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [error, setError] = useState(false);
  const [detailEntry, setDetailEntry] = useState<HomeworkEntry | null>(null);
  const [sessionLabel, setSessionLabel] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetchCurrentAcademicYear()
      .then((r) => setSessionLabel(r.label))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchHomeworkDates(access.className, access.section || undefined, viewYear, viewMonth)
      .then(setHomeworkDates)
      .catch(() => setHomeworkDates([]));
  }, [access, viewYear, viewMonth]);

  function loadEntries(date: string) {
    setLoadingEntries(true);
    setError(false);
    fetchHomeworkForDate(access.className, access.section || undefined, date)
      .then(setEntries)
      .catch(() => setError(true))
      .finally(() => setLoadingEntries(false));
  }

  function loadAllEntries() {
    setLoadingEntries(true);
    setError(false);
    fetchHomeworkForDate(access.className, access.section || undefined, 'all')
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
          (e.description && e.description.toLowerCase().includes(q)) ||
          (e.teacher_name && e.teacher_name.toLowerCase().includes(q));
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
      {allChildren.length > 1 ? (
        <ChildSwitcherCard siblings={allChildren} activeSrn={access.srn} onSwitch={switchChild} sessionLabel={sessionLabel} />
      ) : (
        <ProfileHeaderBar
          icon="school"
          name={access.name}
          photoUrl={access.photoUrl}
          contact={access.phone || undefined}
          subtitle={`${/\bclass\b/i.test(access.className) ? access.className : `Class ${access.className}`}${
            access.section ? ` - ${access.section}` : ''
          } · SRN ${access.srn}`}
          sessionLabel={sessionLabel}
          menu={[]}
        />
      )}

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

          <ThemedText type="smallBold" style={styles.entriesTitle}>
            Homework — {selectedDate}
          </ThemedText>

          {loadingEntries ? (
            <Loading label="Loading…" />
          ) : error ? (
            <ErrorState message="Could not load homework." onRetry={() => loadEntries(selectedDate)} />
          ) : entries.length === 0 ? (
            <EmptyState message="No homework for this date." icon="book-outline" />
          ) : (
            entries.map((entry) => (
              <Pressable key={entry.id} onPress={() => setDetailEntry(entry)}>
                <Card style={styles.entryCard}>
                  <View style={styles.entryHeaderRow}>
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

                  {entry.teacher_name ? (
                    <ThemedText type="small" themeColor="textSecondary" style={styles.entryTeacher}>
                      Assigned by {entry.teacher_name}
                    </ThemedText>
                  ) : null}
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
        </>
      ) : (
        /* List View */
        <>
          <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
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

                {group.items.map((entry) => (
                  <Pressable key={entry.id} onPress={() => setDetailEntry(entry)}>
                    <Card style={styles.entryCard}>
                      <View style={styles.entryHeaderRow}>
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

                      {entry.teacher_name ? (
                        <ThemedText type="small" themeColor="textSecondary" style={styles.entryTeacher}>
                          Assigned by {entry.teacher_name}
                        </ThemedText>
                      ) : null}
                      {entry.description ? (
                        <ThemedText type="small" themeColor="textSecondary" style={styles.entryDescription} numberOfLines={3}>
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
                ))}
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

export default function HomeworkScreen() {
  const { checking, access, setAccess, refresh } = useStudentAuth();
  const enabled = useSectionEnabled('homework');

  if (!enabled) return <SectionUnavailable />;

  if (checking) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading…" />
      </Screen>
    );
  }

  return (
    <Screen>
      {access ? (
        <HomeworkCalendar
          access={access}
          onLogout={() => {
            clearHomeworkAccess();
            setAccess(null);
          }}
        />
      ) : (
        <AccessForm onDone={refresh} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  formTitle: {
    marginBottom: Spacing.one,
  },
  formSubtitle: {
    marginBottom: Spacing.three,
  },
  fieldLabel: {
    marginBottom: Spacing.one,
    marginTop: Spacing.three,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two + 2,
    fontSize: 16,
  },
  error: {
    color: Brand.red,
    marginTop: Spacing.three,
  },
  button: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Radius.pill,
    marginTop: Spacing.four,
  },
  buttonLabel: {
    color: Brand.white,
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
  entriesTitle: {
    marginBottom: Spacing.three,
  },
  entryCard: {
    marginBottom: Spacing.three,
  },
  entryTeacher: {
    marginTop: 2,
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
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  brandLogo: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
  },
  brandTitle: {
    fontSize: 16,
    flex: 1,
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
  entryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.one,
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
    marginLeft: 'auto',
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
