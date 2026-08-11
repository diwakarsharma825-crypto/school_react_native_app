import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/ui/ThemedText';
import { useBrand } from '@/hooks/use-brand';
import { useTheme } from '@/hooks/use-theme';
import { fetchSettings } from '@/data/api';
import { teacherLogout } from '@/data/teacher-api';
import { useFetch } from '@/hooks/use-fetch';
import { useSections } from '@/hooks/use-sections';
import { useStudentAuth } from '@/hooks/use-student-auth';
import { useTeacherAuth } from '@/hooks/use-teacher-auth';
import { clearHomeworkAccess } from '@/lib/homework-access';
import { getAppVersion } from '@/lib/version';

const logoSource = require('../../../assets/images/icon.png');

interface Row {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  /** Section is admin-disabled — row still shows, but tapping it lands on
   * the Coming Soon state rather than real content. */
  locked?: boolean;
  destructive?: boolean;
}

function RowList({ rows }: { rows: Row[] }) {
  const theme = useTheme();
  if (rows.length === 0) return null;
  return (
    <Card style={styles.listCard}>
      {rows.map((item, idx) => (
        <Pressable
          key={item.label}
          onPress={item.onPress}
          style={[
            styles.row,
            idx < rows.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth },
          ]}
        >
          <View style={styles.rowLeft}>
            <View style={[styles.rowIconWrap, { backgroundColor: theme.backgroundElement }]}>
              <Ionicons name={item.icon} size={18} color={item.destructive ? '#C62828' : theme.tint} />
            </View>
            <ThemedText type="default" style={item.destructive ? { color: '#C62828' } : undefined}>
              {item.label}
            </ThemedText>
            {item.locked ? (
              <Ionicons name="hourglass-outline" size={13} color={theme.textSecondary} style={styles.lockIcon} />
            ) : null}
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </Pressable>
      ))}
    </Card>
  );
}

