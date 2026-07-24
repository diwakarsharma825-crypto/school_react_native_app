import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { formatDate } from '@/lib/format';
import { Card } from './Card';
import { ThemedText } from './ThemedText';

interface MediaCardProps {
  title: string;
  date: string;
  imageUrl: string;
  excerpt?: string;
  onPress?: () => void;
  variant?: 'list' | 'compact';
}

export function MediaCard({ title, date, imageUrl, excerpt, onPress, variant = 'list' }: MediaCardProps) {
  if (variant === 'compact') {
    return (
      <Card onPress={onPress} style={styles.compactCard}>
        <Image source={{ uri: imageUrl }} style={styles.compactImage} contentFit="cover" />
        <ThemedText type="smallBold" numberOfLines={2} style={styles.compactTitle}>
          {title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatDate(date)}
        </ThemedText>
      </Card>
    );
  }

  return (
    <Card onPress={onPress} style={styles.listCard}>
      <Image source={{ uri: imageUrl }} style={styles.listImage} contentFit="cover" />
      <View style={styles.listBody}>
        <ThemedText type="smallBold" numberOfLines={2}>
          {title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.date}>
          {formatDate(date)}
        </ThemedText>
        {excerpt ? (
          <ThemedText type="small" numberOfLines={2}>
            {excerpt}
          </ThemedText>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  listCard: {
    flexDirection: 'row',
    padding: Spacing.two,
    marginBottom: Spacing.three,
  },
  listImage: {
    width: 88,
    height: 88,
    borderRadius: Radius.md,
    marginRight: Spacing.three,
  },
  listBody: {
    flex: 1,
    justifyContent: 'center',
  },
  date: {
    marginVertical: Spacing.half,
  },
  compactCard: {
    width: 180,
    marginRight: Spacing.three,
    padding: Spacing.two,
  },
  compactImage: {
    width: '100%',
    height: 100,
    borderRadius: Radius.md,
    marginBottom: Spacing.two,
  },
  compactTitle: {
    marginBottom: Spacing.half,
  },
});
