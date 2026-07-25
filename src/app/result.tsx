import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { ErrorState } from '@/components/ui/states';
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
  const [pickerOpen, setPickerOpen] = useState(false);
  const [srn, setSrn] = useState('');
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [result, setResult] = useState<ResultCheckResponse | undefined>(undefined);

  const activeSession = sessions.data?.find((s) => String(s.id) === sessionId);

  if (!enabled) return <SectionUnavailable />;

  async function handleSearch() {
    if (!activeSession || !srn.trim() || !dob.trim()) {
      setError('Please select a session and enter your SRN and date of birth.');
      setResult(undefined);
      return;
    }
    setLoading(true);
    setError(undefined);
    setResult(undefined);
    try {
      const record = await checkResult(String(activeSession.id), srn.trim(), dob.trim());
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
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="document-text" size={26} color="#fff" />
        </View>
        <View style={styles.heroText}>
          <ThemedText type="subtitle" themeColor="textOnBrand">
            Report Card
          </ThemedText>
          <ThemedText type="small" themeColor="textOnBrand" style={styles.heroSubtitle}>
            Enter your details to view your result
          </ThemedText>
        </View>
      </View>

      <Card style={styles.formCard}>
        <ThemedText type="smallBold" style={styles.label}>
          Session
        </ThemedText>
        <Pressable
          onPress={() => sessions.data && sessions.data.length > 0 && setPickerOpen(true)}
          style={[styles.select, { borderColor: theme.border }]}
        >
          <ThemedText type="default" themeColor={activeSession ? 'text' : 'textSecondary'}>
            {activeSession ? activeSession.label : 'Select session'}
          </ThemedText>
          <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
        </Pressable>

        <ThemedText type="smallBold" style={styles.label}>
          SRN
        </ThemedText>
        <TextInput
          value={srn}
          onChangeText={setSrn}
          placeholder="Enter your SRN"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        />

        <ThemedText type="smallBold" style={styles.label}>
          Date of Birth
        </ThemedText>
        <TextInput
          value={dob}
          onChangeText={(v) => setDob(v.replace(/\D/g, ''))}
          placeholder="DDMMYYYY"
          placeholderTextColor={theme.textSecondary}
          keyboardType="number-pad"
          maxLength={8}
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        />
        <ThemedText type="small" themeColor="textSecondary" style={styles.helper}>
          Enter as day, month, year with no slash or hyphen — DDMMYYYY.
        </ThemedText>

        <Button label="View Report Card" variant="primary" icon="search" onPress={handleSearch} loading={loading} />
      </Card>

      <View style={styles.disclaimerRow}>
        <Ionicons name="lock-closed-outline" size={16} color={theme.textSecondary} style={styles.disclaimerIcon} />
        <ThemedText type="small" themeColor="textSecondary" style={styles.disclaimerText}>
          Your details are used only to verify and load your official report card.
        </ThemedText>
      </View>

      {error ? <ErrorState message={error} /> : null}

      {result?.student ? (
        <Card style={styles.resultCard}>
          <ThemedText type="subtitle">{result.student.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.meta}>
            Class {result.student.class}
            {result.student.section} · SRN {result.student.srn}
          </ThemedText>
          <Button label="Open PDF" icon="document-text" variant="accent" onPress={() => openPdf(result.pdf_url)} />
        </Card>
      ) : null}

      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerOpen(false)}>
          <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
            <ThemedText type="smallBold" style={styles.modalTitle}>
              Select Session
            </ThemedText>
            {(sessions.data ?? []).map((s) => (
              <Pressable
                key={s.id}
                onPress={() => {
                  setSessionId(String(s.id));
                  setPickerOpen(false);
                }}
                style={[styles.modalRow, { borderBottomColor: theme.border }]}
              >
                <ThemedText type="default">{s.label}</ThemedText>
                {String(s.id) === sessionId ? (
                  <Ionicons name="checkmark" size={18} color={theme.tint} />
                ) : null}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.blue,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    marginBottom: Spacing.three,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: Brand.saffron,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
  },
  heroText: {
    flex: 1,
  },
  heroSubtitle: {
    opacity: 0.85,
    marginTop: 2,
  },
  formCard: {
    marginBottom: Spacing.three,
  },
  label: {
    marginBottom: Spacing.one,
    marginTop: Spacing.two,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two + 2,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  helper: {
    marginTop: Spacing.one,
    marginBottom: Spacing.three,
  },
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.three,
  },
  disclaimerIcon: {
    marginTop: 2,
    marginRight: Spacing.one,
  },
  disclaimerText: {
    flex: 1,
  },
  resultCard: {},
  meta: {
    marginBottom: Spacing.three,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Spacing.three,
    paddingBottom: Spacing.five,
  },
  modalTitle: {
    marginBottom: Spacing.two,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
