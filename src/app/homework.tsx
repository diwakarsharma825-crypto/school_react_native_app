import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

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
import { fetchHomeworkDates, fetchHomeworkForDate, HomeworkEntry, registerStudentPushToken, studentLogin } from '@/data/homework-api';
import { teacherLogout } from '@/data/teacher-api';
import { useStudentAuth } from '@/hooks/use-student-auth';
import { useTeacherAuth } from '@/hooks/use-teacher-auth';
import { getFcmPushToken } from '@/lib/notifications';
import { clearHomeworkAccess, HomeworkAccess, saveHomeworkChildren } from '@/lib/homework-access';
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
  const { setLoggedIn: setTeacherLoggedIn } = useTeacherAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    if (!identifier.trim() || !password) {
      setError('Please enter your SRN or mobile number, and your password.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      // One login can return several sibling children sharing this
      // phone+password — all get saved, the app defaults to the first and
      // lets the parent/student switch later without re-entering anything.
      const results = await studentLogin(identifier.trim(), password);
      const children: HomeworkAccess[] = results.map((result) => ({
        name: result.name,
        srn: result.srn,
        className: result.class,
        section: result.section,
        phone: result.phone,
        gender: result.gender,
        photoUrl: result.photo_url,
      }));
      // Only one identity is "active" on this device at a time — logging
      // in as a student clears any teacher session, same reasoning as the
      // reverse on the teacher login screen.
      await teacherLogout().catch(() => {});
      setTeacherLoggedIn(false);
      await saveHomeworkChildren(children);
      onDone();
      const pushToken = await getFcmPushToken();
      if (pushToken) registerStudentPushToken(identifier.trim(), pushToken).catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
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

function HomeworkCalendar({ access, onLogout }: { access: HomeworkAccess; onLogout: () => void }) {
  const theme = useTheme();
  const { allChildren, switchChild } = useStudentAuth();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(
    `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
  );
  const [homeworkDates, setHomeworkDates] = useState<string[]>([]);
  const [entries, setEntries] = useState<HomeworkEntry[]>([]);
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
    <>
      {/* No menu here — Change Password/Log out now live under the More
          tab's Account section, so a second menu here was redundant. */}
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
              <ThemedText type="smallBold">{entry.subject}</ThemedText>
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

      {detailEntry ? (
        <HomeworkDetailModal
          visible
          onClose={() => setDetailEntry(null)}
          subject={detailEntry.subject}
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
});
