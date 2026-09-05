import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as DocumentPicker from 'expo-document-picker';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardAwareScrollViewRef } from 'react-native-keyboard-controller';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { InvoiceViewerModal } from '@/components/ui/InvoiceViewerModal';
import { MediaPickerModal } from '@/components/ui/MediaPickerModal';
import { Screen } from '@/components/ui/Screen';
import { SelectField } from '@/components/ui/SelectField';
import { EmptyState, ErrorState, Loading } from '@/components/ui/states';
import { ThemedText } from '@/components/ui/ThemedText';
import { TeacherGuard } from '@/components/ui/TeacherGuard';
import {
  addFeeInvoice,
  deleteFeeInvoice,
  editFeeInvoice,
  fetchTeacherStudents,
  FeeStatus,
  FeeType,
  fetchTeacherFeeInvoices,
  RosterStudent,
  TeacherFeeInvoice,
  updateFeeInvoiceStatus,
  formatClassLabel,
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
  editingInvoice,
}: {
  visible: boolean;
  onClose: () => void;
  onAdded: () => void;
  classId: number | null;
  sectionId?: number;
  editingInvoice?: TeacherFeeInvoice | null;
}) {
  const theme = useTheme();
  const [students, setStudents] = useState<RosterStudent[] | null>(null);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSrn, setStudentSrn] = useState<string | null>(null);
  const [feeType, setFeeType] = useState<FeeType | null>(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [discountValue, setDiscountValue] = useState('');
  const [discountReason, setDiscountReason] = useState('');
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

  useEffect(() => {
    if (editingInvoice) {
      setStudentSrn(editingInvoice.student_srn || null);
      setFeeType(editingInvoice.fee_type || null);
      setTitle(editingInvoice.title || '');
      setAmount(editingInvoice.base_amount !== undefined ? String(editingInvoice.base_amount) : String(editingInvoice.amount || ''));
      setDiscountType(editingInvoice.discount_type || 'fixed');
      setDiscountValue(editingInvoice.discount_value ? String(editingInvoice.discount_value) : '');
      setDiscountReason(editingInvoice.discount_reason || '');
      setDueDate(editingInvoice.due_date || null);
      setFile(null);
    } else if (visible) {
      setStudentSrn(null);
      setFeeType(null);
      setTitle('');
      setAmount('');
      setDiscountValue('');
      setDiscountType('fixed');
      setDiscountReason('');
      setDueDate(null);
      setFile(null);
    }
  }, [editingInvoice, visible]);

  const studentOptions = (students ?? [])
    .filter((s) => !!s.srn)
    .map((s) => ({ label: `${s.name}${s.roll_no ? ` (Roll ${s.roll_no})` : ''}`, value: s.srn as string }));

  const [mediaPickerVisible, setMediaPickerVisible] = useState(false);

  function pickFile() {
    setMediaPickerVisible(true);
  }

  const baseNum = Number(amount) || 0;
  const discValNum = Number(discountValue) || 0;
  const computedDiscountAmount = discountType === 'percent'
    ? Math.round((baseNum * discValNum) / 100)
    : discValNum;
  const netPayable = Math.max(0, baseNum - computedDiscountAmount);

  async function handleSubmit() {
    if ((!editingInvoice && !studentSrn) || !feeType || !title.trim() || !amount.trim() || isNaN(Number(amount))) {
      setError('Student, fee type, title and a numeric amount are required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (editingInvoice) {
        await editFeeInvoice({
          id: editingInvoice.id,
          feeType,
          title: title.trim(),
          amount: netPayable,
          baseAmount: baseNum,
          discountType,
          discountValue: discValNum,
          discountReason: discountReason.trim() || undefined,
          dueDate: dueDate || undefined,
          fileUri: file?.uri,
          fileMimeType: file?.mimeType,
          fileName: file?.name,
        });
      } else {
        await addFeeInvoice({
          srn: studentSrn!,
          feeType,
          title: title.trim(),
          amount: netPayable,
          baseAmount: baseNum,
          discountType,
          discountValue: discValNum,
          discountReason: discountReason.trim() || undefined,
          classId: classId || undefined,
          dueDate: dueDate || undefined,
          fileUri: file?.uri,
          fileMimeType: file?.mimeType,
          fileName: file?.name,
        });
      }
      setStudentSrn(null);
      setFeeType(null);
      setTitle('');
      setAmount('');
      setDiscountValue('');
      setDiscountType('fixed');
      setDiscountReason('');
      setDueDate(null);
      setFile(null);
      onAdded();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save fee invoice.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBackdrop}>
        <View style={[styles.modalSheet, { backgroundColor: theme.background }]}>
          <View style={styles.modalHeader}>
            <ThemedText type="subtitle">{editingInvoice ? 'Edit Fee Invoice' : 'Add Fee Due'}</ThemedText>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={theme.text} />
            </Pressable>
          </View>

          <KeyboardAwareScrollView
            ref={scrollRef}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            bottomOffset={40}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
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
                Base Amount (₹)
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

          <View style={styles.row}>
            <View style={styles.rowItem}>
              <View style={styles.discountHeaderRow}>
                <ThemedText type="smallBold" style={styles.fieldLabelNoMargin}>
                  {discountType === 'percent' ? 'Discount (%)' : 'Discount (₹)'}
                </ThemedText>
                <View style={[styles.typeToggleRow, { borderColor: theme.border }]}>
                  <Pressable
                    onPress={() => setDiscountType('fixed')}
                    style={[styles.typeToggleBtn, discountType === 'fixed' && { backgroundColor: theme.tint }]}
                  >
                    <ThemedText style={[styles.typeToggleText, { color: discountType === 'fixed' ? Brand.white : theme.text }]}>
                      ₹
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={() => setDiscountType('percent')}
                    style={[styles.typeToggleBtn, discountType === 'percent' && { backgroundColor: theme.tint }]}
                  >
                    <ThemedText style={[styles.typeToggleText, { color: discountType === 'percent' ? Brand.white : theme.text }]}>
                      %
                    </ThemedText>
                  </Pressable>
                </View>
              </View>
              <TextInput
                value={discountValue}
                onChangeText={setDiscountValue}
                onFocus={() => scrollRef.current?.assureFocusedInputVisible()}
                placeholder={discountType === 'percent' ? 'e.g. 10' : '0'}
                keyboardType="decimal-pad"
                autoComplete="off"
                textContentType="none"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { borderColor: theme.border, color: theme.text }]}
              />
              {discountType === 'percent' && discValNum > 0 ? (
                <ThemedText type="small" themeColor="textSecondary" style={styles.discountHelpText}>
                  Concession: ₹{computedDiscountAmount} ({discValNum}%)
                </ThemedText>
              ) : null}
            </View>

            <View style={styles.rowItem}>
              <ThemedText type="smallBold" style={styles.fieldLabel}>
                Net Payable
              </ThemedText>
              <View style={[styles.netPayableBox, { borderColor: theme.dark ? '#38BDF8' : '#0284C7', backgroundColor: theme.dark ? '#0F172A' : '#F0F9FF' }]}>
                <ThemedText style={[styles.netPayableText, { color: theme.dark ? '#38BDF8' : '#0284C7' }]}>
                  ₹{netPayable.toLocaleString()}
                </ThemedText>
              </View>
            </View>
          </View>

          {computedDiscountAmount > 0 ? (
            <>
              <ThemedText type="smallBold" style={styles.fieldLabel}>
                Discount Reason
              </ThemedText>
              <TextInput
                value={discountReason}
                onChangeText={setDiscountReason}
                onFocus={() => scrollRef.current?.assureFocusedInputVisible()}
                placeholder="e.g. Sibling Concession, Merit Scholarship"
                placeholderTextColor={theme.textSecondary}
                autoComplete="off"
                textContentType="none"
                style={[styles.input, { borderColor: theme.border, color: theme.text }]}
              />
            </>
          ) : null}

          {/* Existing Attachment Preview in Edit Mode */}
          {editingInvoice?.file_url && !file ? (
            <View style={[styles.attachmentPreviewBox, { borderColor: theme.border, backgroundColor: theme.surface }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flex: 1 }}>
                {editingInvoice.file_type === 'image' || editingInvoice.file_url.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                  <Image source={{ uri: editingInvoice.file_url }} style={styles.previewThumb} contentFit="cover" />
                ) : (
                  <Ionicons name="document-text-outline" size={32} color={theme.tint} />
                )}
                <View style={{ flex: 1 }}>
                  <ThemedText type="smallBold" numberOfLines={1}>
                    Attached {editingInvoice.file_type === 'pdf' ? 'PDF Document' : 'Invoice Image'}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11 }}>
                    Tap 'Change' below to replace file
                  </ThemedText>
                </View>
              </View>
              <Pressable
                onPress={pickFile}
                style={[styles.replaceFileBtn, { backgroundColor: theme.dark ? 'rgba(56, 189, 248, 0.15)' : '#EFF6FF' }]}
              >
                <ThemedText type="smallBold" style={{ color: theme.dark ? '#38BDF8' : theme.tint, fontSize: 12 }}>
                  Change File
                </ThemedText>
              </Pressable>
            </View>
          ) : null}

          {/* Newly Selected File Attachment Preview */}
          {file ? (
            <View style={[styles.attachmentPreviewBox, { borderColor: theme.tint, backgroundColor: theme.dark ? 'rgba(37, 99, 235, 0.15)' : '#EFF6FF' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flex: 1 }}>
                {file.mimeType?.startsWith('image/') || file.uri.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                  <Image source={{ uri: file.uri }} style={styles.previewThumb} contentFit="cover" />
                ) : (
                  <Ionicons name="document-text-outline" size={32} color={theme.tint} />
                )}
                <View style={{ flex: 1 }}>
                  <ThemedText type="smallBold" numberOfLines={1} style={{ color: theme.text }}>
                    {file.name || 'Selected File'}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.dark ? '#4ADE80' : '#15803D', fontSize: 11, fontWeight: '600' }}>
                    New file selected
                  </ThemedText>
                </View>
              </View>
              <Pressable onPress={() => setFile(null)} hitSlop={8} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </Pressable>
            </View>
          ) : !editingInvoice?.file_url ? (
            <Pressable onPress={pickFile} style={[styles.filePicker, { borderColor: theme.border }]}>
              <Ionicons name="cloud-upload-outline" size={20} color={theme.textSecondary} style={{ marginBottom: 4 }} />
              <ThemedText type="small" themeColor="textSecondary">
                Attach invoice (image or PDF, optional)
              </ThemedText>
            </Pressable>
          ) : null}

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
              {submitting ? 'Saving…' : 'Add Fee'}
            </ThemedText>
          </Pressable>
          </KeyboardAwareScrollView>
        </View>
      </KeyboardAvoidingView>

      <MediaPickerModal
        visible={mediaPickerVisible}
        onClose={() => setMediaPickerVisible(false)}
        onSelectMedia={(f) => setFile(f)}
      />
    </Modal>
  );
}

