import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Linking,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Loading } from '@/components/ui/states';
import { ThemedText } from '@/components/ui/ThemedText';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { fetchSettings } from '@/data/api';
import { fetchAppStatus } from '@/data/app-status';
import { useFetch } from '@/hooks/use-fetch';
import { useTheme } from '@/hooks/use-theme';

interface AppFeatureItem {
  id: string;
  name: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
  role: 'Student' | 'Teacher' | 'Both';
}

const REAL_APP_FEATURES: AppFeatureItem[] = [
  {
    id: 'push_notifications',
    name: 'Push Notifications & Real-Time Alerts',
    desc: 'Instant alerts for urgent school notices, circulars & announcements',
    icon: 'notifications-outline',
    role: 'Both',
  },
  {
    id: 'homework_notes',
    name: 'Daily Homework & Study Notes',
    desc: 'Access subject assignments, class notes & downloadable PDF resources',
    icon: 'book-outline',
    role: 'Both',
  },
  {
    id: 'homework_submission',
    name: 'Digital Homework Submission',
    desc: 'Students can upload photos or PDF files of completed homework easily',
    icon: 'cloud-upload-outline',
    role: 'Student',
  },
  {
    id: 'sibling_login',
    name: 'Multi-Sibling Single Login',
    desc: 'Parents with multiple children can switch student profiles seamlessly with 1 login',
    icon: 'people-circle-outline',
    role: 'Student',
  },
  {
    id: 'storage_backup',
    name: 'Cloud Storage & Automated Backups',
    desc: 'Secure cloud data management with daily automatic backups for school records',
    icon: 'cloud-done-outline',
    role: 'Both',
  },
  {
    id: 'attendance_leave',
    name: 'Daily Attendance & Leave Portal',
    desc: 'Track live attendance status & submit online leave applications',
    icon: 'calendar-outline',
    role: 'Student',
  },
  {
    id: 'teacher_roster',
    name: 'Teacher Roster & Attendance Manager',
    desc: 'Teachers mark class attendance, manage student promotion & rosters',
    icon: 'people-outline',
    role: 'Teacher',
  },
  {
    id: 'fee_records',
    name: 'Fee Records & Digital Receipts',
    desc: 'View fee payment history, pending installments & download instant receipts',
    icon: 'card-outline',
    role: 'Student',
  },
  {
    id: 'photo_gallery',
    name: 'Event Photo & Video Gallery',
    desc: 'Explore school celebration albums, sports day photos & video spotlights',
    icon: 'images-outline',
    role: 'Both',
  },
  {
    id: 'classmates_directory',
    name: 'Classmates & Friends Directory',
    desc: 'Browse section classmates roster & student contact profiles',
    icon: 'person-add-outline',
    role: 'Student',
  },
  {
    id: 'syllabus_curriculum',
    name: 'Syllabus & Course Curriculum',
    desc: 'View complete subject syllabus, chapter outlines & academic guidelines',
    icon: 'journal-outline',
    role: 'Both',
  },
];

