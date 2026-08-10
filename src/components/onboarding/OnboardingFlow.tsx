import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, TextInput, View } from 'react-native';
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

type Belonging = 'saarthak' | 'other';
type UserType = 'student' | 'teacher' | 'other';

// Welcome, Belonging, User type, Details, mandatory Permissions gate.
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
        // One phone can be the login for several sibling children — save
        // every one returned, the app defaults to the first.
        const results = await studentLogin(trimmedMobile, password);
        const children: HomeworkAccess[] = results.map((result) => ({
          name: result.name,
          srn: result.srn,
          className: result.class,
          section: result.section,
          phone: result.phone,
          gender: result.gender,
          dob: result.dob,
          photoUrl: result.photo_url,
        }));
        await saveHomeworkChildren(children);
        await refreshStudentAuth();
      } catch (loginError) {
        // No account exists yet for this phone — this is a first-time
        // student, so register them as pending instead. If an account DOES
        // already exist under this exact SRN (just a wrong password),
        // register_student() detects the collision server-side and returns
        // a clear error instead of silently creating a duplicate.
        try {
          await studentRegister({
            name: trimmedName,
            className: studentClass ?? '',
            section: section.trim() || undefined,
            phone: trimmedMobile,
            password,
            srn: srn.trim(),
            gender: gender ?? undefined,
          });
          // Also remembered locally so the Home screen can keep reminding
          // them even after this one-time alert is dismissed and the app
          // is closed/reopened while still awaiting activation.
          await savePendingRegistration({ name: trimmedName, className: studentClass ?? '' });
          setTimeout(() => {
            Alert.alert(
              'Registered!',
              "Your class teacher needs to verify your account before you can view homework. You'll be able to log in once that's done."
            );
          }, 400);
        } catch (registerError) {
          setFinishing(false);
          const message = registerError instanceof Error ? registerError.message : 'Could not register. Please try again.';
          // The backend's duplicate-registration error is about the SRN, not
          // the password — showing it under Password (as before) misled
          // students into thinking their password was wrong.
          if (/srn/i.test(message)) {
            setSrnError(message);
            setPasswordError(null);
          } else {
            setPasswordError(message);
            setSrnError(null);
          }
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
    // If notification permission was granted in the step above, pick up the
    // token now. If not, this simply returns null and the user can enable it
    // later from system settings.
    const pushToken = await getFcmPushToken();
    if (pushToken) {
      registerDevice({ pushToken, latitude: location?.latitude ?? null, longitude: location?.longitude ?? null }).catch(() => {});
      if (needsPassword) registerStudentPushToken(trimmedMobile, pushToken).catch(() => {});
    }
    onDone();
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
        {step === 0 ? <WelcomeStep schoolName={schoolName} /> : null}
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

function WelcomeStep({ schoolName }: { schoolName: string }) {
  return (
    <View style={styles.welcomeWrap}>
      <Image source={logoSource} style={styles.logo} contentFit="cover" />
      <ThemedText type="title" style={styles.centerText}>
        Welcome to {schoolName}
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
