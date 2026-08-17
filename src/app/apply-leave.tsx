import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { ChildSwitcherCard } from '@/components/ui/ChildSwitcherCard';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { Screen } from '@/components/ui/Screen';
import { SelectField } from '@/components/ui/SelectField';
import { EmptyState, ErrorState, Loading } from '@/components/ui/states';
import { ThemedText } from '@/components/ui/ThemedText';
import { applyForLeave, fetchStudentLeaveApplications, LeaveApplication, LeaveStatus } from '@/data/homework-api';
import { useStudentAuth } from '@/hooks/use-student-auth';
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

const LEAVE_TYPES = [
  { label: 'Sick Leave', value: 'Sick' },
  { label: 'Personal', value: 'Personal' },
  { label: 'Family Function', value: 'Family Function' },
  { label: 'Other', value: 'Other' },
];

function getLeaveStatusMeta(status: LeaveStatus, isDark: boolean): { label: string; color: string; bg: string } {
  if (status === 'approved') {
    return {
      label: 'Approved',
      color: isDark ? '#86EFAC' : '#15803D',
      bg: isDark ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7',
    };
  }
  if (status === 'rejected') {
    return {
      label: 'Rejected',
      color: isDark ? '#FCA5A5' : '#B91C1C',
      bg: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2',
    };
  }
  return {
    label: 'Pending',
    color: isDark ? '#FDE047' : '#B45309',
    bg: isDark ? 'rgba(234, 179, 8, 0.2)' : '#FEF3C7',
  };
}

