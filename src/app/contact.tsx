import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, Loading } from '@/components/ui/states';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@/hooks/use-theme';
import { fetchSettings } from '@/data/api';
import { useFetch } from '@/hooks/use-fetch';

function ContactRow({
  icon,
  label,
  value,
  onPress,
  showDivider,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress: () => void;
  showDivider: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.row, showDivider && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <View style={[styles.rowIconWrap, { backgroundColor: theme.backgroundSelected }]}>
        <Ionicons name={icon} size={18} color={theme.tint} />
      </View>
      <View style={styles.rowText}>
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
        <ThemedText type="smallBold">{value}</ThemedText>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
    </Pressable>
  );
}

export default function ContactScreen() {
  const theme = useTheme();
  const { data, loading, error, refetch } = useFetch(fetchSettings);

  if (loading && !data) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading contact info…" />
      </Screen>
    );
  }

  if (error || !data) {
    return (
      <Screen scroll={false}>
        <ErrorState message="Could not load contact details." onRetry={refetch} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Card style={styles.card}>
        <ContactRow
          icon="location"
          label="Address"
          value={data.address}
          onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(data.address)}`)}
          showDivider
        />
        <ContactRow
          icon="call"
          label="Phone"
          value={data.phone}
          onPress={() => Linking.openURL(`tel:${data.phone}`)}
          showDivider
        />
        <ContactRow
          icon="mail"
          label="Email"
          value={data.email}
          onPress={() => Linking.openURL(`mailto:${data.email}`)}
          showDivider={false}
        />
      </Card>

      <View style={styles.ctaRow}>
        <Pressable
          onPress={() => Linking.openURL(`tel:${data.phone}`)}
          style={[styles.ctaButton, { backgroundColor: Brand.blue }]}
        >
          <Ionicons name="call" size={18} color={Brand.white} />
          <ThemedText type="smallBold" style={styles.ctaLabel}>
            Call
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(data.address)}`)}
          style={[styles.ctaButton, { backgroundColor: Brand.saffron }]}
        >
          <Ionicons name="navigate" size={18} color={Brand.white} />
          <ThemedText type="smallBold" style={styles.ctaLabel}>
            Directions
          </ThemedText>
        </Pressable>
      </View>

      <ThemedText type="subtitle" style={styles.heading}>
        Follow Us
      </ThemedText>
      <View style={styles.socialRow}>
        {data.facebook_url ? (
          <Pressable onPress={() => Linking.openURL(data.facebook_url!)} style={[styles.socialIcon, { backgroundColor: theme.tint }]}>
            <Ionicons name="logo-facebook" size={22} color={Brand.white} />
          </Pressable>
        ) : null}
        {data.youtube_url ? (
          <Pressable onPress={() => Linking.openURL(data.youtube_url!)} style={[styles.socialIcon, { backgroundColor: theme.tint }]}>
            <Ionicons name="logo-youtube" size={22} color={Brand.white} />
          </Pressable>
        ) : null}
        {data.instagram_url ? (
          <Pressable onPress={() => Linking.openURL(data.instagram_url!)} style={[styles.socialIcon, { backgroundColor: theme.tint }]}>
            <Ionicons name="logo-instagram" size={22} color={Brand.white} />
          </Pressable>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    marginBottom: Spacing.three,
  },
  card: {
    marginBottom: Spacing.three,
    paddingVertical: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three,
  },
  rowIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  ctaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Radius.pill,
  },
  ctaLabel: {
    color: Brand.white,
  },
  socialRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  socialIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
