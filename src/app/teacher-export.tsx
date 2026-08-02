import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { Screen } from '@/components/ui/Screen';
import { SelectField } from '@/components/ui/SelectField';
import { TeacherGuard } from '@/components/ui/TeacherGuard';
import { ThemedText } from '@/components/ui/ThemedText';
import { exportAttendance, exportHomework } from '@/data/teacher-api';
import { useTeacherAuth } from '@/hooks/use-teacher-auth';
import { useTheme } from '@/hooks/use-theme';

type ExportKind = 'homework' | 'attendance';
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
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    if (!classId) {
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
      const params = {
        classId: Number(classId),
        sectionId: selected?.section_id ?? undefined,
        dateFrom,
        dateTo,
        format,
      };
      const { uri } = kind === 'homework' ? await exportHomework(params) : await exportAttendance(params);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: format === 'pdf' ? 'application/pdf' : 'text/csv',
          dialogTitle: kind === 'homework' ? 'Share Homework Export' : 'Share Attendance Export',
        });
      } else {
        Alert.alert('Export ready', `Saved to ${uri}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not export.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <TeacherGuard>
      <Screen>
        <View style={[styles.hero, { backgroundColor: theme.tint }]}>
          <View style={styles.heroIcon}>
            <Ionicons name="download-outline" size={26} color={Brand.white} />
          </View>
          <ThemedText type="title" style={styles.heroTitle}>
            Export Reports
          </ThemedText>
          <ThemedText type="small" style={styles.heroSubtitle}>
            Download homework or attendance for any date range — share as PDF or open in Excel.
          </ThemedText>
        </View>

        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
          WHAT TO EXPORT
        </ThemedText>
        <View style={styles.kindRow}>
          <Pressable
            onPress={() => setKind('homework')}
            style={[
              styles.kindCard,
              { borderColor: theme.border },
              kind === 'homework' && { borderColor: theme.tint, backgroundColor: theme.backgroundSelected },
            ]}
          >
            <View style={[styles.kindIcon, { backgroundColor: kind === 'homework' ? theme.tint : theme.backgroundElement }]}>
              <Ionicons name="book" size={20} color={kind === 'homework' ? Brand.white : theme.textSecondary} />
            </View>
            <ThemedText type="smallBold">Homework</ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setKind('attendance')}
            style={[
              styles.kindCard,
              { borderColor: theme.border },
              kind === 'attendance' && { borderColor: theme.tint, backgroundColor: theme.backgroundSelected },
            ]}
          >
            <View style={[styles.kindIcon, { backgroundColor: kind === 'attendance' ? theme.tint : theme.backgroundElement }]}>
              <Ionicons name="checkmark-done" size={20} color={kind === 'attendance' ? Brand.white : theme.textSecondary} />
            </View>
            <ThemedText type="smallBold">Attendance</ThemedText>
          </Pressable>
        </View>

        <Card style={styles.card}>
          <SelectField label="Class" placeholder="Select class" value={classId} options={classOptions} onChange={setClassId} />

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
              {exporting ? 'Preparing…' : 'Export & Share'}
            </ThemedText>
          </Pressable>
        </Card>
      </Screen>
    </TeacherGuard>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: Radius.lg,
    padding: Spacing.four,
    marginBottom: Spacing.four,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  heroTitle: {
    color: Brand.white,
    marginBottom: 4,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 18,
  },
  sectionLabel: {
    marginBottom: Spacing.two,
    letterSpacing: 0.5,
  },
  kindRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  kindCard: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
  kindIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  exportButtonLabel: {
    color: Brand.white,
  },
});
