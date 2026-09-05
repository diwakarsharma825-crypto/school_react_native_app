import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useState } from 'react';
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
import { useLanguage } from '@/lib/i18n';
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
  const { t } = useLanguage();
  if (rows.length === 0) return null;
  const iconColor = theme.dark ? '#FFFFFF' : theme.tint;
  const iconBg = theme.dark ? theme.tint : theme.backgroundElement;
  const textColor = theme.dark ? '#FFFFFF' : theme.text;
  const chevronColor = theme.dark ? '#FFFFFF' : theme.textSecondary;

  const translateRowLabel = (rawLabel: string) => {
    const map: Record<string, string> = {
      'Homework': t('homework'),
      'Subject Syllabus': t('syllabus'),
      'Syllabus': t('syllabus'),
      'Notice Board': t('notices'),
      'Announcements': t('announcements'),
      'Events Calendar': t('events'),
      'Photo & Video Gallery': t('gallery'),
      'Top Achievers': t('top_students'),
      'Mandatory Disclosures': t('disclosures'),
      'About Us': t('about_us'),
      'Contact Us': t('contact_us'),
      'Fees & Invoices': t('fees'),
      'My Profile': t('profile'),
      'My Classmates': 'My Classmates',
      'Change Password': t('change_password'),
      'Log Out': t('logout'),
      'Sign Out': t('logout'),
    };
    return map[rawLabel] || rawLabel;
  };

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
            <View style={[styles.rowIconWrap, { backgroundColor: iconBg }]}>
              <Ionicons name={item.icon} size={18} color={item.destructive ? '#C62828' : iconColor} />
            </View>
            <ThemedText type="default" style={item.destructive ? { color: '#C62828' } : { color: textColor }}>
              {translateRowLabel(item.label)}
            </ThemedText>
            {item.locked ? (
              <Ionicons name="hourglass-outline" size={13} color={chevronColor} style={styles.lockIcon} />
            ) : null}
          </View>
          <Ionicons name="chevron-forward" size={18} color={chevronColor} />
        </Pressable>
      ))}
    </Card>
  );
}

import { useLayout } from '@/hooks/use-layout';

export default function MoreScreen() {
  const theme = useTheme();
  const { instituteMode } = useLayout();
  const { data: settings } = useFetch(fetchSettings);
  const sections = useSections();
  const brand = useBrand();
  const { loggedIn: teacherLoggedIn, setLoggedIn: setTeacherLoggedIn, profile: teacherProfile } = useTeacherAuth();
  const { loggedIn: studentLoggedIn, setAccess: setStudentAccess, access: studentAccess } = useStudentAuth();

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
          ...(sections.classmates
            ? [
                {
                  label: 'My Classmates',
                  icon: 'people-outline' as const,
                  onPress: () => router.push('/classmates' as any),
                },
              ]
            : []),
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
      router.replace('/');
    });
  }

  const exploreRows: Row[] = [
    { label: 'Notifications', icon: 'notifications-outline', onPress: () => router.push('/notifications') },
    ...(!studentLoggedIn ? [{ label: 'Subject Syllabus', icon: 'book-outline' as const, onPress: () => router.push('/syllabus') }] : []),
    ...(!instituteMode ? [{ label: 'About Us', icon: 'information-circle-outline' as const, onPress: () => router.push('/about') }] : []),
    {
      label: 'Announcements',
      icon: 'megaphone-outline',
      onPress: () => router.push('/notices'),
      locked: !sections.notices,
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
    ...(!instituteMode
      ? [
          {
            label: 'Top Students',
            icon: 'ribbon-outline' as const,
            onPress: () => router.push('/top-students'),
            locked: !sections.top_students,
          },
          {
            label: 'Mandatory Disclosure',
            icon: 'shield-checkmark-outline' as const,
            onPress: () => router.push('/disclosure'),
            locked: !sections.disclosure,
          },
        ]
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

  // No hardcoded fallback name here on purpose — showing school name from /settings
  // while /settings is still loading, then swapping to the real school name,
  // reads as a bug (flash of wrong content). Just wait for the real data.
  const [imgError, setImgError] = useState(false);
  const schoolName = settings?.school_name;
  const address = settings?.address;

  const rawLogoUri = brand.logoUrl || settings?.logo_url || settings?.front_logo_url;
  const logoUri = !imgError && rawLogoUri ? rawLogoUri : null;

  const userRole = teacherLoggedIn ? 'TEACHER' : studentLoggedIn ? 'STUDENT' : null;
  const userName = teacherLoggedIn ? teacherProfile?.name ?? 'Teacher' : studentLoggedIn ? studentAccess?.name ?? 'Student' : '';
  const userSubtitle = teacherLoggedIn
    ? teacherProfile?.email ?? 'Teacher Account'
    : studentLoggedIn
      ? `Class ${studentAccess?.className ?? ''}${studentAccess?.section ? ` - ${studentAccess.section}` : ''} · SRN ${studentAccess?.srn ?? ''}`
      : '';
  const userPhoto = teacherLoggedIn ? (teacherProfile as any)?.photo_url : studentLoggedIn ? studentAccess?.photoUrl : null;

  return (
    <Screen>
      {loggedIn ? (
        <Card style={[styles.userCard, { borderColor: theme.border }]}>
          <Pressable onPress={() => router.push('/profile')} style={styles.userCardInner}>
            {userPhoto ? (
              <Image
                source={{ uri: userPhoto }}
                style={styles.userAvatarPhoto}
                contentFit="cover"
                cachePolicy="memory-disk"
                priority="high"
                transition={200}
              />
            ) : (
              <View style={[styles.userAvatarFallback, { backgroundColor: theme.tint }]}>
                <Ionicons name={userRole === 'TEACHER' ? 'briefcase' : 'school'} size={26} color={Brand.white} />
              </View>
            )}
            <View style={styles.userInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <ThemedText type="subtitle" numberOfLines={1} style={{ flexShrink: 1, color: theme.dark ? '#FFFFFF' : theme.text }}>
                  {userName}
                </ThemedText>
                <View style={[styles.roleBadge, { backgroundColor: theme.tint + '1F', borderColor: theme.tint, borderWidth: 1 }]}>
                  <ThemedText type="smallBold" style={{ color: theme.dark ? '#FFFFFF' : theme.tint, fontSize: 10 }}>
                    {userRole}
                  </ThemedText>
                </View>
              </View>
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {userSubtitle}
              </ThemedText>
              <ThemedText type="smallBold" style={{ marginTop: 2, color: theme.dark ? '#FFFFFF' : theme.tint }}>
                View Full Profile &rarr;
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.dark ? '#FFFFFF' : theme.textSecondary} />
          </Pressable>
        </Card>
      ) : (
        <View style={[styles.brandCard, { backgroundColor: theme.tint }]}>
          <Image
            source={logoUri ? { uri: logoUri } : logoSource}
            onError={() => setImgError(true)}
            style={styles.logo}
            contentFit="cover"
          />
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
      )}

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
  userCard: {
    marginBottom: Spacing.four,
    padding: Spacing.three,
  },
  userCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  userAvatarPhoto: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  userAvatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.pill,
  },
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
