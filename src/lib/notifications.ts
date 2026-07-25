import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/** Matches the filename bundled via the expo-notifications config plugin
 * (app.json → plugins → expo-notifications → sounds). Android needs the
 * bare filename (no extension) once it's registered as a channel sound;
 * the plugin copies the raw file into res/raw at build time. */
const CHANNEL_SOUND = 'notification.wav';

/** Foreground behavior: play the custom sound and show the alert banner —
 * without this, expo-notifications silently swallows foreground pushes.
 * Background/killed-app notifications are handled natively by Android's
 * FCM receiver using the channel below (title/body/image/sound come
 * straight from the backend's FCM payload — see 07-backend.md). */
export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Android requires a notification channel (API 26+) to use a custom sound
 * and to control importance (HIGH is required for heads-up + big-picture
 * image display). Safe to call on every launch — re-creating a channel
 * with the same id just updates it. */
export async function ensureNotificationChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Saarthak GIMSSS',
    importance: Notifications.AndroidImportance.MAX,
    sound: CHANNEL_SOUND,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#123A6B',
    enableVibrate: true,
  });
}

/** The backend sends pushes via the raw FCM HTTP v1 API (see Fcm.php), not
 * Expo's push service — so we need the native FCM registration token
 * (`getDevicePushTokenAsync`), not an Expo push token
 * (`getExpoPushTokenAsync`, which is a different `ExponentPushToken[...]`
 * string the backend's FCM sender can't use). Returns null if permission
 * isn't granted yet or the device has no push capability (e.g. simulator). */
export async function getFcmPushToken(): Promise<string | null> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return null;
    const { data } = await Notifications.getDevicePushTokenAsync();
    return typeof data === 'string' ? data : null;
  } catch {
    return null;
  }
}
