import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'saarthak.onboarding_completed';

/** Per-install flag (AsyncStorage, not account-based) — resets automatically
 * on uninstall/reinstall, matching the real app's behavior. */
export async function isOnboardingComplete(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_KEY);
  return value === '1';
}

export async function markOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, '1');
}

export type Belonging = 'saarthak' | 'other';
export type UserType = 'student' | 'teacher' | 'other';

export interface OnboardingProfile {
  belonging: Belonging;
  userType: UserType;
  fullName: string;
  studentClass: string;
  section: string;
  mobile: string;
}
