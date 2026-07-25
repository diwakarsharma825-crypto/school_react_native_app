import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand, Spacing } from '@/constants/theme';
import { ThemedText } from './ThemedText';
import { ThemeToggle } from './ThemeToggle';

interface TabHeaderProps {
  title: string;
}

/** Non-Home tab header (Events/Gallery/More): plain title, no logo/address/bell,
 * no back arrow. Only the Home tab gets the full branded AppHeader. */
export function TabHeader({ title }: TabHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.two }]}>
      <ThemedText type="title" themeColor="textOnBrand" numberOfLines={1} style={styles.title}>
        {title}
      </ThemedText>
      <ThemeToggle />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Brand.blue,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
  },
  title: {
    flex: 1,
  },
});
