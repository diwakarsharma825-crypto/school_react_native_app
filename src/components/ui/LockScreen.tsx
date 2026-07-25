import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppStatus } from '@/data/app-status';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { Button } from './Button';
import { ThemedText } from './ThemedText';

interface LockScreenProps {
  status: AppStatus;
  onRetry: () => void;
  retrying: boolean;
}

export function LockScreen({ status, onRetry, retrying }: LockScreenProps) {
  const title = status.title || 'App Access Paused';
  const message =
    status.message || 'This app is currently inactive. Please contact the developer to reactivate your access.';

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="lock-closed" size={40} color="#fff" />
        </View>
        <ThemedText type="title" themeColor="textOnBrand" style={styles.title}>
          {title}
        </ThemedText>
        <ThemedText type="default" themeColor="textOnBrand" style={styles.message}>
          {message}
        </ThemedText>

        {(status.phone || status.whatsapp || status.email) && (
          <View style={styles.contactCard}>
            <ThemedText type="smallBold" themeColor="textOnBrand" style={styles.contactHeading}>
              {status.devName || 'Developer Contact'}
            </ThemedText>
            <View style={styles.contactActions}>
              {status.phone ? (
                <Button
                  label="Call"
                  icon="call"
                  variant="accent"
                  onPress={() => Linking.openURL(`tel:${status.phone}`)}
                />
              ) : null}
              {status.whatsapp ? (
                <Button
                  label="WhatsApp"
                  icon="logo-whatsapp"
                  variant="outline"
                  onPress={() => Linking.openURL(`https://wa.me/${status.whatsapp!.replace(/\D/g, '')}`)}
                />
              ) : null}
              {status.email ? (
                <Button
                  label="Email"
                  icon="mail"
                  variant="outline"
                  onPress={() => Linking.openURL(`mailto:${status.email}`)}
                />
              ) : null}
            </View>
          </View>
        )}

        <Button label="Try Again" icon="refresh" variant="outline" onPress={onRetry} loading={retrying} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.blueDark,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.four,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  message: {
    textAlign: 'center',
    opacity: 0.85,
    marginBottom: Spacing.five,
  },
  contactCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radius.lg,
    padding: Spacing.four,
    marginBottom: Spacing.four,
  },
  contactHeading: {
    textAlign: 'center',
    marginBottom: Spacing.three,
  },
  contactActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.two,
  },
});
