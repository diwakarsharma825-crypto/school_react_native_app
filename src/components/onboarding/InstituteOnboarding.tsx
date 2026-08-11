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
  points: string[];
}

const SLIDES: SlideData[] = [
  {
    icon: 'book-outline',
    badge: 'HOMEWORK & STUDY',
    title: 'Smart Learning & Homework',
    subtitle: 'Access daily homework assignments, chapter notes, and study material assigned directly by your teachers.',
    points: ['Daily Classwork & Chapter Notes', 'Photo Attachments & Downloads', 'Subject & Date Filtered Views'],
  },
  {
    icon: 'stats-chart-outline',
    badge: 'PROGRESS & MARKS',
    title: 'Real-Time Attendance & Results',
    subtitle: 'Track monthly attendance records, test marks, and academic performance reports instantly in real-time.',
    points: ['Monthly Attendance Calendar', 'Instant Exam Results & Grades', 'Fee Receipts & Invoices'],
  },
  {
    icon: 'notifications-outline',
    badge: 'NOTICES & LEAVES',
    title: 'Instant Notices & Easy Leaves',
    subtitle: 'Stay updated with important institute announcements and submit leave applications seamlessly.',
    points: ['Direct Institute Announcements', 'One-Tap Online Leave Applications', 'Personalized Student Profile'],
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
        <View style={[styles.logoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
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
          <Pressable onPress={onDone} style={styles.skipButton} hitSlop={12}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              Skip
            </ThemedText>
          </Pressable>
        ) : null}
      </View>

      {/* Slide Content Card */}
      <View style={styles.contentWrap}>
        {/* Dynamic Graphic Circle */}
        <View style={[styles.graphicCircle, { backgroundColor: theme.tint + '15', borderColor: theme.tint + '30' }]}>
          <View style={[styles.innerCircle, { backgroundColor: theme.tint }, Shadow.card]}>
            <Ionicons name={slide.icon} size={44} color={Brand.white} />
          </View>
        </View>

        {/* Badge */}
        <View style={[styles.badge, { backgroundColor: theme.accent + '22', borderColor: theme.accent }]}>
          <ThemedText type="smallBold" style={{ color: theme.accent, fontSize: 11, letterSpacing: 0.8 }}>
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

        {/* Feature Points list */}
        <View style={styles.pointsList}>
          {slide.points.map((point, index) => (
            <View key={index} style={[styles.pointRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.checkCircle, { backgroundColor: theme.tint }]}>
                <Ionicons name="checkmark" size={14} color={Brand.white} />
              </View>
              <ThemedText type="smallBold" style={styles.pointText}>
                {point}
              </ThemedText>
            </View>
          ))}
        </View>
      </View>

      {/* Footer Navigation */}
      <View style={styles.footer}>
        {/* Pagination Dots */}
        <View style={styles.paginationDots}>
          {SLIDES.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                idx === currentStep
                  ? [styles.activeDot, { backgroundColor: theme.tint, width: 24 }]
                  : { backgroundColor: theme.border },
              ]}
            />
          ))}
        </View>

        {/* Action Button */}
        <Pressable
          onPress={nextStep}
          style={[styles.primaryButton, { backgroundColor: theme.tint }, Shadow.card]}
        >
          <ThemedText type="smallBold" style={styles.buttonText}>
            {isLastStep ? 'Get Started' : 'Next'}
          </ThemedText>
          <Ionicons name={isLastStep ? 'checkmark-circle' : 'arrow-forward'} size={20} color={Brand.white} style={{ marginLeft: 6 }} />
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
    marginBottom: Spacing.three,
  },
  logoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: 1,
    gap: Spacing.two,
    maxWidth: width * 0.7,
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
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  contentWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
  },
  graphicCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.four,
  },
  innerCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    marginBottom: Spacing.two,
  },
  titleText: {
    textAlign: 'center',
    fontSize: 24,
    marginBottom: Spacing.two,
  },
  subtitleText: {
    textAlign: 'center',
    fontSize: 15,
    marginBottom: Spacing.four,
    lineHeight: 22,
  },
  pointsList: {
    width: '100%',
    gap: Spacing.two,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.three,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointText: {
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.four,
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
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
    borderRadius: Radius.pill,
    minWidth: 130,
  },
  buttonText: {
    color: Brand.white,
    fontSize: 16,
  },
});
