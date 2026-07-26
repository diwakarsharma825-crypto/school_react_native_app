import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { SelectField } from '@/components/ui/SelectField';
import { EmptyState, ErrorState, Loading } from '@/components/ui/states';
import { ThemedText } from '@/components/ui/ThemedText';
import { fetchHomeworkDates, fetchHomeworkForDate, HomeworkEntry } from '@/data/homework-api';
import { getHomeworkAccess, HomeworkAccess, saveHomeworkAccess } from '@/lib/homework-access';
import { useTheme } from '@/hooks/use-theme';

const CLASS_OPTIONS = [
  { label: 'Pre-Nursery', value: 'Pre-Nursery' },
  { label: 'Nursery', value: 'Nursery' },
  { label: 'LKG', value: 'LKG' },
  { label: 'UKG', value: 'UKG' },
  ...Array.from({ length: 12 }, (_, i) => {
    const n = String(i + 1);
    return { label: `Class ${n}`, value: n };
  }),
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function pad(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

function AccessForm({ onDone }: { onDone: (access: HomeworkAccess) => void }) {
  const theme = useTheme();
  const [className, setClassName] = useState<string | null>(null);
  const [section, setSection] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    if (!className || phone.trim().length !== 10 || !password) {
      setError('Please fill in your class, a 10-digit phone number, and a password.');
      return;
    }
    const access: HomeworkAccess = { className, section: section.trim(), phone: phone.trim(), password };
    await saveHomeworkAccess(access);
    onDone(access);
  }

  return (
    <Card>
      <ThemedText type="subtitle" style={styles.formTitle}>
        A few details
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.formSubtitle}>
        Saved on this device so you only need to do this once — until the app is uninstalled.
      </ThemedText>

      <SelectField label="Class" placeholder="Select class" value={className} options={CLASS_OPTIONS} onChange={setClassName} />

      <ThemedText type="smallBold" style={styles.fieldLabel}>
        Section
      </ThemedText>
      <TextInput
        value={section}
        onChangeText={setSection}
        placeholder="e.g. A (optional)"
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { borderColor: theme.border, color: theme.text }]}
      />

      <ThemedText type="smallBold" style={styles.fieldLabel}>
        Mobile Number
      </ThemedText>
      <TextInput
        value={phone}
        onChangeText={(v) => setPhone(v.replace(/\D/g, '').slice(0, 10))}
        keyboardType="number-pad"
        placeholder="10-digit mobile number"
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { borderColor: theme.border, color: theme.text }]}
      />

      <ThemedText type="smallBold" style={styles.fieldLabel}>
        Password
      </ThemedText>
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Choose a password"
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { borderColor: theme.border, color: theme.text }]}
      />

      {error ? (
        <ThemedText type="small" style={styles.error}>
          {error}
        </ThemedText>
      ) : null}

      <Pressable onPress={handleContinue} style={[styles.button, { backgroundColor: theme.tint }]}>
        <ThemedText type="smallBold" style={styles.buttonLabel}>
          Continue
        </ThemedText>
      </Pressable>
    </Card>
  );
}

function HomeworkCalendar({ access }: { access: HomeworkAccess }) {
  const theme = useTheme();
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
          <Card key={entry.id} style={styles.entryCard}>
            <ThemedText type="smallBold">{entry.subject}</ThemedText>
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
    </>
  );
}

export default function HomeworkScreen() {
  const [access, setAccess] = useState<HomeworkAccess | null | undefined>(undefined);

  useEffect(() => {
    getHomeworkAccess().then(setAccess);
  }, []);

  if (access === undefined) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading…" />
      </Screen>
    );
  }

  return <Screen>{access ? <HomeworkCalendar access={access} /> : <AccessForm onDone={setAccess} />}</Screen>;
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
