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
  heroIcon: keyof typeof Ionicons.glyphMap;
  heroGradient: string;
  heroAccent: string;
  points: { icon: keyof typeof Ionicons.glyphMap; text: string }[];
}

const SLIDES: SlideData[] = [
  {
    badge: 'CLASSWORK & HOMEWORK',
    title: 'Smart Learning & Homework',
    subtitle: 'Access daily homework assignments, chapter notes, and study material assigned directly by your teachers.',
    heroIcon: 'journal-outline',
    heroGradient: '#3B82F6',
    heroAccent: '#60A5FA',
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
    heroIcon: 'trophy-outline',
    heroGradient: '#10B981',
    heroAccent: '#34D399',
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
    heroIcon: 'megaphone-outline',
    heroGradient: '#8B5CF6',
    heroAccent: '#A78BFA',
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
  const translateXAnim = useRef(new Animated.Value(0)).current;

  const logoSource = !imgError && brand.logoUrl ? { uri: brand.logoUrl } : defaultLogo;
  const instituteTitle = brand.appTitle || 'Our Institute';
  const isLastStep = currentStep === SLIDES.length - 1;
  const slide = SLIDES[currentStep];

  useEffect(() => {
    if (brand.logoUrl) {
      Image.prefetch(brand.logoUrl).catch(() => {});
    }
  }, [brand.logoUrl]);

  function animateStepChange(nextStepIdx: number) {
    if (nextStepIdx === currentStep) return;
    const isForward = nextStepIdx > currentStep;
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.94,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(translateXAnim, {
        toValue: isForward ? -40 : 40,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentStep(nextStepIdx);
      translateXAnim.setValue(isForward ? 40 : -40);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.spring(translateXAnim, {
          toValue: 0,
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
      {/* Top Header with Skip Button */}
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
      <Animated.View style={[styles.contentWrap, { opacity: fadeAnim, transform: [{ scale: scaleAnim }, { translateX: translateXAnim }] }]}>
        {/* Dynamic Visual Hero Graphic */}
        <View style={styles.heroWrap}>
          <View style={[styles.heroCard, { backgroundColor: slide.heroGradient + '15', borderColor: slide.heroGradient + '30' }]}>
            {/* Background Glow */}
            <View style={[styles.glowCircle, { backgroundColor: slide.heroGradient + '20' }]} />

            {/* Center School Logo Badge */}
            <View style={[styles.logoBadge, { backgroundColor: theme.surface, borderColor: theme.border }, Shadow.card]}>
              <Image
                source={logoSource}
                onError={() => setImgError(true)}
                style={styles.centerLogoImage}
                contentFit="contain"
                cachePolicy="memory-disk"
                priority="high"
                transition={300}
              />
            </View>

            {/* Floating Hero Feature Icon Badge */}
            <View style={[styles.floatingHeroIcon, { backgroundColor: slide.heroGradient }, Shadow.card]}>
              <Ionicons name={slide.heroIcon} size={24} color="#FFFFFF" />
            </View>
          </View>
        </View>

        {/* Category Badge */}
        <View style={[styles.badge, { backgroundColor: slide.heroGradient + '1A', borderColor: slide.heroGradient }]}>
          <ThemedText type="smallBold" style={{ color: slide.heroGradient, fontSize: 11, letterSpacing: 1 }}>
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
              <View style={[styles.iconWrap, { backgroundColor: slide.heroGradient + '18' }]}>
                <Ionicons name={pt.icon} size={18} color={slide.heroGradient} />
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
  heroCard: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    position: 'relative',
  },
  glowCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    position: 'absolute',
  },
  logoBadge: {
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
  floatingHeroIcon: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
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
