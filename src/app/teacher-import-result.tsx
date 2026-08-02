import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/ui/ThemedText';
import { TeacherGuard } from '@/components/ui/TeacherGuard';
import { downloadResultTemplate, importTeacherResult } from '@/data/teacher-api';
import { useTheme } from '@/hooks/use-theme';

export default function TeacherImportResultScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [file, setFile] = useState<{ uri: string; name: string; mimeType?: string | null } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleDownloadTemplate() {
    setError(null);
    setDownloading(true);
    try {
      const { uri } = await downloadResultTemplate();
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { dialogTitle: 'Save Result Template' });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not download the template.');
    } finally {
      setDownloading(false);
    }
  }

  async function handlePickFile() {
    setError(null);
    setSuccessMessage(null);
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'text/csv',
        'text/comma-separated-values',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType });
  }

  async function handleUpload() {
    if (!file) {
      setError('Please choose a result file first.');
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const { message } = await importTeacherResult(file);
      setSuccessMessage(message);
      setFile(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not import result. Please check the file and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <TeacherGuard>
      <Screen>
        <Card style={styles.card}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.intro}>
            Upload a result sheet (.csv or .xlsx) in the same template used on the admin panel's Import Result
            page, for your own class only. Existing students matched by roll number will be updated.
          </ThemedText>

          <Pressable
            onPress={handleDownloadTemplate}
            disabled={downloading}
            style={[styles.templateButton, { borderColor: theme.tint, opacity: downloading ? 0.6 : 1 }]}
          >
            <ThemedText type="smallBold" themeColor="tint">
              {downloading ? 'Preparing…' : 'Download Template'}
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={handlePickFile}
            style={[styles.filePicker, { borderColor: theme.border }]}
          >
            <ThemedText type="smallBold">{file ? file.name : 'Choose file…'}</ThemedText>
          </Pressable>

          {error ? (
            <ThemedText type="small" style={styles.error}>
              {error}
            </ThemedText>
          ) : null}

          {successMessage ? (
            <ThemedText type="small" style={styles.success}>
              {successMessage}
            </ThemedText>
          ) : null}

          <Pressable
            onPress={handleUpload}
            disabled={submitting || !file}
            style={[styles.button, { backgroundColor: theme.tint, opacity: submitting || !file ? 0.6 : 1 }]}
          >
            <ThemedText type="smallBold" style={styles.buttonLabel}>
              {submitting ? 'Importing…' : 'Import Result'}
            </ThemedText>
          </Pressable>

          <Pressable onPress={() => router.back()} style={styles.cancelButton}>
            <ThemedText type="small" themeColor="textSecondary">
              Back
            </ThemedText>
          </Pressable>
        </Card>
      </Screen>
    </TeacherGuard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.four,
  },
  intro: {
    marginBottom: Spacing.three,
    lineHeight: 18,
  },
  templateButton: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    alignItems: 'center',
    paddingVertical: Spacing.two + 2,
    marginBottom: Spacing.three,
  },
  filePicker: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  error: {
    color: Brand.red,
    marginTop: Spacing.three,
  },
  success: {
    color: Brand.green,
    marginTop: Spacing.three,
  },
  button: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Radius.pill,
    marginTop: Spacing.four,
  },
  buttonLabel: {
    color: Brand.white,
  },
  cancelButton: {
    alignItems: 'center',
    marginTop: Spacing.three,
  },
});
