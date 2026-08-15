import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Href, router, usePathname } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Linking, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Shadow, Spacing } from '@/constants/theme';
import { useLayout } from '@/hooks/use-layout';
import { useStudentAuth } from '@/hooks/use-student-auth';
import { useTeacherAuth } from '@/hooks/use-teacher-auth';
import { useTheme } from '@/hooks/use-theme';
import { TARGET_ROUTES } from '@/lib/layout';
import { LoginSheet } from './LoginSheet';
import { ThemedText } from './ThemedText';

export const BOTTOM_BAR_HEIGHT = 58;

interface MenuItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  destructive?: boolean;
}

/** Replaces expo-router's built-in tab bar so bottom-tab slots can point at
 * ANY app screen (not just the four files under (tabs)/) — admin-configured
 * via App Control → App Layout. Rendered once at the root, above the Stack,
 * so it persists across every screen instead of only the tab group.
 *
 * Any tab whose target is `'login'` is special-cased: not logged in (as
 * either role) → tapping opens the Student/Teacher picker as an animated
 * bottom sheet (LoginSheet) right over whatever's on screen, no navigation.
 * Logged in (either role) → shows "Profile" and tapping opens a small menu
 * (Dashboard/Homework, Profile, Log out) instead of navigating straight
 * through, so logout doesn't require first landing on the dashboard. */
import { useLanguage } from '@/lib/i18n';

