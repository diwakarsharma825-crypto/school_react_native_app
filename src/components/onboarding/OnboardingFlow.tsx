import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Linking, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { registerDevice } from '@/data/app-status';
import { fetchSettings } from '@/data/api';
import { registerStudentPushToken, studentLogin, studentRegister } from '@/data/homework-api';
import { ClassPickerItem, fetchClassesCatalog, teacherLogout } from '@/data/teacher-api';
import { Brand, Radius, Shadow, Spacing } from '@/constants/theme';
import { useFetch } from '@/hooks/use-fetch';
import { useStudentAuth } from '@/hooks/use-student-auth';
import { useTeacherAuth } from '@/hooks/use-teacher-auth';
import { HomeworkAccess, saveHomeworkChildren, savePendingRegistration } from '@/lib/homework-access';
import { markOnboardingComplete } from '@/lib/onboarding';
import { getFcmPushToken } from '@/lib/notifications';
import { getCurrentDeviceLocation } from '@/lib/permissions';
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui/Button';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { SelectField } from '@/components/ui/SelectField';
import { ThemedText } from '@/components/ui/ThemedText';

const logoSource = require('../../../assets/images/icon.png');
const hwPreviewImg = require('../../../assets/images/onboarding_hw.jpg');
const attPreviewImg = require('../../../assets/images/onboarding_att.jpg');
const noticesPreviewImg = require('../../../assets/images/onboarding_notices.jpg');

type Belonging = 'saarthak' | 'other';
type UserType = 'student' | 'teacher' | 'other';

// Intro Showcase, Belonging, User type, Details, mandatory Permissions gate.
const TOTAL_STEPS = 5;

const STREAM_OPTIONS = [
  { label: 'Arts', value: 'Arts' },
  { label: 'Non-Medical', value: 'Non-Medical' },
  { label: 'Medical', value: 'Medical' },
  { label: 'Commerce', value: 'Commerce' },
];

const DESIGNATION_OPTIONS = [
  { label: 'PRT (Primary Teacher)', value: 'PRT' },
  { label: 'TGT (Trained Graduate Teacher)', value: 'TGT' },
  { label: 'PGT (Post Graduate Teacher)', value: 'PGT' },
];

// A class name containing "11" or "12" (whatever the admin's exact naming
// is — "Class 11th", "11", etc.) is eligible for a stream — same keyword
// check the teacher profile screen already uses, so it's not hardcoded to
// one exact string that can drift out of sync with real class names.
const STREAM_ELIGIBLE_KEYWORDS = ['11', '12'];

interface OnboardingFlowProps {
  onDone: () => void;
}

