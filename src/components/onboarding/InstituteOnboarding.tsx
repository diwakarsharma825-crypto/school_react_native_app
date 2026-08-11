import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ui/ThemedText';
import { Brand, Radius, Shadow, Spacing } from '@/constants/theme';
import { useBrand } from '@/hooks/use-brand';
import { useTheme } from '@/hooks/use-theme';

const defaultLogo = require('../../../assets/images/icon.png');
const { width } = Dimensions.get('window');

interface SlideData {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  badge: string;
  points: { icon: keyof typeof Ionicons.glyphMap; text: string }[];
}

const SLIDES: SlideData[] = [
  {
    icon: 'book-outline',
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
    icon: 'stats-chart-outline',
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
    icon: 'notifications-outline',
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

  const logoSource = !imgError && brand.logoUrl ? { uri: brand.logoUrl } : defaultLogo;
  const instituteTitle = brand.appTitle || 'Institute Portal';
  const isLastStep = currentStep === SLIDES.length - 1;
  const slide = SLIDES[currentStep];

  function nextStep() {
    if (isLastStep) {
      onDone();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + Spacing.four }]}>
      {/* Top Header with Institute Logo & Skip */}
      <View style={styles.topHeader}>
        <View style={[styles.logoCard, { backgroundColor: theme.surface, borderColor: theme.border }, Shadow.card]}>
          <Image
            source={logoSource}
            onError={() => setImgError(true)}
            style={styles.logoImage}
            contentFit="contain"
          />
          <ThemedText type="smallBold" numberOfLines={1} style={styles.logoText}>
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

      {/* Slide Content */}
      <View style={styles.contentWrap}>
        {/* Dynamic Graphic Hero Container */}
        <View style={[styles.heroWrap]}>
          <View style={[styles.outerGlow, { backgroundColor: theme.tint + '12' }]}>
            <View style={[styles.middleRing, { backgroundColor: theme.tint + '20', borderColor: theme.tint + '40' }]}>
              <View style={[styles.innerCircle, { backgroundColor: theme.tint }, Shadow.card]}>
                <Ionicons name={slide.icon} size={44} color={Brand.white} />
              </View>
            </View>
          </View>
        </View>

        {/* Badge */}
        <View style={[styles.badge, { backgroundColor: theme.accent + '1E', borderColor: theme.accent }]}>
          <ThemedText type="smallBold" style={{ color: theme.accent, fontSize: 11, letterSpacing: 1.2 }}>
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
      </View>

      {/* Footer Controls */}
      <View style={styles.footer}>
        {/* Step Indicators */}
        <View style={styles.paginationDots}>
          {SLIDES.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                idx === currentStep
                  ? [styles.activeDot, { backgroundColor: theme.tint, width: 28 }]
                  : { backgroundColor: theme.border },
              ]}
            />
          ))}
        </View>

        {/* Primary Action Button */}
        <Pressable
          onPress={nextStep}
          style={[styles.primaryButton, { backgroundColor: theme.tint }, Shadow.card]}
        >
          <ThemedText type="smallBold" style={styles.buttonText}>
            {isLastStep ? 'Get Started' : 'Next'}
          </ThemedText>
          <Ionicons name={isLastStep ? 'checkmark-circle' : 'arrow-forward'} size={20} color={Brand.white} style={{ marginLeft: 8 }} />
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
  logoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three + 2,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: 1,
    gap: Spacing.two,
    maxWidth: width * 0.72,
  },
  logoImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  logoText: {
    fontSize: 14,
    flexShrink: 1,
  },
  skipButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 3,
    borderRadius: Radius.pill,
  },
  contentWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.one,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: Spacing.three + 2,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
    marginBottom: Spacing.two,
  },
  titleText: {
    textAlign: 'center',
    fontSize: 23,
    marginBottom: Spacing.one + 2,
  },
  subtitleText: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: Spacing.four,
    lineHeight: 21,
    paddingHorizontal: Spacing.two,
  },
  pointsList: {
    width: '100%',
    gap: Spacing.two + 2,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three + 2,
    paddingVertical: Spacing.three,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.three,
  },
  paginationDots: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five + 2,
    paddingVertical: Spacing.three + 2,
    borderRadius: Radius.pill,
    minWidth: 140,
  },
  buttonText: {
    color: Brand.white,
    fontSize: 16,
  },
});
