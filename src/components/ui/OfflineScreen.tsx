import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { ThemedText } from './ThemedText';

interface OfflineScreenProps {
  onRetry: () => void;
  retrying?: boolean;
}

/** Full-screen takeover shown app-wide whenever there's no internet
 * connection at all — distinct from a single screen's fetch failure, which
 * still uses ErrorState. This is the "you have literally no signal" case. */
export function OfflineScreen({ onRetry, retrying }: OfflineScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="cloud-offline-outline" size={54} color={Brand.white} />
      </View>
      <ThemedText type="title" themeColor="textOnBrand" style={styles.title}>
        No Internet Connection
      </ThemedText>
      <ThemedText type="default" themeColor="textOnBrand" style={styles.message}>
        This app needs an internet connection to show live updates. Please check your Wi-Fi
        or mobile data and try again.
      </ThemedText>
      <Pressable onPress={onRetry} style={styles.retryButton} disabled={retrying}>
        <Ionicons name="refresh" size={18} color={Brand.blue} />
        <ThemedText type="smallBold" style={styles.retryLabel}>
          {retrying ? 'Checking…' : 'Try Again'}
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.blueDark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
  },
  iconCircle: {
    width: 104,
    height: 104,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.five,
  },
  title: {
    marginBottom: Spacing.two,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    opacity: 0.85,
    lineHeight: 21,
    marginBottom: Spacing.five,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Brand.white,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Radius.pill,
  },
  retryLabel: {
    color: Brand.blue,
  },
});
