import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const STORAGE_KEY = 'saarthak.device_id';

function randomId(): string {
  return 'dev-' + Array.from({ length: 24 }, () => Math.floor(Math.random() * 36).toString(36)).join('');
}

/**
 * Stable per-install identifier used by the backend to allow/block this
 * specific device. Prefers the OS-level install id; falls back to a
 * generated id persisted in AsyncStorage (Expo Go / web have no stable id).
 */
export async function getDeviceId(): Promise<string> {
  try {
    if (Platform.OS === 'android') {
      const androidId = Application.getAndroidId();
      if (androidId) return androidId;
    } else if (Platform.OS === 'ios') {
      const iosId = await Application.getIosIdForVendorAsync();
      if (iosId) return iosId;
    }
  } catch {
    // fall through to the stored/generated id
  }

  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (stored) return stored;

  const generated = randomId();
  await AsyncStorage.setItem(STORAGE_KEY, generated);
  return generated;
}

export function getAppVersion(): string {
  return Constants.expoConfig?.version ?? '1.0.0';
}
