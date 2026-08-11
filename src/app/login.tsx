import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/ui/ThemedText';
import { Brand, Radius, Shadow, Spacing } from '@/constants/theme';
import { useBrand } from '@/hooks/use-brand';
import { useStudentAuth } from '@/hooks/use-student-auth';
import { useTeacherAuth } from '@/hooks/use-teacher-auth';
import { useTheme } from '@/hooks/use-theme';

const defaultLogo = require('../../assets/images/icon.png');

export default function LoginChoiceScreen() {
  const theme = useTheme();
  const brand = useBrand();
  const router = useRouter();
  const { loggedIn: studentLoggedIn } = useStudentAuth();
  const { loggedIn: teacherLoggedIn } = useTeacherAuth();

  const [imgError, setImgError] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const studentScale = useRef(new Animated.Value(1)).current;
  const teacherScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (studentLoggedIn) {
      router.replace('/student-dashboard');
    } else if (teacherLoggedIn) {
      router.replace('/teacher-dashboard');
    }
  }, [studentLoggedIn, teacherLoggedIn, router]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  function animatePress(scaleRef: Animated.Value, toVal: number) {
    Animated.spring(scaleRef, {
      toValue: toVal,
      friction: 6,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }

  const logoSource = !imgError && brand.logoUrl ? { uri: brand.logoUrl } : defaultLogo;
  const displayTitle = brand.appTitle || 'Institute Portal';

  return (
    <Screen>
      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        {/* Section Header */}
        <View style={styles.titleWrap}>
          <ThemedText type="title" style={styles.title}>
            Who&apos;s using this?
          </ThemedText>
          <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
            Choose your profile to access your dashboard
          </ThemedText>
        </View>

        {/* Student Role Card */}
        <Pressable
          onPressIn={() => animatePress(studentScale, 0.97)}
          onPressOut={() => animatePress(studentScale, 1)}
          onPress={() => router.push('/homework')}
        >
          <Animated.View style={{ transform: [{ scale: studentScale }] }}>
            <Card style={[styles.optionCard, { borderColor: theme.tint + '40' }, Shadow.card]}>
              <View style={[styles.iconWrap, { backgroundColor: theme.tint + '1C' }]}>
                <Ionicons name="school-outline" size={30} color={theme.tint} />
              </View>
              <View style={styles.optionText}>
                <View style={styles.roleHeaderRow}>
                  <ThemedText type="smallBold" style={{ fontSize: 17 }}>
                    I&apos;m a Student
                  </ThemedText>
                  <View style={[styles.roleChip, { backgroundColor: theme.tint + '1A' }]}>
                    <ThemedText type="smallBold" style={{ color: theme.tint, fontSize: 10 }}>
                      STUDENT
                    </ThemedText>
                  </View>
                </View>
                <ThemedText type="small" themeColor="textSecondary" style={{ lineHeight: 18 }}>
                  View homework calendar, attendance records &amp; report cards
                </ThemedText>
                <View style={styles.featurePillsRow}>
                  <View style={[styles.pill, { backgroundColor: theme.backgroundElement }]}>
                    <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11 }}>
                      📚 Homework
                    </ThemedText>
                  </View>
                  <View style={[styles.pill, { backgroundColor: theme.backgroundElement }]}>
                    <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11 }}>
                      📅 Attendance
                    </ThemedText>
                  </View>
                  <View style={[styles.pill, { backgroundColor: theme.backgroundElement }]}>
                    <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11 }}>
                      🏆 Results
                    </ThemedText>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={22} color={theme.tint} />
            </Card>
          </Animated.View>
        </Pressable>

        {/* Teacher Role Card */}
        <Pressable
          onPressIn={() => animatePress(teacherScale, 0.97)}
          onPressOut={() => animatePress(teacherScale, 1)}
          onPress={() => router.push('/teacher-login')}
        >
          <Animated.View style={{ transform: [{ scale: teacherScale }] }}>
            <Card style={[styles.optionCard, { borderColor: theme.accent + '40' }, Shadow.card]}>
              <View style={[styles.iconWrap, { backgroundColor: theme.accent + '1E' }]}>
                <Ionicons name="briefcase-outline" size={28} color={theme.accent} />
              </View>
              <View style={styles.optionText}>
                <View style={styles.roleHeaderRow}>
                  <ThemedText type="smallBold" style={{ fontSize: 17 }}>
                    I&apos;m a Teacher
                  </ThemedText>
                  <View style={[styles.roleChip, { backgroundColor: theme.accent + '1A' }]}>
                    <ThemedText type="smallBold" style={{ color: theme.accent, fontSize: 10 }}>
                      TEACHER
                    </ThemedText>
                  </View>
                </View>
                <ThemedText type="small" themeColor="textSecondary" style={{ lineHeight: 18 }}>
                  Add homework, mark attendance &amp; manage your class
                </ThemedText>
                <View style={styles.featurePillsRow}>
                  <View style={[styles.pill, { backgroundColor: theme.backgroundElement }]}>
                    <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11 }}>
                      ✍️ Manage Class
                    </ThemedText>
                  </View>
                  <View style={[styles.pill, { backgroundColor: theme.backgroundElement }]}>
                    <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11 }}>
                      📋 Attendance
                    </ThemedText>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={22} color={theme.accent} />
            </Card>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brandCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.four,
    marginTop: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  logoGlow: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  brandLogo: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.sm,
  },
  brandTextCol: {
    flex: 1,
    gap: 3,
  },
  welcomeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  brandTitle: {
    fontSize: 18,
  },
  titleWrap: {
    marginBottom: Spacing.three,
  },
  title: {
    fontSize: 22,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.three + 2,
    marginBottom: Spacing.three,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
    gap: 4,
  },
  roleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  roleChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  featurePillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
});
