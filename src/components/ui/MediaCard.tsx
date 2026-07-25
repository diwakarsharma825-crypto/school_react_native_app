import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { excerptFrom, formatDateShort } from '@/lib/format';
import { Card } from './Card';
import { ThemedText } from './ThemedText';

interface MediaCardProps {
  title: string;
  date: string;
  imageUrl: string;
  excerpt?: string;
  category: 'News' | 'Event';
  onPress?: () => void;
  /** Fixed width, used for the horizontally-scrollable home rows. */
  width?: number;
}

export function MediaCard({ title, date, imageUrl, excerpt, category, onPress, width }: MediaCardProps) {
  const theme = useTheme();

  return (
    <Card
      onPress={onPress}
      style={[styles.card, width ? { width, marginRight: Spacing.three } : { marginBottom: Spacing.three }]}
    >
      <View style={styles.imageWrap}>
        <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" />
        <View style={[styles.pill, styles.datePill]}>
          <ThemedText type="small" style={styles.pillText}>
            {formatDateShort(date)}
          </ThemedText>
        </View>
        <View style={[styles.pill, styles.categoryPill]}>
          <ThemedText type="small" style={styles.pillText}>
            {category}
          </ThemedText>
        </View>
      </View>
      <ThemedText type="smallBold" numberOfLines={2} style={styles.title}>
        {title}
      </ThemedText>
      {excerpt ? (
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={2} style={styles.excerpt}>
          {excerptFrom(excerpt)}
        </ThemedText>
      ) : null}
      <View style={styles.readMoreRow}>
        <ThemedText type="smallBold" themeColor="tint">
          Read more
        </ThemedText>
        <View style={[styles.readMoreCircle, { backgroundColor: theme.accent }]}>
          <Ionicons name="arrow-forward" size={12} color="#fff" />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.two,
  },
  imageWrap: {
    position: 'relative',
    marginBottom: Spacing.two,
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: Radius.md,
  },
  pill: {
    position: 'absolute',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
  },
  datePill: {
    top: Spacing.one,
    left: Spacing.one,
    backgroundColor: Brand.saffron,
  },
  categoryPill: {
    top: Spacing.one,
    right: Spacing.one,
    backgroundColor: 'rgba(18,58,107,0.85)',
  },
  pillText: {
    color: '#fff',
    fontSize: 11,
  },
  title: {
    marginBottom: Spacing.half,
  },
  excerpt: {
    marginBottom: Spacing.two,
  },
  readMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  readMoreCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