export default function PaymentScreen() {
  const theme = useTheme();
  const { data: appStatus, loading: loadingStatus } = useFetch(fetchAppStatus);
  const { data: settings } = useFetch(fetchSettings);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Screen Flashes & Ambient Glow animations
  const flashAnim1 = useRef(new Animated.Value(0.3)).current;
  const flashAnim2 = useRef(new Animated.Value(0.15)).current;
  const scalePulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Continuous screen flash / glowing light pulses
    Animated.loop(
      Animated.sequence([
        Animated.timing(flashAnim1, {
          toValue: 0.85,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(flashAnim1, {
          toValue: 0.25,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(flashAnim2, {
          toValue: 0.7,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(flashAnim2, {
          toValue: 0.15,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(scalePulse, {
          toValue: 1.15,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scalePulse, {
          toValue: 0.95,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Entrance Animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start();
  }, [flashAnim1, flashAnim2, scalePulse, fadeAnim, slideAnim]);

  if (loadingStatus) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading activation details…" />
      </Screen>
    );
  }

  const schoolName = settings?.school_name || appStatus?.appTitle || 'School App';
  const devName = appStatus?.devName || 'Support & Activation Team';
  const phone = appStatus?.phone || '9876543210';
  const email = appStatus?.email || 'support@schoolapp.com';
  const whatsapp = appStatus?.whatsapp || phone;

  function handleCall() {
    if (phone) Linking.openURL(`tel:${phone.replace(/[^0-9+]/g, '')}`);
  }

  function handleWhatsapp() {
    if (whatsapp) {
      const num = whatsapp.replace(/[^0-9]/g, '');
      const msg = encodeURIComponent(
        `Hello, I want to activate/upgrade the app for ${schoolName}. Please share details on custom section configuration & quotation.`
      );
      Linking.openURL(`https://wa.me/${num}?text=${msg}`);
    }
  }

  function handleEmail() {
    if (email) {
      const subject = encodeURIComponent(`App Activation & Quotation Request - ${schoolName}`);
      const body = encodeURIComponent(
        `Hello ${devName},\n\n` +
          `We wish to inquire about app activation and custom section configuration for ${schoolName}.\n\n` +
          `Please contact us for custom setup and quotation details.`
      );
      Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`);
    }
  }

  return (
    <Screen>
      {/* Animated Background Glowing Screen Flashes */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Animated.View
          style={[
            styles.flashOrbTop,
            {
              backgroundColor: theme.dark ? 'rgba(59, 130, 246, 0.28)' : 'rgba(37, 99, 235, 0.14)',
              opacity: flashAnim1,
              transform: [{ scale: scalePulse }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.flashOrbBottom,
            {
              backgroundColor: theme.dark ? 'rgba(139, 92, 246, 0.28)' : 'rgba(124, 58, 237, 0.14)',
              opacity: flashAnim2,
              transform: [{ scale: scalePulse }],
            },
          ]}
        />
      </View>

      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        {/* Compact Hero Banner */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: theme.dark ? '#1E293B' : '#2563EB',
              borderColor: theme.dark ? '#3B82F6' : '#1D4ED8',
            },
          ]}
        >
          <Animated.View
            style={[
              styles.heroFlashAura,
              {
                opacity: flashAnim1,
                transform: [{ scale: scalePulse }],
              },
            ]}
          />

          <View style={styles.badgeRow}>
            <Animated.View style={[styles.glowingDot, { opacity: flashAnim1 }]} />
            <ThemedText type="smallBold" style={styles.badgeText}>
              PREMIUM APP ACTIVATION
            </ThemedText>
          </View>
          <ThemedText type="title" style={styles.heroTitle}>
            Unlock Full Access for {schoolName}
          </ThemedText>
          <ThemedText type="default" style={styles.heroSubtitle}>
            Explore all powerful portal features built inside your institutional app.
          </ThemedText>
        </View>

        {/* Custom Section Quotation Offer Card */}
        <Card style={[styles.customQuoteNoticeCard, { borderColor: theme.dark ? '#3B82F6' : '#2563EB' }]}>
          <View style={styles.noticeHeaderRow}>
            <Ionicons name="sparkles-sharp" size={20} color={theme.dark ? '#60A5FA' : '#2563EB'} />
            <ThemedText type="smallBold" style={{ color: theme.dark ? '#60A5FA' : '#2563EB', fontSize: 14, flex: 1 }}>
              Lower Cost Custom Offer
            </ThemedText>
          </View>
          <ThemedText type="subtitle" style={styles.noticeBodyText}>
            Choose any section as per your requirement & get lower cost offers!
          </ThemedText>
        </Card>

        {/* Features Header */}
        <View style={styles.sectionHeaderRow}>
          <Animated.View style={{ opacity: flashAnim1 }}>
            <Ionicons name="apps" size={18} color={theme.dark ? '#F59E0B' : '#D97706'} />
          </Animated.View>
          <ThemedText type="subtitle">App Features & Modules</ThemedText>
        </View>

        {/* Clean 2-Column Feature Grid (Without Student/Teacher Badges & Fully Un-truncated Text) */}
        <View style={styles.compactFeatureGrid}>
          {REAL_APP_FEATURES.map((feat) => (
            <View
              key={feat.id}
              style={[
                styles.compactFeatureCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.compactTopRow}>
                <View
                  style={[
                    styles.compactIconCircle,
                    {
                      backgroundColor: theme.dark
                        ? 'rgba(96, 165, 250, 0.18)'
                        : '#EFF6FF',
                    },
                  ]}
                >
                  <Ionicons
                    name={feat.icon}
                    size={18}
                    color={theme.dark ? '#60A5FA' : '#2563EB'}
                  />
                </View>
              </View>

              <ThemedText type="smallBold" style={styles.compactTitle}>
                {feat.name}
              </ThemedText>

              <ThemedText
                type="small"
                themeColor="textSecondary"
                style={styles.compactDesc}
              >
                {feat.desc}
              </ThemedText>
            </View>
          ))}
        </View>

        {/* Direct Contact Actions */}
        <Card style={[styles.contactCard, { borderColor: theme.border }]}>
          <ThemedText type="subtitle" style={styles.sectionHeaderTitle}>
            Contact Activation & Support Team
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: Spacing.three }}>
            Reach out directly for institutional setup, custom section configuration, and lower cost offers:
          </ThemedText>

          <View style={styles.contactDetailsBox}>
            <View style={styles.contactItemRow}>
              <Ionicons name="person-outline" size={18} color={theme.textSecondary} />
              <ThemedText type="small" themeColor="textSecondary" style={{ flex: 1 }}>
                Contact Person:
              </ThemedText>
              <ThemedText type="smallBold">{devName}</ThemedText>
            </View>

            <View style={styles.contactItemRow}>
              <Ionicons name="call-outline" size={18} color={theme.textSecondary} />
              <ThemedText type="small" themeColor="textSecondary" style={{ flex: 1 }}>
                Phone / Mobile:
              </ThemedText>
              <ThemedText type="smallBold">{phone}</ThemedText>
            </View>

            <View style={styles.contactItemRow}>
              <Ionicons name="mail-outline" size={18} color={theme.textSecondary} />
              <ThemedText type="small" themeColor="textSecondary" style={{ flex: 1 }}>
                Email Support:
              </ThemedText>
              <ThemedText type="smallBold">{email}</ThemedText>
            </View>
          </View>

          {/* Action Buttons Grid */}
          <View style={styles.actionGrid}>
            <Pressable
              onPress={handleCall}
              style={({ pressed }) => [
                styles.contactButton,
                { backgroundColor: theme.dark ? '#2563EB' : '#1D4ED8' },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Ionicons name="call" size={18} color="#FFFFFF" />
              <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                Call Support
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={handleWhatsapp}
              style={({ pressed }) => [
                styles.contactButton,
                { backgroundColor: '#16A34A' },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
              <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                WhatsApp
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={handleEmail}
              style={({ pressed }) => [
                styles.contactButton,
                styles.outlineBtn,
                { borderColor: theme.dark ? '#60A5FA' : '#2563EB' },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Ionicons name="mail" size={18} color={theme.dark ? '#60A5FA' : '#2563EB'} />
              <ThemedText type="smallBold" style={{ color: theme.dark ? '#60A5FA' : '#2563EB' }}>
                Email Us
              </ThemedText>
            </Pressable>
          </View>
        </Card>

        {/* Back to App Action */}
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="arrow-back" size={18} color={theme.textSecondary} />
          <ThemedText type="smallBold" themeColor="textSecondary">
            Back to App
          </ThemedText>
        </Pressable>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flashOrbTop: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  flashOrbBottom: {
    position: 'absolute',
    bottom: 80,
    left: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  heroCard: {
    borderRadius: Radius.xl,
    padding: Spacing.three,
    marginBottom: Spacing.two,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  heroFlashAura: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    marginBottom: Spacing.one,
  },
  glowingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34D399',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    marginBottom: 2,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    lineHeight: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.two,
    paddingHorizontal: 2,
  },
  compactFeatureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  compactFeatureCard: {
    width: '48.5%',
    borderRadius: Radius.md,
    padding: Spacing.two,
    borderWidth: 1,
    ...Shadow.card,
  },
  compactTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  compactIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactTitle: {
    fontSize: 12,
    marginTop: 2,
  },
  compactDesc: {
    fontSize: 10,
    marginTop: 1,
  },
  roleBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: Radius.pill,
  },
  customQuoteNoticeCard: {
    padding: Spacing.three,
    marginBottom: Spacing.three,
    borderWidth: 1.5,
  },
  noticeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noticeBodyText: {
    marginTop: 4,
    lineHeight: 18,
    fontSize: 12,
  },
  contactCard: {
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  sectionHeaderTitle: {
    marginBottom: 4,
  },
  contactDetailsBox: {
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  contactItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  contactButton: {
    flex: 1,
    minWidth: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
  outlineBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    marginBottom: Spacing.three,
  },
});





