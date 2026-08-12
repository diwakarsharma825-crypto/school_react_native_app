import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { ExportPdfButton } from '@/components/ui/ExportPdfButton';
import { exportToPdf } from '@/lib/pdf-export';
import { Card } from '@/components/ui/Card';
import { ChildSwitcherCard } from '@/components/ui/ChildSwitcherCard';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { InvoiceViewerModal } from '@/components/ui/InvoiceViewerModal';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, Loading } from '@/components/ui/states';
import { ThemedText } from '@/components/ui/ThemedText';
import { FeeInvoice, FeeStatus, fetchStudentFeeInvoices } from '@/data/homework-api';
import { useStudentAuth } from '@/hooks/use-student-auth';
import { useTheme } from '@/hooks/use-theme';
import { useSectionEnabled } from '@/hooks/use-sections';
import { SectionUnavailable } from '@/components/ui/SectionUnavailable';

const STATUS_META: Record<FeeStatus, { label: string; color: string; bg: string }> = {
  due: { label: 'Due', color: '#C62828', bg: '#FBE2E2' },
  paid: { label: 'Paid', color: '#2E7D32', bg: '#DFF1E1' },
};

const FEE_TYPE_LABELS: Record<string, string> = {
  monthly: 'Monthly Fee',
  bus: 'Bus Fee',
  fine: 'Fine',
  other: 'Other',
};

export default function FeesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { checking, loggedIn, access, allChildren, switchChild } = useStudentAuth();
  const enabled = useSectionEnabled('fees');
  const [invoices, setInvoices] = useState<FeeInvoice[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [statusFilter, setStatusFilter] = useState<FeeStatus | 'all'>('all');
  const [dateFromFilter, setDateFromFilter] = useState<string | null>(null);
  const [dateToFilter, setDateToFilter] = useState<string | null>(null);
  const [viewerInvoice, setViewerInvoice] = useState<FeeInvoice | null>(null);

  function load() {
    if (!access) return;
    const validSrn = access.srn && access.srn !== '0' && access.srn !== '0.0' ? access.srn : null;
    const identifier = validSrn || access.phone;
    if (!identifier) return;
    setLoading(true);
    setError(false);
    fetchStudentFeeInvoices(identifier, dateFromFilter ?? undefined, dateToFilter ?? undefined)
      .then(setInvoices)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useFocusEffect(
    useCallback(() => {
      if (!checking && !loggedIn) {
        router.replace('/homework');
        return;
      }
      load();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [checking, loggedIn, access?.srn, dateFromFilter, dateToFilter])
  );

  const visibleInvoices = (invoices ?? []).filter((i) => statusFilter === 'all' || i.status === statusFilter);

  if (!enabled) return <SectionUnavailable />;

  if (checking || !loggedIn) {
    return (
      <Screen scroll={false}>
        <Loading label="Checking login…" />
      </Screen>
    );
  }

  const totalDue = (invoices ?? []).filter((i) => i.status === 'due').reduce((sum, i) => sum + Number(i.amount), 0);

  return (
    <Screen>
      {allChildren.length > 1 && access ? (
        <ChildSwitcherCard siblings={allChildren} activeSrn={access.srn} onSwitch={switchChild} />
      ) : null}

      <View style={[styles.summaryCard, { backgroundColor: theme.tint }]}>
        <ThemedText type="small" themeColor="textOnBrand">
          Total Due
        </ThemedText>
        <ThemedText type="title" themeColor="textOnBrand">
          ₹{totalDue.toFixed(2)}
        </ThemedText>
      </View>

      <View style={[styles.filterRow, { borderColor: theme.border }]}>
        {(['all', 'due', 'paid'] as const).map((s) => (
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

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.two, marginBottom: Spacing.two }}>
        <View style={{ flex: 1 }}>
          <ThemedText type="smallBold">Fee Statements</ThemedText>
        </View>
        <ExportPdfButton
          variant="compact"
          onPress={() => {
            if (!visibleInvoices || visibleInvoices.length === 0) return;
            exportToPdf({
              title: `Fee Invoices Report - ${access?.name ?? ''}`,
              subtitle: `Class: ${access?.className ?? ''} | Filter: ${statusFilter.toUpperCase()} | Total Due: ₹${dueTotal}`,
              columns: [
                { header: 'Invoice No / Title', key: 'title', width: '30%' },
                { header: 'Fee Type', key: 'typeLabel', width: '25%' },
                { header: 'Due Date', key: 'due_date', width: '20%' },
                { header: 'Amount', key: 'amountLabel', width: '15%' },
                { header: 'Status', key: 'statusLabel', width: '10%' },
              ],
              rows: visibleInvoices.map((inv) => ({
                ...inv,
                typeLabel: FEE_TYPE_LABELS[inv.fee_type] || inv.fee_type,
                amountLabel: `₹${inv.amount}`,
                statusLabel: STATUS_META[inv.status]?.label ?? inv.status,
              })),
            });
          }}
        />
      </View>

      {loading && !invoices ? (
        <Loading label="Loading fees…" />
      ) : error ? (
        <ErrorState message="Could not load fees." onRetry={load} />
      ) : visibleInvoices.length === 0 ? (
        <EmptyState message="No fee dues yet." icon="cash-outline" />
      ) : (
        visibleInvoices.map((inv) => {
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
              <ThemedText type="small" themeColor="textSecondary">
                {FEE_TYPE_LABELS[inv.fee_type] ?? inv.fee_type} · ₹{inv.amount}
                {inv.due_date ? ` · Due ${inv.due_date}` : ''}
              </ThemedText>
              {inv.file_url ? (
                <Pressable onPress={() => setViewerInvoice(inv)}>
                  <ThemedText type="small" themeColor="tint" style={styles.viewLink}>
                    View invoice ({inv.file_type === 'pdf' ? 'PDF' : 'Image'})
                  </ThemedText>
                </Pressable>
              ) : null}
            </Card>
          );
        })
      )}

      <InvoiceViewerModal
        visible={!!viewerInvoice}
        onClose={() => setViewerInvoice(null)}
        url={viewerInvoice?.file_url ?? null}
        fileType={viewerInvoice?.file_type ?? null}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    borderRadius: Radius.lg,
    padding: Spacing.four,
    marginBottom: Spacing.four,
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
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  rowItem: {
    flex: 1,
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
  pill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  viewLink: {
    marginTop: Spacing.two,
  },
});
