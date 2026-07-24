import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { ErrorState } from '@/components/ui/states';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@/hooks/use-theme';
import { fetchResult } from '@/data/api';
import { ResultRecord } from '@/data/types';

export default function ResultScreen() {
  const theme = useTheme();
  const [className, setClassName] = useState('');
  const [roll, setRoll] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [result, setResult] = useState<ResultRecord | undefined>(undefined);

  async function handleSearch() {
    if (!className.trim() || !roll.trim()) {
      setError('Please enter both class and roll number.');
      setResult(undefined);
      return;
    }
    setLoading(true);
    setError(undefined);
    setResult(undefined);
    try {
      const record = await fetchResult(className.trim(), roll.trim());
      setResult(record);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No result found for the given details.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <ThemedText type="title" style={styles.heading}>
        Check Result
      </ThemedText>
      <Card style={styles.formCard}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
          Class
        </ThemedText>
        <TextInput
          value={className}
          onChangeText={setClassName}
          placeholder="e.g. VIII-A"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        />
        <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
          Roll Number
        </ThemedText>
        <TextInput
          value={roll}
          onChangeText={setRoll}
          placeholder="e.g. 23"
          placeholderTextColor={theme.textSecondary}
          keyboardType="number-pad"
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        />
        <Button label="Search" variant="primary" icon="search" onPress={handleSearch} loading={loading} />
      </Card>

      {error ? <ErrorState message={error} /> : null}

      {result ? (
        <Card style={styles.resultCard}>
          <ThemedText type="subtitle">{result.studentName}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.meta}>
            {result.className} · Roll {result.rollNo} · {result.term}
          </ThemedText>
          <ThemedText type="smallBold" style={styles.percentage}>
            Overall: {result.percentage}%
          </ThemedText>

          <View style={[styles.tableHeader, { borderBottomColor: theme.border }]}>
            <ThemedText type="smallBold" style={styles.colSubject}>
              Subject
            </ThemedText>
            <ThemedText type="smallBold" style={styles.colMarks}>
              Marks
            </ThemedText>
            <ThemedText type="smallBold" style={styles.colGrade}>
              Grade
            </ThemedText>
          </View>
          {result.subjects.map((s) => (
            <View key={s.name} style={[styles.tableRow, { borderBottomColor: theme.border }]}>
              <ThemedText type="small" style={styles.colSubject}>
                {s.name}
              </ThemedText>
              <ThemedText type="small" style={styles.colMarks}>
                {s.marks}/{s.max}
              </ThemedText>
              <ThemedText type="small" style={styles.colGrade}>
                {s.grade}
              </ThemedText>
            </View>
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    marginBottom: Spacing.three,
  },
  formCard: {
    marginBottom: Spacing.three,
  },
  label: {
    marginBottom: Spacing.one,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    marginBottom: Spacing.three,
  },
  resultCard: {},
  meta: {
    marginBottom: Spacing.two,
  },
  percentage: {
    marginBottom: Spacing.three,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingBottom: Spacing.one,
    marginBottom: Spacing.one,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.one,
  },
  colSubject: {
    flex: 2,
  },
  colMarks: {
    flex: 1,
  },
  colGrade: {
    flex: 1,
  },
});
