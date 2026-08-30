import { useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export function useAppPermissions() {
  useEffect(() => {
    (async () => {
      try {
        // 1. Camera permission
        await ImagePicker.requestCameraPermissionsAsync();
        // 2. Gallery / Media Library permission
        await ImagePicker.requestMediaLibraryPermissionsAsync();
        // 3. Location permission
        await Location.requestForegroundPermissionsAsync();
        // 4. Notification permission
        if (Platform.OS !== 'web') {
          await Notifications.requestPermissionsAsync();
        }
      } catch (e) {
        // Silently ignore if browser/device rejects initial prompt
      }
    })();
  }, []);
}
