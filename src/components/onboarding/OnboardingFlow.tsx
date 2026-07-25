import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { registerDevice } from '@/data/app-status';
import { Brand, Radius, Shadow, Spacing } from '@/constants/theme';
import { markOnboardingComplete } from '@/lib/onboarding';
import { requestOnboardingPermissions } from '@/lib/permissions';
import { getFcmPushToken } from '@/lib/notifications';
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui/Button';
import { SelectField } from '@/components/ui/SelectField';
import { ThemedText } from '@/components/ui/ThemedText';

const logoSource = require('../../../assets/images/icon.png');

type Belonging = 'saarthak' | 'other';
type UserType = 'student' | 'teacher' | 'other';

const TOTAL_STEPS = 4;

const CLASS_OPTIONS = Array.from({ length: 12 }, (_, i) => {
  const n = String(i + 1);
  return { label: `Class ${n}`, value: n };
});

const STREAM_OPTIONS = [
  { label: 'Arts', value: 'Arts' },
  { label: 'Non-Medical', value: 'Non-Medical' },
  { label: 'Medical', value: 'Medical' },
];

const DESIGNATION_OPTIONS = [
  { label: 'PRT (Primary Teacher)', value: 'PRT' },
  { label: 'TGT (Trained Graduate Teacher)', value: 'TGT' },
  { label: 'PGT (Post Graduate Teacher)', value: 'PGT' },
];

const STREAM_ELIGIBLE_CLASSES = ['11', '12'];

interface OnboardingFlowProps {
  onDone: () => void;
}

export function OnboardingFlow({ onDone }: OnboardingFlowProps) {
  const theme = useTheme();
  const [step, setStep] = useState(0);
  const [belonging, setBelonging] = useState<Belonging | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [fullName, setFullName] = useState('');
  const [studentClass, setStudentClass] = useState<string | null>(null);
  const [section, setSection] = useState('');
  const [stream, setStream] = useState<string | null>(null);
  const [designation, setDesignation] = useState<string | null>(null);
  const [mobile, setMobile] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [mobileError, setMobileError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);

  async function finish() {
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
    if (hasError) return;

    setFinishing(true);
    await markOnboardingComplete();
    await registerDevice({
      userType: userType ?? undefined,
      role: userType === 'teacher' ? designation ?? undefined : userType ?? undefined,
      fullName: trimmedName,
      studentClass: userType === 'student' ? studentClass ?? undefined : undefined,
      section: userType === 'student' ? section.trim() || undefined : undefined,
      stream: userType === 'student' ? stream ?? undefined : undefined,
      designation: userType === 'teacher' ? designation ?? undefined : undefined,
      phone: `+91${trimmedMobile}`,
    }).catch(() => {});
    onDone();
    await requestOnboardingPermissions();
    // Permission was just granted (or denied) above — try once more to pick
    // up a push token now that we know. No-ops silently if denied.
    const pushToken = await getFcmPushToken();
    if (pushToken) registerDevice({ pushToken }).catch(() => {});
  }

  async function skip() {
    await markOnboardingComplete();
    onDone();
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      {step > 0 ? (
        <Pressable onPress={() => setStep((s) => s - 1)} hitSlop={10} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </Pressable>
      ) : (
        <View style={styles.back} />
      )}
      <StepDots total={TOTAL_STEPS} current={step} />

      <View style={styles.body}>
        {step === 0 ? <WelcomeStep /> : null}
        {step === 1 ? <BelongingStep value={belonging} onChange={setBelonging} /> : null}
        {step === 2 ? <UserTypeStep value={userType} onChange={setUserType} /> : null}
        {step === 3 ? (
          <DetailsStep
            userType={userType}
            fullName={fullName}
            onFullName={setFullName}
            nameError={nameError}
            studentClass={studentClass}
            onClass={setStudentClass}
            section={section}
            onSection={setSection}
            stream={stream}
            onStream={setStream}
            designation={designation}
            onDesignation={setDesignation}
            mobile={mobile}
            onMobile={setMobile}
            mobileError={mobileError}
          />
        ) : null}
      </View>

      <View style={styles.footer}>
        {step === 0 ? (
          <>
            <Button label="Get Started" variant="primary" onPress={() => setStep(1)} />
            <Pressable onPress={skip} hitSlop={8} style={styles.skipLink}>
              <ThemedText type="default" themeColor="textSecondary">
                Skip for now
              </ThemedText>
            </Pressable>
          </>
        ) : step === 1 ? (
          <Button label="Continue" variant="primary" onPress={() => setStep(2)} disabled={!belonging} />
        ) : step === 2 ? (
          <Button label="Continue" variant="primary" onPress={() => setStep(3)} disabled={!userType} />
        ) : (
          <Button label="Finish" variant="primary" onPress={finish} loading={finishing} />
        )}
      </View>
    </SafeAreaView>
  );
}

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === current && styles.dotActive,
            i < current && styles.dotDone,
          ]}
        />
      ))}
    </View>
  );
}

