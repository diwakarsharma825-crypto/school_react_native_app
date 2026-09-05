import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { SelectField } from '@/components/ui/SelectField';
import { ThemedText } from '@/components/ui/ThemedText';
import { TeacherGuard } from '@/components/ui/TeacherGuard';
import { downloadResultTemplate, importTeacherResult, formatClassLabel } from '@/data/teacher-api';
import { useTeacherAuth } from '@/hooks/use-teacher-auth';
import { useTheme } from '@/hooks/use-theme';

export default function TeacherImportResultScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile } = useTeacherAuth();

  const classes = profile?.classes ?? [];
  const classOptions = classes.map((c) => ({
    label: formatClassLabel(c.class_name, c.section_name),
    value: String(c.class_id),
  }));

  const [classId, setClassId] = useState<string | null>(classOptions[0]?.value ?? null);
  const [file, setFile] = useState<{ uri: string; name: string; mimeType?: string | null } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedClass = classes.find((c) => String(c.class_id) === classId);

  async function handleDownloadTemplate() {
    setError(null);
    setDownloading(true);
    try {
      const cId = selectedClass ? selectedClass.class_id : undefined;
      const sId = selectedClass ? (selectedClass.section_id ?? undefined) : undefined;
      const { uri } = await downloadResultTemplate(cId, sId);
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
        '*/*',
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
      const cId = selectedClass ? selectedClass.class_id : undefined;
      const sId = selectedClass ? (selectedClass.section_id ?? undefined) : undefined;
      const { message } = await importTeacherResult(file, cId, sId);
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
            Download the result template pre-filled with your class roster, add your exam &amp; score details, then upload (.csv or .xlsx) to import student marks.
          </ThemedText>

          {classOptions.length > 0 ? (
            <SelectField
              label="Select Class"
              placeholder="Choose class"
              value={classId}
              options={classOptions}
              onChange={setClassId}
            />
          ) : null}

          <Pressable
            onPress={handleDownloadTemplate}
            disabled={downloading}
            style={[
              styles.templateButton,
              {
                borderColor: theme.dark ? '#60A5FA' : theme.tint,
                backgroundColor: theme.dark ? 'rgba(96, 165, 250, 0.15)' : theme.surface,
                opacity: downloading ? 0.6 : 1,
              },
            ]}
          >
            <ThemedText type="smallBold" style={{ color: theme.dark ? '#FFFFFF' : theme.tint }}>
              {downloading ? 'Preparing template…' : 'Download Template'}
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={handlePickFile}
            style={[
              styles.filePicker,
              {
                borderColor: theme.dark ? '#60A5FA' : theme.border,
                backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.05)' : theme.surface,
              },
            ]}
          >
            <ThemedText type="smallBold" style={{ color: theme.dark ? '#FFFFFF' : theme.text }}>
              {file ? file.name : 'Choose file…'}
            </ThemedText>
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
            style={[
              styles.button,
              {
                backgroundColor: theme.dark ? '#2563EB' : theme.tint,
                opacity: submitting || !file ? 0.6 : 1,
              },
            ]}
          >
            <ThemedText type="smallBold" style={styles.buttonLabel}>
              {submitting ? 'Importing…' : 'Import Result'}
            </ThemedText>
          </Pressable>

          <Pressable onPress={() => router.back()} style={styles.cancelButton}>
            <ThemedText type="small" style={{ color: theme.dark ? '#FFFFFF' : theme.textSecondary }}>
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
    marginTop: Spacing.two,
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