export function OnboardingFlow({ onDone }: OnboardingFlowProps) {
  const theme = useTheme();
  const { refresh: refreshStudentAuth } = useStudentAuth();
  const { setLoggedIn: setTeacherLoggedIn } = useTeacherAuth();
  const { data: settings } = useFetch(fetchSettings);
  const schoolName = settings?.school_name ?? 'our school';
  const address = settings?.address ?? '';
  const [step, setStep] = useState(0);
  const [belonging, setBelonging] = useState<Belonging | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [fullName, setFullName] = useState('');
  const [studentClass, setStudentClass] = useState<string | null>(null);
  const [section, setSection] = useState('');
  const [stream, setStream] = useState<string | null>(null);
  const [designation, setDesignation] = useState<string | null>(null);
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [srn, setSrn] = useState('');
  const [gender, setGender] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [mobileError, setMobileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [srnError, setSrnError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [classCatalog, setClassCatalog] = useState<ClassPickerItem[]>([]);

  // Fetched live from the CMS's real `classes`/`sections` tables — a
  // hardcoded list here previously drifted out of sync with real class
  // names ("1" vs "Class 1st"), silently breaking homework/roster matching
  // for anyone who registered through it.
  useEffect(() => {
    fetchClassesCatalog()
      .then(setClassCatalog)
      .catch(() => setClassCatalog([]));
  }, []);

  const classOptions = classCatalog.map((c) => ({ label: c.name, value: c.name }));
  function sectionOptionsFor(className: string | null) {
    const cls = classCatalog.find((c) => c.name === className);
    return (cls?.sections ?? []).map((s) => ({ label: s.name, value: s.name }));
  }

  // Password is only asked for — and only means anything for — a student
  // from this school, since it verifies against `result_students` via the
  // same student_login the Homework tab uses. Everyone else just registers
  // the device, no server-side account to check against.
  const needsPassword = belonging === 'saarthak' && userType === 'student';

  // Only a student from THIS school self-registers (name/class/SRN/password)
  // — everyone else (any teacher, any "other profession", and anyone from a
  // different school) skips the details form entirely and goes straight to
  // the permission step. Teacher accounts are issued by the principal and
  // signed in on the dedicated Teacher Login screen, not registered here.
  const needsDetailsForm = belonging === 'saarthak' && userType === 'student';

  function validateDetails(): boolean {
    const trimmedName = fullName.trim();
    const trimmedMobile = mobile.trim();
    let hasError = false;
    if (!trimmedName) {
      setNameError('Please enter your name.');
      hasError = true;
    } else {
      setNameError(null);
    }
    if (!/^\d{10}$/.test(trimmedMobile)) {
      setMobileError('Please enter a valid 10-digit mobile number.');
      hasError = true;
    } else {
      setMobileError(null);
    }
    if (needsPassword && !password) {
      setPasswordError('Please enter the password your school gave you.');
      hasError = true;
    } else {
      setPasswordError(null);
    }
    setSrnError(null);
    return !hasError;
  }

  function goToPermissions() {
    if (validateDetails()) setStep(4);
  }

  async function finishSkippedStudentOnboarding() {
    const trimmedName = fullName.trim();
    setFinishing(true);
    await teacherLogout().catch(() => {});
    setTeacherLoggedIn(false);
    await markOnboardingComplete();
    const location = await getCurrentDeviceLocation().catch(() => null);
    await registerDevice({
      userType: userType ?? undefined,
      role: userType === 'teacher' ? designation ?? undefined : userType ?? undefined,
      fullName: trimmedName || undefined,
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
    }).catch(() => {});
    onDone();
  }

  // Reached after the permissions step either grants access or lets the user
  // skip for now.
  async function completeOnboarding() {
    const trimmedName = fullName.trim();
    const trimmedMobile = mobile.trim();
    setFinishing(true);
    // Only one identity is "active" on this device at a time — same
    // reasoning as the teacher/student login screens.
    await teacherLogout().catch(() => {});
    setTeacherLoggedIn(false);

    if (needsPassword) {
      try {
        const cleanSrn = String(Math.floor(100000000 + Math.random() * 900000000));
        await studentRegister({
          name: trimmedName,
          className: studentClass ?? '',
          section: section.trim() || undefined,
          phone: trimmedMobile,
          password,
          srn: cleanSrn,
          gender: gender ?? undefined,
        });
        await savePendingRegistration({ name: trimmedName, className: studentClass ?? '' });
        setTimeout(() => {
          if (typeof window !== 'undefined' && window.alert) {
            window.alert("Registered!\n\nYour class teacher needs to verify your account before you can view homework. You'll be able to log in once that's done.");
          } else {
            Alert.alert(
              'Registered!',
              "Your class teacher needs to verify your account before you can view homework. You'll be able to log in once that's done."
            );
          }
        }, 400);
      } catch (registerError) {
        const regMsg = registerError instanceof Error ? registerError.message : 'Could not register. Please try again.';
        if (/already|registered|srn|exist|conflict/i.test(regMsg)) {
          await savePendingRegistration({ name: trimmedName, className: studentClass ?? '' });
          setTimeout(() => {
            if (typeof window !== 'undefined' && window.alert) {
              window.alert("Registered!\n\nYour class teacher needs to verify your account before you can view homework. You'll be able to log in once that's done.");
            } else {
              Alert.alert(
                'Registered!',
                "Your class teacher needs to verify your account before you can view homework. You'll be able to log in once that's done."
              );
            }
          }, 400);
        } else {
          setFinishing(false);
          setPasswordError(regMsg);
          setStep(3);
          return;
        }
      }
    }

    await markOnboardingComplete();
    const location = await getCurrentDeviceLocation().catch(() => null);
    await registerDevice({
      userType: userType ?? undefined,
      role: userType === 'teacher' ? designation ?? undefined : userType ?? undefined,
      fullName: trimmedName,
      studentClass: userType === 'student' ? studentClass ?? undefined : undefined,
      section: userType === 'student' ? section.trim() || undefined : undefined,
      stream: userType === 'student' ? stream ?? undefined : undefined,
      designation: userType === 'teacher' ? designation ?? undefined : undefined,
      phone: `+91${trimmedMobile}`,
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
    }).catch(() => {});
    try {
      const pushToken = await Promise.race([
        getFcmPushToken(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 1200)),
      ]);
      if (pushToken) {
        registerDevice({ pushToken, latitude: location?.latitude ?? null, longitude: location?.longitude ?? null }).catch(() => {});
        if (needsPassword) registerStudentPushToken(trimmedMobile, pushToken).catch(() => {});
      }
    } catch {
      // ignore token error
    } finally {
      setFinishing(false);
      onDone();
    }
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      {step > 0 ? (
        <Pressable
          onPress={() => setStep((s) => (s === 4 && !needsDetailsForm ? 2 : s - 1))}
          hitSlop={10}
          style={styles.back}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </Pressable>
      ) : (
        <View style={styles.back} />
      )}
      <StepDots total={TOTAL_STEPS} current={step} />

      <KeyboardAwareScrollView
        style={styles.flex}
        contentContainerStyle={styles.bodyScroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        bottomOffset={24}
        showsVerticalScrollIndicator={false}
      >
        {step === 0 ? <IntroShowcaseStep schoolName={schoolName} /> : null}
        {step === 1 ? (
          <BelongingStep value={belonging} onChange={setBelonging} schoolName={schoolName} address={address} />
        ) : null}
        {step === 2 ? <UserTypeStep value={userType} onChange={setUserType} /> : null}
        {step === 3 ? (
          <DetailsStep
            userType={userType}
            fullName={fullName}
            onFullName={setFullName}
            nameError={nameError}
            classOptions={classOptions}
            studentClass={studentClass}
            onClass={(v) => {
              setStudentClass(v);
              setSection('');
            }}
            sectionOptions={sectionOptionsFor(studentClass)}
            section={section}
            onSection={setSection}
            stream={stream}
            onStream={setStream}
            designation={designation}
            onDesignation={setDesignation}
            mobile={mobile}
            onMobile={setMobile}
            mobileError={mobileError}
            needsPassword={needsPassword}
            password={password}
            onPassword={setPassword}
            passwordError={passwordError}
            srn={srn}
            onSrn={setSrn}
            srnError={srnError}
            gender={gender}
            onGender={setGender}
          />
        ) : null}
        {step === 4 ? (
          <PermissionsStep
            onGranted={completeOnboarding}
            onSkip={completeOnboarding}
            busy={finishing}
            allowSkip
          />
        ) : null}
      </KeyboardAwareScrollView>

      {step < 4 ? (
        <View style={styles.footer}>
          {step === 0 ? (
            <Button label="Get Started" variant="primary" onPress={() => setStep(1)} />
          ) : step === 1 ? (
            <Button label="Continue" variant="primary" onPress={() => setStep(2)} disabled={!belonging} />
          ) : step === 2 ? (
            <Button
              label="Continue"
              variant="primary"
              onPress={() => setStep(needsDetailsForm ? 3 : 4)}
              disabled={!userType}
            />
          ) : needsDetailsForm ? (
            <>
              <Button label="Continue" variant="primary" onPress={goToPermissions} />
              <Pressable onPress={() => finishSkippedStudentOnboarding()} hitSlop={8} style={styles.skipLink}>
                <ThemedText type="default" themeColor="textSecondary">
                  Skip for now
                </ThemedText>
              </Pressable>
            </>
          ) : (
            <Button label="Continue" variant="primary" onPress={goToPermissions} />
          )}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function StepDots({ total, current }: { total: number; current: number }) {
  const theme = useTheme();
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === current && [styles.dotActive, { backgroundColor: theme.tint }],
            i < current && { backgroundColor: theme.tint },
          ]}
        />
      ))}
    </View>
  );
}

