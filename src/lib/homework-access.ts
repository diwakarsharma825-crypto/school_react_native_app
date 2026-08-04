import AsyncStorage from '@react-native-async-storage/async-storage';

const CHILDREN_KEY = 'saarthak.homework_children';
const ACTIVE_KEY = 'saarthak.homework_active_srn';
const PENDING_KEY = 'saarthak.pending_registration';

/** A just-submitted self-registration, saved locally so the Home screen can
 * remind the student it's awaiting their teacher's approval even after they
 * close and reopen the app (not just in the one-time alert shown right after
 * registering). Cleared automatically once a real login succeeds — see
 * saveHomeworkChildren() below — since that only happens post-activation. */
export interface PendingRegistration {
  name: string;
  className: string;
}

export async function savePendingRegistration(pending: PendingRegistration): Promise<void> {
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(pending));
}

export async function getPendingRegistration(): Promise<PendingRegistration | null> {
  const raw = await AsyncStorage.getItem(PENDING_KEY);
  return raw ? (JSON.parse(raw) as PendingRegistration) : null;
}

export async function clearPendingRegistration(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_KEY);
}

/** One child's profile — what's saved locally once a student/parent logs in
 * via /student_login (server-verified against `result_students`, not a
 * manually picked value). A single phone+password login can return several
 * of these (siblings at the same school) — see `saveHomeworkChildren()`. */
export interface HomeworkAccess {
  name: string;
  srn: string;
  className: string;
  section: string;
  phone?: string;
  gender?: string | null;
  photoUrl?: string | null;
}

/** Saves every child linked to this login. The first child becomes active
 * unless one is already active and still present in the new list (keeps the
 * current selection stable across a token refresh/relogin). */
export async function saveHomeworkChildren(children: HomeworkAccess[]): Promise<void> {
  await AsyncStorage.setItem(CHILDREN_KEY, JSON.stringify(children));
  await clearPendingRegistration();
  const currentActive = await AsyncStorage.getItem(ACTIVE_KEY);
  const stillPresent = currentActive && children.some((c) => c.srn === currentActive);
  if (!stillPresent && children.length > 0) {
    await AsyncStorage.setItem(ACTIVE_KEY, children[0].srn);
  }
}

export async function getHomeworkChildren(): Promise<HomeworkAccess[]> {
  const raw = await AsyncStorage.getItem(CHILDREN_KEY);
  return raw ? (JSON.parse(raw) as HomeworkAccess[]) : [];
}

export async function setActiveChildSrn(srn: string): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_KEY, srn);
}

/** The currently active child — what every existing screen (Homework,
 * Attendance, Result) reads as "who's logged in". */
export async function getHomeworkAccess(): Promise<HomeworkAccess | null> {
  const children = await getHomeworkChildren();
  if (children.length === 0) return null;
  const activeSrn = await AsyncStorage.getItem(ACTIVE_KEY);
  return children.find((c) => c.srn === activeSrn) ?? children[0];
}

export async function clearHomeworkAccess(): Promise<void> {
  await AsyncStorage.multiRemove([CHILDREN_KEY, ACTIVE_KEY]);
}
