import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from './ThemedText';
import { ThemeToggle } from './ThemeToggle';

interface TabHeaderProps {
  title: string;
}

/** Non-Home tab header (Events/Gallery/More): plain title, no logo/address/bell,
 * no back arrow. Only the Home tab gets the full branded AppHeader. */
export function TabHeader({ title }: TabHeaderProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.two, backgroundColor: theme.tint }]}>
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
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
  },
  title: {
    flex: 1,
  },
});
