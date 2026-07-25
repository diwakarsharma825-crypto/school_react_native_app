import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

/** Requested once, right after onboarding finishes — matches the real app's
 * "we'll ask for notification & location permission" flow. Both are
 * best-effort; the user can always deny and keep using the app. */
export async function requestOnboardingPermissions(): Promise<void> {
  await Notifications.requestPermissionsAsync().catch(() => {});
  await Location.requestForegroundPermissionsAsync().catch(() => {});
}
