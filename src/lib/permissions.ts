import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

export interface AppLocation {
  latitude: number;
  longitude: number;
}

/** Shared native-permission prompt used by onboarding and login flows.
 * Both requests are best-effort; the caller can continue even if the user
 * denies one or both, and decide separately whether to upload a push token. */
export async function requestAppPermissions(): Promise<void> {
  await Notifications.requestPermissionsAsync().catch(() => {});
  await Location.requestForegroundPermissionsAsync().catch(() => {});
}

/** Best-effort read of the device's current foreground GPS coordinates.
 * Returns null if permissions are unavailable or the location lookup fails. */
export async function getCurrentDeviceLocation(): Promise<AppLocation | null> {
  const permission = await Location.getForegroundPermissionsAsync().catch(() => null);
  if (!permission?.granted) {
    return null;
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  }).catch(() => null);

  if (!location?.coords) {
    return null;
  }

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
}
