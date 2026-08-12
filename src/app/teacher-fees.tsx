import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardAwareScrollViewRef } from 'react-native-keyboard-controller';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { InvoiceViewerModal } from '@/components/ui/InvoiceViewerModal';
import { Screen } from '@/components/ui/Screen';
import { SelectField } from '@/components/ui/SelectField';
import { EmptyState, ErrorState, Loading } from '@/components/ui/states';
import { ThemedText } from '@/components/ui/ThemedText';
import { TeacherGuard } from '@/components/ui/TeacherGuard';
import {
  addFeeInvoice,
  fetchTeacherStudents,
  FeeStatus,
  FeeType,
  fetchTeacherFeeInvoices,
  RosterStudent,
  TeacherFeeInvoice,
  updateFeeInvoiceStatus,
} from '@/data/teacher-api';
import { useTeacherAuth } from '@/hooks/use-teacher-auth';
import { useTheme } from '@/hooks/use-theme';
import { useSectionEnabled } from '@/hooks/use-sections';
import { SectionUnavailable } from '@/components/ui/SectionUnavailable';
import { ExportPdfButton } from '@/components/ui/ExportPdfButton';
import { exportToPdf } from '@/lib/pdf-export';

const FEE_TYPE_OPTIONS: { label: string; value: FeeType }[] = [
  { label: 'Monthly Fee', value: 'monthly' },
  { label: 'Bus Fee', value: 'bus' },
  { label: 'Fine', value: 'fine' },
  { label: 'Other', value: 'other' },
];

const STATUS_META: Record<FeeStatus, { label: string; color: string; bg: string }> = {
  due: { label: 'Due', color: '#C62828', bg: '#FBE2E2' },
  paid: { label: 'Paid', color: '#2E7D32', bg: '#DFF1E1' },
};

