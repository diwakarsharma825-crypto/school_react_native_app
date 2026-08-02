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

const LEAVE_TYPES = [
  { label: 'Sick Leave', value: 'Sick' },
  { label: 'Personal', value: 'Personal' },
  { label: 'Family Function', value: 'Family Function' },
  { label: 'Other', value: 'Other' },
];

const STATUS_META: Record<LeaveStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: '#B8860B', bg: '#FBEFD3' },
  approved: { label: 'Approved', color: '#2E7D32', bg: '#DFF1E1' },
  rejected: { label: 'Rejected', color: '#C62828', bg: '#FBE2E2' },
};

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
    if (!access?.srn) return;
    setLoadingHistory(true);
    setHistoryError(false);
    fetchStudentLeaveApplications(access.srn)
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
    }, [checking, loggedIn, access?.srn])
  );

  async function handleSubmit() {
    if (!access?.srn) return;
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
        srn: access.srn,
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
                // Keep the range valid — if "To" was already picked and now
                // falls before the new "From", clear it rather than submit
                // an inverted range.
                if (dateTo && dateTo < date) setDateTo(null);
              }}
            />
          </View>
          <View style={styles.rowItem}>
            <DatePickerField
              label="To"
              placeholder="Select date"
              value={dateTo}
              onChange={setDateTo}
              minDate={dateFrom ?? undefined}
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

      <ThemedText type="smallBold" style={styles.historyTitle}>
        Your Leave History
      </ThemedText>
      {loadingHistory && !history ? (
        <Loading label="Loading…" />
      ) : historyError ? (
        <ErrorState message="Could not load leave history." onRetry={loadHistory} />
      ) : !history || history.length === 0 ? (
        <EmptyState message="No leave requests yet." icon="calendar-outline" />
      ) : (
        history.map((h) => {
          const meta = STATUS_META[h.status];
          return (
            <Card key={h.id} style={styles.historyRow}>
              <View style={styles.historyTop}>
                <ThemedText type="smallBold">{h.leave_type}</ThemedText>
                <View style={[styles.pill, { backgroundColor: meta.bg }]}>
                  <ThemedText type="small" style={{ color: meta.color }}>
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
