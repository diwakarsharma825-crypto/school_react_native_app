import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, Loading } from '@/components/ui/states';
import { ThemedText } from '@/components/ui/ThemedText';
import { deleteTeacherNotice, fetchTeacherNotices, TeacherNotice, toggleTeacherNotice } from '@/data/teacher-api';
import { TeacherGuard } from '@/components/ui/TeacherGuard';
import { useTheme } from '@/hooks/use-theme';
import { ExportPdfButton } from '@/components/ui/ExportPdfButton';
import { exportToPdf } from '@/lib/pdf-export';

import { NoticeDetailModal } from '@/components/ui/NoticeDetailModal';

export default function TeacherNoticesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [notices, setNotices] = useState<TeacherNotice[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<TeacherNotice | null>(null);

  function load() {
    setLoading(true);
    setError(false);
    fetchTeacherNotices()
      .then(setNotices)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  // Reload every time this screen regains focus — coming back from
  // add/edit shouldn't require a manual pull-to-refresh to see the change.
  useFocusEffect(useCallback(load, []));

  function confirmDelete(notice: TeacherNotice) {
    Alert.alert('Delete notice?', `"${notice.title}" will be permanently removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteTeacherNotice(notice.id)
            .then(load)
            .catch((e) => Alert.alert('Could not delete', e instanceof Error ? e.message : 'Please try again.'));
        },
      },
    ]);
  }

  function toggleActive(n: TeacherNotice, active: boolean) {
    toggleTeacherNotice(n.id, active)
      .then(load)
      .catch((e) => Alert.alert('Could not update', e instanceof Error ? e.message : 'Please try again.'));
  }

  return (
    <TeacherGuard>
    <Screen>
      <View style={{ flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.four }}>
        <Pressable
          onPress={() => router.push('/teacher-add-notice' as any)}
          style={[styles.addButton, { backgroundColor: theme.dark ? '#2563EB' : theme.tint, flex: 1, marginBottom: 0 }]}
        >
          <Ionicons name="add" size={18} color={Brand.white} />
          <ThemedText type="smallBold" style={styles.addButtonLabel}>
            New Notice
          </ThemedText>
        </Pressable>

        <ExportPdfButton
          variant="outline"
          style={{ flex: 1, marginBottom: 0 }}
          onPress={() => {
            if (!notices || notices.length === 0) return;
            exportToPdf({
              title: 'Teacher Notices Report',
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
          }}
        />
      </View>

      {loading ? (
        <Loading label="Loading notices…" />
      ) : error ? (
        <ErrorState message="Could not load notices." onRetry={load} />
      ) : !notices || notices.length === 0 ? (
        <EmptyState message="No notices posted yet." icon="megaphone-outline" />
      ) : (
        notices.map((n) => {
          const active = Number(n.is_view_on_web) === 1;
          const image = (n as any).image_url || (n as any).photo || (n as any).attachment || null;
          return (
            <Card key={n.id} style={[styles.card, !active && styles.cardInactive]}>
              <Pressable onPress={() => setSelectedNotice(n)}>
                <View style={styles.cardHeader}>
                  <ThemedText type="smallBold" style={styles.cardTitle} numberOfLines={1}>
                    {n.title}
                  </ThemedText>
                  <View
                    style={[
                      styles.statusTag,
                      {
                        backgroundColor: active
                          ? theme.dark
                            ? '#1B4D24'
                            : '#DFF1E1'
                          : theme.dark
                          ? '#3E351A'
                          : '#F1E9D9',
                      },
                    ]}
                  >
                    <ThemedText
                      type="smallBold"
                      style={{
                        color: active
                          ? theme.dark
                            ? '#81C784'
                            : '#2E7D32'
                          : theme.dark
                          ? '#FFD54F'
                          : '#9A7B2E',
                      }}
                    >
                      {active ? 'Active' : 'Inactive'}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText type="small" style={{ color: theme.dark ? '#FFFFFF' : theme.textSecondary }}>
                  {n.date}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.dark ? '#FFFFFF' : theme.textSecondary, marginTop: 4 }} numberOfLines={3}>
                  {n.notice}
                </ThemedText>

                {image ? (
                  <View style={{ marginTop: Spacing.two, height: 140, borderRadius: Radius.md, overflow: 'hidden' }}>
                    <Image source={{ uri: image }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  </View>
                ) : null}
              </Pressable>

              <View style={styles.actionsRow}>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/teacher-add-notice',
                      params: { id: String(n.id), initialTitle: n.title, initialBody: n.notice },
                    } as any)
                  }
                  style={styles.actionButton}
                >
                  <Ionicons name="create-outline" size={16} color={theme.dark ? '#FFFFFF' : theme.tint} />
                  <ThemedText type="small" style={{ color: theme.dark ? '#FFFFFF' : theme.tint, fontWeight: '600' }}>
                    Edit
                  </ThemedText>
                </Pressable>
                <Pressable onPress={() => toggleActive(n, !active)} style={styles.actionButton}>
                  <Ionicons name={active ? 'eye-off-outline' : 'eye-outline'} size={16} color={theme.dark ? '#FFFFFF' : theme.textSecondary} />
                  <ThemedText type="small" style={{ color: theme.dark ? '#FFFFFF' : theme.textSecondary }}>
                    {active ? 'Deactivate' : 'Activate'}
                  </ThemedText>
                </Pressable>
                <Pressable onPress={() => confirmDelete(n)} style={styles.actionButton}>
                  <Ionicons name="trash-outline" size={16} color={Brand.red} />
                  <ThemedText type="small" style={{ color: Brand.red }}>
                    Delete
                  </ThemedText>
                </Pressable>
              </View>
            </Card>
          );
        })
      )}

      {selectedNotice ? (
        <NoticeDetailModal
          visible={!!selectedNotice}
          onClose={() => setSelectedNotice(null)}
          title={selectedNotice.title}
          date={selectedNotice.date}
          notice={selectedNotice.notice}
          statusLabel={Number(selectedNotice.is_view_on_web) === 1 ? 'Active' : 'Inactive'}
          isActiveStatus={Number(selectedNotice.is_view_on_web) === 1}
          imageUrl={(selectedNotice as any).image_url || (selectedNotice as any).photo || (selectedNotice as any).attachment || null}
          onEdit={() =>
            router.push({
              pathname: '/teacher-add-notice',
              params: { id: String(selectedNotice.id), initialTitle: selectedNotice.title, initialBody: selectedNotice.notice },
            } as any)
          }
        />
      ) : null}
    </Screen>
    </TeacherGuard>
  );
}

const styles = StyleSheet.create({
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.three,
    borderRadius: Radius.pill,
    marginBottom: Spacing.four,
  },
  addButtonLabel: {
    color: Brand.white,
  },
  card: {
    marginBottom: Spacing.three,
  },
  cardInactive: {
    opacity: 0.65,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  statusTag: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  cardTitle: {
    flex: 1,
  },
  cardBody: {
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.four,
    marginTop: Spacing.three,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