export default function TeacherFeesScreen() {
  const theme = useTheme();
  const { profile } = useTeacherAuth();
  const enabled = useSectionEnabled('fees');

  const classes = profile?.classes ?? [];
  const classOptions = classes.map((c) => ({
    label: formatClassLabel(c.class_name, c.section_name),
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
  const [editingInvoice, setEditingInvoice] = useState<TeacherFeeInvoice | null>(null);

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

  function handleDeleteInvoice(inv: TeacherFeeInvoice) {
    Alert.alert(
      'Delete Fee Invoice',
      `Are you sure you want to delete "${inv.title}" for ${inv.student_name || 'student'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActingId(inv.id);
            try {
              await deleteFeeInvoice(inv.id);
              load();
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Could not delete invoice');
            } finally {
              setActingId(null);
            }
          },
        },
      ]
    );
  }

  function handleEditInvoice(inv: TeacherFeeInvoice) {
    setEditingInvoice(inv);
    setAddOpen(true);
  }

  const [searchQuery, setSearchQuery] = useState('');

  const filteredInvoices = (invoices ?? []).filter((inv) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = inv.student_name?.toLowerCase().includes(q);
    const titleMatch = inv.title.toLowerCase().includes(q);
    const rollMatch = inv.student_roll_no?.toString().includes(q);
    return nameMatch || titleMatch || rollMatch;
  });

  if (!enabled) {
    return <SectionUnavailable />;
  }

  return (
    <TeacherGuard>
      <Screen>
        {/* Class Dropdown Selector */}
        {classOptions.length > 0 ? (
          <SelectField
            label="Class"
            placeholder="Select Class"
            value={classId}
            options={classOptions}
            onChange={setClassId}
          />
        ) : null}

        <View style={styles.actionHeader}>
          <Pressable onPress={() => { setEditingInvoice(null); setAddOpen(true); }} style={[styles.addButton, { backgroundColor: theme.tint }]}>
            <Ionicons name="add" size={18} color={Brand.white} />
            <ThemedText type="smallBold" style={styles.addButtonLabel}>
              Add Fee Due
            </ThemedText>
          </Pressable>

          <ExportPdfButton
            variant="compact"
            onPress={() => {
              if (!filteredInvoices || filteredInvoices.length === 0) {
                Alert.alert('Export PDF', 'No fee dues available to export.');
                return;
              }
              const titleStr = `Fee Report - ${selected?.class_name ?? ''}${selected?.section_name ? ` (${selected.section_name})` : ''}`;
              exportToPdf({
                title: titleStr,
                subtitle: `Status: ${statusFilter.toUpperCase()} | Total Invoices: ${filteredInvoices.length}`,
                columns: [
                  { header: 'Student Name', key: 'student_name', width: '25%' },
                  { header: 'Roll No', key: 'student_roll_no', width: '15%' },
                  { header: 'Title / Description', key: 'title', width: '30%' },
                  { header: 'Amount (₹)', key: 'amount', width: '15%' },
                  { header: 'Status', key: 'status', width: '15%' },
                ],
                rows: filteredInvoices.map((inv) => ({
                  ...inv,
                  student_roll_no: inv.student_roll_no || 'N/A',
                  amount: `₹${inv.amount}`,
                  status: inv.status.toUpperCase(),
                })),
              });
            }}
          />
        </View>

        {/* Filter Pills */}
        <View style={[styles.filterRow, { borderColor: theme.border }]}>
          {(['due', 'paid', 'all'] as const).map((f) => {
            const active = statusFilter === f;
            return (
              <Pressable
                key={f}
                onPress={() => setStatusFilter(f)}
                style={[
                  styles.filterPill,
                  active && { backgroundColor: theme.tint },
                ]}
              >
                <ThemedText
                  type="smallBold"
                  style={[
                    styles.filterText,
                    { color: active ? Brand.white : theme.dark ? '#CBD5E1' : theme.textSecondary },
                  ]}
                >
                  {f === 'due' ? 'Due' : f === 'paid' ? 'Paid' : 'All'}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        {/* Student Filter */}
        <SelectField
          label="Filter by Student"
          placeholder="All Students"
          value={studentFilter ?? ''}
          options={studentFilterOptions}
          onChange={(val) => setStudentFilter(val || null)}
        />

        {/* Date Range Filter */}
        <View style={styles.dateFilterRow}>
          <View style={{ flex: 1 }}>
            <DatePickerField
              label="Due From"
              placeholder="Any"
              value={dateFromFilter}
              onChange={setDateFromFilter}
            />
          </View>
          <View style={{ flex: 1 }}>
            <DatePickerField
              label="Due To"
              placeholder="Any"
              value={dateToFilter}
              onChange={setDateToFilter}
            />
          </View>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="search" size={18} color={theme.textSecondary} style={{ marginRight: Spacing.two }} />
          <TextInput
            placeholder="Search by student name, title, roll no..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: theme.text }]}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        {dateFromFilter || dateToFilter ? (
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
        ) : !filteredInvoices || filteredInvoices.length === 0 ? (
          <EmptyState message="No fee dues here." icon="cash-outline" />
        ) : (
          filteredInvoices.map((inv) => {
            const meta = STATUS_META[inv.status];
            return (
              <Card key={inv.id} style={styles.invoiceCard}>
                <View style={styles.invoiceTop}>
                  <ThemedText type="smallBold">{inv.title}</ThemedText>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
                    {inv.status === 'due' ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginRight: 4 }}>
                        <Pressable onPress={() => handleEditInvoice(inv)} hitSlop={8}>
                          <Ionicons name="create-outline" size={18} color={theme.dark ? '#38BDF8' : theme.tint} />
                        </Pressable>
                        <Pressable onPress={() => handleDeleteInvoice(inv)} hitSlop={8}>
                          <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        </Pressable>
                      </View>
                    ) : null}
                    <View style={[styles.pill, { backgroundColor: meta.bg }]}>
                      <ThemedText type="small" style={{ color: meta.color, fontWeight: '700' }}>
                        {meta.label}
                      </ThemedText>
                    </View>
                  </View>
                </View>
                {inv.student_name ? (
                  <ThemedText type="small" style={[styles.studentLine, { color: theme.dark ? '#60A5FA' : theme.tint, fontWeight: '600' }]}>
                    {inv.student_name}
                    {inv.student_roll_no ? ` · Roll No. ${inv.student_roll_no}` : ''}
                  </ThemedText>
                ) : null}
                <ThemedText type="small" themeColor="textSecondary">
                  ₹{inv.amount} {inv.due_date ? `· Due ${inv.due_date}` : ''}
                </ThemedText>
                {inv.file_url ? (
                  <Pressable onPress={() => setViewerInvoice(inv)}>
                    <ThemedText type="smallBold" style={{ color: theme.dark ? '#38BDF8' : '#0284C7', marginTop: Spacing.two }}>
                      View invoice
                    </ThemedText>
                  </Pressable>
                ) : null}
                {inv.status === 'due' ? (
                  <Pressable
                    onPress={() => handleMarkPaid(inv.id)}
                    disabled={actingId === inv.id}
                    style={[
                      styles.markPaidButton,
                      {
                        backgroundColor: theme.dark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(46, 125, 50, 0.1)',
                        borderColor: theme.dark ? '#4ADE80' : '#15803D',
                        opacity: actingId === inv.id ? 0.6 : 1,
                      },
                    ]}
                  >
                    <ThemedText type="smallBold" style={{ color: theme.dark ? '#4ADE80' : '#15803D' }}>
                      {actingId === inv.id ? 'Updating…' : 'Mark as Paid'}
                    </ThemedText>
                  </Pressable>
                ) : null}
              </Card>
            );
          })
        )}

        <AddFeeModal
          visible={addOpen}
          onClose={() => {
            setAddOpen(false);
            setEditingInvoice(null);
          }}
          onAdded={load}
          classId={classId ? Number(classId) : null}
          sectionId={selected?.section_id ?? undefined}
          editingInvoice={editingInvoice}
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
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
    gap: Spacing.two,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
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
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  filterPill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.pill,
  },
  filterText: {
    fontSize: 12,
  },
  dateFilterRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  fieldLabelNoMargin: {
    marginBottom: 0,
  },
  discountHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.three,
    marginBottom: Spacing.one,
  },
  typeToggleRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: Radius.pill,
    padding: 2,
  },
  typeToggleBtn: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  typeToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  netPayableBox: {
    borderWidth: 1.5,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two + 2,
    justifyContent: 'center',
    alignItems: 'flex-start',
    height: 48,
  },
  netPayableText: {
    fontSize: 18,
    fontWeight: '700',
  },
  discountHelpText: {
    marginTop: 4,
    fontSize: 11,
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
  attachmentPreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.two,
    marginTop: Spacing.three,
  },
  previewThumb: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
  },
  replaceFileBtn: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    borderRadius: Radius.pill,
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
