import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AvatarFgPalette, AvatarPalette, Brand, Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { Screen } from '@/components/ui/Screen';
import { SelectField } from '@/components/ui/SelectField';
import { EmptyState, ErrorState, Loading } from '@/components/ui/states';
import { ThemedText } from '@/components/ui/ThemedText';
import { AttendanceStatus, AttendanceStudent, fetchAttendance, getSavedSelectedClassId, saveAttendance, saveSelectedClassId } from '@/data/teacher-api';
import { TeacherGuard } from '@/components/ui/TeacherGuard';
import { useTeacherAuth } from '@/hooks/use-teacher-auth';
import { useTheme } from '@/hooks/use-theme';
import { useSectionEnabled } from '@/hooks/use-sections';
import { SectionUnavailable } from '@/components/ui/SectionUnavailable';
import { ExportPdfButton } from '@/components/ui/ExportPdfButton';
import { exportToPdf } from '@/lib/pdf-export';

function pad(n: number) {
  return n < 10 ? `0${n}` : String(n);
}
function todayStr() {
  const t = new Date();
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
}

const STATUS_META: Record<AttendanceStatus, {
  label: string;
  color: string;
  darkColor: string;
  bg: string;
  darkBg: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = {
  P: { label: 'Present', color: '#15803D', darkColor: '#4ADE80', bg: '#DCFCE7', darkBg: 'rgba(22, 101, 52, 0.35)', icon: 'checkmark-circle' },
  A: { label: 'Absent', color: '#B91C1C', darkColor: '#F87171', bg: '#FEE2E2', darkBg: 'rgba(153, 27, 27, 0.35)', icon: 'close-circle' },
  L: { label: 'Leave', color: '#B45309', darkColor: '#FBBF24', bg: '#FEF3C7', darkBg: 'rgba(146, 64, 14, 0.35)', icon: 'moon' },
};

export default function TeacherAttendanceScreen() {
  const theme = useTheme();
  const { profile } = useTeacherAuth();
  const enabled = useSectionEnabled('attendance');
  const { classId: paramClassId } = useLocalSearchParams<{ classId?: string }>();

  const classes = profile?.classes ?? [];
  const classOptions = classes.map((c) => ({
    label: `${c.class_name}${c.section_name ? ` - ${c.section_name}` : ''}`,
    value: String(c.class_id),
  }));

  const [classId, setClassId] = useState<string | null>(paramClassId ?? null);

  useEffect(() => {
    if (!classId) {
      getSavedSelectedClassId().then((saved) => {
        if (saved && classes.some((c) => String(c.class_id) === saved)) {
          setClassId(saved);
        } else if (classOptions[0]?.value) {
          setClassId(classOptions[0].value);
        }
      });
    }
  }, [classes, classId]);

  function handleClassChange(val: string | null) {
    setClassId(val);
    if (val) saveSelectedClassId(val);
  }
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
      .then((data) => {
        const activeOnly = data.filter((s) => s.enrollment_status !== 0);
        setStudents(activeOnly);
      })
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
    const res = { P: 0, A: 0, L: 0 };
    if (students) {
      students.forEach((s) => {
        if (s.status && s.status in res) res[s.status as AttendanceStatus]++;
      });
    }
    return res;
  }, [students]);

  function markAll(status: AttendanceStatus) {
    setStudents((prev) => (prev ? prev.map((s) => ({ ...s, status })) : prev));
  }

  async function handleSave() {
    if (!classId || !students) return;
    setSaving(true);
    try {
      await saveAttendance(
        Number(classId),
        selected?.section_id ?? undefined,
        date,
        students.map((s) => ({ studentRef: s.id, status: s.status!, remarks: s.remarks ?? undefined }))
      );
      Alert.alert('Saved', 'Attendance has been recorded.');
      load();
    } catch (e) {
      Alert.alert('Error', 'Could not save attendance.');
    } finally {
      setSaving(false);
    }
  }

  if (enabled === false) return <SectionUnavailable />;

  return (
    <TeacherGuard>
    <Screen scroll>
      <SelectField label="Class" placeholder="Select class" value={classId} options={classOptions} onChange={handleClassChange} />
      <DatePickerField label="Date" placeholder="Select date" value={date} onChange={setDate} minDate="2000-01-01" disableSundays={true} />

      {students && students.length > 0 ? (
        <View style={{ marginTop: Spacing.two, marginBottom: Spacing.two }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.two }}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={{ letterSpacing: 0.5 }}>
              MARK ALL STUDENTS
            </ThemedText>
            <ExportPdfButton
              variant="outline"
              style={{ borderRadius: Radius.md, paddingVertical: 6, paddingHorizontal: 12 }}
              onPress={() => {
                if (!students || students.length === 0) return;
                exportToPdf({
                  title: `Class Attendance Sheet - ${selected?.class_name ?? ''}${selected?.section_name ? ` (${selected.section_name})` : ''}`,
                  subtitle: `Date: ${date} | Present: ${counts.P} | Absent: ${counts.A} | Leave: ${counts.L}`,
                  columns: [
                    { header: 'Roll No', key: 'roll_no', width: '20%' },
                    { header: 'Student Name', key: 'name', width: '40%' },
                    { header: 'Status', key: 'statusLabel', width: '20%' },
                    { header: 'Remarks', key: 'remarks', width: '20%' },
                  ],
                  rows: students.map((s) => ({
                    ...s,
                    statusLabel: STATUS_META[s.status!]?.label ?? s.status ?? 'Not Marked',
                  })),
                });
              }}
            />
          </View>

          <View style={[styles.markAllRow, { marginTop: 0 }]}>
            {(['P', 'A', 'L'] as AttendanceStatus[]).map((s) => {
              const meta = STATUS_META[s];
              const textColor = theme.dark ? '#FFFFFF' : meta.color;
              const badgeColor = theme.dark ? meta.darkColor : meta.color;
              const borderColor = theme.dark ? meta.darkColor : meta.color;
              const bgColor = theme.dark ? meta.darkBg : meta.bg;

              return (
                <Pressable
                  key={s}
                  onPress={() => markAll(s)}
                  style={({ pressed }) => [
                    styles.markAllChip,
                    {
                      borderColor,
                      backgroundColor: bgColor,
                      opacity: pressed ? 0.75 : 1,
                      transform: [{ scale: pressed ? 0.97 : 1 }],
                    },
                  ]}
                >
                  <Ionicons name={meta.icon} size={16} color={badgeColor} />
                  <ThemedText type="smallBold" style={{ color: textColor, fontSize: 12 }}>
                    All {meta.label}
                  </ThemedText>
                  <View style={[styles.markAllCount, { backgroundColor: badgeColor }]}>
                    <ThemedText type="smallBold" style={styles.markAllCountLabel}>
                      {counts[s]}
                    </ThemedText>
                  </View>
                </Pressable>
              );
            })}
          </View>
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
