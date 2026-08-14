import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from './ThemedText';

export interface ExportPdfButtonProps {
  onPress: () => void;
  label?: string;
  variant?: 'fill' | 'outline' | 'compact';
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export function ExportPdfButton({
  onPress,
  label = 'Export PDF',
  variant = 'fill',
  style,
  disabled = false,
}: ExportPdfButtonProps) {
  const theme = useTheme();

  const outlineBorder = theme.dark ? '#60A5FA' : theme.tint;
  const outlineBg = theme.dark ? 'rgba(96, 165, 250, 0.15)' : theme.surface;
  const outlineText = theme.dark ? '#FFFFFF' : theme.tint;
  const fillBg = theme.dark ? '#2563EB' : theme.tint;

  if (variant === 'compact') {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={[
          styles.compact,
          { backgroundColor: fillBg, opacity: disabled ? 0.5 : 1 },
          style,
        ]}
      >
        <Ionicons name="document-text-outline" size={14} color={Brand.white} />
        <ThemedText type="smallBold" style={{ color: Brand.white }}>
          {label}
        </ThemedText>
      </Pressable>
    );
  }

  if (variant === 'outline') {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={[
          styles.button,
          { backgroundColor: outlineBg, borderColor: outlineBorder, borderWidth: 1.5, opacity: disabled ? 0.5 : 1 },
          style,
        ]}
      >
        <Ionicons name="document-text-outline" size={16} color={outlineText} />
        <ThemedText type="smallBold" style={{ color: outlineText }}>
          {label}
        </ThemedText>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        { backgroundColor: fillBg, opacity: disabled ? 0.5 : 1 },
        style,
      ]}
    >
      <Ionicons name="document-text-outline" size={16} color={Brand.white} />
      <ThemedText type="smallBold" style={{ color: Brand.white }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: 9,
    borderRadius: Radius.pill,
  },
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
});
