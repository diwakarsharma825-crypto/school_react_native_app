import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Brand, Radius, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from './ThemedText';

export interface ProfileMenuItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  destructive?: boolean;
}

interface ProfileHeaderBarProps {
  icon: keyof typeof Ionicons.glyphMap;
  name: string;
  /** A real uploaded photo (e.g. a student's photo added by their teacher)
   * — shown instead of the icon circle when present. */
  photoUrl?: string | null;
  /** Contact line — email for a teacher, phone for a student — shown right
   * under the name so both sides of the app always show who's logged in
   * and how to reach them, not just a display name. */
  contact?: string | null;
  subtitle?: string;
  /** Currently running academic year/session, e.g. "April 2025 - March 2026" —
   * shown as its own line so it's always clear which session is active. */
  sessionLabel?: string;
  menu: ProfileMenuItem[];
  style?: any;
}

export function ProfileHeaderBar({ icon, name, photoUrl, contact, subtitle, sessionLabel, menu, style }: ProfileHeaderBarProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <View style={[styles.bar, { backgroundColor: theme.surface, borderColor: theme.border }, style]}>
      <Pressable
        onPress={() => router.push('/profile')}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
      >
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.avatarPhoto} contentFit="cover" />
        ) : (
          <View style={[styles.avatar, { backgroundColor: theme.backgroundSelected }]}>
            <Ionicons name={icon} size={20} color={theme.tint} />
          </View>
        )}
        <View style={styles.textCol}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {name}
          </ThemedText>
          {contact ? (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {contact}
            </ThemedText>
          ) : null}
          {subtitle ? (
            <ThemedText type="small" themeColor="textSecondary">
              {subtitle}
            </ThemedText>
          ) : null}
          {sessionLabel ? (
            <ThemedText type="small" themeColor="tint">
              Session: {sessionLabel}
            </ThemedText>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} style={{ marginRight: 6 }} />
      </Pressable>
      {menu.length > 0 ? (
        <Pressable onPress={() => setOpen(true)} hitSlop={10} style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={18} color={theme.textSecondary} />
        </Pressable>
      ) : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={[styles.menuCard, { backgroundColor: theme.surface }, Shadow.card]}>
            {menu.map((item, i) => (
              <Pressable
                key={item.label}
                onPress={() => {
                  setOpen(false);
                  item.onPress();
                }}
                style={[styles.menuRow, i < menu.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: 1 }]}
              >
                <Ionicons name={item.icon} size={18} color={item.destructive ? Brand.red : theme.text} />
                <ThemedText type="default" style={item.destructive ? { color: Brand.red } : undefined}>
                  {item.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    marginBottom: Spacing.two,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
  },
  avatarPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.three,
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  menuButton: {
    padding: Spacing.two,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'flex-end',
    paddingTop: 90,
    paddingRight: Spacing.four,
  },
  menuCard: {
    minWidth: 180,
    borderRadius: Radius.md,
    overflow: 'hidden',
    paddingVertical: Spacing.one,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
});
