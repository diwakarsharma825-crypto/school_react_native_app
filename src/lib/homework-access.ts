import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'saarthak.homework_access';

/** What the student enters once to view Homework — class + section + phone
 * + a password field. NOTE: there is no student-account system on the
 * backend (students aren't authenticated users in this ERP), so this
 * "password" is captured and stored locally only — it identifies the
 * student for their own record, it is NOT verified against any server-side
 * credential. Saved to AsyncStorage, so it persists until the app is
 * uninstalled, matching what was asked for. */
export interface HomeworkAccess {
  className: string;
  section: string;
  phone: string;
  password: string;
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
