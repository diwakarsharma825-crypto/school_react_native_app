import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Screen } from '@/components/ui/Screen';
import { SelectField } from '@/components/ui/SelectField';
import { ThemedText } from '@/components/ui/ThemedText';
import { fetchStudentDetail, reviewStudent } from '@/data/teacher-api';
import { useTheme } from '@/hooks/use-theme';

/** One screen for both first-time activation and later edits of a
 * self-registered student — class/section are read-only (auto-filled from
 * their registration), everything else is editable (including name, SRN,
 * phone and gender, not just roll/father/mother/status), and an
 * active/inactive toggle replaces the old plain "Activate" button so a
 * teacher can also deactivate someone later if needed. */
export default function TeacherStudentReviewScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    name: string;
    className: string;
    section?: string;
    srn?: string;
    phone?: string;
    gender?: string;
    rollNo?: string;
    fatherName?: string;
    motherName?: string;
    photoUrl?: string;
    active?: string;
  }>();

  const [name, setName] = useState(params.name ?? '');
  const [srn, setSrn] = useState(params.srn ?? '');
  const [phone, setPhone] = useState(params.phone ?? '');
  const [gender, setGender] = useState<string | null>(params.gender ?? null);
  const [newPassword, setNewPassword] = useState('');
  const [rollNo, setRollNo] = useState(params.rollNo ?? '');
  const [fatherName, setFatherName] = useState(params.fatherName ?? '');
  const [motherName, setMotherName] = useState(params.motherName ?? '');
  const [active, setActive] = useState(params.active === '1');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [remotePhotoUrl, setRemotePhotoUrl] = useState<string | null>(params.photoUrl ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pull the authoritative stored record on open and pre-fill every field
  // the student entered at onboarding — the roster list that launched this
  // screen may not carry all of them (e.g. gender), so nav params alone
  // aren't reliable for a full edit form.
  useEffect(() => {
    if (!params.id) return;
    let cancelled = false;
    fetchStudentDetail(params.id)
      .then((d) => {
        if (cancelled) return;
        if (d.name) setName(d.name);
        if (d.srn) setSrn(d.srn);
        if (d.phone) setPhone(d.phone);
        if (d.gender) setGender(d.gender);
        if (d.roll_no) setRollNo(d.roll_no);
        if (d.father_name) setFatherName(d.father_name);
        if (d.mother_name) setMotherName(d.mother_name);
        setActive(d.account_status === 1);
        if (d.photo_url) setRemotePhotoUrl(d.photo_url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function handleSubmit() {
    if (!name.trim()) {
      setError('Name cannot be empty.');
      return;
    }
    if (!srn.trim()) {
      setError('SRN cannot be empty.');
      return;
    }
    if (newPassword && !phone.trim()) {
      setError('A mobile number is required to set a password, so the student can log in with it.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await reviewStudent({
        id: Number(params.id),
        name: name.trim(),
        srn: srn.trim(),
        phone: phone.trim(),
        gender: gender ?? '',
        password: newPassword.trim() || undefined,
        rollNo,
        fatherName,
        motherName,
        active,
        photoUri: photoUri ?? undefined,
      });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <Card style={styles.card}>
        <View style={styles.photoRow}>
          <Pressable onPress={pickPhoto} style={[styles.photoBox, { borderColor: theme.border }]}>
            {photoUri || remotePhotoUrl ? (
              <Image source={{ uri: photoUri ?? remotePhotoUrl ?? undefined }} style={styles.photo} contentFit="cover" />
            ) : (
              <Ionicons name="camera-outline" size={26} color={theme.textSecondary} />
            )}
          </Pressable>
          <View style={styles.headerText}>
            <ThemedText type="subtitle" numberOfLines={1}>
              {name || params.name}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {params.className}
              {params.section ? ` - ${params.section}` : ''} · Class/section is fixed here
            </ThemedText>
          </View>
        </View>

        <ThemedText type="smallBold" style={styles.fieldLabel}>
          Name
        </ThemedText>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Student's full name"
          placeholderTextColor={theme.textSecondary}
          keyboardType="default"
          autoComplete="off"
          textContentType="none"
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        />

        <ThemedText type="smallBold" style={styles.fieldLabel}>
          SRN
        </ThemedText>
        <TextInput
          value={srn}
          onChangeText={setSrn}
          placeholder="School-assigned, must be unique"
          placeholderTextColor={theme.textSecondary}
          keyboardType="default"
          autoComplete="off"
          textContentType="none"
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        />

        <ThemedText type="smallBold" style={styles.fieldLabel}>
          Mobile Number
        </ThemedText>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="10-digit mobile (optional)"
          placeholderTextColor={theme.textSecondary}
          keyboardType="number-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        />

        <SelectField
          label="Gender"
          placeholder="Select gender (optional)"
          value={gender}
          options={[
            { label: 'Male', value: 'Male' },
            { label: 'Female', value: 'Female' },
            { label: 'Other', value: 'Other' },
          ]}
          onChange={setGender}
        />

        <ThemedText type="smallBold" style={styles.fieldLabel}>
          Reset Password (optional)
        </ThemedText>
        <PasswordInput value={newPassword} onChangeText={setNewPassword} placeholder="Leave blank to keep the current password" />
        <ThemedText type="small" themeColor="textSecondary" style={styles.fieldHint}>
          Only fill this in to set a new login password for this student — needs a mobile number
          above.
        </ThemedText>

        <ThemedText type="smallBold" style={styles.fieldLabel}>
          Roll Number
        </ThemedText>
        <TextInput
          value={rollNo}
          onChangeText={setRollNo}
          placeholder="Roll number"
          placeholderTextColor={theme.textSecondary}
          keyboardType="default"
          autoComplete="off"
          textContentType="none"
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        />

        <ThemedText type="smallBold" style={styles.fieldLabel}>
          Father's Name
        </ThemedText>
        <TextInput
          value={fatherName}
          onChangeText={setFatherName}
          placeholder="Father's name"
          placeholderTextColor={theme.textSecondary}
          keyboardType="default"
          autoComplete="off"
          textContentType="none"
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        />

        <ThemedText type="smallBold" style={styles.fieldLabel}>
          Mother's Name
        </ThemedText>
        <TextInput
          value={motherName}
          onChangeText={setMotherName}
          placeholder="Mother's name"
          placeholderTextColor={theme.textSecondary}
          keyboardType="default"
          autoComplete="off"
          textContentType="none"
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        />

        <ThemedText type="smallBold" style={styles.fieldLabel}>
          Account Status
        </ThemedText>
        <View style={styles.statusRow}>
          <Pressable
            onPress={() => setActive(true)}
            style={[styles.statusButton, { borderColor: theme.border }, active && { backgroundColor: '#DFF1E1', borderColor: '#2E7D32' }]}
          >
            <ThemedText type="smallBold" style={active ? { color: '#2E7D32' } : undefined}>
              Active
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setActive(false)}
            style={[styles.statusButton, { borderColor: theme.border }, !active && { backgroundColor: '#FBE2E2', borderColor: '#C62828' }]}
          >
            <ThemedText type="smallBold" style={!active ? { color: '#C62828' } : undefined}>
              Inactive
            </ThemedText>
          </Pressable>
        </View>

        {error ? (
          <ThemedText type="small" style={styles.error}>
            {error}
          </ThemedText>
        ) : null}

        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          style={[styles.button, { backgroundColor: theme.tint, opacity: submitting ? 0.6 : 1 }]}
        >
          <ThemedText type="smallBold" style={styles.buttonLabel}>
            {submitting ? 'Saving…' : 'Submit'}
          </ThemedText>
        </Pressable>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.four,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.two,
  },
  photoBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  fieldLabel: {
    marginBottom: Spacing.one,
    marginTop: Spacing.three,
  },
  fieldHint: {
    marginTop: Spacing.one,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two + 2,
    fontSize: 16,
  },
  statusRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  statusButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  error: {
    color: Brand.red,
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
});
