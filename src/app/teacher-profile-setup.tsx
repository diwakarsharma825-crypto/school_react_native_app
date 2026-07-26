import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { SelectField } from '@/components/ui/SelectField';
import { Loading } from '@/components/ui/states';
import { ThemedText } from '@/components/ui/ThemedText';
import {
  ClassPickerItem,
  fetchClassesCatalog,
  ProfileClassSelection,
  saveTeacherProfile,
} from '@/data/teacher-api';
import { useTeacherAuth } from '@/hooks/use-teacher-auth';
import { useTheme } from '@/hooks/use-theme';

const STREAM_OPTIONS = [
  { label: 'Arts', value: 'Arts' },
  { label: 'Non-Medical', value: 'Non-Medical' },
  { label: 'Medical', value: 'Medical' },
];

interface Assignment {
  classId: string | null;
  sectionId: string | null;
  stream: string | null;
}

const STREAM_ELIGIBLE_KEYWORDS = ['11', '12'];

export default function TeacherProfileSetupScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile, refresh } = useTeacherAuth();

  const [catalog, setCatalog] = useState<ClassPickerItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([{ classId: null, sectionId: null, stream: null }]);
  const [signatureUri, setSignatureUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClassesCatalog()
      .then(setCatalog)
      .catch(() => setCatalog([]))
      .finally(() => setLoadingCatalog(false));
  }, []);

  const classOptions = catalog.map((c) => ({ label: c.name, value: String(c.id) }));

  function sectionOptionsFor(classId: string | null) {
    const cls = catalog.find((c) => String(c.id) === classId);
    return (cls?.sections ?? []).map((s) => ({ label: s.name, value: String(s.id) }));
  }

  function needsStream(classId: string | null) {
    const cls = catalog.find((c) => String(c.id) === classId);
    return cls ? STREAM_ELIGIBLE_KEYWORDS.some((k) => cls.name.includes(k)) : false;
  }

  function updateAssignment(index: number, patch: Partial<Assignment>) {
    setAssignments((prev) => prev.map((a, i) => (i === index ? { ...a, ...patch } : a)));
  }

  function addAssignment() {
    setAssignments((prev) => [...prev, { classId: null, sectionId: null, stream: null }]);
  }

  function removeAssignment(index: number) {
    setAssignments((prev) => prev.filter((_, i) => i !== index));
  }

  async function pickSignature() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setSignatureUri(result.assets[0].uri);
    }
  }

  async function handleSave() {
    const validAssignments = assignments.filter((a) => a.classId);
    if (!signatureUri && !profile?.signature_url) {
      setError('Please add your signature.');
      return;
    }
    if (validAssignments.length === 0) {
      setError('Please choose at least one class.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload: ProfileClassSelection[] = validAssignments.map((a) => ({
        classId: Number(a.classId),
        sectionId: a.sectionId ? Number(a.sectionId) : undefined,
        stream: a.stream ?? undefined,
      }));
      await saveTeacherProfile(signatureUri, payload, profile?.signature_url ?? null);
      await refresh();
      router.replace('/teacher-dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your profile.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingCatalog) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading classes…" />
      </Screen>
    );
  }

  return (
    <Screen>
      <ThemedText type="default" themeColor="textSecondary" style={styles.intro}>
        Complete your profile once — this stays saved until you finish, so you'll only see
        this screen again if you need to change something.
      </ThemedText>

      <Card style={styles.card}>
        <ThemedText type="smallBold" style={styles.fieldLabel}>
          Signature
        </ThemedText>
        <Pressable onPress={pickSignature} style={[styles.signatureBox, { borderColor: theme.border }]}>
          {signatureUri || profile?.signature_url ? (
            <Image source={{ uri: signatureUri ?? profile!.signature_url! }} style={styles.signatureImage} contentFit="contain" />
          ) : (
            <View style={styles.signaturePlaceholder}>
              <Ionicons name="create-outline" size={28} color={theme.textSecondary} />
              <ThemedText type="small" themeColor="textSecondary">
                Tap to upload your signature
              </ThemedText>
            </View>
          )}
        </Pressable>
      </Card>

      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
        CLASSES YOU TEACH
      </ThemedText>
      {assignments.map((a, i) => (
        <Card key={i} style={styles.card}>
          <View style={styles.rowBetween}>
            <ThemedText type="smallBold">Class {i + 1}</ThemedText>
            {assignments.length > 1 ? (
              <Pressable onPress={() => removeAssignment(i)} hitSlop={8}>
                <Ionicons name="trash-outline" size={18} color={Brand.red} />
              </Pressable>
            ) : null}
          </View>
          <SelectField
            label="Class"
            placeholder="Select class"
            value={a.classId}
            options={classOptions}
            onChange={(v) => updateAssignment(i, { classId: v, sectionId: null, stream: null })}
          />
          {a.classId ? (
            <SelectField
              label="Section (optional)"
              placeholder="All sections"
              value={a.sectionId}
              options={sectionOptionsFor(a.classId)}
              onChange={(v) => updateAssignment(i, { sectionId: v })}
            />
          ) : null}
          {a.classId && needsStream(a.classId) ? (
            <SelectField
              label="Stream"
              placeholder="Select stream"
              value={a.stream}
              options={STREAM_OPTIONS}
              onChange={(v) => updateAssignment(i, { stream: v })}
            />
          ) : null}
        </Card>
      ))}
      <Pressable onPress={addAssignment} style={styles.addRow}>
        <Ionicons name="add-circle-outline" size={18} color={theme.tint} />
        <ThemedText type="smallBold" themeColor="tint">
          Add another class
        </ThemedText>
      </Pressable>

      {error ? (
        <ThemedText type="small" style={styles.error}>
          {error}
        </ThemedText>
      ) : null}

      <Pressable
        onPress={handleSave}
        disabled={submitting}
        style={[styles.button, { backgroundColor: theme.tint, opacity: submitting ? 0.6 : 1 }]}
      >
        <ThemedText type="smallBold" style={styles.buttonLabel}>
          {submitting ? 'Saving…' : 'Save & Continue'}
        </ThemedText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    marginBottom: Spacing.four,
    lineHeight: 20,
  },
  card: {
    marginBottom: Spacing.three,
  },
  fieldLabel: {
    marginBottom: Spacing.two,
  },
  signatureBox: {
    height: 100,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  signatureImage: {
    width: '100%',
    height: '100%',
  },
  signaturePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  sectionTitle: {
    marginBottom: Spacing.two,
    letterSpacing: 0.5,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  error: {
    color: Brand.red,
    marginBottom: Spacing.two,
  },
  button: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Radius.pill,
    marginBottom: Spacing.five,
  },
  buttonLabel: {
    color: Brand.white,
  },
});
