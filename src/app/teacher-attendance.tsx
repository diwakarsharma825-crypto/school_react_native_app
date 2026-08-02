import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AvatarFgPalette, AvatarPalette, Brand, Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { Screen } from '@/components/ui/Screen';
import { SelectField } from '@/components/ui/SelectField';
import { EmptyState, ErrorState, Loading } from '@/components/ui/states';
import { ThemedText } from '@/components/ui/ThemedText';
import { AttendanceStatus, AttendanceStudent, fetchAttendance, saveAttendance } from '@/data/teacher-api';
import { TeacherGuard } from '@/components/ui/TeacherGuard';
import { useTeacherAuth } from '@/hooks/use-teacher-auth';
import { useTheme } from '@/hooks/use-theme';
import { useSectionEnabled } from '@/hooks/use-sections';
import { SectionUnavailable } from '@/components/ui/SectionUnavailable';

function pad(n: number) {
  return n < 10 ? `0${n}` : String(n);
}
function todayStr() {
  const t = new Date();
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
}

const STATUS_META: Record<AttendanceStatus, { label: string; color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  P: { label: 'Present', color: '#2E7D32', bg: '#DFF1E1', icon: 'checkmark-circle' },
  A: { label: 'Absent', color: '#C62828', bg: '#FBE2E2', icon: 'close-circle' },
  L: { label: 'Leave', color: '#B8860B', bg: '#FBEFD3', icon: 'moon' },
};

