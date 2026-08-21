import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Button } from './Button';
import { ThemedText } from './ThemedText';

const logoSource = require('../../../assets/images/icon.png');

export function Loading({ label = 'Loading…' }: { label?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.center}>
      <View style={styles.logoWrap}>
        <Image source={logoSource} style={styles.logo} contentFit="cover" />
        <ActivityIndicator color={theme.tint} size="small" style={styles.spinner} />
      </View>
      <ThemedText type="small" themeColor="textSecondary" style={styles.spacingTop}>
        {label}
      </ThemedText>
    </View>
  );
}

export function ErrorState({
  message = 'Something went wrong. Please try again.',
  onRetry,
}: {
  message?: React.ReactNode;
  onRetry?: () => void;
}) {
  const theme = useTheme();
  let rawMsg = 'Something went wrong. Please try again.';
  if (message) {
    if (typeof message === 'object' && 'message' in (message as any)) {
      rawMsg = String((message as any).message);
    } else if (typeof message === 'string' || typeof message === 'number') {
      rawMsg = String(message);
    } else {
      rawMsg = String(message);
    }
  }

  // Security Sanitization: Never reveal sensitive server URLs, domain names, or backend endpoints to end users!
  let displayMsg = rawMsg;
  if (
    rawMsg.includes('http://') ||
    rawMsg.includes('https://') ||
    rawMsg.includes('Network request failed') ||
    rawMsg.includes('Failed to fetch') ||
    rawMsg.includes('NetworkError') ||
    rawMsg.includes('/api/') ||
    rawMsg.includes('JSON')
  ) {
    displayMsg = 'Unable to connect to the server. Please check your internet connection and try again.';
  }

  return (
    <View style={styles.center}>
      <Ionicons name="alert-circle-outline" size={36} color={theme.textSecondary} />
      <ThemedText type="default" themeColor="textSecondary" style={styles.spacingTop}>
        {displayMsg}
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
  logoWrap: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  spinner: {
    position: 'absolute',
    bottom: -6,
    right: -6,
  },
  spacingTop: {
    marginTop: Spacing.two,
  },
});
