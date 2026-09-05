import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { SelectField } from '@/components/ui/SelectField';
import { TeacherGuard } from '@/components/ui/TeacherGuard';
import { ThemedText } from '@/components/ui/ThemedText';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { downloadStudentTemplate, importTeacherStudents, formatClassLabel } from '@/data/teacher-api';
import { useTeacherAuth } from '@/hooks/use-teacher-auth';
import { useTheme } from '@/hooks/use-theme';

export default function TeacherImportStudentsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ classId?: string; sectionId?: string }>();
  const { profile } = useTeacherAuth();

  const classes = profile?.classes ?? [];
  const classOptions = classes.map((c) => ({
    label: formatClassLabel(c.class_name, c.section_name),
    value: String(c.class_id),
  }));

  const initialClassId = params.classId || classOptions[0]?.value || null;
  const [classId, setClassId] = useState<string | null>(initialClassId);
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
      const { uri } = await downloadStudentTemplate();
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { dialogTitle: 'Save Student Import Template' });
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
      setError('Please choose a CSV/Excel file first.');
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const cId = selectedClass ? selectedClass.class_id : undefined;
      const sId = selectedClass ? (selectedClass.section_id ?? undefined) : undefined;
      const { message } = await importTeacherStudents(file, cId, sId);
      setSuccessMessage(message);
      setFile(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not import students. Please check the file format and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <TeacherGuard>
      <Screen>
        <Card style={styles.card}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.intro}>
            Download the student import template (.csv / .xlsx), add your student details (Roll No, SRN, Name, Father Name, Mother Name, Phone, Gender, DOB), then upload to bulk add students.
          </ThemedText>

          {classOptions.length > 1 ? (
            <>
              <ThemedText type="smallBold" style={styles.fieldLabel}>
                Target Class &amp; Section
              </ThemedText>
              <SelectField
                label="Target Class & Section"
                value={classId}
                onChange={setClassId}
                options={classOptions}
                placeholder="Select Class"
              />
            </>
          ) : null}

          <Pressable
            onPress={handleDownloadTemplate}
            disabled={downloading}
            style={[
              styles.secondaryButton,
              {
                borderColor: theme.dark ? '#60A5FA' : theme.tint,
                backgroundColor: theme.dark ? 'rgba(96, 165, 250, 0.15)' : theme.surface,
              },
            ]}
          >
            <ThemedText type="smallBold" style={{ color: theme.dark ? '#FFFFFF' : theme.tint }}>
              {downloading ? 'Downloading…' : '📥 Download Student Excel Template'}
            </ThemedText>
          </Pressable>

          <ThemedText type="smallBold" style={styles.fieldLabel}>
            Upload Student File (.csv or .xlsx)
          </ThemedText>
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
            <ThemedText type="small" style={{ color: theme.dark ? '#FFFFFF' : (file ? theme.text : theme.textSecondary) }}>
              {file ? `📄 ${file.name}` : 'Tap to select CSV / Excel file…'}
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
              styles.primaryButton,
              {
                backgroundColor: theme.dark ? '#2563EB' : theme.tint,
                opacity: submitting || !file ? 0.5 : 1,
              },
            ]}
          >
            <ThemedText type="smallBold" style={styles.primaryButtonLabel}>
              {submitting ? 'Importing Students…' : 'Upload & Import Students'}
            </ThemedText>
          </Pressable>
        </Card>
      </Screen>
    </TeacherGuard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
  },
  intro: {
    lineHeight: 20,
    marginBottom: Spacing.three,
  },
  fieldLabel: {
    marginTop: Spacing.three,
    marginBottom: Spacing.one,
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: Spacing.two + 4,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    marginTop: Spacing.two,
  },
  filePicker: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderStyle: 'dashed',
  },
  primaryButton: {
    alignItems: 'center',
    paddingVertical: Spacing.two + 4,
    borderRadius: Radius.pill,
    marginTop: Spacing.four,
  },
  primaryButtonLabel: {
    color: Brand.white,
  },
  error: {
    color: Brand.red,
    marginTop: Spacing.two,
  },
  success: {
    color: '#2E7D32',
    marginTop: Spacing.two,
  },
});
