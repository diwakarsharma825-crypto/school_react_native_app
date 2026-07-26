import { Ionicons } from '@expo/vector-icons';
import { Href, router, usePathname } from 'expo-router';
import React, { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useLayout } from '@/hooks/use-layout';
import { useTeacherAuth } from '@/hooks/use-teacher-auth';
import { useTheme } from '@/hooks/use-theme';
import { TARGET_ROUTES } from '@/lib/layout';
import { LoginSheet } from './LoginSheet';
import { ThemedText } from './ThemedText';

export const BOTTOM_BAR_HEIGHT = 58;

/** Replaces expo-router's built-in tab bar so bottom-tab slots can point at
 * ANY app screen (not just the four files under (tabs)/) — admin-configured
 * via App Control → App Layout. Rendered once at the root, above the Stack,
 * so it persists across every screen instead of only the tab group.
 *
 * Any tab whose target is `'login'` is special-cased: not logged in as a
 * teacher → tapping opens the Student/Teacher picker as an animated bottom
 * sheet (LoginSheet) right over whatever's on screen, no navigation. Logged
 * in → shows "Dashboard" and routes straight there (which has its own
 * Logout). Same tab, no separate app, no extra screen for the picker. */
export function DynamicBottomBar() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { bottomTabs } = useLayout();
  const { loggedIn } = useTeacherAuth();
  const [loginSheetOpen, setLoginSheetOpen] = useState(false);

  if (bottomTabs.length === 0) return null;

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
        {bottomTabs.map((tab) => {
          const isLoginSlot = tab.target === 'login';
          const route = tab.target === 'url' ? null : isLoginSlot ? (loggedIn ? '/teacher-dashboard' : null) : TARGET_ROUTES[tab.target];
          const isActive = isLoginSlot
            ? loginSheetOpen || pathname.startsWith('/teacher-') || pathname.startsWith('/homework')
            : route
              ? isRouteActive(pathname, route as Href)
              : false;
          const label = isLoginSlot ? (loggedIn ? 'Dashboard' : tab.label) : tab.label;
          const icon = isLoginSlot ? (loggedIn ? 'grid' : 'log-in') : tab.icon;

          return (
            <Pressable
              key={`${tab.target}-${tab.label}`}
              style={styles.item}
              onPress={() => {
                if (isLoginSlot && !loggedIn) {
                  setLoginSheetOpen(true);
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
      <LoginSheet visible={loginSheetOpen} onClose={() => setLoginSheetOpen(false)} />
    </>
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
