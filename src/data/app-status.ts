import { Platform } from 'react-native';

import { BASE_URL } from './api';
import { getAppVersion, getDeviceId } from '@/lib/device';
import type { LayoutItem, LayoutTarget } from '@/lib/layout';

export type SectionKey =
  | 'events'
  | 'gallery'
  | 'notices'
  | 'result'
  | 'teachers'
  | 'top_students'
  | 'disclosure'
  | 'homework'
  | 'homework_submission'
  | 'attendance'
  | 'leave'
  | 'fees'
  | 'teacher_subjects'
  | 'teacher_promote'
  | 'syllabus'
  | 'teacher_export'
  | 'teacher_storage'
  | 'classmates';

/** Admin-controlled section visibility. Defaults to all-true so nothing
 * flickers hidden while the first app_status check is still in flight. */
export type EnabledSections = Record<SectionKey, boolean>;

export const ALL_SECTIONS_ENABLED: EnabledSections = {
  events: true,
  gallery: true,
  notices: true,
  result: true,
  teachers: true,
  top_students: true,
  disclosure: true,
  homework: true,
  homework_submission: true,
  attendance: true,
  leave: true,
  fees: true,
  teacher_subjects: true,
  teacher_promote: true,
  syllabus: true,
  teacher_export: true,
  teacher_storage: true,
  classmates: true,
};

export interface AppStatus {
  enabled: boolean;
  reason: 'device_blocked' | 'app_disabled' | 'not_allowed' | null;
  title: string | null;
  message: string | null;
  devName: string | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  enabledSections: EnabledSections;
  minVersion: string | null;
  storeUrl: string | null;
  appLogoUrl: string | null;
  appTitle?: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  splashColor?: string | null;
  headerColor?: string | null;
  homeTiles: LayoutItem[];
  bottomTabs: LayoutItem[];
  achieversDisplay: 'marks' | 'grade';
  instituteMode?: boolean;
  trial: TrialStatus;
}

export interface TrialStatus {
  startDate: string;
  totalDays: number;
  remainingDays: number;
  ended: boolean;
  features: string[];
}

const FAIL_OPEN_TRIAL: TrialStatus = {
  startDate: '',
  totalDays: 7,
  remainingDays: 7,
  ended: false,
  features: [],
};

/** Matches what the backend seeds app_layout_items with — used as a
 * fail-open fallback if the API doesn't return layout arrays (older
 * backend) or returns them empty. */
export const DEFAULT_HOME_TILES: LayoutItem[] = [
  { label: 'Result', icon: 'document-text', colorBg: '#FDECD8', colorFg: '#E8871E', target: 'result', targetUrl: null },
  { label: 'Notices', icon: 'megaphone', colorBg: '#DCE8F7', colorFg: '#2E6FBE', target: 'notices', targetUrl: null },
  { label: 'Syllabus', icon: 'book', colorBg: '#F3E8FF', colorFg: '#9333EA', target: 'syllabus', targetUrl: null },
  { label: 'Subjects', icon: 'journal', colorBg: '#E0F2FE', colorFg: '#0284C7', target: 'teacher_subjects', targetUrl: null },
  { label: 'Promotion', icon: 'arrow-up-circle', colorBg: '#DCFCE7', colorFg: '#16A34A', target: 'teacher_promote', targetUrl: null },
  { label: 'Disclosure', icon: 'shield-checkmark', colorBg: '#DFF1E1', colorFg: '#2E7D32', target: 'disclosure', targetUrl: null },
  { label: 'Contact', icon: 'call', colorBg: '#FBE2E2', colorFg: '#C62828', target: 'contact', targetUrl: null },
];

export const DEFAULT_BOTTOM_TABS: LayoutItem[] = [
  { label: 'Home', icon: 'home', colorBg: null, colorFg: null, target: 'home', targetUrl: null },
  { label: 'Events', icon: 'calendar', colorBg: null, colorFg: null, target: 'events', targetUrl: null },
  { label: 'Login', icon: 'log-in', colorBg: null, colorFg: null, target: 'login', targetUrl: null },
  { label: 'Gallery', icon: 'images', colorBg: null, colorFg: null, target: 'gallery', targetUrl: null },
  { label: 'More', icon: 'menu', colorBg: null, colorFg: null, target: 'more', targetUrl: null },
];

function parseLayoutItems(
  raw: Array<{ label: string; icon: string; color_bg: string | null; color_fg: string | null; target: string; target_url: string | null }> | undefined,
  fallback: LayoutItem[]
): LayoutItem[] {
  if (!raw || raw.length === 0) return fallback;
  return raw.map((r) => ({
    label: r.label,
    icon: r.icon,
    colorBg: r.color_bg,
    colorFg: r.color_fg,
    target: r.target as LayoutTarget,
    targetUrl: r.target_url,
  }));
}

interface ApiEnvelope<T> {
  status: boolean;
  message: string;
  data: T;
}

/**
 * Checked once on every app launch. The backend evaluates two independent
 * gates — this specific device may be blocked by an admin, or the app may
 * be globally disabled — and returns whichever applies.
 */
