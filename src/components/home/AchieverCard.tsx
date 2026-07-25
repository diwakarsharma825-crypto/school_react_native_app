import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AvatarFgPalette, AvatarPalette, Brand, Radius, Spacing } from '@/constants/theme';
import type { Achiever } from '@/data/achievers';
import { Card } from '../ui/Card';
import { ThemedText } from '../ui/ThemedText';

interface AchieverCardProps {
  achiever: Achiever;
  paletteIndex: number;
  width?: number;
}

export function AchieverCard({ achiever, paletteIndex, width }: AchieverCardProps) {
  return (
    <Card style={[styles.card, width ? { width, marginRight: Spacing.three } : undefined]}>
      <View style={[styles.photo, { backgroundColor: AvatarPalette[paletteIndex % AvatarPalette.length] }]}>
        <Ionicons name="person" size={34} color={AvatarFgPalette[paletteIndex % AvatarFgPalette.length]} />
        <View style={styles.classBadge}>
          <ThemedText type="small" style={styles.classBadgeLabel}>
            {achiever.classLabel}
          </ThemedText>
        </View>
        <View style={styles.trophyBadge}>
          <ThemedText type="default">🏆</ThemedText>
        </View>
      </View>
      <View style={styles.body}>
        <ThemedText type="smallBold">{achiever.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {achiever.position}
        </ThemedText>
        <View style={styles.scoreRow}>
          <ThemedText type="default">
            {achiever.score} / {achiever.total}
          </ThemedText>
          <View style={styles.percentPill}>
            <ThemedText type="small" style={styles.percentLabel}>
              {achiever.percent}%
            </ThemedText>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  photo: {
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classBadge: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    backgroundColor: Brand.white,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  classBadgeLabel: {
    fontWeight: '700',
    color: Brand.blue,
  },
  trophyBadge: {
    position: 'absolute',
    top: Spacing.two,
    left: Spacing.two,
  },
  body: {
    padding: Spacing.three,
    gap: 2,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.one,
  },
  percentPill: {
    backgroundColor: Brand.blue,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  percentLabel: {
    color: Brand.white,
    fontWeight: '700',
  },
});
