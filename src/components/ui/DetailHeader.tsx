import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand, Spacing } from '@/constants/theme';
import { ThemedText } from './ThemedText';

interface DetailHeaderProps {
  title: string;
}

/** Detail-screen header: plain back arrow + title, no bell, no address. */
export function DetailHeader({ title }: DetailHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.two }]}>
      <Pressable
        hitSlop={10}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        style={styles.back}
        accessibilityLabel="Go back"
      >
        <Ionicons name="arrow-back" size={22} color="#fff" />
      </Pressable>
      <ThemedText type="smallBold" themeColor="textOnBrand" numberOfLines={1} style={styles.title}>
        {title}
      </ThemedText>
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.blue,
    paddingHorizontal: Spacing.two,
    paddingBottom: Spacing.two + 2,
  },
  back: {
    padding: Spacing.two,
  },
  title: {
    flex: 1,
    fontSize: 17,
  },
  spacer: {
    width: 38,
  },
});
