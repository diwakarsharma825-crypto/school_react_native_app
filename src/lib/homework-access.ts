import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'saarthak.homework_access';

/** What's saved locally once a student logs in via /student_login — the
 * server-verified class/section from `result_students`, not a manually
 * picked value. Persists until the app is uninstalled, matching what was
 * asked for; there's no separate "session" concept, this IS the session. */
export interface HomeworkAccess {
  name: string;
  srn: string;
  className: string;
  section: string;
}

export async function getHomeworkAccess(): Promise<HomeworkAccess | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as HomeworkAccess) : null;
}

export async function saveHomeworkAccess(access: HomeworkAccess): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(access));
}

export async function clearHomeworkAccess(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