export default function MoreScreen() {
  const { data: settings } = useFetch(fetchSettings);
  const sections = useSections();
  const brand = useBrand();
  const { loggedIn: teacherLoggedIn, setLoggedIn: setTeacherLoggedIn } = useTeacherAuth();
  const { loggedIn: studentLoggedIn, setAccess: setStudentAccess } = useStudentAuth();

  function confirmLogout(onConfirm: () => void) {
    Alert.alert('Log out?', 'You can log back in anytime.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: onConfirm },
    ]);
  }

  const loggedIn = teacherLoggedIn || studentLoggedIn;

  const accountRows: Row[] = teacherLoggedIn
    ? [
        {
          label: 'Change Password',
          icon: 'key-outline',
          onPress: () => router.push({ pathname: '/change-password', params: { role: 'teacher' } } as any),
        },
        { label: 'My Storage', icon: 'server-outline', onPress: () => router.push('/teacher-storage' as any) },
      ]
    : studentLoggedIn
      ? [
          {
            label: 'Change Password',
            icon: 'key-outline',
            onPress: () => router.push({ pathname: '/change-password', params: { role: 'student' } } as any),
          },
        ]
      : [];

  function handleLogout() {
    confirmLogout(async () => {
      if (teacherLoggedIn) {
        await teacherLogout();
        setTeacherLoggedIn(false);
      } else {
        await clearHomeworkAccess();
        setStudentAccess(null);
      }
    });
  }

  const exploreRows: Row[] = [
    { label: 'Notifications', icon: 'notifications-outline', onPress: () => router.push('/notifications') },
    { label: 'About Us', icon: 'information-circle-outline', onPress: () => router.push('/about') },
    {
      label: 'Announcements',
      icon: 'megaphone-outline',
      onPress: () => router.push('/notices'),
      locked: !sections.notices,
    },
    {
      label: 'Result / Report Card',
      icon: 'document-text-outline',
      onPress: () => router.push('/result'),
      locked: !sections.result,
    },
    { label: 'Contact Us', icon: 'call-outline', onPress: () => router.push('/contact') },
  ];

  const infoRows: Row[] = [
    {
      label: 'Our Teachers',
      icon: 'people-outline',
      onPress: () => router.push('/teachers'),
      locked: !sections.teachers,
    },
    {
      label: 'Top Students',
      icon: 'ribbon-outline',
      onPress: () => router.push('/top-students'),
      locked: !sections.top_students,
    },
    {
      label: 'Mandatory Disclosure',
      icon: 'shield-checkmark-outline',
      onPress: () => router.push('/disclosure'),
      locked: !sections.disclosure,
    },
    // Storage shows the whole school's upload usage — only worth showing
    // (and only meant to be seen) once a student/teacher from this school
    // is actually logged in, not to anyone who opens the app.
    ...(loggedIn
      ? [{ label: 'Storage', icon: 'server-outline' as const, onPress: () => router.push('/storage-usage' as any) }]
      : []),
  ];

  const followRows: Row[] = [
    {
      label: 'Facebook',
      icon: 'logo-facebook',
      onPress: () => settings?.facebook_url && Linking.openURL(settings.facebook_url),
    },
    {
      label: 'YouTube',
      icon: 'logo-youtube',
      onPress: () => settings?.youtube_url && Linking.openURL(settings.youtube_url),
    },
    {
      label: 'Instagram',
      icon: 'logo-instagram',
      onPress: () => settings?.instagram_url && Linking.openURL(settings.instagram_url),
    },
  ];

  // No hardcoded fallback name here on purpose — showing "Saarthak GIMSSS"
  // while /settings is still loading, then swapping to the real school name,
  // reads as a bug (flash of wrong content). Just wait for the real data.
  const schoolName = settings?.school_name;
  const address = settings?.address;

  return (
    <Screen>
      <View style={[styles.brandCard, { backgroundColor: theme.tint }]}>
        <Image source={brand.logoUrl ? { uri: brand.logoUrl } : logoSource} style={styles.logo} contentFit="cover" />
        {schoolName ? (
          <ThemedText type="subtitle" themeColor="textOnBrand" style={styles.brandName}>
            {schoolName}
          </ThemedText>
        ) : null}
        {address ? (
          <ThemedText type="small" themeColor="textOnBrand" style={styles.brandAddress}>
            {address}
          </ThemedText>
        ) : null}
      </View>

      {accountRows.length > 0 ? (
        <>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
            ACCOUNT
          </ThemedText>
          <RowList rows={accountRows} />
        </>
      ) : null}

      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
        EXPLORE
      </ThemedText>
      <RowList rows={exploreRows} />

      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
        INFORMATION
      </ThemedText>
      <RowList rows={infoRows} />

      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
        FOLLOW US
      </ThemedText>
      <RowList rows={followRows} />

      {loggedIn ? (
        <Pressable onPress={handleLogout} style={[styles.logoutButton, { borderColor: '#C62828' }]}>
          <Ionicons name="log-out-outline" size={18} color="#C62828" />
          <ThemedText type="smallBold" style={styles.logoutLabel}>
            Log out
          </ThemedText>
        </Pressable>
      ) : null}

      <View style={styles.footer}>
        {schoolName ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.footerText}>
            {schoolName} {address ? `· ${address}` : ''}
          </ThemedText>
        ) : null}
        <ThemedText type="small" themeColor="textSecondary" style={styles.footerText}>
          Vedic Culture · Scientific Approach · Communication
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={[styles.footerText, styles.versionText]}>
          v{getAppVersion()}
        </ThemedText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brandCard: {
    backgroundColor: Brand.blue,
    borderRadius: Radius.lg,
    alignItems: 'center',
    padding: Spacing.four,
    marginBottom: Spacing.four,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: Spacing.two,
    backgroundColor: '#fff',
  },
  brandName: {
    textAlign: 'center',
  },
  brandAddress: {
    textAlign: 'center',
    opacity: 0.85,
    marginTop: 2,
  },
  sectionTitle: {
    marginBottom: Spacing.two,
    letterSpacing: 0.5,
  },
  listCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: Spacing.four,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
  },
  lockIcon: {
    marginLeft: Spacing.two,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.three,
    marginBottom: Spacing.four,
  },
  logoutLabel: {
    color: '#C62828',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
  },
  footerText: {
    textAlign: 'center',
    marginBottom: 2,
  },
  versionText: {
    marginTop: Spacing.two,
    opacity: 0.6,
  },
});
