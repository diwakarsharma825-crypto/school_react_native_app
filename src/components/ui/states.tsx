import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Button } from './Button';
import { ThemedText } from './ThemedText';

export function Loading({ label = 'Loading…' }: { label?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={theme.tint} size="large" />
      <ThemedText type="small" themeColor="textSecondary" style={styles.spacingTop}>
        {label}
      </ThemedText>
    </View>
  );
}

export function ErrorState({
  message = 'Something went wrong.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.center}>
      <Ionicons name="alert-circle-outline" size={36} color={theme.textSecondary} />
      <ThemedText type="default" themeColor="textSecondary" style={styles.spacingTop}>
        {message}
      </ThemedText>
      {onRetry ? (
        <View style={styles.spacingTop}>
          <Button label="Retry" variant="outline" onPress={onRetry} icon="refresh" />
        </View>
      ) : null}
    </View>
  );
}

export function EmptyState({
  message = 'Nothing to show yet.',
  icon = 'file-tray-outline',
}: {
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const theme = useTheme();
  return (
    <View style={styles.center}>
      <Ionicons name={icon} size={36} color={theme.textSecondary} />
      <ThemedText type="default" themeColor="textSecondary" style={styles.spacingTop}>
        {message}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.three,
  },
  spacingTop: {
    marginTop: Spacing.two,
  },
});
