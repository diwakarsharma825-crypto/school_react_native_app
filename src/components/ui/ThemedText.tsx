import { StyleSheet, Text, type TextProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export type ThemedTextType =
  | 'title'
  | 'subtitle'
  | 'default'
  | 'small'
  | 'smallBold'
  | 'link'
  | 'code';

export type ThemedTextProps = TextProps & {
  type?: ThemedTextType;
  themeColor?: 'text' | 'textSecondary' | 'textOnBrand' | 'tint' | 'accent';
};

export function ThemedText({ style, type = 'default', themeColor = 'text', ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const color = theme[themeColor];

  return (
    <Text
      style={[
        { color },
        type === 'title' ? styles.title : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'default' ? styles.default : undefined,
        type === 'small' ? styles.small : undefined,
        type === 'smallBold' ? styles.smallBold : undefined,
        type === 'link' ? [styles.link, { color: theme.tint }] : undefined,
        type === 'code' ? styles.code : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  small: {
    fontSize: 13,
    lineHeight: 18,
  },
  smallBold: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    textDecorationLine: 'underline',
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 14,
  },
});