export function DynamicBottomBar() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { bottomTabs, instituteMode } = useLayout();
  const { loggedIn: teacherLoggedIn, profile } = useTeacherAuth();
  const { loggedIn: studentLoggedIn, access } = useStudentAuth();
  const { t } = useLanguage();
  const [loginSheetOpen, setLoginSheetOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuAnim = useRef(new Animated.Value(0)).current;

  const translateTabLabel = (rawLabel: string) => {
    const key = rawLabel.toLowerCase().trim();
    if (key === 'home') return t('home');
    if (key === 'events') return t('events');
    if (key === 'gallery') return t('gallery');
    if (key === 'more') return t('more');
    if (key === 'login') return t('login');
    if (key === 'profile') return t('profile');
    if (key === 'teacher') return t('teacher_portal');
    if (key === 'student') return t('student_portal');
    return rawLabel;
  };

  useEffect(() => {
    if (menuOpen) {
      menuAnim.setValue(0);
      Animated.spring(menuAnim, { toValue: 1, useNativeDriver: true, friction: 8, tension: 80 }).start();
    }
  }, [menuOpen, menuAnim]);

  if (bottomTabs.length === 0) return null;
  if (instituteMode && !teacherLoggedIn && !studentLoggedIn) return null;

  const visibleBottomTabs =
    teacherLoggedIn && profile?.permissions?.gallery === false
      ? bottomTabs.filter((t) => t.target !== 'gallery')
      : bottomTabs;

  const loggedIn = teacherLoggedIn || studentLoggedIn;
  const menuName = teacherLoggedIn ? profile?.name ?? 'Teacher' : access?.name ?? 'Student';
  const menuIcon: keyof typeof Ionicons.glyphMap = teacherLoggedIn ? 'briefcase' : 'school';
  const studentPhotoUrl = !teacherLoggedIn ? access?.photoUrl : null;

  const rawTeacherMenuItems: (MenuItem & { permKey?: keyof NonNullable<typeof profile>['permissions'] })[] = [
    { label: 'Teacher Dashboard', icon: 'speedometer-outline', onPress: () => router.push('/teacher-dashboard' as any) },
    { label: 'Manage Notices', icon: 'megaphone-outline', onPress: () => router.push('/teacher-notices' as any), permKey: 'notices' },
    { label: 'Manage Events', icon: 'calendar-outline', onPress: () => router.push('/teacher-events' as any), permKey: 'events' },
    { label: 'Attendance', icon: 'checkmark-done-outline', onPress: () => router.push('/teacher-attendance' as any), permKey: 'attendance' },
    { label: 'Leaves', icon: 'calendar-clear-outline', onPress: () => router.push('/teacher-leaves' as any), permKey: 'leave' },
    { label: 'Fees', icon: 'cash-outline', onPress: () => router.push('/teacher-fees' as any), permKey: 'fees' },
    { label: 'Export Reports', icon: 'download-outline', onPress: () => router.push('/teacher-export' as any) },
  ];

  const menuItems: MenuItem[] = teacherLoggedIn
    ? rawTeacherMenuItems.filter((item) => !item.permKey || profile?.permissions?.[item.permKey] !== false)
    : [
        { label: 'Student Dashboard', icon: 'speedometer-outline', onPress: () => router.push('/student-dashboard' as any) },
        { label: 'Homework', icon: 'book-outline', onPress: () => router.push('/homework') },
        { label: 'My Attendance', icon: 'checkmark-done-outline', onPress: () => router.push('/student-attendance' as any) },
        { label: 'Apply Leave', icon: 'calendar-clear-outline', onPress: () => router.push('/apply-leave' as any) },
        { label: 'Fees', icon: 'cash-outline', onPress: () => router.push('/fees' as any) },
      ];

  return (
    <>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
            paddingBottom: Math.max(insets.bottom, Spacing.two),
          },
        ]}
      >
        {visibleBottomTabs.map((tab) => {
          const isLoginSlot = tab.target === 'login';
          const route = tab.target === 'url' ? null : isLoginSlot ? null : TARGET_ROUTES[tab.target];
          const isActive = isLoginSlot
            ? loginSheetOpen ||
              menuOpen ||
              pathname.startsWith('/teacher-') ||
              pathname.startsWith('/homework') ||
              pathname.startsWith('/student-dashboard') ||
              pathname.startsWith('/student-attendance') ||
              pathname.startsWith('/apply-leave') ||
              pathname.startsWith('/fees') ||
              pathname.startsWith('/profile') ||
              pathname.startsWith('/change-password')
            : route
              ? isRouteActive(pathname, route as Href)
              : false;
          const rawLabel = isLoginSlot ? (teacherLoggedIn ? 'Teacher' : studentLoggedIn ? 'Student' : tab.label) : tab.label;
          const label = translateTabLabel(rawLabel);
          const icon = isLoginSlot ? (loggedIn ? 'person-circle' : 'log-in') : tab.icon;

          const activeColor = isActive ? (theme.dark ? '#FFFFFF' : theme.tint) : theme.textSecondary;

          return (
            <Pressable
              key={`${tab.target}-${tab.label}`}
              style={styles.item}
              onPress={() => {
                if (isLoginSlot) {
                  if (loggedIn) setMenuOpen(true);
                  else setLoginSheetOpen(true);
                } else if (tab.target === 'url' && tab.targetUrl) {
                  Linking.openURL(tab.targetUrl);
                } else if (route) {
                  router.push(route as Href);
                }
              }}
            >
              <Ionicons
                name={(isActive ? icon : `${icon}-outline`) as keyof typeof Ionicons.glyphMap}
                size={22}
                color={activeColor}
              />
              <ThemedText
                type="small"
                style={[styles.label, { color: activeColor }]}
                numberOfLines={1}
              >
                {label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
      <LoginSheet visible={loginSheetOpen} onClose={() => setLoginSheetOpen(false)} />

      <Modal visible={menuOpen} transparent animationType="none" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)}>
          <Animated.View
            style={[
              styles.menuCard,
              { backgroundColor: theme.surface },
              Shadow.card,
              {
                opacity: menuAnim,
                transform: [
                  { scale: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
                  { translateY: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
                ],
              },
            ]}
          >
            <Pressable
              onPress={() => {
                setMenuOpen(false);
                router.push('/profile' as any);
              }}
              style={[styles.menuHeader, { borderBottomColor: theme.border }]}
            >
              {studentPhotoUrl ? (
                <Image source={{ uri: studentPhotoUrl }} style={styles.menuAvatarPhoto} contentFit="cover" />
              ) : (
                <View style={[styles.menuAvatar, { backgroundColor: theme.dark ? theme.tint : theme.backgroundSelected }]}>
                  <Ionicons name={menuIcon} size={18} color={theme.dark ? '#FFFFFF' : theme.tint} />
                </View>
              )}
              <View style={styles.menuHeaderTextCol}>
                <ThemedText type="smallBold" numberOfLines={1} style={{ color: theme.dark ? '#FFFFFF' : theme.text }}>
                  {menuName}
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.dark ? '#FFFFFF' : theme.textSecondary} />
            </Pressable>
            {menuItems.map((item, i) => (
              <Pressable
                key={item.label}
                onPress={() => {
                  setMenuOpen(false);
                  item.onPress();
                }}
                style={[styles.menuRow, i < menuItems.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: 1 }]}
              >
                <Ionicons name={item.icon} size={18} color={item.destructive ? '#C62828' : (theme.dark ? '#FFFFFF' : theme.text)} />
                <ThemedText type="default" style={item.destructive ? { color: '#C62828' } : (theme.dark ? { color: '#FFFFFF' } : undefined)}>
                  {item.label}
                </ThemedText>
              </Pressable>
            ))}
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}

function isRouteActive(pathname: string, route: Href): boolean {
  // Was replacing the bare "(tabs)" substring, leaving a double leading
  // slash for any nested route ("/(tabs)/gallery" -> "//gallery") that
  // then never matched the real pathname ("/gallery") — Gallery, Events
  // and More all silently failed to highlight because of this.
  const routeStr = String(route).replace('/(tabs)', '').replace(/\/+$/, '') || '/';
  const current = pathname.replace(/\/+$/, '') || '/';
  return current === routeStr || (routeStr !== '/' && current.startsWith(routeStr));
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.two,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  label: {
    fontSize: 11,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 90,
  },
  menuCard: {
    minWidth: 220,
    borderRadius: 16,
    overflow: 'hidden',
    paddingVertical: Spacing.one,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
  },
  menuAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuAvatarPhoto: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  menuHeaderTextCol: {
    flex: 1,
    gap: 1,
  },
  menuHeaderName: {
    flexShrink: 1,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
});
