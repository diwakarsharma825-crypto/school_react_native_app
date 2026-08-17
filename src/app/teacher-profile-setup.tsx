import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

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

import { TextInput } from 'react-native';

export default function TeacherProfileSetupScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile, refresh } = useTeacherAuth();

  const [isEditing, setIsEditing] = useState<boolean>(!profile?.completed);
  const [teacherName, setTeacherName] = useState<string>(profile?.name ?? '');
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

  useEffect(() => {
    if (profile) {
      if (profile.name) setTeacherName(profile.name);
      if (profile.classes.length > 0) {
        setAssignments(
          profile.classes.map((c) => ({
            classId: String(c.class_id),
            sectionId: c.section_id ? String(c.section_id) : null,
            stream: c.stream ?? null,
          }))
        );
      }
    }
  }, [profile]);

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
    if (!dataUrl) return;
    try {
      if (Platform.OS === 'web') {
        setSignatureUri(dataUrl);
        return;
      }
      const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
      const uri = `${FileSystem.cacheDirectory}signature-${Date.now()}.png`;
      await FileSystem.writeAsStringAsync(uri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      setSignatureUri(uri);
    } catch {
      setSignatureUri(dataUrl);
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
      await saveTeacherProfile(
        signatureUri,
        payload,
        profile?.signature_url ?? null,
        teacherName.trim() || undefined,
        true // teacher is in edit mode — always allow class updates
      );
      await refresh();
      setIsEditing(false);
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
      {/* Top Profile Header & Edit Mode Toggle */}
      <Card style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.two }}>
          <View style={{ flex: 1 }}>
            <ThemedText type="subtitle" style={{ fontSize: 18 }}>
              {profile?.name || teacherName || 'Teacher Profile'}
            </ThemedText>

            {profile?.email ? (
              <ThemedText type="small" themeColor="textSecondary">
                {profile.email}
              </ThemedText>
            ) : null}
          </View>

          <Pressable
            onPress={() => setIsEditing(!isEditing)}
            style={({ pressed }) => [
              styles.editToggleBtn,
              {
                backgroundColor: isEditing
                  ? theme.dark
                    ? 'rgba(239,68,68,0.2)'
                    : '#FEF2F2'
                  : theme.dark
                  ? 'rgba(59,130,246,0.2)'
                  : '#EFF6FF',
                borderColor: isEditing ? '#EF4444' : '#3B82F6',
              },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons
              name={isEditing ? 'close' : 'pencil-outline'}
              size={15}
              color={isEditing ? '#EF4444' : theme.dark ? '#60A5FA' : '#2563EB'}
            />
            <ThemedText
              type="smallBold"
              style={{ color: isEditing ? '#EF4444' : theme.dark ? '#60A5FA' : '#2563EB', fontSize: 12 }}
            >
              {isEditing ? 'Cancel Edit' : 'Edit Profile'}
            </ThemedText>
          </Pressable>
        </View>
      </Card>

      {!isEditing ? (
        /* READ-ONLY VIEW MODE */
        <View style={{ gap: Spacing.three }}>
          <Card style={styles.card}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>
              TEACHER INFORMATION
            </ThemedText>
            <View style={styles.infoRow}>
              <ThemedText type="small" themeColor="textSecondary">Full Name</ThemedText>
              <ThemedText type="smallBold">{profile?.name || teacherName || '—'}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText type="small" themeColor="textSecondary">Email Address</ThemedText>
              <ThemedText type="smallBold">{profile?.email || '—'}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText type="small" themeColor="textSecondary">Phone Number</ThemedText>
              <ThemedText type="smallBold">{(profile as any)?.phone || '—'}</ThemedText>
            </View>
          </Card>

          <Card style={styles.card}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>
              TEACHER SIGNATURE
            </ThemedText>
            {signatureUri || profile?.signature_url ? (
              <View style={[styles.signatureBox, { borderColor: theme.border }, styles.signatureBoxWithImage]}>
                <Image source={{ uri: signatureUri ?? profile!.signature_url! }} style={styles.signatureImage} contentFit="contain" />
              </View>
            ) : (
              <ThemedText type="small" themeColor="textSecondary">
                No digital signature recorded yet. Tap 'Edit Profile' to draw your signature.
              </ThemedText>
            )}
          </Card>

          <Card style={styles.card}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>
              ASSIGNED CLASSES & MULTI-CLASS
            </ThemedText>
            {!profile?.classes || profile.classes.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                No classes assigned yet. Tap 'Edit Profile' to select classes.
              </ThemedText>
            ) : (
              <View style={styles.chipRow}>
                {profile.classes.map((c, i) => (
                  <View key={i} style={[styles.chip, { backgroundColor: theme.dark ? '#1E293B' : '#F1F5F9', borderColor: theme.border, borderWidth: 1 }]}>
                    <ThemedText type="smallBold">
                      {c.class_name}
                      {c.section_name ? ` - ${c.section_name}` : ''}
                      {c.stream ? ` (${c.stream})` : ''}
                    </ThemedText>
                  </View>
                ))}
              </View>
            )}
          </Card>
        </View>
      ) : (
        /* EDITABLE FORM MODE */
        <View style={{ gap: Spacing.three }}>
          <Card style={styles.card}>
            <ThemedText type="smallBold" style={styles.fieldLabel}>
              Full Name
            </ThemedText>
            <TextInput
              value={teacherName}
              onChangeText={setTeacherName}
              placeholder="Enter your full name"
              placeholderTextColor={theme.dark ? '#64748B' : '#94A3B8'}
              style={[
                styles.input,
                {
                  backgroundColor: theme.dark ? '#0F172A' : '#F8FAFC',
                  borderColor: theme.dark ? '#334155' : '#CBD5E1',
                  color: theme.dark ? '#FFFFFF' : '#0F172A',
                },
              ]}
            />

            <ThemedText type="smallBold" style={[styles.fieldLabel, { marginTop: Spacing.three }]}>
              Digital Signature
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
                    Tap to draw or edit your signature
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
            CLASSES & MULTI-CLASS SELECTIONS
          </ThemedText>

          {assignments.map((a, i) => (
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
          ))}

          <Pressable onPress={addAssignment} style={styles.addRow}>
            <Ionicons name="add-circle-outline" size={18} color={theme.dark ? '#60A5FA' : theme.tint} />
            <ThemedText type="smallBold" style={{ color: theme.dark ? '#60A5FA' : theme.tint }}>
              + Add multi-class selection
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
            style={[styles.button, { backgroundColor: theme.dark ? '#2563EB' : theme.tint, opacity: submitting ? 0.6 : 1 }]}
          >
            <ThemedText type="smallBold" style={styles.buttonLabel}>
              {submitting ? 'Saving…' : 'Save Profile Changes'}
            </ThemedText>
          </Pressable>
        </View>
      )}
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
  editToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.15)',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.pill,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two + 2,
    fontSize: 15,
  },
  buttonLabel: {
    color: Brand.white,
  },
});
