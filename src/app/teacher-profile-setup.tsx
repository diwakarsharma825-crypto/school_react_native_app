import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { SelectField } from '@/components/ui/SelectField';
import { SignaturePadModal } from '@/components/ui/SignaturePadModal';
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
  { label: 'Commerce', value: 'Commerce' },
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
  const [signaturePadVisible, setSignaturePadVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClassesCatalog()
      .then(setCatalog)
      .catch(() => setCatalog([]))
      .finally(() => setLoadingCatalog(false));
  }, []);

  // Prefill from whatever was already saved — otherwise reopening this
  // screen to tweak one class shows an empty "Select class" and looks like
  // the save never took, even though the server has it.
  useEffect(() => {
    if (profile && profile.classes.length > 0) {
      setAssignments(
        profile.classes.map((c) => ({
          classId: String(c.class_id),
          sectionId: c.section_id ? String(c.section_id) : null,
          stream: c.stream ?? null,
        }))
      );
    }
  }, [profile]);

  // Once a teacher's initial setup is complete, class/section assignment can
  // only be changed by the principal from the admin panel — this screen just
  // reflects that lock by showing the saved classes read-only.
  const classesLocked = !!profile?.completed && !profile?.can_edit_classes;

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

  async function handleSignatureCaptured(dataUrl: string) {
    setSignaturePadVisible(false);
    // dataUrl is "data:image/png;base64,...." — write it to a real file so the
    // upload gets a proper file:// uri (a raw data-uri here is what caused the
    // native "Unsupported FormDataPart implementation" error).
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
    const file = new FileSystem.File(FileSystem.Paths.cache, `signature-${Date.now()}.png`);
    file.write(base64, { encoding: 'base64' });
    setSignatureUri(file.uri);
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
      {profile?.name || profile?.email ? (
        <Card style={styles.card}>
          {profile.name ? <ThemedText type="smallBold">{profile.name}</ThemedText> : null}
          {profile.email ? (
            <ThemedText type="small" themeColor="textSecondary">
              {profile.email}
            </ThemedText>
          ) : null}
        </Card>
      ) : null}

      <ThemedText type="default" themeColor="textSecondary" style={styles.intro}>
        Complete your profile once — this stays saved until you finish, so you'll only see
        this screen again if you need to change something.
      </ThemedText>

      <Card style={styles.card}>
        <ThemedText type="smallBold" style={styles.fieldLabel}>
          Signature
        </ThemedText>
        <Pressable
          onPress={() => setSignaturePadVisible(true)}
          style={[styles.signatureBox, { borderColor: theme.border }, (signatureUri || profile?.signature_url) && styles.signatureBoxWithImage]}
        >
          {signatureUri || profile?.signature_url ? (
            <Image source={{ uri: signatureUri ?? profile!.signature_url! }} style={styles.signatureImage} contentFit="contain" />
          ) : (
            <View style={styles.signaturePlaceholder}>
              <Ionicons name="create-outline" size={28} color={theme.textSecondary} />
              <ThemedText type="small" themeColor="textSecondary">
                Tap to draw your signature
              </ThemedText>
            </View>
          )}
        </Pressable>
        {signatureUri || profile?.signature_url ? (
          <Pressable onPress={() => setSignaturePadVisible(true)} hitSlop={8} style={styles.redrawRow}>
            <ThemedText type="small" style={{ color: theme.dark ? '#60A5FA' : theme.tint }}>
              Redraw signature
            </ThemedText>
          </Pressable>
        ) : null}
      </Card>

      <SignaturePadModal
        visible={signaturePadVisible}
        onClose={() => setSignaturePadVisible(false)}
        onSave={handleSignatureCaptured}
      />

      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
        CLASSES YOU TEACH
      </ThemedText>
      {classesLocked ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.intro}>
          Your class assignment is set by the school. Contact the principal if it needs to change.
        </ThemedText>
      ) : null}
      {assignments.map((a, i) =>
        classesLocked ? (
          <Card key={i} style={styles.card}>
            <ThemedText type="smallBold">{classOptions.find((c) => c.value === a.classId)?.label ?? '—'}</ThemedText>
            {a.sectionId ? (
              <ThemedText type="small" themeColor="textSecondary">
                Section: {sectionOptionsFor(a.classId).find((s) => s.value === a.sectionId)?.label ?? a.sectionId}
              </ThemedText>
            ) : null}
            {a.stream ? (
              <ThemedText type="small" themeColor="textSecondary">
                Stream: {a.stream}
              </ThemedText>
            ) : null}
          </Card>
        ) : (
          <Card key={i} style={styles.card}>
            {assignments.length > 1 ? (
              <View style={styles.rowEnd}>
                <Pressable onPress={() => removeAssignment(i)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={18} color={Brand.red} />
                </Pressable>
              </View>
            ) : null}
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
        )
      )}
      {!classesLocked ? (
        <Pressable onPress={addAssignment} style={styles.addRow}>
          <Ionicons name="add-circle-outline" size={18} color={theme.dark ? '#60A5FA' : theme.tint} />
          <ThemedText type="smallBold" style={{ color: theme.dark ? '#60A5FA' : theme.tint }}>
            Add another class
          </ThemedText>
        </Pressable>
      ) : null}

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
  // Signature ink is exported as a transparent PNG with dark strokes — a
  // fixed white background (regardless of app theme) is what keeps it
  // visible in dark mode, same as ink on real paper.
  signatureBoxWithImage: {
    backgroundColor: '#FFFFFF',
    borderStyle: 'solid',
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
  redrawRow: {
    marginTop: Spacing.two,
    alignSelf: 'flex-start',
  },
  sectionTitle: {
    marginBottom: Spacing.two,
    letterSpacing: 0.5,
  },
  rowEnd: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: Spacing.two,
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
