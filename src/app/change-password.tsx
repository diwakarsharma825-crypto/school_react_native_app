import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/ui/ThemedText';
import { changeStudentPassword } from '@/data/homework-api';
import { changeTeacherPassword } from '@/data/teacher-api';
import { useStudentAuth } from '@/hooks/use-student-auth';
import { useTheme } from '@/hooks/use-theme';

export default function ChangePasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role: 'teacher' | 'student' }>();
  const { access } = useStudentAuth();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!oldPassword || !newPassword) {
      setError('Please fill in both password fields.');
      return;
    }
    if (newPassword.length < 4) {
      setError('New password must be at least 4 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (role === 'teacher') {
        await changeTeacherPassword(oldPassword, newPassword);
      } else if (access) {
        await changeStudentPassword(access.srn, oldPassword, newPassword);
      }
      setSuccess(true);
      setTimeout(() => router.back(), 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not change password.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <Card>
        <ThemedText type="subtitle" style={styles.title}>
          Change Password
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
          Enter your current password, then choose a new one.
        </ThemedText>

        <ThemedText type="smallBold" style={styles.fieldLabel}>
          Current Password
        </ThemedText>
        <PasswordInput value={oldPassword} onChangeText={setOldPassword} placeholder="Current password" />

        <ThemedText type="smallBold" style={styles.fieldLabel}>
          New Password
        </ThemedText>
        <PasswordInput value={newPassword} onChangeText={setNewPassword} placeholder="New password" />

        <ThemedText type="smallBold" style={styles.fieldLabel}>
          Confirm New Password
        </ThemedText>
        <PasswordInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm new password" />

        {error ? (
          <ThemedText type="small" style={styles.error}>
            {error}
          </ThemedText>
        ) : null}
        {success ? (
          <ThemedText type="small" style={[styles.success, { color: '#2E7D32' }]}>
            Password changed successfully.
          </ThemedText>
        ) : null}

        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          style={[styles.button, { backgroundColor: theme.tint, opacity: submitting ? 0.6 : 1 }]}
        >
          <ThemedText type="smallBold" style={styles.buttonLabel}>
            {submitting ? 'Saving…' : 'Change Password'}
          </ThemedText>
        </Pressable>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: Spacing.one,
  },
  subtitle: {
    marginBottom: Spacing.four,
  },
  fieldLabel: {
    marginBottom: Spacing.one,
    marginTop: Spacing.three,
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
  success: {
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
