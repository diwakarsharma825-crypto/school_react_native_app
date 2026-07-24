import React from 'react';
import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/ui/ThemedText';

export default function AboutScreen() {
  return (
    <Screen>
      <ThemedText type="title" style={styles.heading}>
        About Saarthak GIMSS
      </ThemedText>

      <Card style={styles.card}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Our History
        </ThemedText>
        <ThemedText type="default">
          Saarthak Global Indian Model Senior Secondary School was established in Sector 12-A,
          Panchkula, with a vision to provide holistic, value-based education rooted in Vedic
          culture while embracing a scientific and modern outlook. Over the years, the school has
          grown into a trusted institution serving thousands of students from Nursery to Class XII.
        </ThemedText>
      </Card>

      <Card style={styles.card}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Our Mission
        </ThemedText>
        <ThemedText type="default">
          To nurture confident, compassionate and capable individuals by blending strong academic
          foundations with moral and cultural values, preparing every student to contribute
          meaningfully to society.
        </ThemedText>
      </Card>

      <Card style={styles.card}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Our Vision
        </ThemedText>
        <ThemedText type="default">
          To be recognized as a center of academic excellence and character building, where
          students are empowered with knowledge, skills and values to become responsible global
          citizens rooted in Indian heritage.
        </ThemedText>
      </Card>

      <Card style={styles.card}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Why Saarthak GIMSS
        </ThemedText>
        <ThemedText type="default">
          Experienced faculty, modern smart classrooms, well-equipped science and computer labs, a
          vibrant sports program, and a curriculum that balances academics with co-curricular
          growth — Saarthak GIMSS strives to give every child the best possible start in life.
        </ThemedText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    marginBottom: Spacing.three,
  },
  card: {
    marginBottom: Spacing.three,
  },
  sectionTitle: {
    marginBottom: Spacing.two,
  },
});
