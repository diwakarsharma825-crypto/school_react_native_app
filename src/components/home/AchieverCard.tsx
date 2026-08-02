import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AvatarFgPalette, AvatarPalette, Brand, Radius, Spacing } from '@/constants/theme';
import type { Achiever } from '@/data/achievers';
import { useBrand } from '@/hooks/use-brand';
import { Card } from '../ui/Card';
import { ThemedText } from '../ui/ThemedText';

interface AchieverCardProps {
  achiever: Achiever;
  paletteIndex: number;
  width?: number;
}

export function AchieverCard({ achiever, paletteIndex, width }: AchieverCardProps) {
  const { achieversDisplay } = useBrand();
  const router = useRouter();
  const showGrade = achieversDisplay === 'grade';
  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/achiever-detail',
          params: {
            name: achiever.name,
            classLabel: achiever.classLabel,
            position: achiever.position,
            score: String(achiever.score),
            total: String(achiever.total),
            percent: String(achiever.percent),
            grade: achiever.grade,
            photoUrl: achiever.photoUrl ?? undefined,
            paletteIndex: String(paletteIndex),
            showGrade: showGrade ? '1' : '0',
          },
        } as any)
      }
    >
      <Card style={[styles.card, width ? { width, marginRight: Spacing.three } : undefined]}>
        {achiever.photoUrl ? (
          <Image source={{ uri: achiever.photoUrl }} style={styles.photo} contentFit="cover" />
        ) : (
          <View style={[styles.photo, { backgroundColor: AvatarPalette[paletteIndex % AvatarPalette.length] }]}>
            <Ionicons name="person" size={34} color={AvatarFgPalette[paletteIndex % AvatarFgPalette.length]} />
          </View>
        )}
        <View style={styles.trophyBadge}>
          <ThemedText type="default">🏆</ThemedText>
        </View>
        <View style={styles.body}>
          <ThemedText type="smallBold">{achiever.name}</ThemedText>
          <View style={styles.metaRow}>
            <ThemedText type="small" themeColor="textSecondary">
              {achiever.position}
            </ThemedText>
            <View style={styles.classBadge}>
              <ThemedText type="small" style={styles.classBadgeLabel}>
                {achiever.classLabel}
              </ThemedText>
            </View>
          </View>
          <View style={styles.scoreRow}>
            {showGrade ? (
              <ThemedText type="default">Grade</ThemedText>
            ) : (
              <ThemedText type="default">
                {achiever.score} / {achiever.total}
              </ThemedText>
            )}
            <View style={styles.percentPill}>
              <ThemedText type="small" style={styles.percentLabel}>
                {showGrade ? achiever.grade : `${achiever.percent}%`}
              </ThemedText>
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
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
    backgroundColor: Brand.blue,
    paddingHorizontal: Spacing.two,
    paddingVertical: 1,
    borderRadius: Radius.sm,
  },
  classBadgeLabel: {
    fontWeight: '700',
    color: Brand.white,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
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