export async function fetchAppStatus(): Promise<AppStatus> {
  const deviceId = await getDeviceId();
  const url = `${BASE_URL}/app_status?device_id=${encodeURIComponent(deviceId)}`;

  // A hung DNS/network request (not just a fast failure) used to leave the
  // app stuck on LaunchScreen indefinitely, since fetch() has no default
  // timeout. Bail out after 10s so checkStatus()'s catch can fail open.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  let response: Response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) {
    throw new Error(`app_status request failed with status ${response.status}`);
  }
  const json = (await response.json()) as ApiEnvelope<{
    enabled: boolean;
    reason: 'device_blocked' | 'app_disabled' | 'not_allowed' | null;
    title: string | null;
    message: string | null;
    dev_name: string | null;
    phone: string | null;
    email: string | null;
    whatsapp: string | null;
    enabled_sections?: Partial<Record<SectionKey, boolean>>;
    min_version?: string | null;
    store_url?: string | null;
    app_logo_url?: string | null;
    primary_color?: string | null;
    accent_color?: string | null;
    splash_color?: string | null;
    header_color?: string | null;
    home_tiles?: Array<{ label: string; icon: string; color_bg: string | null; color_fg: string | null; target: string; target_url: string | null }>;
    bottom_tabs?: Array<{ label: string; icon: string; color_bg: string | null; color_fg: string | null; target: string; target_url: string | null }>;
    achievers_display?: 'marks' | 'grade';
    trial?: {
      start_date: string;
      total_days: number;
      remaining_days: number;
      ended: boolean;
      features: string[];
    };
  }>;

  if (!json.status || !json.data) {
    throw new Error(json.message || 'app_status returned an error');
  }

  const resStatus: AppStatus = {
    enabled: json.data.enabled,
    reason: json.data.reason,
    title: json.data.title,
    message: json.data.message,
    devName: json.data.dev_name,
    phone: json.data.phone,
    email: json.data.email,
    whatsapp: json.data.whatsapp,
    enabledSections: { ...ALL_SECTIONS_ENABLED, ...json.data.enabled_sections },
    minVersion: json.data.min_version ?? null,
    storeUrl: json.data.store_url ?? null,
    appLogoUrl: json.data.app_logo_url ?? null,
    appTitle: (json.data as any).app_title ?? null,
    primaryColor: json.data.primary_color ?? null,
    accentColor: json.data.accent_color ?? null,
    splashColor: json.data.splash_color ?? null,
    headerColor: json.data.header_color ?? null,
    homeTiles: parseLayoutItems(json.data.home_tiles, DEFAULT_HOME_TILES),
    bottomTabs: parseLayoutItems(json.data.bottom_tabs, DEFAULT_BOTTOM_TABS),
    achieversDisplay: json.data.achievers_display === 'grade' ? 'grade' : 'marks',
    instituteMode: (json.data as any).institute_mode === true || (json.data as any).institute_mode === 1,
    trial: json.data.trial
      ? {
          startDate: json.data.trial.start_date,
          totalDays: json.data.trial.total_days,
          remainingDays: json.data.trial.remaining_days,
          ended: json.data.trial.ended,
          features: json.data.trial.features ?? [],
        }
      : FAIL_OPEN_TRIAL,
  };

  cachedAppStatus = resStatus;
  return resStatus;
}

let cachedAppStatus: AppStatus | null = null;

export function getCachedAppStatus(): AppStatus | null {
  return cachedAppStatus;
}

export interface DeviceProfile {
  userType?: string;
  role?: string;
  fullName?: string;
  studentClass?: string;
  section?: string;
  /** Student stream, only meaningful for Class 11/12 (Arts/Non-Medical/Medical). */
  stream?: string;
  /** Teacher designation (PRT/TGT/PGT). */
  designation?: string;
  phone?: string;
  /** Native FCM registration token — see lib/notifications.ts's getFcmPushToken(). */
  pushToken?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

/** Registers this install so it shows up in the admin's device list (and can be
 * blocked). Called on every launch (no profile) and again after onboarding
 * (with the collected profile) — device_register upserts by device_id and
 * never overwrites a stored field with a blank one, so this is safe to call
 * repeatedly. */
export async function registerDevice(profile?: DeviceProfile): Promise<void> {
  const deviceId = await getDeviceId();
  const body = new FormData();
  body.append('device_id', deviceId);
  body.append('platform', Platform.OS);
  body.append('app_version', getAppVersion());
  if (profile?.userType) body.append('user_type', profile.userType);
  if (profile?.role) body.append('role', profile.role);
  if (profile?.fullName) body.append('full_name', profile.fullName);
  if (profile?.studentClass) body.append('class', profile.studentClass);
  if (profile?.section) body.append('section', profile.section);
  if (profile?.stream) body.append('stream', profile.stream);
  if (profile?.designation) body.append('designation', profile.designation);
  if (profile?.phone) body.append('phone', profile.phone);
  if (profile?.pushToken) body.append('push_token', profile.pushToken);
  if (typeof profile?.latitude === 'number') body.append('latitude', String(profile.latitude));
  if (typeof profile?.longitude === 'number') body.append('longitude', String(profile.longitude));
 
  await fetch(`${BASE_URL}/device_register`, { method: 'POST', body }).catch(() => {
    // Best-effort — a failed registration shouldn't block app usage.
  });
}
