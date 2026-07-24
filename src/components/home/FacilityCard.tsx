import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Facility } from '@/data/types';
import { Card } from '../ui/Card';
import { ThemedText } from '../ui/ThemedText';

interface FacilityCardProps {
  facility: Facility;
}

export function FacilityCard({ facility }: FacilityCardProps) {
  const theme = useTheme();

  return (
    <Card style={styles.card}>
      {facility.imageUrl ? (
        <Image source={{ uri: facility.imageUrl }} style={styles.image} contentFit="cover" />
      ) : (
        <View style={[styles.iconWrap, { backgroundColor: theme.backgroundElement }]}>
          <Ionicons name={facility.icon as keyof typeof Ionicons.glyphMap} size={26} color={theme.tint} />
        </View>
      )}
      <ThemedText type="smallBold" style={styles.title}>
        {facility.title}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {facility.description}
      </ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 200,
    marginRight: Spacing.three,
  },
  image: {
    width: '100%',
    height: 100,
    borderRadius: Radius.md,
    marginBottom: Spacing.two,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  title: {
    marginBottom: Spacing.half,
  },
});
