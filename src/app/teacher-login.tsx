import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/ui/ThemedText';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { registerDevice } from '@/data/app-status';
import { teacherLogin } from '@/data/teacher-api';
import { useStudentAuth } from '@/hooks/use-student-auth';
import { useTeacherAuth } from '@/hooks/use-teacher-auth';
import { useTheme } from '@/hooks/use-theme';
import { clearHomeworkAccess } from '@/lib/homework-access';
import { getFcmPushToken } from '@/lib/notifications';
import { getCurrentDeviceLocation, requestAppPermissions } from '@/lib/permissions';

async function requestTeacherPermissions(emailAddress: string, teacherName?: string) {
  await requestAppPermissions().catch(() => null);
  const location = await getCurrentDeviceLocation().catch(() => null);
  const pushToken = await getFcmPushToken().catch(() => null);

  registerDevice({
    userType: 'teacher',
    fullName: teacherName,
    phone: emailAddress,
    pushToken,
    latitude: location?.latitude ?? null,
    longitude: location?.longitude ?? null,
  }).catch(() => {});
}

export default function TeacherLoginScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { loggedIn: teacherLoggedIn, setLoggedIn } = useTeacherAuth();
  const { setAccess: setStudentAccess } = useStudentAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (teacherLoggedIn) {
      router.replace('/teacher-dashboard');
    }
  }, [teacherLoggedIn, router]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await teacherLogin(email.trim(), password);
      await clearHomeworkAccess();
      setStudentAccess(null);
      setLoggedIn({
        name: res.name,
        phone: res.phone,
        email: res.email,
        photoUrl: res.photo_url,
        subject: res.subject,
        classId: res.class_id,
        sectionId: res.section_id,
        className: res.class_name,
        section: res.section,
      });
      getFcmPushToken().then((pushToken) => {
        if (pushToken) requestTeacherPermissions(res.email, res.name);
      }).catch(() => {});

      router.replace('/teacher-dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <Card style={styles.loginCard}>
          <View style={styles.hero}>
            <View style={[styles.iconCircle, { backgroundColor: theme.accent + '1E' }]}>
              <Ionicons name="briefcase-outline" size={32} color={theme.accent} />
            </View>
            <ThemedText type="title" style={styles.title}>
              Teacher Login
            </ThemedText>
            <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
              Enter your staff email and password to manage your class dashboard.
            </ThemedText>
          </View>

          <ThemedText type="smallBold" style={styles.fieldLabel}>
            Email Address
          </ThemedText>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@institute.org"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
          />
          <ThemedText type="smallBold" style={styles.fieldLabel}>
            Password
          </ThemedText>
          <PasswordInput value={password} onChangeText={setPassword} placeholder="Password" />

          {error ? (
            <ThemedText type="small" style={styles.error}>
              {error}
            </ThemedText>
          ) : null}
          <Pressable
            onPress={handleLogin}
            disabled={submitting}
            style={[styles.button, { backgroundColor: theme.accent, opacity: submitting ? 0.6 : 1 }]}
          >
            <ThemedText type="smallBold" style={styles.buttonLabel}>
              {submitting ? 'Logging in…' : 'Log In as Teacher'}
            </ThemedText>
            <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
          </Pressable>
        </Card>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.three,
    marginTop: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  logoGlow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogo: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
  },
  brandTitle: {
    fontSize: 16,
  },
  hero: {
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  title: {
    marginBottom: Spacing.one,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 20,
  },
  fieldLabel: {
    marginTop: Spacing.three,
    marginBottom: Spacing.one,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two + 2,
    fontSize: 16,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: Spacing.one + 2,
  },
  error: {
    color: Brand.red,
    marginTop: Spacing.two,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two + 4,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.pill,
    marginTop: Spacing.four,
  },
  buttonLabel: {
    color: Brand.white,
  },
});
