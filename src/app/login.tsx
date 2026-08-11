import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/ui/ThemedText';
import { useBrand } from '@/hooks/use-brand';
import { useTheme } from '@/hooks/use-theme';

import { useStudentAuth } from '@/hooks/use-student-auth';
import { useTeacherAuth } from '@/hooks/use-teacher-auth';

const defaultLogo = require('../../assets/images/icon.png');

export default function LoginChoiceScreen() {
  const theme = useTheme();
  const brand = useBrand();
  const router = useRouter();
  const { loggedIn: studentLoggedIn } = useStudentAuth();
  const { loggedIn: teacherLoggedIn } = useTeacherAuth();

  React.useEffect(() => {
    if (studentLoggedIn) {
      router.replace('/student-dashboard');
    } else if (teacherLoggedIn) {
      router.replace('/teacher-dashboard');
    }
  }, [studentLoggedIn, teacherLoggedIn, router]);

  const [imgError, setImgError] = useState(false);
  const logoSource = !imgError && brand.logoUrl ? { uri: brand.logoUrl } : defaultLogo;
  const displayTitle = brand.appTitle || 'Saarthak GIMSSS';

  return (
    <Screen>
      <View style={[styles.brandHeader, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Image
          source={logoSource}
          onError={() => setImgError(true)}
          style={styles.brandLogo}
          contentFit="contain"
        />
        <View style={styles.brandTextCol}>
          <ThemedText type="smallBold" style={{ color: theme.tint, letterSpacing: 0.5, fontSize: 11 }}>
            WELCOME TO
          </ThemedText>
          <ThemedText type="subtitle" style={styles.brandTitle} numberOfLines={1}>
            {displayTitle}
          </ThemedText>
        </View>
      </View>

      <View style={styles.titleWrap}>
        <ThemedText type="title" style={styles.title}>
          Who&apos;s using this?
        </ThemedText>
        <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
          Choose your role to continue to your dashboard.
        </ThemedText>
      </View>

      <Pressable onPress={() => router.push('/homework')}>
        <Card style={styles.option}>
          <View style={[styles.iconWrap, { backgroundColor: theme.tint + '18' }]}>
            <Ionicons name="school-outline" size={28} color={theme.tint} />
          </View>
          <View style={styles.optionText}>
            <ThemedText type="smallBold" style={{ fontSize: 16 }}>I&apos;m a Student</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              View class homework, attendance &amp; results
            </ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </Card>
      </Pressable>

      <Pressable onPress={() => router.push('/teacher-login')}>
        <Card style={styles.option}>
          <View style={[styles.iconWrap, { backgroundColor: theme.accent + '1C' }]}>
            <Ionicons name="briefcase-outline" size={26} color={theme.accent} />
          </View>
          <View style={styles.optionText}>
            <ThemedText type="smallBold" style={{ fontSize: 16 }}>I&apos;m a Teacher</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Log in to manage dashboard &amp; homework
            </ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </Card>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.four,
    marginTop: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  brandLogo: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
  },
  brandTextCol: {
    flex: 1,
    gap: 2,
  },
  brandTitle: {
    fontSize: 17,
  },
  titleWrap: {
    marginBottom: Spacing.three,
  },
  title: {
    marginBottom: Spacing.one,
  },
  subtitle: {
    fontSize: 14,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.four,
    marginBottom: Spacing.three,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
    gap: 3,
  },
});
