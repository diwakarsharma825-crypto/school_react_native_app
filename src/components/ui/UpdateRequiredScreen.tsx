import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, Spacing } from '@/constants/theme';
import { Button } from './Button';
import { ThemedText } from './ThemedText';

const DEFAULT_STORE_URL = 'https://play.google.com/store/apps/details?id=org.saarthakgimsss.app';

interface UpdateRequiredScreenProps {
  storeUrl: string | null;
}

/** Full-screen block shown when the installed version is below the admin's
 * configured minimum. No "try again" / dismiss — the only way out is to
 * update, matching "without update version don't move next". */
export function UpdateRequiredScreen({ storeUrl }: UpdateRequiredScreenProps) {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="arrow-up-circle" size={44} color="#fff" />
        </View>
        <ThemedText type="title" themeColor="textOnBrand" style={styles.title}>
          Update Required
        </ThemedText>
        <ThemedText type="default" themeColor="textOnBrand" style={styles.message}>
          A new version of this app is available. Please update to continue.
        </ThemedText>
        <Button
          label="Update Now"
          icon="download"
          variant="accent"
          onPress={() => Linking.openURL(storeUrl || DEFAULT_STORE_URL)}
        />
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
});
