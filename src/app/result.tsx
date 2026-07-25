import React, { useState } from 'react';
import { Linking, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, Loading } from '@/components/ui/states';
import { SectionUnavailable } from '@/components/ui/SectionUnavailable';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@/hooks/use-theme';
import { checkResult, fetchResultSessions } from '@/data/api';
import { useFetch } from '@/hooks/use-fetch';
import { useSectionEnabled } from '@/hooks/use-sections';
import { ResultCheckResponse } from '@/data/types';

export default function ResultScreen() {
  const theme = useTheme();
  const enabled = useSectionEnabled('result');
  const sessions = useFetch(fetchResultSessions);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [srn, setSrn] = useState('');
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [result, setResult] = useState<ResultCheckResponse | undefined>(undefined);

  const activeSession = sessionId ?? (sessions.data && sessions.data[0] ? String(sessions.data[0].id) : undefined);

  if (!enabled) return <SectionUnavailable />;

  async function handleSearch() {
    if (!activeSession || !srn.trim() || !dob.trim()) {
      setError('Please select a session and enter your SRN and date of birth (YYYY-MM-DD).');
      setResult(undefined);
      return;
    }
    setLoading(true);
    setError(undefined);
    setResult(undefined);
    try {
      const record = await checkResult(activeSession, srn.trim(), dob.trim());
      setResult(record);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No result found for the given details.');
    } finally {
      setLoading(false);
    }
  }

  async function openPdf(url: string) {
    await Linking.openURL(url);
  }

  return (
    <Screen>
      <ThemedText type="title" style={styles.heading}>
        Check Result
      </ThemedText>
      <Card style={styles.formCard}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
          Academic Session
        </ThemedText>
        {sessions.loading && !sessions.data ? (
          <Loading label="Loading sessions…" />
        ) : sessions.data && sessions.data.length > 0 ? (
          <View style={styles.sessionRow}>
            {sessions.data.map((s) => {
              const isActive = String(s.id) === activeSession;
              return (
                <Pressable
                  key={s.id}
                  onPress={() => setSessionId(String(s.id))}
                  style={[
                    styles.sessionChip,
                    { borderColor: theme.border },
                    isActive && { backgroundColor: theme.tint, borderColor: theme.tint },
                  ]}
                >
                  <ThemedText type="small" style={isActive ? { color: '#fff' } : undefined}>
                    {s.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
            No sessions available right now.
          </ThemedText>
        )}

        <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
          SRN
        </ThemedText>
        <TextInput
          value={srn}
          onChangeText={setSrn}
          placeholder="Student Registration Number"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        />
        <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
          Date of Birth
        </ThemedText>
        <TextInput
          value={dob}
          onChangeText={setDob}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        />
        <Button label="Search" variant="primary" icon="search" onPress={handleSearch} loading={loading} />
      </Card>

      {error ? <ErrorState message={error} /> : null}

      {result?.student ? (
        <Card style={styles.resultCard}>
          <ThemedText type="subtitle">{result.student.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.meta}>
            Class {result.student.class}
            {result.student.section} · SRN {result.student.srn}
          </ThemedText>
          <Button label="View Report Card" icon="document-text" variant="accent" onPress={() => openPdf(result.pdf_url)} />
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
  sessionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  sessionChip: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
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
    marginBottom: Spacing.three,
  },
});
