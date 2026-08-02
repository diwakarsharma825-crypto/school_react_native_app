import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/ui/ThemedText';
import { requestTeacherPasswordReset, resetTeacherPassword } from '@/data/teacher-api';
import { useTheme } from '@/hooks/use-theme';

type Step = 'email' | 'reset';

/** Optional forgot-password flow for teachers, reached from Teacher Login —
 * step 1 emails a 6-digit OTP to the teacher's own address, step 2 verifies
 * it and sets the new password. Student side still has no equivalent (no
 * email on file for a student login), matching the scope asked for. */
export default function TeacherForgotPasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSendCode() {
    if (!email.trim()) {
      setError('Enter your email.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await requestTeacherPasswordReset(email.trim());
      setStep('reset');
      setSuccessMessage(`If ${email.trim()} is a registered teacher account, a code has been sent.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send reset code.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword() {
    if (!otp.trim() || newPassword.length < 4) {
      setError('Enter the code from your email and a new password of at least 4 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await resetTeacherPassword(email.trim(), otp.trim(), newPassword);
      router.replace('/teacher-login');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reset password.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <View style={[styles.iconCircle, { backgroundColor: theme.backgroundSelected }]}>
          <Ionicons name="key-outline" size={30} color={theme.tint} />
        </View>
        <ThemedText type="title" style={styles.title}>
          Reset Password
        </ThemedText>
        <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
          {step === 'email'
            ? "Enter your teacher account's email — we'll send a reset code."
            : 'Enter the code from your email and choose a new password.'}
        </ThemedText>
      </View>

      <Card>
        {step === 'email' ? (
          <>
            <ThemedText type="smallBold" style={styles.fieldLabel}>
              Email
            </ThemedText>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              placeholder="you@school.org"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { borderColor: theme.border, color: theme.text }]}
            />
            {error ? (
              <ThemedText type="small" style={styles.error}>
                {error}
              </ThemedText>
            ) : null}
            <Pressable
              onPress={handleSendCode}
              disabled={submitting}
              style={[styles.button, { backgroundColor: theme.tint, opacity: submitting ? 0.6 : 1 }]}
            >
              <ThemedText type="smallBold" style={styles.buttonLabel}>
                {submitting ? 'Sending…' : 'Send Reset Code'}
              </ThemedText>
            </Pressable>
          </>
        ) : (
          <>
            {successMessage ? (
              <ThemedText type="small" themeColor="textSecondary" style={styles.successHint}>
                {successMessage}
              </ThemedText>
            ) : null}
            <ThemedText type="smallBold" style={styles.fieldLabel}>
              Reset Code
            </ThemedText>
            <TextInput
              value={otp}
              onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              placeholder="6-digit code"
              placeholderTextColor={theme.textSecondary}
              maxLength={6}
              style={[styles.input, { borderColor: theme.border, color: theme.text }]}
            />
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
            <Pressable
              onPress={handleResetPassword}
              disabled={submitting}
              style={[styles.button, { backgroundColor: theme.tint, opacity: submitting ? 0.6 : 1 }]}
            >
              <ThemedText type="smallBold" style={styles.buttonLabel}>
                {submitting ? 'Resetting…' : 'Reset Password'}
              </ThemedText>
            </Pressable>
            <Pressable onPress={() => setStep('email')} hitSlop={8} style={styles.resendRow}>
              <ThemedText type="small" themeColor="tint">
                Use a different email / resend code
              </ThemedText>
            </Pressable>
          </>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  title: {
    marginBottom: Spacing.one,
  },
  subtitle: {
    textAlign: 'center',
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
    marginTop: Spacing.two,
  },
  successHint: {
    marginBottom: Spacing.one,
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
  resendRow: {
    alignSelf: 'center',
    marginTop: Spacing.three,
  },
});
