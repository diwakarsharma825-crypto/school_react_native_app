import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
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
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Ionicons name={icon} size={20} color={theme.tint} style={styles.rowIcon} />
      <ThemedText type="default" style={styles.rowText}>
        {label}
      </ThemedText>
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
      <ThemedText type="title" style={styles.heading}>
        Contact Us
      </ThemedText>
      <Card style={styles.card}>
        <ContactRow
          icon="location"
          label={data.address}
          onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(data.address)}`)}
        />
        <ContactRow icon="call" label={data.phone} onPress={() => Linking.openURL(`tel:${data.phone}`)} />
        <ContactRow icon="mail" label={data.email} onPress={() => Linking.openURL(`mailto:${data.email}`)} />
      </Card>

      <ThemedText type="subtitle" style={styles.heading}>
        Follow Us
      </ThemedText>
      <View style={styles.socialRow}>
        {data.facebook_url ? (
          <Pressable onPress={() => Linking.openURL(data.facebook_url!)} style={[styles.socialIcon, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons name="logo-facebook" size={22} color={theme.tint} />
          </Pressable>
        ) : null}
        {data.youtube_url ? (
          <Pressable onPress={() => Linking.openURL(data.youtube_url!)} style={[styles.socialIcon, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons name="logo-youtube" size={22} color={theme.tint} />
          </Pressable>
        ) : null}
        {data.instagram_url ? (
          <Pressable onPress={() => Linking.openURL(data.instagram_url!)} style={[styles.socialIcon, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons name="logo-instagram" size={22} color={theme.tint} />
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
    marginBottom: Spacing.four,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  rowIcon: {
    marginRight: Spacing.three,
  },
  rowText: {
    flex: 1,
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
