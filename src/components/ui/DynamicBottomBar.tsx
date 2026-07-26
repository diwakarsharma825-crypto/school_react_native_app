import { Ionicons } from '@expo/vector-icons';
import { Href, router, usePathname } from 'expo-router';
import React from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useLayout } from '@/hooks/use-layout';
import { useTeacherAuth } from '@/hooks/use-teacher-auth';
import { useTheme } from '@/hooks/use-theme';
import { TARGET_ROUTES } from '@/lib/layout';
import { ThemedText } from './ThemedText';

export const BOTTOM_BAR_HEIGHT = 58;

/** Replaces expo-router's built-in tab bar so bottom-tab slots can point at
 * ANY app screen (not just the four files under (tabs)/) — admin-configured
 * via App Control → App Layout. Rendered once at the root, above the Stack,
 * so it persists across every screen instead of only the tab group.
 *
 * Any tab whose target is `'login'` is special-cased: it shows "Login"
 * (routes to the Teacher/Student picker) when nobody's logged in as a
 * teacher, or "Dashboard" (routes straight to the teacher dashboard, which
 * has its own Logout) once they are — same tab, no separate app needed. */
export function DynamicBottomBar() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { bottomTabs } = useLayout();
  const { loggedIn } = useTeacherAuth();

  if (bottomTabs.length === 0) return null;

  return (
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
      {bottomTabs.map((tab) => {
        const isLoginSlot = tab.target === 'login';
        const route = tab.target === 'url' ? null : (isLoginSlot ? (loggedIn ? '/teacher-dashboard' : '/login') : TARGET_ROUTES[tab.target]);
        const isActive = route
          ? isLoginSlot
            ? pathname.startsWith('/teacher-') || pathname.startsWith('/login') || pathname.startsWith('/homework')
            : isRouteActive(pathname, route as Href)
          : false;
        const label = isLoginSlot ? (loggedIn ? 'Dashboard' : tab.label) : tab.label;
        const icon = isLoginSlot ? (loggedIn ? 'grid' : 'log-in') : tab.icon;

        return (
          <Pressable
            key={`${tab.target}-${tab.label}`}
            style={styles.item}
            onPress={() => {
              if (tab.target === 'url' && tab.targetUrl) {
                Linking.openURL(tab.targetUrl);
              } else if (route) {
                router.push(route as Href);
              }
            }}
          >
            <Ionicons
              name={(isActive ? icon : `${icon}-outline`) as keyof typeof Ionicons.glyphMap}
              size={22}
              color={isActive ? theme.tint : theme.textSecondary}
            />
            <ThemedText
              type="small"
              themeColor={isActive ? 'tint' : 'textSecondary'}
              numberOfLines={1}
              style={styles.label}
            >
              {label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

function isRouteActive(pathname: string, route: Href): boolean {
  const routeStr = String(route).replace('(tabs)', '').replace(/\/+$/, '') || '/';
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
});
