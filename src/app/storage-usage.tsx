import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, Loading } from '@/components/ui/states';
import { ThemedText } from '@/components/ui/ThemedText';
import { fetchStorageUsage, StorageUsage } from '@/data/api';
import { useTheme } from '@/hooks/use-theme';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[i]}`;
}

const CATEGORY_META: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  events: { label: 'Events', icon: 'calendar', color: '#E8871E' },
  gallery: { label: 'Gallery', icon: 'images', color: '#2E6FBE' },
  homework: { label: 'Homework', icon: 'book', color: '#3E8E5B' },
  students: { label: 'Student Photos', icon: 'people', color: '#B8860B' },
};

export default function StorageUsageScreen() {
  const theme = useTheme();
  const [data, setData] = useState<StorageUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  function load() {
    setLoading(true);
    setError(false);
    fetchStorageUsage()
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  if (loading && !data) {
    return (
      <Screen scroll={false}>
        <Loading label="Calculating storage…" />
      </Screen>
    );
  }
  if (error || !data) {
    return (
      <Screen scroll={false}>
        <ErrorState message="Could not load storage usage." onRetry={load} />
      </Screen>
    );
  }

  const percent = Math.min(100, Math.round((data.usedBytes / data.quotaBytes) * 1000) / 10);
  const freeBytes = Math.max(0, data.quotaBytes - data.usedBytes);
  const categories = Object.entries(data.breakdown).sort(([, a], [, b]) => b - a);
  const maxCategoryBytes = Math.max(1, ...categories.map(([, v]) => v));

  return (
    <Screen>
      <View style={[styles.heroCard, { backgroundColor: theme.tint }]}>
        <ThemedText type="title" style={styles.heroPercent}>
          {percent}%
        </ThemedText>
        <ThemedText type="small" style={styles.heroLabel}>
          of your 1GB used
        </ThemedText>

        <View style={styles.heroBarTrack}>
          <View style={[styles.heroBarFill, { width: `${Math.max(2, percent)}%` }]} />
        </View>

        <View style={styles.heroFooterRow}>
          <ThemedText type="smallBold" style={styles.heroUsed}>
            {formatBytes(data.usedBytes)} used
          </ThemedText>
          <ThemedText type="small" style={styles.heroFree}>
            {formatBytes(freeBytes)} free
          </ThemedText>
        </View>
      </View>

      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
        BREAKDOWN
      </ThemedText>

      {categories.map(([key, bytes]) => {
        const meta = CATEGORY_META[key] ?? { label: key, icon: 'folder' as const, color: theme.tint };
        const barPercent = Math.max(2, Math.round((bytes / maxCategoryBytes) * 100));
        return (
          <Card key={key} style={styles.categoryCard}>
            <View style={styles.categoryHeader}>
              <View style={[styles.categoryIcon, { backgroundColor: meta.color + '22' }]}>
                <Ionicons name={meta.icon} size={16} color={meta.color} />
              </View>
              <ThemedText type="smallBold" style={styles.categoryLabel}>
                {meta.label}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {formatBytes(bytes)}
              </ThemedText>
            </View>
            <View style={[styles.barTrack, { backgroundColor: theme.backgroundSelected }]}>
              <View style={[styles.barFill, { width: `${barPercent}%`, backgroundColor: meta.color }]} />
            </View>
          </Card>
        );
      })}

      <ThemedText type="small" themeColor="textSecondary" style={styles.footnote}>
        Includes photos and videos from events, the gallery, homework attachments, and student
        photos uploaded by teachers.
      </ThemedText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: Radius.lg,
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.four,
  },
  heroPercent: {
    color: Brand.white,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  heroBarTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
    marginTop: Spacing.four,
  },
  heroBarFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: Brand.white,
  },
  heroFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  heroUsed: {
    color: Brand.white,
  },
  heroFree: {
    color: 'rgba(255,255,255,0.85)',
  },
  sectionTitle: {
    marginBottom: Spacing.two,
    letterSpacing: 0.5,
  },
  categoryCard: {
    marginBottom: Spacing.three,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  categoryIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    flex: 1,
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  footnote: {
    lineHeight: 18,
    marginTop: Spacing.two,
    marginBottom: Spacing.five,
  },
});
