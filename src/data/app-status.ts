import { Platform } from 'react-native';

import { BASE_URL } from './api';
import { getAppVersion, getDeviceId } from '@/lib/device';

export interface AppStatus {
  enabled: boolean;
  reason: 'device_blocked' | 'app_disabled' | null;
  title: string | null;
  message: string | null;
  devName: string | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
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
  };
}

/** Registers this install so it shows up in the admin's device list (and can be blocked). */
export async function registerDevice(): Promise<void> {
  const deviceId = await getDeviceId();
  const body = new FormData();
  body.append('device_id', deviceId);
  body.append('platform', Platform.OS);
  body.append('app_version', getAppVersion());

  await fetch(`${BASE_URL}/device_register`, { method: 'POST', body }).catch(() => {
    // Best-effort — a failed registration shouldn't block app usage.
  });
}
