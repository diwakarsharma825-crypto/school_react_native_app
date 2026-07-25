import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@/hooks/use-theme';
import { fetchSettings } from '@/data/api';
import { useFetch } from '@/hooks/use-fetch';

const logoSource = require('../../../assets/images/icon.png');

interface Row {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

function RowList({ rows }: { rows: Row[] }) {
  const theme = useTheme();
  return (
    <Card style={styles.listCard}>
      {rows.map((item, idx) => (
        <Pressable
          key={item.label}
          onPress={item.onPress}
          style={[
            styles.row,
            idx < rows.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth },
          ]}
        >
          <View style={styles.rowLeft}>
            <View style={[styles.rowIconWrap, { backgroundColor: theme.backgroundElement }]}>
              <Ionicons name={item.icon} size={18} color={theme.tint} />
            </View>
            <ThemedText type="default">{item.label}</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </Pressable>
      ))}
    </Card>
  );
}

export default function MoreScreen() {
  const { data: settings } = useFetch(fetchSettings);

  const exploreRows: Row[] = [
    { label: 'Notifications', icon: 'notifications-outline', onPress: () => router.push('/notifications') },
    { label: 'About Us', icon: 'information-circle-outline', onPress: () => router.push('/about') },
    { label: 'Announcements', icon: 'megaphone-outline', onPress: () => router.push('/notices') },
    { label: 'Result / Report Card', icon: 'document-text-outline', onPress: () => router.push('/result') },
    { label: 'Contact Us', icon: 'call-outline', onPress: () => router.push('/contact') },
  ];

  const infoRows: Row[] = [
    { label: 'Our Teachers', icon: 'people-outline', onPress: () => router.push('/teachers') },
    { label: 'Top Students', icon: 'ribbon-outline', onPress: () => router.push('/top-students') },
    { label: 'Mandatory Disclosure', icon: 'shield-checkmark-outline', onPress: () => router.push('/disclosure') },
    {
      label: 'School Website',
      icon: 'globe-outline',
      onPress: () => Linking.openURL('https://www.saarthakgimsss12a.org'),
    },
  ];

  const followRows: Row[] = [
    {
      label: 'Facebook',
      icon: 'logo-facebook',
      onPress: () => settings?.facebook_url && Linking.openURL(settings.facebook_url),
    },
    {
      label: 'YouTube',
      icon: 'logo-youtube',
      onPress: () => settings?.youtube_url && Linking.openURL(settings.youtube_url),
    },
    {
      label: 'Instagram',
      icon: 'logo-instagram',
      onPress: () => settings?.instagram_url && Linking.openURL(settings.instagram_url),
    },
  ];

  const schoolName = settings?.school_name ?? 'Saarthak GIMSSS';
  const address = settings?.address ?? 'Sector 12-A, Panchkula, Haryana';

  return (
    <Screen>
      <View style={styles.brandCard}>
        <Image source={logoSource} style={styles.logo} contentFit="cover" />
        <ThemedText type="subtitle" themeColor="textOnBrand" style={styles.brandName}>
          {schoolName}
        </ThemedText>
        <ThemedText type="small" themeColor="textOnBrand" style={styles.brandAddress}>
          {address}
        </ThemedText>
      </View>

      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
        EXPLORE
      </ThemedText>
      <RowList rows={exploreRows} />

      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
        INFORMATION
      </ThemedText>
      <RowList rows={infoRows} />

      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
        FOLLOW US
      </ThemedText>
      <RowList rows={followRows} />

      <View style={styles.footer}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.footerText}>
          {schoolName} · {address}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.footerText}>
          Vedic Culture · Scientific Approach · Communication
        </ThemedText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brandCard: {
    backgroundColor: Brand.blue,
    borderRadius: Radius.lg,
    alignItems: 'center',
    padding: Spacing.four,
    marginBottom: Spacing.four,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: Spacing.two,
    backgroundColor: '#fff',
  },
  brandName: {
    textAlign: 'center',
  },
  brandAddress: {
    textAlign: 'center',
    opacity: 0.85,
    marginTop: 2,
  },
  sectionTitle: {
    marginBottom: Spacing.two,
    letterSpacing: 0.5,
  },
  listCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: Spacing.four,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
  },
  footerText: {
    textAlign: 'center',
    marginBottom: 2,
  },
});
