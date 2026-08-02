import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/ui/ThemedText';
import { teacherLogin } from '@/data/teacher-api';
import { useStudentAuth } from '@/hooks/use-student-auth';
import { useTeacherAuth } from '@/hooks/use-teacher-auth';
import { useTheme } from '@/hooks/use-theme';
import { clearHomeworkAccess } from '@/lib/homework-access';

export default function TeacherLoginScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile, setLoggedIn } = useTeacherAuth();
  const { setAccess: setStudentAccess } = useStudentAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await teacherLogin(email.trim(), password);
      // Only one identity is "active" on this device at a time — logging
      // in as a teacher clears any student session, so the bottom-nav
      // Login slot (and every screen that reads it) never has to guess
      // which of two simultaneously-logged-in roles it should show.
      await clearHomeworkAccess();
      setStudentAccess(null);
      setLoggedIn(true);
      router.replace(profile?.completed ? '/teacher-dashboard' : '/teacher-profile-setup');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <View style={[styles.iconCircle, { backgroundColor: theme.backgroundSelected }]}>
          <Ionicons name="briefcase" size={30} color={theme.tint} />
        </View>
        <ThemedText type="title" style={styles.title}>
          Teacher Login
        </ThemedText>
        <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
          Use the same email and password your school admin gave you for the staff portal.
        </ThemedText>
      </View>

      <Card>
        <ThemedText type="smallBold" style={styles.fieldLabel}>
          Email
        </ThemedText>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@school.org"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        />
        <ThemedText type="smallBold" style={styles.fieldLabel}>
          Password
        </ThemedText>
        <PasswordInput value={password} onChangeText={setPassword} placeholder="Password" />
        <Pressable onPress={() => router.push('/teacher-forgot-password' as any)} hitSlop={8} style={styles.forgotRow}>
          <ThemedText type="small" themeColor="tint">
            Forgot password?
          </ThemedText>
        </Pressable>
        {error ? (
          <ThemedText type="small" style={styles.error}>
            {error}
          </ThemedText>
        ) : null}
        <Pressable
          onPress={handleLogin}
          disabled={submitting}
          style={[styles.button, { backgroundColor: theme.tint, opacity: submitting ? 0.6 : 1 }]}
        >
          <ThemedText type="smallBold" style={styles.buttonLabel}>
            {submitting ? 'Logging in…' : 'Log In'}
          </ThemedText>
        </Pressable>
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
  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: Spacing.two,
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
