import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from './ThemedText';

interface SectionHeaderProps {
  title: string;
  onSeeAll?: () => void;
}

export function SectionHeader({ title, onSeeAll }: SectionHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <View style={styles.titleRow}>
        <View style={[styles.accentBar, { backgroundColor: theme.accent }]} />
        <ThemedText type="subtitle">{title}</ThemedText>
      </View>
      {onSeeAll ? (
        <Pressable onPress={onSeeAll} hitSlop={8}>
          <ThemedText type="smallBold" themeColor="tint">
            See all ›
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accentBar: {
    width: 4,
    height: 20,
    borderRadius: Radius.sm,
    marginRight: Spacing.two,
  },
});