function IntroShowcaseStep({ schoolName }: { schoolName: string }) {
  const theme = useTheme();

  // Floating animation for orbital badges
  const floatAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  // Active feature card index in the bottom animated preview gallery
  const [activeCardIdx, setActiveCardIdx] = useState(0);
  const cardFadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }),
    ]).start();

    // Gentle continuous floating loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 5,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: -5,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim, floatAnim, scaleAnim]);

  // Switch card automatically or on dot click
  function switchPreviewCard(newIdx: number) {
    if (newIdx === activeCardIdx) return;
    Animated.timing(cardFadeAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      setActiveCardIdx(newIdx);
      Animated.timing(cardFadeAnim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    });
  }

  const PREVIEW_CARDS = [
    {
      badge: 'HOMEWORK & STUDY',
      title: 'Smart Homework & Classwork',
      desc: 'Access daily assignments, attached photos, PDFs, and chapter notes.',
      image: hwPreviewImg,
      icon: 'book-outline' as const,
      color: '#3B82F6',
      tag: 'Photo & PDF Notes',
    },
    {
      badge: 'ATTENDANCE & LOGS',
      title: 'Real-Time Monthly Attendance',
      desc: 'Track monthly attendance percentage, present/absent logs in real-time.',
      image: attPreviewImg,
      icon: 'checkmark-done-circle-outline' as const,
      color: '#10B981',
      tag: 'Live Logs',
    },
    {
      badge: 'ANNOUNCEMENTS',
      title: 'Direct School Notices & Alerts',
      desc: 'Stay updated with official school circulars, event announcements & alerts.',
      image: noticesPreviewImg,
      icon: 'megaphone-outline' as const,
      color: '#8B5CF6',
      tag: 'Live Alerts',
    },
  ];

  const currentPreview = PREVIEW_CARDS[activeCardIdx];

  const floatTop = floatAnim;
  const floatBottom = Animated.multiply(floatAnim, -1);

  return (
    <Animated.View style={[styles.introWrap, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      {/* 1. Main Title & Subtitle at the Top */}
      <View style={styles.topTitleHeader}>
        <ThemedText type="title" style={[styles.centerText, styles.topMainTitle]}>
          Welcome to {schoolName}
        </ThemedText>
        <ThemedText type="default" themeColor="textSecondary" style={[styles.centerText, styles.topMainSubtitle]}>
          Your all-in-one digital portal for homework, attendance, leave applications, notices, and school activities.
        </ThemedText>
      </View>

      {/* 2. Hero Visual Container with Multi-Ring Orbit & 6 Floating Feature Pills */}
      <View style={styles.introHeroBoxExpanded}>
        {/* Outer Glow Orbits */}
        <View style={[styles.introOuterOrbit, { backgroundColor: theme.tint + '08', borderColor: theme.tint + '1A' }]} />
        <View style={[styles.introMiddleOrbit, { backgroundColor: theme.tint + '10', borderColor: theme.tint + '2A' }]} />

        {/* Central Logo Ring */}
        <View style={[styles.introLogoRingExpanded, { backgroundColor: theme.surface, borderColor: theme.border }, Shadow.card]}>
          <Image
            source={logoSource}
            style={styles.introLogoImg}
            contentFit="contain"
            cachePolicy="memory-disk"
            priority="high"
            transition={300}
          />
        </View>

        {/* 6 Floating Orbital Feature Badges around the circle */}
        {/* 1. Daily Homework (Top-Left) */}
        <Animated.View style={[styles.floatingBadge, styles.badgePosTopLeft, { backgroundColor: '#3B82F6', transform: [{ translateY: floatTop }] }, Shadow.card]}>
          <Ionicons name="journal-outline" size={13} color="#FFFFFF" />
          <ThemedText type="smallBold" style={styles.floatingBadgeText}>Daily Homework</ThemedText>
        </Animated.View>

        {/* 2. Announcements (Top-Right) */}
        <Animated.View style={[styles.floatingBadge, styles.badgePosTopRight, { backgroundColor: '#8B5CF6', transform: [{ translateY: floatBottom }] }, Shadow.card]}>
          <Ionicons name="megaphone-outline" size={13} color="#FFFFFF" />
          <ThemedText type="smallBold" style={styles.floatingBadgeText}>Announcements</ThemedText>
        </Animated.View>

        {/* 3. Attendance (Mid-Left) */}
        <Animated.View style={[styles.floatingBadge, styles.badgePosMidLeft, { backgroundColor: '#10B981', transform: [{ translateY: floatBottom }] }, Shadow.card]}>
          <Ionicons name="checkmark-done-circle-outline" size={13} color="#FFFFFF" />
          <ThemedText type="smallBold" style={styles.floatingBadgeText}>Attendance</ThemedText>
        </Animated.View>

        {/* 4. Apply Leave (Mid-Right) */}
        <Animated.View style={[styles.floatingBadge, styles.badgePosMidRight, { backgroundColor: '#F59E0B', transform: [{ translateY: floatTop }] }, Shadow.card]}>
          <Ionicons name="calendar-clear-outline" size={13} color="#FFFFFF" />
          <ThemedText type="smallBold" style={styles.floatingBadgeText}>Apply Leave</ThemedText>
        </Animated.View>

        {/* 5. Gallery (Bottom-Left) */}
        <Animated.View style={[styles.floatingBadge, styles.badgePosBottomLeft, { backgroundColor: '#EC4899', transform: [{ translateY: floatTop }] }, Shadow.card]}>
          <Ionicons name="images-outline" size={13} color="#FFFFFF" />
          <ThemedText type="smallBold" style={styles.floatingBadgeText}>Gallery</ThemedText>
        </Animated.View>

        {/* 6. Fees & Invoices (Bottom-Right) */}
        <Animated.View style={[styles.floatingBadge, styles.badgePosBottomRight, { backgroundColor: '#6366F1', transform: [{ translateY: floatBottom }] }, Shadow.card]}>
          <Ionicons name="cash-outline" size={13} color="#FFFFFF" />
          <ThemedText type="smallBold" style={styles.floatingBadgeText}>Fees & Payments</ThemedText>
        </Animated.View>
      </View>

      {/* 2-3 Animated Visual Feature Preview Cards Carousel with Images */}
      <View style={styles.previewCarouselWrap}>
        <Animated.View
          style={[
            styles.featurePreviewCard,
            { backgroundColor: theme.surface, borderColor: currentPreview.color + '40', opacity: cardFadeAnim },
            Shadow.card,
          ]}
        >
          {/* Header Row of Preview Card */}
          <View style={styles.previewCardHeader}>
            <View style={[styles.previewIconWrap, { backgroundColor: currentPreview.color + '1A' }]}>
              <Ionicons name={currentPreview.icon} size={22} color={currentPreview.color} />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText type="smallBold" style={{ color: currentPreview.color, fontSize: 10, letterSpacing: 1 }}>
                {currentPreview.badge}
              </ThemedText>
              <ThemedText type="subtitle" style={{ fontSize: 15, marginTop: 1 }}>
                {currentPreview.title}
              </ThemedText>
            </View>
            <View style={[styles.previewTagPill, { backgroundColor: currentPreview.color }]}>
              <ThemedText type="smallBold" style={{ color: '#FFFFFF', fontSize: 10 }}>
                {currentPreview.tag}
              </ThemedText>
            </View>
          </View>

          {/* Visual App UI Image Preview */}
          <View style={styles.previewImageWrap}>
            <Image
              source={currentPreview.image}
              style={styles.previewImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              priority="high"
              transition={300}
            />
          </View>
        </Animated.View>

        {/* Carousel Pagination Dots for Preview Cards */}
        <View style={styles.carouselDotsRow}>
          {PREVIEW_CARDS.map((item, idx) => (
            <Pressable key={idx} onPress={() => switchPreviewCard(idx)} hitSlop={8}>
              <View
                style={[
                  styles.carouselDot,
                  idx === activeCardIdx
                    ? [styles.carouselDotActive, { backgroundColor: item.color, width: 22 }]
                    : { backgroundColor: theme.border },
                ]}
              />
            </Pressable>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}


function RadioOption({
  icon,
  title,
  description,
  selected,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.option, { backgroundColor: theme.surface }, selected && { borderColor: theme.tint, borderWidth: 2 }]}
    >
      <View style={[styles.optionIconWrap, { backgroundColor: theme.backgroundElement }]}>
        <Ionicons name={icon} size={22} color={theme.tint} />
      </View>
      <View style={styles.optionText}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.optionDescription}>
          {description}
        </ThemedText>
      </View>
      <View style={[styles.radioCircle, { borderColor: theme.border }, selected && { borderColor: theme.tint }]}>
        {selected ? <View style={[styles.radioDot, { backgroundColor: theme.tint }]} /> : null}
      </View>
    </Pressable>
  );
}

function BelongingStep({
  value,
  onChange,
  schoolName,
  address,
}: {
  value: Belonging | null;
  onChange: (v: Belonging) => void;
  schoolName: string;
  address: string;
}) {
  return (
    <View>
      <ThemedText type="title" style={styles.stepTitle}>
        Where do you belong?
      </ThemedText>
      <ThemedText type="default" themeColor="textSecondary" style={styles.stepSubtitle}>
        Help us tailor your experience.
      </ThemedText>
      <RadioOption
        icon="school"
        title={schoolName}
        description={address ? `I'm a part of ${schoolName}, ${address}.` : `I'm a part of ${schoolName}.`}
        selected={value === 'saarthak'}
        onPress={() => onChange('saarthak')}
      />
      <RadioOption
        icon="business"
        title="Other School / Department"
        description="I'm from a different school, tuition center, or department."
        selected={value === 'other'}
        onPress={() => onChange('other')}
      />
    </View>
  );
}

function UserTypeStep({ value, onChange }: { value: UserType | null; onChange: (v: UserType) => void }) {
  return (
    <View>
      <ThemedText type="title" style={styles.stepTitle}>
        You are a...
      </ThemedText>
      <ThemedText type="default" themeColor="textSecondary" style={styles.stepSubtitle}>
        Pick the option that fits you best.
      </ThemedText>
      <RadioOption
        icon="person"
        title="Student"
        description="View results, notices & events."
        selected={value === 'student'}
        onPress={() => onChange('student')}
      />
      <RadioOption
        icon="easel"
        title="Teacher"
        description="Stay updated with school activity."
        selected={value === 'teacher'}
        onPress={() => onChange('teacher')}
      />
      <RadioOption
        icon="people"
        title="Other Profession"
        description="Parent, guardian, or any other profession."
        selected={value === 'other'}
        onPress={() => onChange('other')}
      />
    </View>
  );
}

interface DetailsStepProps {
  userType: UserType | null;
  fullName: string;
  onFullName: (v: string) => void;
  nameError: string | null;
  classOptions: { label: string; value: string }[];
  studentClass: string | null;
  onClass: (v: string) => void;
  sectionOptions: { label: string; value: string }[];
  section: string;
  onSection: (v: string) => void;
  stream: string | null;
  onStream: (v: string) => void;
  designation: string | null;
  onDesignation: (v: string) => void;
  mobile: string;
  onMobile: (v: string) => void;
  mobileError: string | null;
  needsPassword: boolean;
  password: string;
  onPassword: (v: string) => void;
  passwordError: string | null;
  srn: string;
  onSrn: (v: string) => void;
  srnError: string | null;
  gender: string | null;
  onGender: (v: string) => void;
}

const GENDER_OPTIONS = [
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
  { label: 'Other', value: 'Other' },
];

function DetailsStep({
  userType,
  fullName,
  onFullName,
  nameError,
  classOptions,
  studentClass,
  onClass,
  sectionOptions,
  section,
  onSection,
  stream,
  onStream,
  designation,
  onDesignation,
  mobile,
  onMobile,
  mobileError,
  needsPassword,
  password,
  onPassword,
  passwordError,
  srn,
  onSrn,
  srnError,
  gender,
  onGender,
}: DetailsStepProps) {
  const theme = useTheme();
  const showStream =
    userType === 'student' && studentClass !== null && STREAM_ELIGIBLE_KEYWORDS.some((k) => studentClass.includes(k));

  return (
    <View>
      <ThemedText type="title" style={styles.stepTitle}>
        A few details
      </ThemedText>
      <ThemedText type="default" themeColor="textSecondary" style={styles.stepSubtitle}>
        So we can connect you correctly.
      </ThemedText>

      <ThemedText type="smallBold" style={styles.fieldLabel}>
        Full Name
      </ThemedText>
      <TextInput
        value={fullName}
        onChangeText={onFullName}
        placeholder="Your name"
        placeholderTextColor={theme.textSecondary}
        keyboardType="default"
        autoComplete="off"
        textContentType="none"
        style={[styles.input, { borderColor: theme.border, color: theme.text }]}
      />

      {userType !== 'other' ? (
        <SelectField label="Gender" placeholder="Select gender" value={gender} options={GENDER_OPTIONS} onChange={onGender} />
      ) : null}

      {userType === 'student' ? (
        <>
          <View style={styles.row}>
            <View style={styles.rowItem}>
              <SelectField
                label="Class"
                placeholder="Select class"
                value={studentClass}
                options={classOptions}
                onChange={onClass}
              />
            </View>
            <View style={styles.rowItem}>
              <SelectField
                label="Section"
                placeholder={studentClass ? 'Select section' : 'Pick a class first'}
                value={section || null}
                options={sectionOptions}
                onChange={onSection}
              />
            </View>
          </View>

          <ThemedText type="small" themeColor="textSecondary" style={styles.fieldHint}>
            If you have a sibling already using this app, use the same mobile number below —
            you&apos;ll be able to switch between both after logging in.
          </ThemedText>

          {showStream ? (
            <SelectField
              label="Stream"
              placeholder="Select stream"
              value={stream}
              options={STREAM_OPTIONS}
              onChange={onStream}
            />
          ) : null}
        </>
      ) : null}

      {userType === 'teacher' ? (
        <SelectField
          label="Designation"
          placeholder="Select designation"
          value={designation}
          options={DESIGNATION_OPTIONS}
          onChange={onDesignation}
        />
      ) : null}

      <ThemedText type="smallBold" style={styles.fieldLabel}>
        Mobile Number
      </ThemedText>
      <View style={[styles.phoneRow, { borderColor: theme.border }]}>
        <ThemedText type="smallBold">+91</ThemedText>
        <TextInput
          value={mobile}
          onChangeText={(v) => onMobile(v.replace(/\D/g, '').slice(0, 10))}
          placeholder="Mobile number"
          placeholderTextColor={theme.textSecondary}
          keyboardType="number-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          maxLength={10}
          style={[styles.phoneInput, { color: theme.text }]}
        />
      </View>

      {needsPassword ? (
        <>
          <ThemedText type="smallBold" style={styles.fieldLabel}>
            Password
          </ThemedText>
          <PasswordInput value={password} onChangeText={onPassword} placeholder="Password" />
          <ThemedText type="small" themeColor="textSecondary" style={styles.fieldHint}>
            Verified against your school record — same login used on the Homework tab.
          </ThemedText>
        </>
      ) : null}

      <ThemedText type="small" themeColor="textSecondary" style={styles.permissionNote}>
        Next, we&apos;ll need notification &amp; location permission — both are required to use the app.
      </ThemedText>

      {nameError || mobileError || passwordError ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={16} color={Brand.red} style={styles.errorIcon} />
          <ThemedText type="default" style={{ color: Brand.red }}>
            {nameError || mobileError || passwordError}
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

function PermissionsStep({
  onGranted,
  onSkip,
  busy,
  allowSkip,
}: {
  onGranted: () => void;
  onSkip: () => void;
  busy: boolean;
  allowSkip: boolean;
}) {
  const theme = useTheme();
  const [notifStatus, setNotifStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [locationStatus, setLocationStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [requesting, setRequesting] = useState(false);

  const bothGranted = notifStatus === 'granted' && locationStatus === 'granted';
  const anyDenied = notifStatus === 'denied' || locationStatus === 'denied';

  async function requestBoth() {
    setRequesting(true);
    const notif = await Notifications.requestPermissionsAsync().catch(() => null);
    const loc = await Location.requestForegroundPermissionsAsync().catch(() => null);
    const notifOk = notif?.granted ?? false;
    const locOk = loc?.granted ?? false;
    setNotifStatus(notifOk ? 'granted' : 'denied');
    setLocationStatus(locOk ? 'granted' : 'denied');
    setRequesting(false);
    if (notifOk && locOk) onGranted();
  }

  return (
    <View>
      <View style={styles.permissionsIconWrap}>
        <Ionicons name="shield-checkmark" size={40} color={theme.tint} />
      </View>
      <ThemedText type="title" style={[styles.stepTitle, styles.centerText]}>
        Two permissions needed
      </ThemedText>
      <ThemedText type="default" themeColor="textSecondary" style={[styles.stepSubtitle, styles.centerText]}>
        {allowSkip
          ? 'Both help us reach you with school updates — you can change them later in your phone’s Settings, or skip for now.'
          : "Both are required to use the app — you can change them later in your phone's Settings."}
      </ThemedText>

      <View style={[styles.permissionRow, { backgroundColor: theme.surface }]}>
        <Ionicons name="notifications" size={22} color={theme.tint} />
        <View style={styles.permissionRowText}>
          <ThemedText type="smallBold">Notifications</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Results, homework and school announcements
          </ThemedText>
        </View>
        {notifStatus === 'granted' ? <Ionicons name="checkmark-circle" size={22} color="#2E7D32" /> : null}
      </View>

      <View style={[styles.permissionRow, { backgroundColor: theme.surface }]}>
        <Ionicons name="location" size={22} color={theme.tint} />
        <View style={styles.permissionRowText}>
          <ThemedText type="smallBold">Location</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Helps confirm you&apos;re reachable for school updates
          </ThemedText>
        </View>
        {locationStatus === 'granted' ? <Ionicons name="checkmark-circle" size={22} color="#2E7D32" /> : null}
      </View>

      {anyDenied && !bothGranted ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={16} color={Brand.red} style={styles.errorIcon} />
          <ThemedText type="default" style={{ color: Brand.red, flex: 1 }}>
            {allowSkip
              ? 'If you denied one permanently, open Settings to enable it, or skip below to continue without it.'
              : 'Both permissions are required. If you denied one permanently, open Settings to enable it, then come back and try again.'}
          </ThemedText>
        </View>
      ) : null}

      <Button
        label={requesting || busy ? 'Please wait…' : 'Allow & Continue'}
        variant="primary"
        onPress={requestBoth}
        disabled={requesting || busy}
        loading={requesting || busy}
      />

      {anyDenied ? (
        <Pressable onPress={() => Linking.openSettings()} hitSlop={8} style={styles.settingsLink}>
          <ThemedText type="default" themeColor="tint">
            Open Settings
          </ThemedText>
        </Pressable>
      ) : null}

      {allowSkip ? (
        <Pressable onPress={onSkip} disabled={busy} hitSlop={8} style={styles.settingsLink}>
          <ThemedText type="default" themeColor="textSecondary">
            Skip for now
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  back: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.two,
    marginTop: Spacing.one,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: -36,
    marginBottom: Spacing.four,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D5DBE3',
  },
  dotDone: {
    backgroundColor: Brand.blue,
  },
  dotActive: {
    width: 24,
    backgroundColor: Brand.blue,
  },
  flex: {
    flex: 1,
  },
  body: {
    flex: 1,
    paddingHorizontal: Spacing.four,
  },
  bodyScroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
  },
  footer: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  skipLink: {
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  settingsLink: {
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  permissionsIconWrap: {
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    marginBottom: Spacing.three,
    ...Shadow.card,
  },
  permissionRowText: {
    flex: 1,
    gap: 2,
  },
  welcomeWrap: {
    alignItems: 'center',
    paddingTop: Spacing.four,
  },
  introWrap: {
    alignItems: 'center',
    paddingTop: Spacing.two,
  },
  topTitleHeader: {
    alignItems: 'center',
    marginBottom: Spacing.three,
    paddingHorizontal: Spacing.two,
  },
  topMainTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  topMainSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: Spacing.two,
  },
  introHeroBoxExpanded: {
    width: '100%',
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: Spacing.three,
  },
  introOuterOrbit: {
    width: 195,
    height: 195,
    borderRadius: 97.5,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    position: 'absolute',
  },
  introMiddleOrbit: {
    width: 145,
    height: 145,
    borderRadius: 72.5,
    borderWidth: 1,
    position: 'absolute',
  },
  introLogoRingExpanded: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  introLogoImg: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  floatingBadge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  floatingBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  badgePosTopLeft: {
    top: 2,
    left: 0,
  },
  badgePosTopRight: {
    top: 2,
    right: 0,
  },
  badgePosMidLeft: {
    top: 80,
    left: -8,
  },
  badgePosMidRight: {
    top: 80,
    right: -8,
  },
  badgePosBottomLeft: {
    bottom: 2,
    left: 4,
  },
  badgePosBottomRight: {
    bottom: 2,
    right: 4,
  },
  introSubtitleCompact: {
    marginTop: Spacing.one,
    marginBottom: Spacing.two,
    lineHeight: 19,
    fontSize: 13,
  },
  previewCarouselWrap: {
    width: '100%',
    marginTop: Spacing.one,
    gap: Spacing.two,
  },
  featurePreviewCard: {
    width: '100%',
    padding: Spacing.three,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
  },
  previewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
    marginBottom: Spacing.two,
  },
  previewIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTagPill: {
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  previewDescText: {
    fontSize: 13,
    lineHeight: 19,
  },
  previewImageWrap: {
    width: '100%',
    height: 150,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginTop: Spacing.one,
    backgroundColor: '#F1F5F9',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.lg,
  },
  carouselDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 2,
  },
  carouselDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  carouselDotActive: {
    height: 7,
    borderRadius: 3.5,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: Spacing.four,
  },
  centerText: {
    textAlign: 'center',
  },
  welcomeSubtitle: {
    marginTop: Spacing.two,
    marginBottom: Spacing.five,
  },
  featureRow: {
    flexDirection: 'row',
    gap: Spacing.five,
  },
  featureItem: {
    alignItems: 'center',
    width: 88,
  },
  featureIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  stepTitle: {
    marginBottom: Spacing.one,
  },
  stepSubtitle: {
    marginBottom: Spacing.four,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
    padding: Spacing.three,
    marginBottom: Spacing.three,
    ...Shadow.card,
  },
  optionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
  },
  optionText: {
    flex: 1,
  },
  optionDescription: {
    marginTop: 2,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  fieldLabel: {
    marginBottom: Spacing.one,
    marginTop: Spacing.three,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two + 2,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  rowItem: {
    flex: 1,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
  },
  phoneInput: {
    flex: 1,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  fieldHint: {
    marginTop: Spacing.one,
  },
  permissionNote: {
    marginTop: Spacing.three,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  errorIcon: {
    marginRight: Spacing.one,
  },
});
