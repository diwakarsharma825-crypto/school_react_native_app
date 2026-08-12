import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, Loading } from '@/components/ui/states';
import { ThemedText } from '@/components/ui/ThemedText';
import { deleteTeacherEvent, fetchTeacherEvents, TeacherEvent, toggleTeacherEvent } from '@/data/teacher-api';
import { TeacherGuard } from '@/components/ui/TeacherGuard';
import { useTheme } from '@/hooks/use-theme';
import { exportToPdf } from '@/lib/pdf-export';

export default function TeacherEventsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [events, setEvents] = useState<TeacherEvent[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  function load() {
    setLoading(true);
    setError(false);
    fetchTeacherEvents()
      .then(setEvents)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  // Reload every time this screen regains focus — coming back from
  // add/edit shouldn't require a manual pull-to-refresh to see the change.
  useFocusEffect(useCallback(load, []));

  function confirmDelete(event: TeacherEvent) {
    Alert.alert('Delete event?', `"${event.title}" will be permanently removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteTeacherEvent(event.id)
            .then(load)
            .catch((e) => Alert.alert('Could not delete', e instanceof Error ? e.message : 'Please try again.'));
        },
      },
    ]);
  }

  function toggleActive(e: TeacherEvent, active: boolean) {
    toggleTeacherEvent(e.id, active)
      .then(load)
      .catch((err) => Alert.alert('Could not update', err instanceof Error ? err.message : 'Please try again.'));
  }

  return (
    <TeacherGuard>
    <Screen>
      <View style={{ flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.four }}>
        <Pressable
          onPress={() => router.push('/teacher-event-add' as any)}
          style={[styles.addButton, { backgroundColor: theme.tint, flex: 1, marginBottom: 0 }]}
        >
          <Ionicons name="add" size={18} color={Brand.white} />
          <ThemedText type="smallBold" style={styles.addButtonLabel}>
            New Event
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={() => {
            if (!events || events.length === 0) return;
            const allImages = events.flatMap((e) => e.media.filter((m) => m.type === 'image').map((m) => m.url));
            exportToPdf({
              title: 'Teacher Events Report',
              subtitle: `Total Events: ${events.length}`,
              columns: [
                { header: 'From - To', key: 'dates', width: '25%' },
                { header: 'Title', key: 'title', width: '30%' },
                { header: 'Class', key: 'class_label', width: '20%' },
                { header: 'Place / Note', key: 'note', width: '25%' },
              ],
              rows: events.map((e) => ({
                ...e,
                dates: `${e.event_from}${e.event_to && e.event_to !== e.event_from ? ` — ${e.event_to}` : ''}`,
              })),
              images: allImages,
            });
          }}
          style={[styles.addButton, { backgroundColor: theme.surface, borderColor: theme.tint, borderWidth: 1.5, flex: 1, marginBottom: 0 }]}
        >
          <Ionicons name="document-text-outline" size={18} color={theme.tint} />
          <ThemedText type="smallBold" themeColor="tint">
            Export PDF
          </ThemedText>
        </Pressable>
      </View>

      {loading ? (
        <Loading label="Loading events…" />
      ) : error ? (
        <ErrorState message="Could not load events." onRetry={load} />
      ) : !events || events.length === 0 ? (
        <EmptyState message="No events posted yet." icon="calendar-outline" />
      ) : (
        events.map((e) => {
          const cover = e.media.find((m) => m.type === 'image')?.url ?? e.image_url ?? null;
          const hasVideo = e.media.some((m) => m.type === 'video');
          const active = Number(e.is_view_on_web) === 1;
          return (
            <Card key={e.id} style={[styles.card, !active && styles.cardInactive]}>
              <View style={styles.row}>
                {cover ? (
                  <View style={styles.thumbWrap}>
                    <Image source={{ uri: cover }} style={styles.thumb} contentFit="cover" />
                    {hasVideo ? (
                      <View style={styles.videoBadge}>
                        <Ionicons name="videocam" size={12} color={Brand.white} />
                      </View>
                    ) : null}
                  </View>
                ) : (
                  <View style={[styles.thumb, styles.thumbFallback, { backgroundColor: theme.backgroundSelected }]}>
                    <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} />
                  </View>
                )}
                <View style={styles.info}>
                  <View style={styles.titleRow}>
                    <ThemedText type="smallBold" numberOfLines={1} style={styles.titleText}>
                      {e.title}
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
                    {e.event_from}
                    {e.event_to && e.event_to !== e.event_from ? ` — ${e.event_to}` : ''}
                  </ThemedText>
                  {e.class_label ? (
                    <ThemedText type="small" style={{ color: theme.dark ? '#FFFFFF' : theme.textSecondary }}>
                      {e.class_label}
                    </ThemedText>
                  ) : null}
                </View>
              </View>
              <View style={styles.actionsRow}>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/teacher-event-add',
                      params: {
                        id: String(e.id),
                        initialTitle: e.title,
                        initialPlace: e.event_place ?? '',
                        initialFrom: e.event_from,
                        initialTo: e.event_to,
                        initialNote: e.note ?? '',
                        existingMedia: JSON.stringify(e.media),
                      },
                    } as any)
                  }
                  style={styles.actionButton}
                >
                  <Ionicons name="create-outline" size={16} color={theme.dark ? '#FFFFFF' : theme.tint} />
                  <ThemedText type="small" style={{ color: theme.dark ? '#FFFFFF' : theme.tint, fontWeight: '600' }}>
                    Edit
                  </ThemedText>
                </Pressable>
                <Pressable onPress={() => toggleActive(e, !active)} style={styles.actionButton}>
                  <Ionicons name={active ? 'eye-off-outline' : 'eye-outline'} size={16} color={theme.dark ? '#FFFFFF' : theme.textSecondary} />
                  <ThemedText type="small" style={{ color: theme.dark ? '#FFFFFF' : theme.textSecondary }}>
                    {active ? 'Deactivate' : 'Activate'}
                  </ThemedText>
                </Pressable>
                <Pressable onPress={() => confirmDelete(e)} style={styles.actionButton}>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  titleText: {
    flex: 1,
  },
  statusTag: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  thumbWrap: {
    position: 'relative',
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: Radius.sm,
  },
  thumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoBadge: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 3,
    padding: 2,
  },
  info: {
    flex: 1,
    gap: 2,
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
