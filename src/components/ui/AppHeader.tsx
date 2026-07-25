import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand, Spacing } from '@/constants/theme';
import { ThemedText } from './ThemedText';
import { ThemeToggle } from './ThemeToggle';

const logoSource = require('../../../assets/images/icon.png');

interface AppHeaderProps {
  schoolName?: string;
  address?: string;
}

/** Top-level header: circular logo, school name, address subtitle, bell icon. */
export function AppHeader({
  schoolName = 'Saarthak GIMSSS',
  address = 'Sector 12-A, Panchkula, Haryana',
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.two }]}>
      <Image source={logoSource} style={styles.logo} contentFit="cover" />
      <View style={styles.textWrap}>
        <ThemedText type="smallBold" themeColor="textOnBrand" numberOfLines={1} style={styles.name}>
          {schoolName}
        </ThemedText>
        <ThemedText type="small" themeColor="textOnBrand" numberOfLines={1} style={styles.address}>
          {address}
        </ThemedText>
      </View>
      <View style={styles.actions}>
        <ThemeToggle />
        <Pressable
          hitSlop={10}
          onPress={() => router.push('/notifications')}
          style={styles.bell}
          accessibilityLabel="Notifications"
        >
          <Ionicons name="notifications-outline" size={22} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.blue,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two + 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
  },
  textWrap: {
    flex: 1,
    marginLeft: Spacing.two,
  },
  name: {
    fontSize: 16,
  },
  address: {
    opacity: 0.85,
    marginTop: 1,
  },
  bell: {
    padding: Spacing.one,
  },
});
