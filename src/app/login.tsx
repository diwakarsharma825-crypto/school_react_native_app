import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@/hooks/use-theme';

/** Entry point for the bottom bar's Login/Dashboard slot when nobody's
 * logged in as a teacher yet — lets the user pick which flow they want.
 * Student -> the local class/phone/password homework calendar gate
 * (src/app/homework.tsx, already built). Teacher -> real login against the
 * school's staff credentials (src/app/teacher-login.tsx). */
export default function LoginChoiceScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Screen>
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
