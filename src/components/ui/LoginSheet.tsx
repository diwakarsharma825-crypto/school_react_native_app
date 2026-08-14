import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from './ThemedText';

import { useStudentAuth } from '@/hooks/use-student-auth';
import { useTeacherAuth } from '@/hooks/use-teacher-auth';

interface LoginSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function LoginSheet({ visible, onClose }: LoginSheetProps) {
  const theme = useTheme();
  const router = useRouter();
  const { loggedIn: studentLoggedIn } = useStudentAuth();
  const { loggedIn: teacherLoggedIn } = useTeacherAuth();
  const translateY = useRef(new Animated.Value(400)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, friction: 9, tension: 65, useNativeDriver: true }),
      ]).start();
    } else {
      translateY.setValue(400);
      backdropOpacity.setValue(0);
    }
  }, [visible, translateY, backdropOpacity]);

  function closeThen(action: () => void) {
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 400, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      onClose();
      action();
    });
  }

  const titleColor = theme.dark ? '#FFFFFF' : theme.text;
  const iconColor = theme.dark ? '#FFFFFF' : theme.tint;
  const iconBg = theme.dark ? theme.tint : theme.backgroundSelected;
  const chevronColor = theme.dark ? '#FFFFFF' : theme.textSecondary;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => closeThen(() => {})} />
      </Animated.View>
      <Animated.View
        style={[styles.sheet, { backgroundColor: theme.surface, transform: [{ translateY }] }]}
      >
        <View style={[styles.handle, { backgroundColor: theme.border }]} />
        <ThemedText type="title" style={[styles.title, { color: titleColor }]}>
          Who&apos;s using this?
        </ThemedText>
        <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
          Choose your role to continue.
        </ThemedText>

        <Pressable
          onPress={() =>
            closeThen(() => router.push(studentLoggedIn ? ('/student-dashboard' as any) : '/homework'))
          }
        >
          <View style={[styles.option, { backgroundColor: theme.backgroundElement }]}>
            <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
              <Ionicons name="school-outline" size={26} color={iconColor} />
            </View>
            <View style={styles.optionText}>
              <ThemedText type="smallBold" style={{ color: titleColor }}>I&apos;m a Student</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {studentLoggedIn ? 'Open your student dashboard' : "View your class's homework calendar"}
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={chevronColor} />
          </View>
        </Pressable>

        <Pressable
          onPress={() =>
            closeThen(() => router.push(teacherLoggedIn ? ('/teacher-dashboard' as any) : '/teacher-login'))
          }
        >
          <View style={[styles.option, { backgroundColor: theme.backgroundElement }]}>
            <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
              <Ionicons name="briefcase-outline" size={24} color={iconColor} />
            </View>
            <View style={styles.optionText}>
              <ThemedText type="smallBold" style={{ color: titleColor }}>I&apos;m a Teacher</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {teacherLoggedIn ? 'Open your teacher dashboard' : 'Log in to manage your dashboard & homework'}
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={chevronColor} />
          </View>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.four,
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
    borderRadius: Radius.md,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  iconWrap: {
    width: 48,
    height: 48,
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
