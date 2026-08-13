import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

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
};

function CategoryView({ type, onBack, onChanged }: { type: StorageCategory; onBack: () => void; onChanged: () => void }) {
  const theme = useTheme();
  const [items, setItems] = useState<StorageItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
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

  function toggle(id: number) {
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
        const file = await FileSystem.File.downloadFileAsync(item.url, new FileSystem.Directory(FileSystem.Paths.cache), { idempotent: true });
        if (canShare) {
          await Sharing.shareAsync(file.uri, { dialogTitle: filename });
        }
      }
    } catch (e) {
      Alert.alert('Download failed', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }

  function handleDeleteSelected() {
    if (selected.size === 0) return;
    Alert.alert(
      'Delete selected?',
      `This permanently deletes ${selected.size} item(s) you uploaded. This can't be undone — make sure you've downloaded anything you want to keep.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              await deleteTeacherStorageItems(type, Array.from(selected));
              setSelected(new Set());
              load();
              onChanged();
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
        <Ionicons name="chevron-back" size={18} color={theme.tint} />
        <ThemedText type="small" themeColor="tint">
          All Storage
        </ThemedText>
      </Pressable>

      <ThemedText type="subtitle" style={styles.categoryTitle}>
        {CATEGORY_META[type].label}
      </ThemedText>

      {loading ? (
        <Loading label="Loading…" />
      ) : error ? (
        <ErrorState message="Could not load items." onRetry={load} />
      ) : !items || items.length === 0 ? (
        <EmptyState message="Nothing here." icon={CATEGORY_META[type].icon} />
      ) : (
        <>
          <View style={styles.grid}>
            {items.map((item) => {
              const isSelected = selected.has(item.id);
              return (
                <Pressable
                  key={item.id}
                  onLongPress={() => toggle(item.id)}
                  onPress={() => {
                    if (selected.size > 0) {
                      toggle(item.id);
                    } else if (item.media_type === 'image') {
                      setPreviewIndex(imageItems.findIndex((i) => i.id === item.id));
                    } else {
                      setVideoUrl(item.url);
                    }
                  }}
                  style={styles.gridItem}
                >
                  {item.media_type === 'image' ? (
                    <Image source={{ uri: item.url }} style={styles.thumb} contentFit="cover" />
                  ) : (
                    <View style={[styles.thumb, styles.videoThumb, { backgroundColor: theme.backgroundSelected }]}>
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
            Long-press to select, tap to preview. Select items, then download or delete below.
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
                  Download ({selected.size})
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={handleDeleteSelected}
                disabled={busy}
                style={[styles.actionButton, { borderColor: Brand.red, opacity: busy ? 0.6 : 1 }]}
              >
                <Ionicons name="trash-outline" size={16} color={Brand.red} />
                <ThemedText type="small" style={{ color: Brand.red }}>
                  Delete ({selected.size})
                </ThemedText>
              </Pressable>
            </View>
          ) : null}
        </>
      )}

      {previewIndex !== null ? (
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

  return (
    <TeacherGuard>
      <Screen>
        {activeCategory ? (
          <CategoryView type={activeCategory} onBack={() => setActiveCategory(null)} onChanged={load} />
        ) : (
          <>
            <ThemedText type="small" themeColor="textSecondary" style={styles.intro}>
              Everything you personally uploaded — across all your classes. Download what you want to keep, then
              clear space by deleting.
            </ThemedText>

            {loading ? (
              <Loading label="Calculating…" />
            ) : error || !summary ? (
              <ErrorState message="Could not load storage." onRetry={load} />
            ) : (
              <>
                <View style={[styles.totalCard, { backgroundColor: theme.tint }]}>
                  <ThemedText type="small" themeColor="textOnBrand">
                    Total You've Uploaded
                  </ThemedText>
                  <ThemedText type="title" themeColor="textOnBrand">
                    {formatBytes(summary.total_bytes)}
                  </ThemedText>
                </View>

                {(Object.keys(CATEGORY_META) as StorageCategory[]).map((key) => (
                  <Pressable key={key} onPress={() => setActiveCategory(key)}>
                    <Card style={styles.categoryCard}>
                      <View style={[styles.categoryIcon, { backgroundColor: theme.backgroundSelected }]}>
                        <Ionicons name={CATEGORY_META[key].icon} size={20} color={theme.tint} />
                      </View>
                      <View style={styles.categoryInfo}>
                        <ThemedText type="smallBold">{CATEGORY_META[key].label}</ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {summary[key].count} items · {formatBytes(summary[key].bytes)}
                        </ThemedText>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
                    </Card>
                  </Pressable>
                ))}
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
  totalCard: {
    borderRadius: Radius.lg,
    padding: Spacing.four,
    marginBottom: Spacing.four,
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
  videoThumb: {
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
