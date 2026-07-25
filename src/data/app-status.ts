import { Platform } from 'react-native';

import { BASE_URL } from './api';
import { getAppVersion, getDeviceId } from '@/lib/device';

export type SectionKey =
  | 'events'
  | 'gallery'
  | 'notices'
  | 'result'
  | 'teachers'
  | 'top_students'
  | 'disclosure';

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
};

export interface AppStatus {
  enabled: boolean;
  reason: 'device_blocked' | 'app_disabled' | null;
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
  primaryColor: string | null;
  accentColor: string | null;
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

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`app_status request failed with status ${response.status}`);
  }
  const json = (await response.json()) as ApiEnvelope<{
    enabled: boolean;
    reason: 'device_blocked' | 'app_disabled' | null;
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
  }>;

  if (!json.status || !json.data) {
    throw new Error(json.message || 'app_status returned an error');
  }

  return {
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
    primaryColor: json.data.primary_color ?? null,
    accentColor: json.data.accent_color ?? null,
  };
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

  await fetch(`${BASE_URL}/device_register`, { method: 'POST', body }).catch(() => {
    // Best-effort — a failed registration shouldn't block app usage.
  });
}
