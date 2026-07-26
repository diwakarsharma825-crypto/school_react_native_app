import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { PrincipalCard } from '@/components/home/PrincipalCard';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, Loading } from '@/components/ui/states';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@/hooks/use-theme';
import { fetchSettings } from '@/data/api';
import { useFetch } from '@/hooks/use-fetch';
import { stripHtml } from '@/lib/format';

const VALUES = [
  { icon: 'flower-outline' as const, color: Brand.saffron, title: 'Vedic Culture', desc: 'Grounded in Indian values and heritage.' },
  { icon: 'flask-outline' as const, color: Brand.blueLight, title: 'Scientific Approach', desc: 'Curiosity, reasoning and enquiry-led learning.' },
  { icon: 'chatbubbles-outline' as const, color: Brand.green, title: 'Communication', desc: 'Confident expression for a global stage.' },
];

export default function AboutScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data, loading, error, refetch } = useFetch(fetchSettings);

  if (loading && !data) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading about us…" />
      </Screen>
    );
  }

  if (error || !data) {
    return (
      <Screen scroll={false}>
        <ErrorState message="Could not load this page." onRetry={refetch} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.hero}>
        {data.about_image_url ? (
          <Image source={{ uri: data.about_image_url }} style={styles.heroImage} contentFit="cover" />
        ) : (
          <View style={[styles.heroImage, { backgroundColor: theme.backgroundElement }]} />
        )}
        <View style={styles.heroOverlay}>
          {data.logo_url ? (
            <Image source={{ uri: data.logo_url }} style={styles.heroLogo} contentFit="cover" />
          ) : null}
          <ThemedText type="title" style={styles.heroTitle}>
            {data.school_name}
          </ThemedText>
          <ThemedText type="small" style={styles.heroSubtitle}>
            {data.address}
          </ThemedText>
        </View>
      </View>

      <View style={styles.badgeRow}>
        <View style={[styles.badge, { backgroundColor: theme.backgroundSelected }]}>
          <Ionicons name="ribbon-outline" size={14} color={theme.tint} />
          <ThemedText type="small" style={styles.badgeLabel}>
            CBSE Affiliated
          </ThemedText>
        </View>
        <View style={[styles.badge, { backgroundColor: theme.backgroundSelected }]}>
          <Ionicons name="school-outline" size={14} color={theme.tint} />
          <ThemedText type="small" style={styles.badgeLabel}>
            Sr. Secondary
          </ThemedText>
        </View>
        <View style={[styles.badge, { backgroundColor: theme.backgroundSelected }]}>
          <Ionicons name="location-outline" size={14} color={theme.tint} />
          <ThemedText type="small" style={styles.badgeLabel}>
            {data.address.split(',')[0]}
          </ThemedText>
        </View>
      </View>

      {data.about_text ? (
        <Card style={styles.card}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Who We Are
          </ThemedText>
          <ThemedText type="default" themeColor="textSecondary">
            {stripHtml(data.about_text)}
          </ThemedText>
        </Card>
      ) : null}

      <ThemedText type="subtitle" style={styles.sectionTitle}>
        Our Values
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.sectionSubtitle}>
        The pillars of a {data.school_name} education
      </ThemedText>
      {VALUES.map((v) => (
        <Card key={v.title} style={[styles.valueCard, { borderLeftColor: v.color, borderLeftWidth: 4 }]}>
          <View style={styles.valueRow}>
            <View style={[styles.valueIconWrap, { backgroundColor: theme.backgroundSelected }]}>
              <Ionicons name={v.icon} size={20} color={v.color} />
            </View>
            <View style={styles.valueText}>
              <ThemedText type="smallBold">{v.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {v.desc}
              </ThemedText>
            </View>
          </View>
        </Card>
      ))}

      {data.principle_text ? (
        <>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Principal&apos;s Message
          </ThemedText>
          <PrincipalCard
            photoUrl={data.principle_image_url ?? null}
            message={stripHtml(data.principle_text)}
            name={data.principal_name}
          />
        </>
      ) : null}

      <Card style={styles.ctaCard}>
        <Ionicons name="school-outline" size={30} color={theme.tint} style={styles.ctaIcon} />
        <ThemedText type="subtitle" style={styles.ctaTitle}>
          Come visit us
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.ctaSubtitle}>
          We&apos;d love to welcome you to our campus.
        </ThemedText>
        <Pressable onPress={() => router.push('/contact')} style={[styles.ctaButton, { backgroundColor: theme.tint }]}>
          <Ionicons name="call" size={16} color={Brand.white} />
          <ThemedText type="smallBold" style={styles.ctaButtonLabel}>
            Contact Us
          </ThemedText>
        </Pressable>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.three,
  },
  heroImage: {
    width: '100%',
    height: 180,
  },
  heroOverlay: {
    position: 'absolute',
    left: Spacing.three,
    bottom: Spacing.three,
  },
  heroLogo: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    marginBottom: Spacing.two,
  },
  heroTitle: {
    color: Brand.white,
  },
  heroSubtitle: {
    color: Brand.white,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
  badgeLabel: {},
  card: {
    marginBottom: Spacing.four,
  },
  sectionTitle: {
    marginBottom: Spacing.one,
  },
  sectionSubtitle: {
    marginBottom: Spacing.three,
  },
  valueCard: {
    marginBottom: Spacing.three,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
  },
  valueText: {
    flex: 1,
    gap: 2,
  },
  ctaCard: {
    alignItems: 'center',
    marginTop: Spacing.two,
    marginBottom: Spacing.four,
    paddingVertical: Spacing.five,
  },
  ctaIcon: {
    marginBottom: Spacing.two,
  },
  ctaTitle: {
    marginBottom: Spacing.one,
  },
  ctaSubtitle: {
    textAlign: 'center',
    marginBottom: Spacing.three,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Radius.pill,
  },
  ctaButtonLabel: {
    color: Brand.white,
  },
});
