import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleProp, TextInput, TextInputProps, TextStyle, Pressable, StyleSheet, View, ViewStyle } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface PasswordInputProps extends Omit<TextInputProps, 'secureTextEntry' | 'style'> {
  containerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<TextStyle>;
}

/** Drop-in replacement for a plain password `TextInput` — same look every
 * password field in the app already used (border, radius, padding), plus
 * an eye icon to toggle showing the typed value. */
export function PasswordInput({ containerStyle, style, ...props }: PasswordInputProps) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);

  return (
    <View style={[styles.wrap, { borderColor: theme.border }, containerStyle]}>
      <TextInput
        {...props}
        numberOfLines={1}
        multiline={false}
        secureTextEntry={!visible}
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { color: theme.text }, style]}
      />
      <Pressable onPress={() => setVisible((v) => !v)} hitSlop={10} style={styles.eyeButton}>
        <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.sm,
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two + 2,
    fontSize: 16,
  },
  eyeButton: {
    paddingHorizontal: Spacing.two,
  },
});
