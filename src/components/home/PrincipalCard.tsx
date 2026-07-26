import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Card } from '../ui/Card';
import { ThemedText } from '../ui/ThemedText';

interface PrincipalCardProps {
  photoUrl: string | null;
  message: string;
  name?: string | null;
}

const TRUNCATE_LENGTH = 180;

export function PrincipalCard({ photoUrl, message, name }: PrincipalCardProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const isLong = message.length > TRUNCATE_LENGTH;
  const shown = expanded || !isLong ? message : `${message.slice(0, TRUNCATE_LENGTH).trim()}…`;

  return (
    <Card>
      <View style={styles.header}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.photo} contentFit="cover" />
        ) : (
          <View style={[styles.photo, styles.photoFallback, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons name="person" size={26} color={theme.tint} />
          </View>
        )}
        <View style={styles.headerText}>
          {name ? <ThemedText type="smallBold">{name}</ThemedText> : null}
          <ThemedText type={name ? 'small' : 'smallBold'} themeColor={name ? 'textSecondary' : 'text'}>
            From the Principal&apos;s Desk
          </ThemedText>
        </View>
      </View>
      <View style={styles.quoteRow}>
        <Ionicons name="chatbox-ellipses-outline" size={18} color={theme.accent} style={styles.quoteIcon} />
        <ThemedText type="default" style={styles.message}>
          {shown}
        </ThemedText>
      </View>
      {isLong ? (
        <Pressable onPress={() => setExpanded((v) => !v)} hitSlop={8}>
          <ThemedText type="smallBold" themeColor="tint" style={styles.readMore}>
            {expanded ? 'Read less ⌃' : 'Read more ⌄'}
          </ThemedText>
        </Pressable>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  photo: {
    width: 56,
    height: 56,
    borderRadius: Radius.pill,
    marginRight: Spacing.three,
  },
  photoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  quoteRow: {
    flexDirection: 'row',
  },
  quoteIcon: {
    marginRight: Spacing.two,
    marginTop: 2,
  },
  message: {
    flex: 1,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  readMore: {
    marginTop: Spacing.two,
  },
});
