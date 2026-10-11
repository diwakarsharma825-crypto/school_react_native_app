import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { ThemedText } from './ThemedText';

export interface OfflineScreenProps {
  onRetry: () => void;
  retrying?: boolean;
  title?: string;
  message?: string;
  isServerError?: boolean;
  contactNumber?: string;
  contactEmail?: string;
  showContact?: boolean;
}

const DEFAULT_CONTACT_PHONE = '8168002604';
const DEFAULT_CONTACT_EMAIL = 'vydharo@gmail.com';

/** Full-screen takeover shown app-wide whenever there's no internet
 * connection at all or when the server is unreachable/down. */
export function OfflineScreen({
  onRetry,
  retrying,
  title,
  message,
  isServerError,
  contactNumber = DEFAULT_CONTACT_PHONE,
  contactEmail = DEFAULT_CONTACT_EMAIL,
  showContact,
}: OfflineScreenProps) {
  const displayTitle = title ?? (isServerError ? 'Server Not Responding' : 'No Internet Connection');
  const displayMessage =
    message ??
    (isServerError
      ? 'Unable to connect to the school server. Please check your internet connection or try again later.'
      : 'This app needs an internet connection to show live updates. Please check your Wi-Fi or mobile data and try again.');

  const shouldShowContact = showContact ?? Boolean(isServerError);

  const handleCall = () => {
    if (contactNumber) {
      Linking.openURL(`tel:${contactNumber}`).catch(() => {});
    }
  };

  const handleEmail = () => {
    if (contactEmail) {
      Linking.openURL(`mailto:${contactEmail}`).catch(() => {});
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="cloud-offline-outline" size={54} color={Brand.white} />
      </View>
      <ThemedText type="title" themeColor="textOnBrand" style={styles.title}>
        {displayTitle}
      </ThemedText>
      <ThemedText type="default" themeColor="textOnBrand" style={styles.message}>
        {displayMessage}
      </ThemedText>
      <Pressable onPress={onRetry} style={styles.retryButton} disabled={retrying}>
        <Ionicons name="refresh" size={18} color={Brand.blue} />
        <ThemedText type="smallBold" style={styles.retryLabel}>
          {retrying ? 'Checking…' : 'Try Again'}
        </ThemedText>
      </Pressable>

      {shouldShowContact ? (
        <View style={styles.contactContainer}>
          <ThemedText type="small" themeColor="textOnBrand" style={styles.contactTitle}>
            Need assistance? Contact support:
          </ThemedText>
          <View style={styles.contactActions}>
            {contactNumber ? (
              <Pressable onPress={handleCall} style={styles.contactPill}>
                <Ionicons name="call-outline" size={15} color={Brand.white} />
                <ThemedText type="smallBold" themeColor="textOnBrand" style={styles.contactText}>
                  {contactNumber}
                </ThemedText>
              </Pressable>
            ) : null}
            {contactEmail ? (
              <Pressable onPress={handleEmail} style={styles.contactPill}>
                <Ionicons name="mail-outline" size={15} color={Brand.white} />
                <ThemedText type="smallBold" themeColor="textOnBrand" style={styles.contactText}>
                  {contactEmail}
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
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
  contactContainer: {
    marginTop: Spacing.six,
    alignItems: 'center',
    width: '100%',
    paddingTop: Spacing.four,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  contactTitle: {
    marginBottom: Spacing.two,
    opacity: 0.8,
    textAlign: 'center',
  },
  contactActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  contactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  contactText: {
    letterSpacing: 0.2,
  },
});
