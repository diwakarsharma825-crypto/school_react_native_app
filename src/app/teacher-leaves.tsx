import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { SelectField } from '@/components/ui/SelectField';
import { EmptyState, ErrorState, Loading } from '@/components/ui/states';
import { ThemedText } from '@/components/ui/ThemedText';
import { TeacherGuard } from '@/components/ui/TeacherGuard';
import { fetchTeacherLeaveApplications, LeaveStatus, reviewLeaveApplication, TeacherLeaveApplication } from '@/data/teacher-api';
import { useTeacherAuth } from '@/hooks/use-teacher-auth';
import { useTheme } from '@/hooks/use-theme';
import { useSectionEnabled } from '@/hooks/use-sections';
import { SectionUnavailable } from '@/components/ui/SectionUnavailable';

const STATUS_META: Record<LeaveStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: '#B8860B', bg: '#FBEFD3' },
  approved: { label: 'Approved', color: '#2E7D32', bg: '#DFF1E1' },
  rejected: { label: 'Rejected', color: '#C62828', bg: '#FBE2E2' },
};

const STATUS_FILTERS: { label: string; value: LeaveStatus | 'all' }[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'All', value: 'all' },
];

export default function TeacherLeavesScreen() {
  const theme = useTheme();
  const { profile } = useTeacherAuth();
  const enabled = useSectionEnabled('leave');

  const classes = profile?.classes ?? [];
  const classOptions = classes.map((c) => ({
    label: `${c.class_name}${c.section_name ? ` - ${c.section_name}` : ''}`,
    value: String(c.class_id),
  }));

  const [classId, setClassId] = useState<string | null>(classOptions[0]?.value ?? null);
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | 'all'>('pending');
  const [applications, setApplications] = useState<TeacherLeaveApplication[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);

  const selected = classes.find((c) => String(c.class_id) === classId);

  function load() {
    if (!classId) return;
    setLoading(true);
    setError(false);
    fetchTeacherLeaveApplications(Number(classId), selected?.section_id ?? undefined, statusFilter === 'all' ? undefined : statusFilter)
      .then(setApplications)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(load, [classId, selected?.section_id, statusFilter]);

  async function handleReview(id: number, status: 'approved' | 'rejected') {
    setActingId(id);
    try {
      await reviewLeaveApplication(id, status);
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

        <View style={[styles.filterRow, { borderColor: theme.border }]}>
          {STATUS_FILTERS.map((f) => (
            <Pressable
              key={f.value}
              onPress={() => setStatusFilter(f.value)}
              style={[styles.filterButton, statusFilter === f.value && { backgroundColor: theme.tint }]}
            >
              <ThemedText type="small" themeColor={statusFilter === f.value ? 'textOnBrand' : 'textSecondary'}>
                {f.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        {loading ? (
          <Loading label="Loading leave requests…" />
        ) : error ? (
          <ErrorState message="Could not load leave requests." onRetry={load} />
        ) : !applications || applications.length === 0 ? (
          <EmptyState message="No leave requests here." icon="calendar-clear-outline" />
        ) : (
          applications.map((app) => {
            const meta = STATUS_META[app.status];
            return (
              <Card key={app.id} style={styles.appCard}>
                <View style={styles.appTop}>
                  <ThemedText type="smallBold">{app.student_name}</ThemedText>
                  <View style={[styles.pill, { backgroundColor: meta.bg }]}>
                    <ThemedText type="small" style={{ color: meta.color }}>
                      {meta.label}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                  SRN {app.student_srn} · {app.leave_type}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {app.date_from} to {app.date_to}
                </ThemedText>
                {app.reason ? (
                  <ThemedText type="small" style={styles.reason}>
                    {app.reason}
                  </ThemedText>
                ) : null}

                {app.status === 'pending' ? (
                  <View style={styles.actionRow}>
                    <Pressable
                      onPress={() => handleReview(app.id, 'approved')}
                      disabled={actingId === app.id}
                      style={[styles.actionButton, { backgroundColor: Brand.green, opacity: actingId === app.id ? 0.6 : 1 }]}
                    >
                      <Ionicons name="checkmark" size={16} color={Brand.white} />
                      <ThemedText type="small" style={styles.actionLabel}>
                        Approve
                      </ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={() => handleReview(app.id, 'rejected')}
                      disabled={actingId === app.id}
                      style={[styles.actionButton, { backgroundColor: Brand.red, opacity: actingId === app.id ? 0.6 : 1 }]}
                    >
                      <Ionicons name="close" size={16} color={Brand.white} />
                      <ThemedText type="small" style={styles.actionLabel}>
                        Reject
                      </ThemedText>
                    </Pressable>
                  </View>
                ) : null}
              </Card>
            );
          })
        )}
      </Screen>
    </TeacherGuard>
  );
}

const styles = StyleSheet.create({
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
  appCard: {
    marginBottom: Spacing.three,
  },
  appTop: {
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
  reason: {
    marginTop: Spacing.two,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
  actionLabel: {
    color: Brand.white,
  },
});
