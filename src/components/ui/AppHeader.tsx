import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { fetchSettings } from '@/data/api';
import { useBrand } from '@/hooks/use-brand';
import { useFetch } from '@/hooks/use-fetch';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from './ThemedText';
import { ThemeToggle } from './ThemeToggle';

import { useLayout } from '@/hooks/use-layout';
import { useStudentAuth } from '@/hooks/use-student-auth';
import { useTeacherAuth } from '@/hooks/use-teacher-auth';

const logoSource = require('../../../assets/images/icon.png');

/** Top-level header: circular logo, school name, address subtitle, bell icon.
 * Fetches its own copy of /settings (same endpoint the More screen uses) so
 * the name/address shown here always matches the admin-configured school
 * profile rather than a hardcoded fallback. */
export function AppHeader() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const brand = useBrand();
  const { instituteMode } = useLayout();
  const { loggedIn: teacherLoggedIn } = useTeacherAuth();
  const { loggedIn: studentLoggedIn } = useStudentAuth();
  const { data: settings } = useFetch(fetchSettings);
  const [imgError, setImgError] = useState(false);

  if (instituteMode && !teacherLoggedIn && !studentLoggedIn) {
    return null;
  }

  const schoolName = settings?.school_name;
  const address = settings?.address;

  const rawLogoUri = brand.logoUrl || settings?.logo_url || settings?.front_logo_url;
  const logoUri = !imgError && rawLogoUri ? rawLogoUri : null;
  const headerBg = brand.headerColor || brand.primaryColor || theme.tint;

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.two, backgroundColor: headerBg }]}>
      <Image
        source={logoUri ? { uri: logoUri } : logoSource}
        onError={() => setImgError(true)}
        style={styles.logo}
        contentFit="cover"
      />
      <View style={styles.textWrap}>
        {schoolName ? (
          <ThemedText type="smallBold" themeColor="textOnBrand" numberOfLines={1} style={styles.name}>
            {schoolName}
          </ThemedText>
        ) : null}
        {address ? (
          <ThemedText type="small" themeColor="textOnBrand" numberOfLines={1} style={styles.address}>
            {address}
          </ThemedText>
        ) : null}
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
