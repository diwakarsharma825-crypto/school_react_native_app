import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { formatDate } from '@/lib/format';
import { ThemedText } from './ThemedText';

interface ArticleDetailProps {
  title: string;
  date: string;
  imageUrl: string;
  body: string;
  meta?: string;
}

export function ArticleDetail({ title, date, imageUrl, body, meta }: ArticleDetailProps) {
  return (
    <View>
      <Image source={{ uri: imageUrl }} style={styles.hero} contentFit="cover" />
      <ThemedText type="title" style={styles.title}>
        {title}
      </ThemedText>
      <View style={styles.metaRow}>
        <ThemedText type="small" themeColor="textSecondary">
          {formatDate(date)}
        </ThemedText>
        {meta ? (
          <ThemedText type="small" themeColor="textSecondary">
            {'  ·  '}
            {meta}
          </ThemedText>
        ) : null}
      </View>
      <ThemedText type="default" style={styles.body}>
        {body}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: '100%',
    height: 220,
    borderRadius: Radius.lg,
    marginBottom: Spacing.three,
  },
  title: {
    marginBottom: Spacing.one,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: Spacing.three,
  },
  body: {
    lineHeight: 24,
  },
});
