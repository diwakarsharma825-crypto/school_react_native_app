import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ui/ThemedText';
import { Brand, Radius, Shadow, Spacing } from '@/constants/theme';
import { useBrand } from '@/hooks/use-brand';
import { useTheme } from '@/hooks/use-theme';

const defaultLogo = require('../../../assets/images/icon.png');
const { width } = Dimensions.get('window');

interface SlideData {
  badge: string;
  title: string;
  subtitle: string;
  points: { icon: keyof typeof Ionicons.glyphMap; text: string }[];
}

const SLIDES: SlideData[] = [
  {
    badge: 'CLASSWORK & HOMEWORK',
    title: 'Smart Learning & Homework',
    subtitle: 'Access daily homework assignments, chapter notes, and study material assigned directly by your teachers.',
    points: [
      { icon: 'document-text-outline', text: 'Daily Classwork & Chapter Notes' },
      { icon: 'attach-outline', text: 'Photo Attachments & Downloads' },
      { icon: 'funnel-outline', text: 'Subject & Date Filtered Views' },
    ],
  },
  {
    badge: 'PROGRESS & MARKS',
    title: 'Real-Time Attendance & Results',
    subtitle: 'Track monthly attendance records, test marks, and academic performance reports instantly in real-time.',
    points: [
      { icon: 'calendar-outline', text: 'Monthly Attendance Calendar' },
      { icon: 'trophy-outline', text: 'Instant Exam Results & Grades' },
      { icon: 'receipt-outline', text: 'Fee Receipts & Invoices' },
    ],
  },
  {
    badge: 'NOTICES & LEAVES',
    title: 'Instant Notices & Easy Leaves',
    subtitle: 'Stay updated with important institute announcements and submit leave applications seamlessly.',
    points: [
      { icon: 'megaphone-outline', text: 'Direct Institute Announcements' },
      { icon: 'calendar-clear-outline', text: 'One-Tap Online Leave Applications' },
      { icon: 'person-circle-outline', text: 'Personalized Student Profile' },
    ],
  },
];

export function InstituteOnboarding({ onDone }: { onDone: () => void }) {
  const theme = useTheme();
  const brand = useBrand();
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const [imgError, setImgError] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const logoSource = !imgError && brand.logoUrl ? { uri: brand.logoUrl } : defaultLogo;
  const instituteTitle = brand.appTitle || 'Our Institute';
  const isLastStep = currentStep === SLIDES.length - 1;
  const slide = SLIDES[currentStep];

  function animateStepChange(nextStepIdx: number) {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentStep(nextStepIdx);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }

  function handleNext() {
    if (isLastStep) {
      onDone();
    } else {
      animateStepChange(currentStep + 1);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top + Spacing.two, paddingBottom: insets.bottom + Spacing.three }]}>
      {/* Top Header with Skip Button Only */}
      <View style={styles.topHeader}>
        <View style={styles.headerTitleWrap}>
          <ThemedText type="smallBold" style={{ color: theme.tint, letterSpacing: 1, fontSize: 11 }}>
            INSTITUTE PORTAL
          </ThemedText>
          <ThemedText type="subtitle" numberOfLines={1} style={styles.headerInstituteName}>
            {instituteTitle}
          </ThemedText>
        </View>

        {!isLastStep ? (
          <Pressable onPress={onDone} style={[styles.skipButton, { backgroundColor: theme.backgroundElement }]} hitSlop={12}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              Skip
            </ThemedText>
          </Pressable>
        ) : null}
      </View>

      {/* Animated Slide Content */}
      <Animated.View style={[styles.contentWrap, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        {/* Dynamic Center Graphic Container showcasing Logo in Central Circle */}
        <View style={styles.heroWrap}>
          <View style={[styles.outerGlow, { backgroundColor: theme.tint + '12' }]}>
            <View style={[styles.middleRing, { backgroundColor: theme.tint + '20', borderColor: theme.tint + '38' }]}>
              <View style={[styles.innerCircle, { backgroundColor: theme.surface, borderColor: theme.border }, Shadow.card]}>
                <Image
                  source={logoSource}
                  onError={() => setImgError(true)}
                  style={styles.centerLogoImage}
                  contentFit="contain"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Category Badge */}
        <View style={[styles.badge, { backgroundColor: theme.accent + '1A', borderColor: theme.accent }]}>
          <ThemedText type="smallBold" style={{ color: theme.accent, fontSize: 11, letterSpacing: 1 }}>
            {slide.badge}
          </ThemedText>
        </View>

        {/* Title & Description */}
        <ThemedText type="title" style={styles.titleText}>
          {slide.title}
        </ThemedText>
        <ThemedText type="default" themeColor="textSecondary" style={styles.subtitleText}>
          {slide.subtitle}
        </ThemedText>

        {/* Feature Cards List */}
        <View style={styles.pointsList}>
          {slide.points.map((pt, index) => (
            <View key={index} style={[styles.pointRow, { backgroundColor: theme.surface, borderColor: theme.border }, Shadow.card]}>
              <View style={[styles.iconWrap, { backgroundColor: theme.tint + '18' }]}>
                <Ionicons name={pt.icon} size={18} color={theme.tint} />
              </View>
              <ThemedText type="smallBold" style={styles.pointText}>
                {pt.text}
              </ThemedText>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Footer Controls with Full Width Button */}
      <View style={styles.footer}>
        {/* Step Indicators */}
        <View style={styles.paginationDots}>
          {SLIDES.map((_, idx) => (
            <Pressable key={idx} onPress={() => animateStepChange(idx)} hitSlop={8}>
              <View
                style={[
                  styles.dot,
                  idx === currentStep
                    ? [styles.activeDot, { backgroundColor: theme.tint, width: 28 }]
                    : { backgroundColor: theme.border },
                ]}
              />
            </Pressable>
          ))}
        </View>

        {/* Full-Width User-Friendly Action Button */}
        <Pressable
          onPress={handleNext}
          style={[styles.primaryButton, { backgroundColor: theme.tint }, Shadow.card]}
        >
          <ThemedText type="smallBold" style={styles.buttonText}>
            {isLastStep ? 'Get Started' : 'Next'}
          </ThemedText>
          <Ionicons name={isLastStep ? 'checkmark-circle' : 'arrow-forward'} size={22} color={Brand.white} style={{ marginLeft: 8 }} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    justifyContent: 'space-between',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  headerTitleWrap: {
    flex: 1,
    gap: 2,
    marginRight: Spacing.two,
  },
  headerInstituteName: {
    fontSize: 16,
  },
  skipButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.pill,
  },
  contentWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  outerGlow: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middleRing: {
    width: 114,
    height: 114,
    borderRadius: 57,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  centerLogoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 33,
  },
  badge: {
    paddingHorizontal: Spacing.three + 2,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    marginBottom: Spacing.two,
  },
  titleText: {
    textAlign: 'center',
    fontSize: 22,
    marginBottom: Spacing.one + 2,
  },
  subtitleText: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: Spacing.four,
    lineHeight: 20,
    paddingHorizontal: Spacing.one,
  },
  pointsList: {
    width: '100%',
    gap: Spacing.two,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three - 1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.three,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointText: {
    fontSize: 14,
    flex: 1,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  paginationDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    height: 8,
    borderRadius: 4,
  },
  primaryButton: {
    width: '100%',
    height: 52,
    borderRadius: Radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: Brand.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
