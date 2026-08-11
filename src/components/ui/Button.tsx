import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from './ThemedText';

type ButtonVariant = 'primary' | 'accent' | 'outline';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
}

export function Button({ label, onPress, variant = 'primary', icon, loading = false, disabled = false }: ButtonProps) {
  const theme = useTheme();

  const backgroundColor =
    variant === 'primary' ? theme.tint : variant === 'accent' ? theme.accent : 'transparent';
  const borderColor = variant === 'outline' ? theme.tint : 'transparent';
  const textColor = variant === 'outline' ? theme.tint : theme.textOnBrand;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor, borderColor, borderWidth: variant === 'outline' ? 1.5 : 0 },
        (disabled || loading) && styles.disabled,
        pressed && !disabled && !loading ? styles.pressed : undefined,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={textColor} style={styles.icon} />
        ) : icon ? (
          <Ionicons name={icon} size={18} color={textColor} style={styles.icon} />
        ) : null}
        <ThemedText type="smallBold" style={{ color: textColor }}>
          {label}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: Radius.md,
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: Spacing.one,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.6,
  },
});
