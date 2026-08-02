import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import type { EventMediaItem } from '@/data/types';
import { formatDateShort } from '@/lib/format';
import { EventMediaCarousel } from '../ui/EventMediaCarousel';
import { ThemedText } from '../ui/ThemedText';

interface EventSpotlightCardProps {
  title: string;
  date: string;
  place?: string | null;
  imageUrl: string;
  coverMedia?: EventMediaItem | null;
  images?: string[];
  onPress?: () => void;
  width?: number;
}

/** Bigger, image-forward card for the Home screen's Events row — a
 * gradient-overlaid hero tile rather than a plain list card, so events read
 * as a highlight rather than an afterthought next to the slider. */
export function EventSpotlightCard({ title, date, place, imageUrl, coverMedia, images, onPress, width = 260 }: EventSpotlightCardProps) {
  return (
    <Pressable onPress={onPress} style={[styles.card, { width }]}>
      <EventMediaCarousel coverMedia={coverMedia} images={images} fallbackUrl={imageUrl} style={styles.image} />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.gradient}>
        <View style={styles.dateBadge}>
          <Ionicons name="calendar" size={12} color={Brand.white} />
          <ThemedText type="small" style={styles.dateBadgeLabel}>
            {formatDateShort(date)}
          </ThemedText>
        </View>
        <ThemedText type="smallBold" style={styles.title} numberOfLines={2}>
          {title}
        </ThemedText>
        {place ? (
          <View style={styles.placeRow}>
            <Ionicons name="location" size={12} color="rgba(255,255,255,0.85)" />
            <ThemedText type="small" style={styles.place} numberOfLines={1}>
              {place}
            </ThemedText>
          </View>
        ) : null}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 170,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginRight: Spacing.three,
  },
  image: {
    ...StyleSheet.absoluteFill,
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: Spacing.three,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: Brand.saffron,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    marginBottom: Spacing.two,
  },
  dateBadgeLabel: {
    color: Brand.white,
    fontSize: 11,
  },
  title: {
    color: Brand.white,
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  place: {
    color: 'rgba(255,255,255,0.85)',
  },
});
