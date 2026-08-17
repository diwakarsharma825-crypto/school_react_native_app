import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { Screen } from '@/components/ui/Screen';
import { SectionUnavailable } from '@/components/ui/SectionUnavailable';
import { SelectField } from '@/components/ui/SelectField';
import { TeacherGuard } from '@/components/ui/TeacherGuard';
import { ThemedText } from '@/components/ui/ThemedText';
import {
  exportAttendance,
  exportHomework,
  fetchTeacherFeeInvoices,
  fetchTeacherLeaveApplications,
  fetchTeacherNotices,
  fetchTeacherStudents,
} from '@/data/teacher-api';
import { useTeacherAuth } from '@/hooks/use-teacher-auth';
import { useTheme } from '@/hooks/use-theme';
import { useSectionEnabled } from '@/hooks/use-sections';
import { exportToPdf } from '@/lib/pdf-export';

type ExportKind = 'homework' | 'attendance' | 'notices' | 'leaves' | 'fees' | 'roster';
type ExportFormat = 'pdf' | 'csv';

function pad(n: number) {
  return n < 10 ? `0${n}` : String(n);
}
function todayStr() {
  const t = new Date();
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
}
function daysAgoStr(n: number) {
  const t = new Date();
  t.setDate(t.getDate() - n);
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
}

const SECTIONS: { key: ExportKind; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'homework', label: 'Homework', icon: 'book' },
  { key: 'attendance', label: 'Attendance', icon: 'checkmark-done' },
  { key: 'notices', label: 'Notices', icon: 'megaphone' },
  { key: 'leaves', label: 'Leaves', icon: 'calendar-clear' },
  { key: 'fees', label: 'Fees', icon: 'cash' },
  { key: 'roster', label: 'Roster', icon: 'people' },
];