function AddFeeModal({
  visible,
  onClose,
  onAdded,
  classId,
  sectionId,
}: {
  visible: boolean;
  onClose: () => void;
  onAdded: () => void;
  classId: number | null;
  sectionId?: number;
}) {
  const theme = useTheme();
  const [students, setStudents] = useState<RosterStudent[] | null>(null);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSrn, setStudentSrn] = useState<string | null>(null);
  const [feeType, setFeeType] = useState<FeeType | null>(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [file, setFile] = useState<{ uri: string; mimeType?: string | null; name?: string | null } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<KeyboardAwareScrollViewRef>(null);

  useEffect(() => {
    if (!visible || !classId) return;
    setLoadingStudents(true);
    fetchTeacherStudents(classId, sectionId)
      .then(setStudents)
      .catch(() => setStudents([]))
      .finally(() => setLoadingStudents(false));
  }, [visible, classId, sectionId]);

  const studentOptions = (students ?? [])
    .filter((s) => !!s.srn)
    .map((s) => ({ label: `${s.name}${s.roll_no ? ` (Roll ${s.roll_no})` : ''}`, value: s.srn as string }));

  async function pickFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf', '*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      setFile({ uri: asset.uri, mimeType: asset.mimeType, name: asset.name });
    } catch (e) {
      Alert.alert('File Error', e instanceof Error ? e.message : 'Could not select file.');
    }
  }

  async function handleSubmit() {
    if (!studentSrn || !feeType || !title.trim() || !amount.trim() || isNaN(Number(amount))) {
      setError('Student, fee type, title and a numeric amount are required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await addFeeInvoice({
        srn: studentSrn,
        feeType,
        title: title.trim(),
        amount: Number(amount),
        dueDate: dueDate || undefined,
        fileUri: file?.uri,
        fileMimeType: file?.mimeType,
        fileName: file?.name,
      });
      setStudentSrn(null);
      setFeeType(null);
      setTitle('');
      setAmount('');
      setDueDate(null);
      setFile(null);
      onAdded();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add fee.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalSheet, { backgroundColor: theme.background }]}>
          <View style={styles.modalHeader}>
            <ThemedText type="subtitle">Add Fee Due</ThemedText>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={theme.text} />
            </Pressable>
          </View>

          <KeyboardAwareScrollView
            ref={scrollRef}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            bottomOffset={24}
            showsVerticalScrollIndicator={false}
          >
          <SelectField
            label="Student"
            placeholder={loadingStudents ? 'Loading students…' : 'Select student'}
            value={studentSrn}
            options={studentOptions}
            onChange={setStudentSrn}
            searchable
          />

          <SelectField label="Fee Type" placeholder="Select type" value={feeType} options={FEE_TYPE_OPTIONS} onChange={(v) => setFeeType(v as FeeType)} />

          <ThemedText type="smallBold" style={styles.fieldLabel}>
            Title
          </ThemedText>
          <TextInput
            value={title}
            onChangeText={setTitle}
            onFocus={() => scrollRef.current?.assureFocusedInputVisible()}
            placeholder="e.g. August 2026 Monthly Fee"
            placeholderTextColor={theme.textSecondary}
            keyboardType="default"
            autoComplete="off"
            textContentType="none"
            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
          />

          <View style={styles.row}>
            <View style={styles.rowItem}>
              <ThemedText type="smallBold" style={styles.fieldLabel}>
                Amount
              </ThemedText>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                onFocus={() => scrollRef.current?.assureFocusedInputVisible()}
                placeholder="0"
                keyboardType="decimal-pad"
                autoComplete="off"
                textContentType="none"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { borderColor: theme.border, color: theme.text }]}
              />
            </View>
            <View style={styles.rowItem}>
              <DatePickerField label="Due Date" placeholder="Select date" value={dueDate} onChange={setDueDate} minDate="0000-00-00" />
            </View>
          </View>

          <Pressable onPress={pickFile} style={[styles.filePicker, { borderColor: theme.border }]}>
            <ThemedText type="small">{file ? 'Invoice file selected' : 'Attach invoice (image or PDF, optional)'}</ThemedText>
          </Pressable>

          {error ? (
            <ThemedText type="small" style={styles.error}>
              {error}
            </ThemedText>
          ) : null}

          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={[styles.button, { backgroundColor: theme.tint, opacity: submitting ? 0.6 : 1 }]}
          >
            <ThemedText type="smallBold" style={styles.buttonLabel}>
              {submitting ? 'Adding…' : 'Add Fee'}
            </ThemedText>
          </Pressable>
          </KeyboardAwareScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function TeacherFeesScreen() {
  const theme = useTheme();
  const { profile } = useTeacherAuth();
  const enabled = useSectionEnabled('fees');

  const classes = profile?.classes ?? [];
  const classOptions = classes.map((c) => ({
    label: `${c.class_name}${c.section_name ? ` - ${c.section_name}` : ''}`,
    value: String(c.class_id),
  }));

  const [classId, setClassId] = useState<string | null>(classOptions[0]?.value ?? null);
  const [statusFilter, setStatusFilter] = useState<FeeStatus | 'all'>('due');
  const [studentFilter, setStudentFilter] = useState<string | null>(null);
  const [dateFromFilter, setDateFromFilter] = useState<string | null>(null);
  const [dateToFilter, setDateToFilter] = useState<string | null>(null);
  const [rosterStudents, setRosterStudents] = useState<RosterStudent[]>([]);
  const [invoices, setInvoices] = useState<TeacherFeeInvoice[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);
  const [viewerInvoice, setViewerInvoice] = useState<TeacherFeeInvoice | null>(null);

  const selected = classes.find((c) => String(c.class_id) === classId);

  const studentFilterOptions = [
    { label: 'All Students', value: '' },
    ...rosterStudents.filter((s) => !!s.srn).map((s) => ({
      label: `${s.name}${s.roll_no ? ` (Roll ${s.roll_no})` : ''}`,
      value: s.srn as string,
    })),
  ];

  function load() {
    if (!classId) return;
    setLoading(true);
    setError(false);
    fetchTeacherFeeInvoices(
      Number(classId),
      selected?.section_id ?? undefined,
      statusFilter === 'all' ? undefined : statusFilter,
      studentFilter ?? undefined,
      dateFromFilter ?? undefined,
      dateToFilter ?? undefined
    )
      .then(setInvoices)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(load, [classId, selected?.section_id, statusFilter, studentFilter, dateFromFilter, dateToFilter]);

  useEffect(() => {
    if (!classId) return;
    fetchTeacherStudents(Number(classId), selected?.section_id ?? undefined)
      .then(setRosterStudents)
      .catch(() => setRosterStudents([]));
    setStudentFilter(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, selected?.section_id]);

  async function handleMarkPaid(id: number) {
    setActingId(id);
    try {
      await updateFeeInvoiceStatus(id, 'paid');
      load();
    } catch (e) {
      Alert.alert('Could not update', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setActingId(null);
    }
  }

  if (!enabled) return <SectionUnavailable />;

  return (
    <TeacherGuard>
      <Screen>
        {classes.length > 1 ? (
          <SelectField label="Class" placeholder="Select class" value={classId} options={classOptions} onChange={setClassId} />
        ) : null}

        <View style={{ flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.three }}>
          <Pressable onPress={() => setAddOpen(true)} style={[styles.addButton, { backgroundColor: theme.tint, flex: 1, marginBottom: 0 }]}>
            <Ionicons name="add" size={16} color={Brand.white} />
            <ThemedText type="smallBold" style={styles.addButtonLabel}>
              Add Fee Due
            </ThemedText>
          </Pressable>

          <ExportPdfButton
            variant="outline"
            style={{ flex: 1, marginBottom: 0 }}
            onPress={() => {
              if (!invoices || invoices.length === 0) return;
              exportToPdf({
                title: `Class Fee Records - ${selected?.class_name ?? ''}${selected?.section_name ? ` (${selected.section_name})` : ''}`,
                subtitle: `Filter: ${statusFilter.toUpperCase()} | Total Records: ${invoices.length}`,
                columns: [
                  { header: 'Student Name', key: 'student_name', width: '25%' },
                  { header: 'Invoice Title', key: 'title', width: '25%' },
                  { header: 'Amount', key: 'amountLabel', width: '15%' },
                  { header: 'Due Date', key: 'due_date', width: '20%' },
                  { header: 'Status', key: 'statusLabel', width: '15%' },
                ],
                rows: invoices.map((inv) => ({
                  ...inv,
                  amountLabel: `₹${inv.amount}`,
                  statusLabel: STATUS_META[inv.status]?.label ?? inv.status,
                })),
              });
            }}
          />
        </View>

        <View style={[styles.filterRow, { borderColor: theme.border }]}>
          {(['due', 'paid', 'all'] as const).map((s) => (
            <Pressable
              key={s}
              onPress={() => setStatusFilter(s)}
              style={[styles.filterButton, statusFilter === s && { backgroundColor: theme.tint }]}
            >
              <ThemedText type="small" themeColor={statusFilter === s ? 'textOnBrand' : 'textSecondary'}>
                {s === 'all' ? 'All' : STATUS_META[s].label}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <SelectField
          label="Filter by Student"
          placeholder="All Students"
          value={studentFilter ?? ''}
          options={studentFilterOptions}
          onChange={(v) => setStudentFilter(v || null)}
          searchable
        />

        <View style={styles.row}>
          <View style={styles.rowItem}>
            <DatePickerField label="Due From" placeholder="Any" value={dateFromFilter} onChange={setDateFromFilter} minDate="0000-00-00" />
          </View>
          <View style={styles.rowItem}>
            <DatePickerField label="Due To" placeholder="Any" value={dateToFilter} onChange={setDateToFilter} minDate={dateFromFilter ?? '0000-00-00'} />
          </View>
        </View>
        {(dateFromFilter || dateToFilter) ? (
          <Pressable
            onPress={() => {
              setDateFromFilter(null);
              setDateToFilter(null);
            }}
            style={styles.clearDatesButton}
          >
            <ThemedText type="small" themeColor="tint">
              Clear date filter
            </ThemedText>
          </Pressable>
        ) : null}

        {loading ? (
          <Loading label="Loading fees…" />
        ) : error ? (
          <ErrorState message="Could not load fees." onRetry={load} />
        ) : !invoices || invoices.length === 0 ? (
          <EmptyState message="No fee dues here." icon="cash-outline" />
        ) : (
          invoices.map((inv) => {
            const meta = STATUS_META[inv.status];
            return (
              <Card key={inv.id} style={styles.invoiceCard}>
                <View style={styles.invoiceTop}>
                  <ThemedText type="smallBold">{inv.title}</ThemedText>
                  <View style={[styles.pill, { backgroundColor: meta.bg }]}>
                    <ThemedText type="small" style={{ color: meta.color }}>
                      {meta.label}
                    </ThemedText>
                  </View>
                </View>
                {inv.student_name ? (
                  <ThemedText type="small" themeColor="tint" style={styles.studentLine}>
                    {inv.student_name}
                    {inv.student_roll_no ? ` · Roll No. ${inv.student_roll_no}` : ''}
                  </ThemedText>
                ) : null}
                <ThemedText type="small" themeColor="textSecondary">
                  ₹{inv.amount} {inv.due_date ? `· Due ${inv.due_date}` : ''}
                </ThemedText>
                {inv.file_url ? (
                  <Pressable onPress={() => setViewerInvoice(inv)}>
                    <ThemedText type="small" themeColor="tint" style={styles.viewLink}>
                      View invoice
                    </ThemedText>
                  </Pressable>
                ) : null}
                {inv.status === 'due' ? (
                  <Pressable
                    onPress={() => handleMarkPaid(inv.id)}
                    disabled={actingId === inv.id}
                    style={[styles.markPaidButton, { borderColor: theme.tint, opacity: actingId === inv.id ? 0.6 : 1 }]}
                  >
                    <ThemedText type="small" themeColor="tint">
                      Mark as Paid
                    </ThemedText>
                  </Pressable>
                ) : null}
              </Card>
            );
          })
        )}

        <AddFeeModal
          visible={addOpen}
          onClose={() => setAddOpen(false)}
          onAdded={load}
          classId={classId ? Number(classId) : null}
          sectionId={selected?.section_id ?? undefined}
        />

        <InvoiceViewerModal
          visible={!!viewerInvoice}
          onClose={() => setViewerInvoice(null)}
          url={viewerInvoice?.file_url ?? null}
          fileType={viewerInvoice?.file_type ?? null}
        />
      </Screen>
    </TeacherGuard>
  );
}

const styles = StyleSheet.create({
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    marginBottom: Spacing.three,
  },
  addButtonLabel: {
    color: Brand.white,
  },
  filterRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: Radius.pill,
    padding: 3,
    marginBottom: Spacing.three,
    alignSelf: 'flex-start',
  },
  filterButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.pill,
  },
  invoiceCard: {
    marginBottom: Spacing.three,
  },
  invoiceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  studentLine: {
    marginBottom: 4,
  },
  clearDatesButton: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.three,
  },
  pill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  viewLink: {
    marginTop: Spacing.two,
  },
  markPaidButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    marginTop: Spacing.three,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Spacing.four,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  rowItem: {
    flex: 1,
  },
  filePicker: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.three,
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
});
