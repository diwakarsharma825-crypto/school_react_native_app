import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, stripHtml } from '@/lib/format';
import { ThemedText } from './ThemedText';

interface ArticleDetailProps {
  title: string;
  date: string;
  imageUrl: string;
  body: string;
  location?: string | null;
}

export function ArticleDetail({ title, date, imageUrl, body, location }: ArticleDetailProps) {
  const theme = useTheme();

  return (
    <View>
      <Image source={{ uri: imageUrl }} style={styles.hero} contentFit="cover" />
      <ThemedText type="title" style={styles.title}>
        {title}
      </ThemedText>
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={14} color={theme.textSecondary} />
          <ThemedText type="small" themeColor="textSecondary" style={styles.metaText}>
            {formatDate(date)}
          </ThemedText>
        </View>
        {location ? (
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary" style={styles.metaText}>
              {location}
            </ThemedText>
          </View>
        ) : null}
      </View>
      <ThemedText type="default" style={styles.body}>
        {stripHtml(body)}
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
    marginBottom: Spacing.two,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: Spacing.three,
    gap: Spacing.four,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    marginLeft: Spacing.one,
  },
  body: {
    lineHeight: 24,
  },
});
