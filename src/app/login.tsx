import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
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
      <View style={styles.brandHeader}>
        <Image
          source={logoSource}
          onError={() => setImgError(true)}
          style={styles.brandLogo}
          contentFit="contain"
        />
        <ThemedText type="subtitle" style={styles.brandTitle} numberOfLines={1}>
          {displayTitle}
        </ThemedText>
      </View>

      <ThemedText type="title" style={styles.title}>
        Who&apos;s using this?
      </ThemedText>
      <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
        Choose your role to continue.
      </ThemedText>

      <Pressable onPress={() => router.push('/homework')}>
        <Card style={styles.option}>
          <View style={[styles.iconWrap, { backgroundColor: theme.backgroundSelected }]}>
            <Ionicons name="school-outline" size={28} color={theme.tint} />
          </View>
          <View style={styles.optionText}>
            <ThemedText type="smallBold">I&apos;m a Student</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              View your class&apos;s homework calendar
            </ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </Card>
      </Pressable>

      <Pressable onPress={() => router.push('/teacher-login')}>
        <Card style={styles.option}>
          <View style={[styles.iconWrap, { backgroundColor: theme.backgroundSelected }]}>
            <Ionicons name="briefcase-outline" size={26} color={theme.tint} />
          </View>
          <View style={styles.optionText}>
            <ThemedText type="smallBold">I&apos;m a Teacher</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Log in to manage your class&apos;s dashboard &amp; homework
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
    gap: Spacing.two,
    marginBottom: Spacing.three,
    marginTop: Spacing.one,
  },
  brandLogo: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
  },
  brandTitle: {
    fontSize: 18,
    flex: 1,
  },
  title: {
    marginBottom: Spacing.one,
  },
  subtitle: {
    marginBottom: Spacing.four,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
});
