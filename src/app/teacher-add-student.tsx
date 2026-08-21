import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { MediaPickerModal } from '@/components/ui/MediaPickerModal';
import { Screen } from '@/components/ui/Screen';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { SelectField } from '@/components/ui/SelectField';
import { ThemedText } from '@/components/ui/ThemedText';
import { addTeacherStudent } from '@/data/teacher-api';
import { TeacherGuard } from '@/components/ui/TeacherGuard';
import { useTheme } from '@/hooks/use-theme';

export default function TeacherAddStudentScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ classId: string; sectionId?: string }>();

  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [srn, setSrn] = useState('');
  const [gender, setGender] = useState<string | null>(null);
  const [dob, setDob] = useState<string | null>(null);
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mediaPickerVisible, setMediaPickerVisible] = useState(false);

  function pickPhoto() {
    setMediaPickerVisible(true);
  }

  async function handleSubmit() {
    if (!name.trim()) {
      setError('Please enter the student’s name.');
      return;
    }
    if (!rollNo.trim()) {
      setError('Please enter a roll number — it must be unique within this class.');
      return;
    }
    if (!srn.trim()) {
      setError('Please enter the student’s SRN (school-assigned, must be unique).');
      return;
    }
    if (phone.trim() && !/^\d{7,15}$/.test(phone.trim())) {
      setError('Please enter a valid mobile number, or leave it blank.');
      return;
    }
    if (password.trim() && !phone.trim()) {
      setError('A mobile number is required to set a password, so the student can log in with it.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await addTeacherStudent({
        classId: Number(params.classId),
        sectionId: params.sectionId ? Number(params.sectionId) : undefined,
        name: name.trim(),
        rollNo: rollNo.trim(),
        srn: srn.trim(),
        gender: gender ?? undefined,
        dob: dob ?? undefined,
        fatherName: fatherName.trim() || undefined,
        motherName: motherName.trim() || undefined,
        phone: phone.trim() || undefined,
        password: password.trim() || undefined,
        photoUri: photoUri ?? undefined,
      });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add student.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <TeacherGuard>
    <Screen>
      <Card style={styles.card}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.intro}>
          Adds the student directly as active — no self-registration or activation step needed.
        </ThemedText>

        <View style={styles.photoRow}>
          <Pressable onPress={pickPhoto} style={[styles.photoBox, { borderColor: theme.border }]}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" />
            ) : (
              <Ionicons name="camera-outline" size={24} color={theme.textSecondary} />
            )}
          </Pressable>
          <ThemedText type="small" themeColor="textSecondary" style={styles.photoHint}>
            Photo (optional)
          </ThemedText>
        </View>

        <ThemedText type="smallBold" style={styles.fieldLabel}>
          Name
        </ThemedText>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Student's full name"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        />

        <ThemedText type="smallBold" style={styles.fieldLabel}>
          Roll Number
        </ThemedText>
        <TextInput
          value={rollNo}
          onChangeText={(val) => setRollNo(val.replace(/[^0-9]/g, ''))}
          placeholder="e.g. 1090"
          placeholderTextColor={theme.textSecondary}
          keyboardType="number-pad"
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        />

        <ThemedText type="smallBold" style={styles.fieldLabel}>
          SRN
        </ThemedText>
        <TextInput
          value={srn}
          onChangeText={(val) => setSrn(val.replace(/[^0-9]/g, ''))}
          placeholder="e.g. 1001"
          placeholderTextColor={theme.textSecondary}
          keyboardType="number-pad"
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        />
        <ThemedText type="small" themeColor="textSecondary" style={styles.fieldHint}>
          If this student has a sibling already added with the same mobile number, that's fine —
          phone numbers can be shared, only SRN and roll number need to be unique.
        </ThemedText>

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

        <DatePickerField
          label="Date of Birth"
          placeholder="Select date of birth (optional)"
          value={dob}
          onChange={setDob}
          minDate="1990-01-01"
        />

        <ThemedText type="smallBold" style={styles.fieldLabel}>
          Father's Name
        </ThemedText>
        <TextInput
          value={fatherName}
          onChangeText={setFatherName}
          placeholder="Father's name (optional)"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        />

        <ThemedText type="smallBold" style={styles.fieldLabel}>
          Mother's Name
        </ThemedText>
        <TextInput
          value={motherName}
          onChangeText={setMotherName}
          placeholder="Mother's name (optional)"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        />

        <ThemedText type="smallBold" style={styles.fieldLabel}>
          Mobile Number
        </ThemedText>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="10-digit mobile number (optional)"
          placeholderTextColor={theme.textSecondary}
          keyboardType="number-pad"
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        />

        <ThemedText type="smallBold" style={styles.fieldLabel}>
          Password
        </ThemedText>
        <PasswordInput
          value={password}
          onChangeText={setPassword}
          placeholder="Create password (optional)"
        />

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
            {submitting ? 'Adding…' : 'Add Student'}
          </ThemedText>
        </Pressable>

        <MediaPickerModal
          visible={mediaPickerVisible}
          onClose={() => setMediaPickerVisible(false)}
          onSelectMedia={(file) => setPhotoUri(file.uri)}
          allowDocument={false}
          title="Student Photo Source"
        />
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
  photoRow: {
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  photoBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
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
  photoHint: {
    marginTop: Spacing.one,
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
