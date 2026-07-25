import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { useThemeMode } from '@/hooks/use-theme-mode';

/** Sun/moon toggle shown in the header. Manual override, persisted —
 * see use-theme-mode.tsx for why this isn't system-driven. */
export function ThemeToggle() {
  const { mode, toggle } = useThemeMode();
  const isDark = mode === 'dark';

  return (
    <Pressable
      onPress={toggle}
      hitSlop={10}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      accessibilityRole="button"
    >
      <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={20} color="#fff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  pressed: {
    opacity: 0.7,
  },
});