export default function ApplyLeaveScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { checking, loggedIn, access, allChildren, switchChild } = useStudentAuth();
  const enabled = useSectionEnabled('leave');

  const [leaveType, setLeaveType] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [history, setHistory] = useState<LeaveApplication[] | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState(false);

  function loadHistory() {
    if (!access) return;
    const validSrn = access.srn && access.srn !== '0' && access.srn !== '0.0' ? access.srn : null;
    const identifier = validSrn || access.phone;
    if (!identifier) return;
    setLoadingHistory(true);
    setHistoryError(false);
    fetchStudentLeaveApplications(identifier)
      .then(setHistory)
      .catch(() => setHistoryError(true))
      .finally(() => setLoadingHistory(false));
  }

  useFocusEffect(
    useCallback(() => {
      if (!checking && !loggedIn) {
        router.replace('/homework');
        return;
      }
      loadHistory();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [checking, loggedIn, access])
  );

  async function handleSubmit() {
    if (!access) return;
    const validSrn = access.srn && access.srn !== '0' && access.srn !== '0.0' ? access.srn : null;
    const identifier = validSrn || access.phone;
    if (!identifier) return;
    if (!leaveType || !dateFrom || !dateTo) {
      setError('Please select a leave type and both dates.');
      return;
    }
    if (dateTo < dateFrom) {
      setError('The "To" date can\'t be before the "From" date.');
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await applyForLeave({
        srn: identifier,
        leaveType,
        dateFrom,
        dateTo,
        reason: reason.trim() || undefined,
      });
      setSuccessMessage('Leave request submitted. Your teacher will review it.');
      setLeaveType(null);
      setDateFrom(null);
      setDateTo(null);
      setReason('');
      loadHistory();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit leave request.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!enabled) return <SectionUnavailable />;

  if (checking || !loggedIn) {
    return (
      <Screen scroll={false}>
        <Loading label="Checking login…" />
      </Screen>
    );
  }

  return (
    <Screen>
      {allChildren.length > 1 && access ? (
        <ChildSwitcherCard siblings={allChildren} activeSrn={access.srn} onSwitch={switchChild} />
      ) : null}

      <Card style={styles.card}>
        <ThemedText type="subtitle" style={styles.formTitle}>
          Apply for Leave
        </ThemedText>

        <SelectField label="Leave Type" placeholder="Select type" value={leaveType} options={LEAVE_TYPES} onChange={setLeaveType} />

        <View style={styles.row}>
          <View style={styles.rowItem}>
            <DatePickerField
              label="From"
              placeholder="Select date"
              value={dateFrom}
              onChange={(date) => {
                setDateFrom(date);
                if (dateTo && dateTo < date) setDateTo(null);
              }}
              minDate={todayStr()}
            />
          </View>
          <View style={styles.rowItem}>
            <DatePickerField
              label="To"
              placeholder="Select date"
              value={dateTo}
              onChange={setDateTo}
              minDate={dateFrom ?? todayStr()}
            />
          </View>
        </View>

        <ThemedText type="smallBold" style={styles.fieldLabel}>
          Reason
        </ThemedText>
        <TextInput
          value={reason}
          onChangeText={setReason}
          placeholder="Optional details for your teacher"
          placeholderTextColor={theme.textSecondary}
          multiline
          numberOfLines={3}
          style={[styles.input, styles.textArea, { borderColor: theme.border, color: theme.text }]}
        />

        {error ? (
          <ThemedText type="small" style={styles.error}>
            {error}
          </ThemedText>
        ) : null}
        {successMessage ? (
          <ThemedText type="small" style={styles.success}>
            {successMessage}
          </ThemedText>
        ) : null}

        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          style={[styles.button, { backgroundColor: theme.tint, opacity: submitting ? 0.6 : 1 }]}
        >
          <ThemedText type="smallBold" style={styles.buttonLabel}>
            {submitting ? 'Submitting…' : 'Submit Request'}
          </ThemedText>
        </Pressable>
      </Card>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.four, marginBottom: Spacing.two }}>
        <ThemedText type="smallBold" style={[styles.historyTitle, { marginTop: 0, marginBottom: 0 }]}>
          Your Leave History
        </ThemedText>
        {history && history.length > 0 ? (
          <ExportPdfButton
            variant="compact"
            onPress={() => {
              exportToPdf({
                title: `Leave Applications Report - ${access?.name ?? ''}`,
                subtitle: `Class: ${access?.className ?? ''} | Total Requests: ${history.length}`,
                columns: [
                  { header: 'Type', key: 'leave_type', width: '20%' },
                  { header: 'From - To', key: 'dates', width: '30%' },
                  { header: 'Reason', key: 'reason', width: '30%' },
                  { header: 'Status', key: 'statusLabel', width: '20%' },
                ],
                rows: history.map((h) => ({
                  ...h,
                  dates: `${h.date_from} to ${h.date_to}`,
                  statusLabel: getLeaveStatusMeta(h.status, theme.dark).label,
                })),
              });
            }}
          />
        ) : null}
      </View>
      {loadingHistory && !history ? (
        <Loading label="Loading…" />
      ) : historyError ? (
        <ErrorState message="Could not load leave history." onRetry={loadHistory} />
      ) : !history || history.length === 0 ? (
        <EmptyState message="No leave requests yet." icon="calendar-outline" />
      ) : (
        history.map((h) => {
          const meta = getLeaveStatusMeta(h.status, theme.dark);
          return (
            <Card key={h.id} style={styles.historyRow}>
              <View style={styles.historyTop}>
                <ThemedText type="smallBold">{h.leave_type}</ThemedText>
                <View style={[styles.pill, { backgroundColor: meta.bg }]}>
                  <ThemedText type="small" style={{ color: meta.color, fontWeight: '700' }}>
                    {meta.label}
                  </ThemedText>
                </View>
              </View>
              <ThemedText type="small" themeColor="textSecondary">
                {h.date_from} to {h.date_to}
              </ThemedText>
              {h.reason ? (
                <ThemedText type="small" themeColor="textSecondary" style={styles.historyReason}>
                  {h.reason}
                </ThemedText>
              ) : null}
              {h.review_note ? (
                <ThemedText type="small" themeColor="textSecondary" style={styles.historyReason}>
                  Teacher's note: {h.review_note}
                </ThemedText>
              ) : null}
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.four,
  },
  formTitle: {
    marginBottom: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  rowItem: {
    flex: 1,
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  error: {
    color: Brand.red,
    marginTop: Spacing.three,
  },
  success: {
    color: Brand.green,
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
  historyTitle: {
    marginBottom: Spacing.two,
  },
  historyRow: {
    marginBottom: Spacing.two,
  },
  historyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  historyReason: {
    marginTop: 4,
  },
  pill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
});