export default function TeacherExportScreen() {
  const theme = useTheme();
  const { profile } = useTeacherAuth();

  const classes = profile?.classes ?? [];
  const classOptions = classes.map((c) => ({
    label: `${c.class_name}${c.section_name ? ` - ${c.section_name}` : ''}`,
    value: String(c.class_id),
  }));

  const [classId, setClassId] = useState<string | null>(classOptions[0]?.value ?? null);
  const [kind, setKind] = useState<ExportKind>('homework');
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [dateFrom, setDateFrom] = useState(daysAgoStr(30));
  const [dateTo, setDateTo] = useState(todayStr());
  const [studentId, setStudentId] = useState<string | null>(null);
  const [rosterStudents, setRosterStudents] = useState<RosterStudent[]>([]);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!classId) return;
    const selected = classes.find((c) => String(c.class_id) === classId);
    fetchTeacherStudents(Number(classId), selected?.section_id ?? undefined)
      .then(setRosterStudents)
      .catch(() => setRosterStudents([]));
    setStudentId(null);
  }, [classId]);

  const studentOptions = [
    { label: 'All Students', value: '' },
    ...rosterStudents.map((s) => ({
      label: `${s.name}${s.roll_no ? ` (Roll ${s.roll_no})` : ''}${s.srn ? ` [SRN ${s.srn}]` : ''}`,
      value: String(s.id),
    })),
  ];

  async function handleExport() {
    if (!classId && (kind === 'homework' || kind === 'attendance' || kind === 'leaves' || kind === 'fees' || kind === 'roster')) {
      setError('Please choose a class.');
      return;
    }
    if (dateFrom > dateTo) {
      setError('Start date must be before the end date.');
      return;
    }
    setExporting(true);
    setError(null);
    try {
      const selected = classes.find((c) => String(c.class_id) === classId);
      const classIdNum = Number(classId);
      const sectionIdNum = selected?.section_id;
      const targetStudent = rosterStudents.find((s) => String(s.id) === studentId);

      if (kind === 'homework') {
        const params = { classId: classIdNum, sectionId: sectionIdNum ?? undefined, dateFrom, dateTo, format };
        const { uri } = await exportHomework(params);
        await shareFile(uri, 'Homework Report', format);
      } else if (kind === 'attendance') {
        const params = { classId: classIdNum, sectionId: sectionIdNum ?? undefined, dateFrom, dateTo, format };
        const { uri } = await exportAttendance(params);
        await shareFile(uri, 'Attendance Report', format);
      } else if (kind === 'notices') {
        const notices = await fetchTeacherNotices();
        await exportToPdf({
          title: 'Notices & Announcements Database Report',
          subtitle: `Total Notices: ${notices.length}`,
          columns: [
            { header: 'Date', key: 'date', width: '20%' },
            { header: 'Title', key: 'title', width: '30%' },
            { header: 'Notice Body', key: 'notice', width: '40%' },
            { header: 'Status', key: 'statusLabel', width: '10%' },
          ],
          rows: notices.map((n) => ({
            ...n,
            statusLabel: Number(n.is_view_on_web) === 1 ? 'Active' : 'Inactive',
          })),
        });
      } else if (kind === 'leaves') {
        const leaves = await fetchTeacherLeaveApplications(classIdNum, sectionIdNum ?? undefined);
        let filtered = leaves.filter((l) => l.date_from >= dateFrom && l.date_from <= dateTo);
        if (targetStudent) {
          filtered = filtered.filter(
            (l) =>
              l.student_name.toLowerCase() === targetStudent.name.toLowerCase() ||
              l.student_srn === targetStudent.srn
          );
        }
        await exportToPdf({
          title: `Class Student Leaves Report - ${selected?.class_name ?? ''}${selected?.section_name ? ` (${selected.section_name})` : ''}`,
          subtitle: `Date Range: ${dateFrom} to ${dateTo}${targetStudent ? ` | Student: ${targetStudent.name}` : ''} | Total: ${filtered.length}`,
          columns: [
            { header: 'Student Name', key: 'student_name', width: '25%' },
            { header: 'SRN', key: 'student_srn', width: '15%' },
            { header: 'Leave Type', key: 'leave_type', width: '15%' },
            { header: 'From - To', key: 'dates', width: '20%' },
            { header: 'Reason', key: 'reason', width: '15%' },
            { header: 'Status', key: 'status', width: '10%' },
          ],
          rows: filtered.map((l) => ({ ...l, dates: `${l.date_from} to ${l.date_to}` })),
        });
      } else if (kind === 'fees') {
        const fees = await fetchTeacherFeeInvoices(classIdNum, sectionIdNum ?? undefined, undefined, undefined, dateFrom, dateTo);
        let filteredFees = fees;
        if (targetStudent) {
          filteredFees = fees.filter(
            (f) =>
              f.student_name?.toLowerCase() === targetStudent.name.toLowerCase() ||
              (f as any).student_srn === targetStudent.srn ||
              f.student_roll_no === targetStudent.roll_no
          );
        }
        await exportToPdf({
          title: `Fee Dues & Statements - ${selected?.class_name ?? ''}${selected?.section_name ? ` (${selected.section_name})` : ''}`,
          subtitle: `Date Range: ${dateFrom} to ${dateTo}${targetStudent ? ` | Student: ${targetStudent.name}` : ''} | Total Records: ${filteredFees.length}`,
          columns: [
            { header: 'Student Name', key: 'student_name', width: '25%' },
            { header: 'Title', key: 'title', width: '25%' },
            { header: 'Amount', key: 'amountLabel', width: '15%' },
            { header: 'Due Date', key: 'due_date', width: '20%' },
            { header: 'Status', key: 'status', width: '15%' },
          ],
          rows: filteredFees.map((f) => ({ ...f, amountLabel: `₹${f.amount}` })),
        });
      } else if (kind === 'roster') {
        const roster = await fetchTeacherStudents(classIdNum, sectionIdNum ?? undefined);
        let filteredRoster = roster;
        if (targetStudent) {
          filteredRoster = roster.filter((s) => String(s.id) === String(targetStudent.id));
        }
        const images = filteredRoster.map((s) => s.photo_url).filter(Boolean) as string[];
        await exportToPdf({
          title: `Class Student Roster - ${selected?.class_name ?? ''}${selected?.section_name ? ` (${selected.section_name})` : ''}`,
          subtitle: `Total Enrolled Students: ${filteredRoster.length}${targetStudent ? ` | Student: ${targetStudent.name}` : ''}`,
          columns: [
            { header: 'Roll No', key: 'roll_no', width: '15%' },
            { header: 'Student Name', key: 'name', width: '30%' },
            { header: 'SRN', key: 'srn', width: '15%' },
            { header: 'Father Name', key: 'father_name', width: '25%' },
            { header: 'Phone', key: 'phone', width: '15%' },
          ],
          rows: filteredRoster,
          images,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not export database records.');
    } finally {
      setExporting(false);
    }
  }

  async function shareFile(uri: string, title: string, fmt: ExportFormat) {
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: fmt === 'pdf' ? 'application/pdf' : 'text/csv',
        dialogTitle: `Share ${title}`,
      });
    } else {
      Alert.alert('Export ready', `Saved to ${uri}`);
    }
  }

  return (
    <TeacherGuard>
      <Screen>
        <View style={[styles.hero, { backgroundColor: theme.tint }]}>
          <View style={styles.heroIcon}>
            <Ionicons name="download-outline" size={18} color={Brand.white} />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="smallBold" style={styles.heroTitle}>
              Section Database Exporter
            </ThemedText>
            <ThemedText type="small" style={styles.heroSubtitle} numberOfLines={1}>
              Select any section to export database records (PDF / CSV).
            </ThemedText>
          </View>
        </View>

        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
          SELECT SECTION TO EXPORT
        </ThemedText>

        <View style={styles.kindGrid}>
          {SECTIONS.map((sec) => {
            const isSelected = kind === sec.key;
            return (
              <Pressable
                key={sec.key}
                onPress={() => setKind(sec.key)}
                style={[
                  styles.kindCard,
                  { borderColor: theme.border },
                  isSelected && { borderColor: theme.tint, backgroundColor: theme.backgroundSelected },
                ]}
              >
                <View style={[styles.kindIcon, { backgroundColor: isSelected ? theme.tint : theme.backgroundElement }]}>
                  <Ionicons name={sec.icon} size={18} color={isSelected ? Brand.white : theme.textSecondary} />
                </View>
                <ThemedText type="smallBold">{sec.label}</ThemedText>
              </Pressable>
            );
          })}
        </View>

        <Card style={styles.card}>
          <SelectField label="Class" placeholder="Select class" value={classId} options={classOptions} onChange={setClassId} />

          <SelectField
            label="Student (Optional)"
            placeholder="All Students"
            value={studentId ?? ''}
            options={studentOptions}
            onChange={(v) => setStudentId(v || null)}
            searchable
          />

          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <DatePickerField
                label="From"
                placeholder="Start date"
                value={dateFrom}
                onChange={setDateFrom}
                minDate="2000-01-01"
                maxDate={todayStr()}
              />
            </View>
            <View style={styles.dateField}>
              <DatePickerField
                label="To"
                placeholder="End date"
                value={dateTo}
                onChange={setDateTo}
                minDate={dateFrom}
                maxDate={todayStr()}
              />
            </View>
          </View>

          <ThemedText type="smallBold" style={styles.fieldLabel}>
            Format
          </ThemedText>
          <View style={styles.formatRow}>
            <Pressable
              onPress={() => setFormat('pdf')}
              style={[
                styles.formatChip,
                { borderColor: theme.border },
                format === 'pdf' && { borderColor: Brand.red, backgroundColor: 'rgba(198,40,40,0.08)' },
              ]}
            >
              <Ionicons name="document-text" size={18} color={format === 'pdf' ? Brand.red : theme.textSecondary} />
              <ThemedText type="smallBold" style={format === 'pdf' ? { color: Brand.red } : undefined}>
                PDF
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setFormat('csv')}
              style={[
                styles.formatChip,
                { borderColor: theme.border },
                format === 'csv' && { borderColor: Brand.green, backgroundColor: 'rgba(46,125,50,0.08)' },
              ]}
            >
              <Ionicons name="grid" size={18} color={format === 'csv' ? Brand.green : theme.textSecondary} />
              <ThemedText type="smallBold" style={format === 'csv' ? { color: Brand.green } : undefined}>
                Excel (CSV)
              </ThemedText>
            </Pressable>
          </View>

          {error ? (
            <ThemedText type="small" style={styles.error}>
              {error}
            </ThemedText>
          ) : null}

          <Pressable
            onPress={handleExport}
            disabled={exporting}
            style={[styles.exportButton, { backgroundColor: theme.tint, opacity: exporting ? 0.6 : 1 }]}
          >
            <Ionicons name="share-outline" size={18} color={Brand.white} />
            <ThemedText type="smallBold" style={styles.exportButtonLabel}>
              {exporting ? 'Fetching Data & Exporting…' : 'Export & Share Records'}
            </ThemedText>
          </Pressable>
        </Card>
      </Screen>
    </TeacherGuard>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    marginBottom: Spacing.two,
  },
  heroIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    color: Brand.white,
    fontSize: 15,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
  },
  sectionLabel: {
    marginBottom: Spacing.two,
    letterSpacing: 0.5,
  },
  kindGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  kindCard: {
    width: '31%',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.one,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
  kindIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    marginBottom: Spacing.five,
  },
  dateRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  dateField: {
    flex: 1,
  },
  fieldLabel: {
    marginBottom: Spacing.two,
    marginTop: Spacing.three,
  },
  formatRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  formatChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
  },
  error: {
    color: Brand.red,
    marginTop: Spacing.three,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Radius.pill,
    marginTop: Spacing.four,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    marginBottom: Spacing.three,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  exportButtonLabel: {
    color: Brand.white,
  },
});
