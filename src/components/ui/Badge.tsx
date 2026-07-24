import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from './ThemedText';

interface BadgeProps {
  label: string;
  color?: string;
}

export function Badge({ label, color }: BadgeProps) {
  const theme = useTheme();
  const backgroundColor = color ?? theme.accent;

  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <ThemedText type="small" style={{ color: theme.textOnBrand }}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
  },
});
