import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { FullScreenGallery } from '@/components/ui/FullScreenGallery';
import { Screen } from '@/components/ui/Screen';
import { VideoPlayerModal } from '@/components/ui/VideoPlayerModal';
import { EmptyState, ErrorState, Loading } from '@/components/ui/states';
import { ThemedText } from '@/components/ui/ThemedText';
import { TeacherGuard } from '@/components/ui/TeacherGuard';
import {
  deleteTeacherStorageItems,
  fetchTeacherStorageItems,
  fetchTeacherStorageSummary,
  StorageCategory,
  StorageItem,
  TeacherStorageSummary,
} from '@/data/teacher-api';
import { useTheme } from '@/hooks/use-theme';

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[i]}`;
}

const CATEGORY_META: Record<StorageCategory, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  homework: { label: 'Homework Photos', icon: 'book-outline' },
  events: { label: 'Event Media', icon: 'calendar-outline' },
  student_photos: { label: 'Student Photos', icon: 'people-outline' },
  syllabus: { label: 'Syllabus Attachments', icon: 'journal-outline' },
};

/** Circular Storage Usage Donut Graph Component */
function StorageCircleGraph({
  usedPercent,
  usedBytes,
  limitBytes = 1073741824,
  onManageClick,
}: {
  usedPercent: number;
  usedBytes: number;
  limitBytes?: number;
  onManageClick?: () => void;
}) {
  const theme = useTheme();
  const clampedPercent = Math.min(100, Math.max(0, usedPercent));
  const remainingBytes = Math.max(0, limitBytes - usedBytes);

  let statusColor = '#10B981'; // Green
  let statusText = 'Optimal';
  if (clampedPercent > 90) {
    statusColor = '#EF4444'; // Red
    statusText = 'Storage Almost Full';
  } else if (clampedPercent > 70) {
    statusColor = '#F59E0B'; // Orange
    statusText = 'Moderate Usage';
  }

  return (
    <Card style={styles.graphCard}>
      <View style={styles.graphHeader}>
        <View>
          <ThemedText type="smallBold" style={{ color: theme.dark ? '#FFFFFF' : theme.text }}>
            TEACHER CLOUD STORAGE (1 GB LIMIT)
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {formatBytes(usedBytes)} used of {formatBytes(limitBytes)}
          </ThemedText>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <ThemedText type="smallBold" style={{ color: statusColor, fontSize: 11 }}>
            {statusText}
          </ThemedText>
        </View>
      </View>

      {/* Circle Graph Visual */}
      <View style={styles.circleContainer}>
        <View style={[styles.outerCircle, { borderColor: theme.dark ? '#334155' : '#E2E8F0' }]}>
          <View
            style={[
              styles.circleProgressRing,
              {
                borderColor: statusColor,
                borderTopColor: clampedPercent > 25 ? statusColor : 'transparent',
                borderRightColor: clampedPercent > 50 ? statusColor : 'transparent',
                borderBottomColor: clampedPercent > 75 ? statusColor : 'transparent',
              },
            ]}
          />
          <View style={[styles.innerCircle, { backgroundColor: theme.dark ? '#1E293B' : '#F8FAFC' }]}>
            <ThemedText type="title" style={{ fontSize: 26, fontWeight: '700', color: statusColor }}>
              {clampedPercent.toFixed(1)}%
            </ThemedText>
            <ThemedText type="smallBold" themeColor="textSecondary" style={{ fontSize: 11 }}>
              USED
            </ThemedText>
          </View>
        </View>

        <View style={styles.circleStatsCol}>
          <View style={styles.statRowItem}>
            <View style={[styles.statSquare, { backgroundColor: statusColor }]} />
            <View>
              <ThemedText type="small" themeColor="textSecondary">
                Used Storage
              </ThemedText>
              <ThemedText type="smallBold">{formatBytes(usedBytes)}</ThemedText>
            </View>
          </View>
          <View style={styles.statRowItem}>
            <View style={[styles.statSquare, { backgroundColor: theme.dark ? '#475569' : '#CBD5E1' }]} />
            <View>
              <ThemedText type="small" themeColor="textSecondary">
                Free Remaining
              </ThemedText>
              <ThemedText type="smallBold">{formatBytes(remainingBytes)}</ThemedText>
            </View>
          </View>

          {onManageClick ? (
            <Pressable
              onPress={onManageClick}
              style={[styles.manageBtn, { backgroundColor: theme.dark ? '#2563EB' : theme.tint }]}
            >
              <Ionicons name="folder-open-outline" size={14} color={Brand.white} />
              <ThemedText type="smallBold" style={{ color: Brand.white, fontSize: 12 }}>
                Backup & Cleanup
              </ThemedText>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

function CategoryView({ type, onBack, onChanged }: { type: StorageCategory; onBack: () => void; onChanged: () => void }) {
  const theme = useTheme();
  const [items, setItems] = useState<StorageItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<Set<number | string>>(new Set());
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function load() {
    setLoading(true);
    setError(false);
    fetchTeacherStorageItems(type)
      .then(setItems)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(load, [type]);

  function toggle(id: number | string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleDownloadSelected() {
    if (!items || selected.size === 0) return;
    setBusy(true);
    try {
      const canShare = await Sharing.isAvailableAsync();
      const targets = items.filter((i) => selected.has(i.id));
      for (const item of targets) {
        const filename = item.url.split('/').pop() || `file-${item.id}`;
        const targetUri = `${FileSystem.cacheDirectory}${filename}`;
        await FileSystem.downloadAsync(item.url, targetUri);
        if (canShare) {
          await Sharing.shareAsync(targetUri, { dialogTitle: filename });
        } else {
          await Linking.openURL(item.url);
        }
      }
    } catch (e) {
      Alert.alert('Download failed', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }

  function promptBackupOrDelete() {
    Alert.alert(
      'Backup or Delete Options',
      'What would you like to do with the selected item(s)?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Backup / Download to Phone',
          onPress: handleDownloadSelected,
        },
        {
          text: 'Delete from Server Path',
          style: 'destructive',
          onPress: handleDeleteSelected,
        },
      ]
    );
  }

  function handleDeleteSelected() {
    if (selected.size === 0) return;
    Alert.alert(
      'Confirm Permanent Deletion',
      `Are you sure you want to delete ${selected.size} file(s)? This will physically remove the files from the server storage path. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              await deleteTeacherStorageItems(type, Array.from(selected));
              setSelected(new Set());
              load();
              onChanged();
              Alert.alert('Cleared', 'Selected files have been deleted from server storage.');
            } catch (e) {
              Alert.alert('Could not delete', e instanceof Error ? e.message : 'Please try again.');
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  }

  const imageItems = (items ?? []).filter((i) => i.media_type === 'image');

  return (
    <>
      <Pressable onPress={onBack} style={styles.backRow} hitSlop={8}>
        <Ionicons name="chevron-back" size={18} color={theme.dark ? '#FFFFFF' : theme.tint} />
        <ThemedText type="small" style={{ color: theme.dark ? '#FFFFFF' : theme.tint }}>
          All Storage Categories
        </ThemedText>
      </Pressable>

      <ThemedText type="subtitle" style={styles.categoryTitle}>
        {CATEGORY_META[type].label}
      </ThemedText>

      {loading ? (
        <Loading label="Loading files…" />
      ) : error ? (
        <ErrorState message="Could not load files." onRetry={load} />
      ) : !items || items.length === 0 ? (
        <EmptyState message="No files found in this category." icon={CATEGORY_META[type].icon} />
      ) : (
        <>
          <View style={styles.grid}>
            {items.map((item) => {
              const isSelected = selected.has(item.id);
              return (
                <Pressable
                  key={String(item.id)}
                  onLongPress={() => toggle(item.id)}
                  onPress={() => {
                    if (selected.size > 0) {
                      toggle(item.id);
                    } else if (item.media_type === 'image') {
                      setPreviewIndex(imageItems.findIndex((i) => i.id === item.id));
                    } else if (item.media_type === 'pdf' || item.media_type === 'document') {
                      Linking.openURL(item.url).catch(() => Alert.alert('Cannot open file'));
                    } else {
                      setVideoUrl(item.url);
                    }
                  }}
                  style={styles.gridItem}
                >
                  {item.media_type === 'image' ? (
                    <Image source={{ uri: item.url }} style={styles.thumb} contentFit="cover" />
                  ) : item.media_type === 'pdf' ? (
                    <View style={[styles.thumb, styles.fileThumb, { backgroundColor: '#FEF2F2' }]}>
                      <Ionicons name="document-text" size={30} color="#EF4444" />
                      <ThemedText type="smallBold" style={{ color: '#EF4444', fontSize: 10, marginTop: 2 }}>
                        PDF
                      </ThemedText>
                    </View>
                  ) : (
                    <View style={[styles.thumb, styles.fileThumb, { backgroundColor: theme.backgroundSelected }]}>
                      <Ionicons name="play-circle" size={28} color={theme.textSecondary} />
                    </View>
                  )}
                  <View style={[styles.checkbox, { borderColor: theme.border, backgroundColor: isSelected ? theme.tint : theme.surface }]}>
                    {isSelected ? <Ionicons name="checkmark" size={14} color={Brand.white} /> : null}
                  </View>
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.gridLabel}>
                    {item.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
            Tap to view file. Long-press to select multiple files to backup or clear storage.
          </ThemedText>

          {selected.size > 0 ? (
            <View style={styles.actionRow}>
              <Pressable
                onPress={handleDownloadSelected}
                disabled={busy}
                style={[styles.actionButton, { borderColor: theme.tint, opacity: busy ? 0.6 : 1 }]}
              >
                <Ionicons name="download-outline" size={16} color={theme.tint} />
                <ThemedText type="small" themeColor="tint">
                  Backup ({selected.size})
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={promptBackupOrDelete}
                disabled={busy}
                style={[styles.actionButton, { borderColor: Brand.red, opacity: busy ? 0.6 : 1 }]}
              >
                <Ionicons name="trash-outline" size={16} color={Brand.red} />
                <ThemedText type="small" style={{ color: Brand.red }}>
                  Clear Storage ({selected.size})
                </ThemedText>
              </Pressable>
            </View>
          ) : null}
        </>
      )}

      {previewIndex !== null && previewIndex >= 0 ? (
        <FullScreenGallery
          visible
          photoUrls={imageItems.map((i) => i.url)}
          initialIndex={previewIndex}
          onClose={() => setPreviewIndex(null)}
        />
      ) : null}

      <VideoPlayerModal visible={!!videoUrl} onClose={() => setVideoUrl(null)} uri={videoUrl} />
    </>
  );
}

export default function TeacherStorageScreen() {
  const theme = useTheme();
  const [summary, setSummary] = useState<TeacherStorageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeCategory, setActiveCategory] = useState<StorageCategory | null>(null);

  function load() {
    setLoading(true);
    setError(false);
    fetchTeacherStorageSummary()
      .then(setSummary)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const totalUsed = summary?.total_bytes ?? 0;
  const limitBytes = summary?.limit_bytes ?? 1073741824; // 1 GB
  const usedPercent = summary?.used_percent ?? (totalUsed > 0 ? (totalUsed / limitBytes) * 100 : 0);

  function handleBackupOrClearAlert() {
    Alert.alert(
      'Cloud Storage Options (1 GB Max)',
      `You are currently using ${formatBytes(totalUsed)} (${usedPercent.toFixed(1)}%) of your 1 GB limit.\n\nTo free up storage space, you can download/backup your files to your phone or Google Drive, then delete files from server path.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Select Category to Manage',
          onPress: () => setActiveCategory('syllabus'),
        },
      ]
    );
  }

  return (
    <TeacherGuard>
      <Screen>
        {activeCategory ? (
          <CategoryView type={activeCategory} onBack={() => setActiveCategory(null)} onChanged={load} />
        ) : (
          <>
            <ThemedText type="small" themeColor="textSecondary" style={styles.intro}>
              Manage files you uploaded (syllabus PDFs, homework photos, event media). Each teacher has a 1 GB storage limit.
            </ThemedText>

            {loading ? (
              <Loading label="Calculating storage usage…" />
            ) : error || !summary ? (
              <ErrorState message="Could not load storage details." onRetry={load} />
            ) : (
              <>
                {/* 1 GB Storage Circle Graph Widget */}
                <StorageCircleGraph
                  usedPercent={usedPercent}
                  usedBytes={totalUsed}
                  limitBytes={limitBytes}
                  onManageClick={handleBackupOrClearAlert}
                />

                <ThemedText type="smallBold" style={styles.sectionHeader}>
                  STORAGE CATEGORIES
                </ThemedText>

                {(Object.keys(CATEGORY_META) as StorageCategory[]).map((key) => {
                  const catSummary = summary[key] ?? { count: 0, bytes: 0 };
                  return (
                    <Pressable key={key} onPress={() => setActiveCategory(key)}>
                      <Card style={styles.categoryCard}>
                        <View style={[styles.categoryIcon, { backgroundColor: theme.dark ? theme.tint : theme.backgroundSelected }]}>
                          <Ionicons name={CATEGORY_META[key].icon} size={20} color={theme.dark ? '#FFFFFF' : theme.tint} />
                        </View>
                        <View style={styles.categoryInfo}>
                          <ThemedText type="smallBold" style={{ color: theme.dark ? '#FFFFFF' : theme.text }}>
                            {CATEGORY_META[key].label}
                          </ThemedText>
                          <ThemedText type="small" themeColor="textSecondary">
                            {catSummary.count} items · {formatBytes(catSummary.bytes)}
                          </ThemedText>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={theme.dark ? '#FFFFFF' : theme.textSecondary} />
                      </Card>
                    </Pressable>
                  );
                })}
              </>
            )}
          </>
        )}
      </Screen>
    </TeacherGuard>
  );
}

const styles = StyleSheet.create({
  intro: {
    marginBottom: Spacing.three,
    lineHeight: 18,
  },
  graphCard: {
    padding: Spacing.four,
    marginBottom: Spacing.four,
  },
  graphHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  circleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
    marginTop: Spacing.two,
  },
  outerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  circleProgressRing: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
  },
  innerCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleStatsCol: {
    flex: 1,
    gap: Spacing.two,
  },
  statRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  statSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    marginTop: Spacing.one,
  },
  sectionHeader: {
    marginBottom: Spacing.two,
    marginTop: Spacing.two,
    letterSpacing: 0.5,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInfo: {
    flex: 1,
    gap: 2,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.two,
  },
  categoryTitle: {
    marginBottom: Spacing.three,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  gridItem: {
    width: '31%',
  },
  thumb: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Radius.sm,
  },
  fileThumb: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridLabel: {
    marginTop: 4,
  },
  hint: {
    marginTop: Spacing.three,
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
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});