function WelcomeStep() {
  return (
    <View style={styles.welcomeWrap}>
      <Image source={logoSource} style={styles.logo} contentFit="cover" />
      <ThemedText type="title" style={styles.centerText}>
        Welcome to Saarthak GIMSSS
      </ThemedText>
      <ThemedText type="default" themeColor="textSecondary" style={[styles.centerText, styles.welcomeSubtitle]}>
        Let&apos;s personalise your app in a few quick steps so you get the right updates and results.
      </ThemedText>
      <View style={styles.featureRow}>
        <FeatureIcon icon="notifications" label="Instant alerts" />
        <FeatureIcon icon="document-text" label="Results" />
        <FeatureIcon icon="images" label="Gallery" />
      </View>
    </View>
  );
}

function FeatureIcon({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  const theme = useTheme();
  return (
    <View style={styles.featureItem}>
      <View style={[styles.featureIconWrap, { backgroundColor: theme.backgroundElement }]}>
        <Ionicons name={icon} size={22} color={theme.tint} />
      </View>
      <ThemedText type="small" style={styles.centerText}>
        {label}
      </ThemedText>
    </View>
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

function BelongingStep({ value, onChange }: { value: Belonging | null; onChange: (v: Belonging) => void }) {
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
        title="Saarthak GIMSSS"
        description="I'm a part of Saarthak GIMSSS, Panchkula."
        selected={value === 'saarthak'}
        onPress={() => onChange('saarthak')}
      />
      <RadioOption
        icon="business"
        title="Other School"
        description="I'm from a different school or institution."
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
  studentClass: string | null;
  onClass: (v: string) => void;
  section: string;
  onSection: (v: string) => void;
  stream: string | null;
  onStream: (v: string) => void;
  designation: string | null;
  onDesignation: (v: string) => void;
  mobile: string;
  onMobile: (v: string) => void;
  mobileError: string | null;
}

function DetailsStep({
  userType,
  fullName,
  onFullName,
  nameError,
  studentClass,
  onClass,
  section,
  onSection,
  stream,
  onStream,
  designation,
  onDesignation,
  mobile,
  onMobile,
  mobileError,
}: DetailsStepProps) {
  const theme = useTheme();
  const showStream = userType === 'student' && studentClass !== null && STREAM_ELIGIBLE_CLASSES.includes(studentClass);

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
        style={[styles.input, { borderColor: theme.border, color: theme.text }]}
      />

      {userType === 'student' ? (
        <>
          <View style={styles.row}>
            <View style={styles.rowItem}>
              <SelectField
                label="Class"
                placeholder="Select class"
                value={studentClass}
                options={CLASS_OPTIONS}
                onChange={onClass}
              />
            </View>
            <View style={styles.rowItem}>
              <ThemedText type="smallBold" style={styles.fieldLabel}>
                Section
              </ThemedText>
              <TextInput
                value={section}
                onChangeText={onSection}
                placeholder="e.g. A"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { borderColor: theme.border, color: theme.text }]}
              />
            </View>
          </View>
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
          placeholder="10-digit mobile number"
          placeholderTextColor={theme.textSecondary}
          keyboardType="number-pad"
          maxLength={10}
          style={[styles.phoneInput, { color: theme.text }]}
        />
      </View>

      <ThemedText type="small" themeColor="textSecondary" style={styles.permissionNote}>
        On finishing, we&apos;ll ask for notification &amp; location permission to keep you updated. You&apos;re
        always in control.
      </ThemedText>

      {nameError || mobileError ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={16} color={Brand.red} style={styles.errorIcon} />
          <ThemedText type="default" style={{ color: Brand.red }}>
            {nameError || mobileError}
          </ThemedText>
        </View>
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
  body: {
    flex: 1,
    paddingHorizontal: Spacing.four,
  },
  footer: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  skipLink: {
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  welcomeWrap: {
    alignItems: 'center',
    paddingTop: Spacing.four,
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
    paddingVertical: Spacing.two,
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