export default function TeacherAttendanceScreen() {
  const theme = useTheme();
  const { profile } = useTeacherAuth();
  const enabled = useSectionEnabled('attendance');

  const classes = profile?.classes ?? [];
  const classOptions = classes.map((c) => ({
    label: `${c.class_name}${c.section_name ? ` - ${c.section_name}` : ''}`,
    value: String(c.class_id),
  }));

  const [classId, setClassId] = useState<string | null>(classOptions[0]?.value ?? null);
  const [date, setDate] = useState(todayStr());
  const [students, setStudents] = useState<AttendanceStudent[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);

  const selected = classes.find((c) => String(c.class_id) === classId);

  function load() {
    if (!classId) return;
    setLoading(true);
    setError(false);
    fetchAttendance(Number(classId), selected?.section_id ?? undefined, date)
      .then(setStudents)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(load, [classId, date]);

  function setStatus(id: string, status: AttendanceStatus) {
    setStudents((prev) => (prev ? prev.map((s) => (s.id === id ? { ...s, status } : s)) : prev));
  }

  function setRemarks(id: string, remarks: string) {
    setStudents((prev) => (prev ? prev.map((s) => (s.id === id ? { ...s, remarks } : s)) : prev));
  }

  const counts = useMemo(() => {
    const c = { P: 0, A: 0, L: 0, unmarked: 0 };
    (students ?? []).forEach((s) => {
      if (s.status) c[s.status]++;
      else c.unmarked++;
    });
    return c;
  }, [students]);

  function markAll(status: AttendanceStatus) {
    setStudents((prev) => (prev ? prev.map((s) => ({ ...s, status })) : prev));
  }

  async function handleSave() {
    if (!students || !classId) return;
    const marked = students.filter((s) => s.status);
    const unmarked = students.filter((s) => !s.status);
    if (marked.length === 0) {
      Alert.alert('Nothing to save', 'Mark at least one student first.');
      return;
    }
    // Only insist on a fully-marked roster for today — a past date is
    // often being corrected (one student's status fixed, say), and a
    // roster that's grown since then can never be "fully marked" for that
    // old date in the first place. Save whatever's marked either way.
    if (unmarked.length > 0 && date === todayStr()) {
      Alert.alert(
        'Some students aren’t marked',
        `${unmarked.length} student${unmarked.length === 1 ? '' : 's'} still need a status. Mark everyone before saving, or continue to save just the rest.`,
        [
          { text: 'Keep marking', style: 'cancel' },
          { text: 'Save anyway', onPress: () => doSave(marked) },
        ]
      );
      return;
    }
    doSave(marked);
  }

  async function doSave(marked: AttendanceStudent[]) {
    if (!classId) return;
    setSaving(true);
    try {
      await saveAttendance(
        Number(classId),
        selected?.section_id ?? undefined,
        date,
        marked.map((s) => ({ studentRef: s.id, status: s.status!, remarks: s.remarks ?? undefined }))
      );
      Alert.alert('Saved', 'Attendance has been saved.');
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (!enabled) return <SectionUnavailable />;

  return (
    <TeacherGuard>
    <Screen>
      <SelectField label="Class" placeholder="Select class" value={classId} options={classOptions} onChange={setClassId} />
      <DatePickerField label="Date" placeholder="Select date" value={date} onChange={setDate} minDate="2000-01-01" maxDate={todayStr()} />

      {students && students.length > 0 ? (
        <View style={styles.markAllRow}>
          {(['P', 'A', 'L'] as AttendanceStatus[]).map((s) => (
            <Pressable
              key={s}
              onPress={() => markAll(s)}
              style={[styles.markAllChip, { borderColor: STATUS_META[s].color, backgroundColor: STATUS_META[s].bg }]}
            >
              <Ionicons name={STATUS_META[s].icon} size={15} color={STATUS_META[s].color} />
              <ThemedText type="small" style={{ color: STATUS_META[s].color }}>
                All {STATUS_META[s].label}
              </ThemedText>
              <View style={[styles.markAllCount, { backgroundColor: STATUS_META[s].color }]}>
                <ThemedText type="small" style={styles.markAllCountLabel}>
                  {counts[s]}
                </ThemedText>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}

      {loading ? (
        <Loading label="Loading roster…" />
      ) : error ? (
        <ErrorState message="Could not load attendance." onRetry={load} />
      ) : !students || students.length === 0 ? (
        <EmptyState message="No students in this class yet." icon="people-outline" />
      ) : (
        students.map((s, i) => (
          <Card key={s.id} style={styles.studentCard}>
            <View style={styles.studentRow}>
              {s.photo_url ? (
                <Image source={{ uri: s.photo_url }} style={styles.avatar} contentFit="cover" />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: AvatarPalette[i % AvatarPalette.length] }]}>
                  <Ionicons name="person" size={18} color={AvatarFgPalette[i % AvatarFgPalette.length]} />
                </View>
              )}
              <View style={styles.studentInfo}>
                <ThemedText type="smallBold" numberOfLines={1}>
                  {s.name}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {s.roll_no ? `Roll No. ${s.roll_no}` : 'No roll number'}
                </ThemedText>
              </View>
            </View>

            <View style={styles.statusRow}>
              {(['P', 'A', 'L'] as AttendanceStatus[]).map((status) => {
                const meta = STATUS_META[status];
                const active = s.status === status;
                return (
                  <Pressable
                    key={status}
                    onPress={() => setStatus(s.id, status)}
                    style={[
                      styles.statusButton,
                      { borderColor: active ? meta.color : theme.border },
                      active && { backgroundColor: meta.bg },
                    ]}
                  >
                    <Ionicons name={meta.icon} size={16} color={active ? meta.color : theme.textSecondary} />
                    <ThemedText type="small" style={active ? { color: meta.color, fontWeight: '700' } : { color: theme.textSecondary }}>
                      {meta.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>

            {s.status && s.status !== 'P' ? (
              <TextInput
                value={s.remarks ?? ''}
                onChangeText={(v) => setRemarks(s.id, v)}
                placeholder="Remarks (optional)"
                placeholderTextColor={theme.textSecondary}
                style={[styles.remarksInput, { borderColor: theme.border, color: theme.text }]}
              />
            ) : null}
          </Card>
        ))
      )}

      {students && students.length > 0 ? (
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveButton, { backgroundColor: theme.tint, opacity: saving ? 0.6 : 1 }]}
        >
          <ThemedText type="smallBold" style={styles.saveButtonLabel}>
            {saving ? 'Saving…' : 'Save Attendance'}
          </ThemedText>
        </Pressable>
      ) : null}
    </Screen>
    </TeacherGuard>
  );
}

const styles = StyleSheet.create({
  markAllRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  markAllChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  markAllCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  markAllCountLabel: {
    color: Brand.white,
    fontWeight: '700',
    fontSize: 11,
  },
  studentCard: {
    marginTop: Spacing.three,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentInfo: {
    flex: 1,
    gap: 2,
  },
  statusRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.two + 2,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
  remarksInput: {
    marginTop: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    fontSize: 14,
  },
  saveButton: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Radius.pill,
    marginTop: Spacing.four,
    marginBottom: Spacing.five,
  },
  saveButtonLabel: {
    color: Brand.white,
  },
});
