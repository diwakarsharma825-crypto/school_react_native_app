import React from 'react';
import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, Loading } from '@/components/ui/states';
import { ThemedText } from '@/components/ui/ThemedText';
import { fetchSettings } from '@/data/api';
import { useFetch } from '@/hooks/use-fetch';
import { stripHtml } from '@/lib/format';

export default function AboutScreen() {
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
      <ThemedText type="title" style={styles.heading}>
        About {data.school_name}
      </ThemedText>

      {data.about_text ? (
        <Card style={styles.card}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Our School
          </ThemedText>
          <ThemedText type="default">{stripHtml(data.about_text)}</ThemedText>
        </Card>
      ) : null}

      {data.courses_text ? (
        <Card style={styles.card}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Our Courses
          </ThemedText>
          <ThemedText type="default">{stripHtml(data.courses_text)}</ThemedText>
        </Card>
      ) : null}

      {data.principle_text ? (
        <Card style={styles.card}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            From the Principal
          </ThemedText>
          <ThemedText type="default">{stripHtml(data.principle_text)}</ThemedText>
        </Card>
      ) : null}
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
