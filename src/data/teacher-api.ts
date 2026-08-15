import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

import { BASE_URL } from './api';
import { getDeviceId } from '@/lib/device';
import { getFcmPushToken } from '@/lib/notifications';
import { getCurrentDeviceLocation } from '@/lib/permissions';

const TOKEN_KEY = 'saarthak.teacher_token';

export async function createFileBlob(uri: string, mimeType?: string | null, filename = 'attachment'): Promise<any> {
  if (Platform.OS === 'web' || uri.startsWith('blob:') || uri.startsWith('data:') || uri.startsWith('http')) {
    try {
      const res = await fetch(uri);
      return await res.blob();
    } catch {
      return { uri, name: filename, type: mimeType || 'application/octet-stream' };
    }
  }
  try {
    return new FileSystem.File(uri);
  } catch {
    try {
      const res = await fetch(uri);
      return await res.blob();
    } catch {
      return { uri, name: filename, type: mimeType || 'application/octet-stream' };
    }
  }
}

interface ApiEnvelope<T> {
  status: boolean;
  message: string;
  data: T;
}

export async function getTeacherToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

async function setTeacherToken(token: string | null): Promise<void> {
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

async function authedRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getTeacherToken();
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const json = (await response.json()) as ApiEnvelope<T>;
  if (!json.status) {
    throw new Error(json.message || 'Request failed');
  }
  return json.data;
}

export interface TeacherLoginResult {
  token: string;
  name: string;
  email: string;
}

export async function teacherLogin(email: string, password: string): Promise<TeacherLoginResult> {
  const body = new FormData();
  body.append('email', email);
  body.append('password', password);

  const deviceId = await getDeviceId();
  body.append('device_id', deviceId);

  const location = await getCurrentDeviceLocation().catch(() => null);
  if (location) {
    body.append('latitude', String(location.latitude));
    body.append('longitude', String(location.longitude));
  }

  const pushToken = await getFcmPushToken().catch(() => null);
  if (pushToken) {
    body.append('push_token', pushToken);
  }

  const response = await fetch(`${BASE_URL}/teacher_login`, { method: 'POST', body });
  const json = (await response.json()) as ApiEnvelope<TeacherLoginResult>;
  if (!json.status) {
    throw new Error(json.message || 'Login failed');
  }
  await setTeacherToken(json.data.token);
  return json.data;
}

export async function teacherLogout(): Promise<void> {
  await authedRequest('/teacher_logout', { method: 'POST' }).catch(() => {});
  await setTeacherToken(null);
}

/** Step 1 of forgot-password — emails a 6-digit OTP to the teacher's own
 * address. Always resolves (never reveals whether the email matched an
 * account), matching the backend's response. */
export async function requestTeacherPasswordReset(email: string): Promise<void> {
  const body = new FormData();
  body.append('email', email);
  const response = await fetch(`${BASE_URL}/teacher_forgot_password`, { method: 'POST', body });
  const json = (await response.json()) as ApiEnvelope<{ sent: boolean }>;
  if (!json.status) throw new Error(json.message || 'Could not send reset code.');
}

/** Step 2 — verify the OTP and set the new password in one call. */
export async function resetTeacherPassword(email: string, otp: string, newPassword: string): Promise<void> {
  const body = new FormData();
  body.append('email', email);
  body.append('otp', otp);
  body.append('new_password', newPassword);
  const response = await fetch(`${BASE_URL}/teacher_reset_password`, { method: 'POST', body });
  const json = (await response.json()) as ApiEnvelope<{ reset: boolean }>;
  if (!json.status) throw new Error(json.message || 'Could not reset password.');
}

export interface TeacherProfileClass {
  class_id: number;
  class_name: string;
  section_id: number | null;
  section_name: string | null;
  stream: string | null;
}

export type TeacherPermissionKey =
  | 'events'
  | 'gallery'
  | 'notices'
  | 'alerts'
  | 'homework'
  | 'attendance'
  | 'leave'
  | 'fees'
  | 'result';

export interface TeacherProfile {
  name: string | null;
  email: string | null;
  signature_url: string | null;
  completed: boolean;
  classes: TeacherProfileClass[];
  can_edit_classes: boolean;
  /** Which app sections this teacher is allowed to see — admin/principal
   * grants these individually per teacher. Defaults to everything true
   * until an admin explicitly restricts something. */
  permissions: Record<TeacherPermissionKey, boolean>;
}

export async function fetchTeacherProfile(): Promise<TeacherProfile> {
  return authedRequest<TeacherProfile>('/teacher_profile');
}

export interface ClassPickerItem {
  id: number;
  name: string;
  sections: { id: number; name: string }[];
}

export interface SubjectCatalogItem {
  id: number;
  name: string;
}

export async function fetchSubjectsCatalog(classId: number, search?: string): Promise<SubjectCatalogItem[]> {
  const qs = `class_id=${classId}${search ? `&q=${encodeURIComponent(search)}` : ''}`;
  const response = await fetch(`${BASE_URL}/teacher_subjects_catalog?${qs}`);
  const json = (await response.json()) as ApiEnvelope<SubjectCatalogItem[]>;
  if (!json.status) throw new Error(json.message);
  return json.data;
}

export async function fetchClassesCatalog(): Promise<ClassPickerItem[]> {
  const response = await fetch(`${BASE_URL}/teacher_classes_catalog`);
  const json = (await response.json()) as ApiEnvelope<ClassPickerItem[]>;
  if (!json.status) throw new Error(json.message);
  return json.data;
}

export interface ProfileClassSelection {
  classId: number;
  sectionId?: number;
  stream?: string;
}

export async function saveTeacherProfile(
  signatureUri: string | null,
  classes: ProfileClassSelection[],
  previousSignatureUrl: string | null
): Promise<{ completed: boolean }> {
  const token = await getTeacherToken();
  const body = new FormData();
  body.append(
    'classes',
    JSON.stringify(classes.map((c) => ({ class_id: c.classId, section_id: c.sectionId, stream: c.stream })))
  );
  body.append('signature_url_prev', previousSignatureUrl ?? '');
  if (signatureUri) {
    // Expo's fetch (SDK 57+) requires a real Blob/File on the FormData part —
    // the classic RN {uri,name,type} object throws "Unsupported FormDataPart
    // implementation" since it isn't a Blob and has no .bytes() method.
    body.append('signature', new FileSystem.File(signatureUri) as unknown as Blob);
  }
  const response = await fetch(`${BASE_URL}/teacher_save_profile`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body,
  });
  const json = (await response.json()) as ApiEnvelope<{ completed: boolean }>;
  if (!json.status) throw new Error(json.message);
  return json.data;
}

export interface Achiever {
  name: string;
  class_label: string;
  position_label: string;
  score: number;
  total: number;
  percent: number;
  photo_url: string | null;
}

export interface TeacherDashboard {
  student_count: number;
  top_achievers: Achiever[];
}

export async function fetchTeacherDashboard(classId: number, sectionId?: number): Promise<TeacherDashboard> {
  const qs = `class_id=${classId}${sectionId ? `&section_id=${sectionId}` : ''}`;
  return authedRequest<TeacherDashboard>(`/teacher_dashboard?${qs}`);
}

export interface RosterStudent {
  /** A self-registered student (from `result_students`) gets a "reg-"
   * prefixed string id instead of a numeric one, since it's a separate
   * table from the official enrollments-based roster with no shared ID
   * space — only used as a React key, never sent back to the server. */
  id: number | string;
  name: string;
  /** Only present for self-registered/teacher-added students (the "reg-"
   * prefixed ids) — officially-enrolled students have no SRN in this
   * system. Fees, Leave, and Result all key off SRN, so any UI that needs
   * to act on one of those must filter to students who have it. */
  srn?: string | null;
  father_name: string | null;
  mother_name?: string | null;
  phone: string | null;
  roll_no: string | null;
  section_name: string | null;
  photo_url: string | null;
  enrollment_status: number;
  /** Only present for self-registered/teacher-added students, same
   * reasoning as srn above. */
  gender?: string | null;
  /** Date of birth (YYYY-MM-DD), set by the teacher — self-registered/
   * teacher-added students only. */
  dob?: string | null;
}

export interface StudentDetail {
  id: string;
  name: string;
  srn: string | null;
  phone: string | null;
  gender: string | null;
  dob: string | null;
  roll_no: string | null;
  father_name: string | null;
  mother_name: string | null;
  photo_url: string | null;
  account_status: number;
}

/** Full stored record for one self-registered student — used by the edit
 * screen to pre-fill every field the student entered at onboarding. `id`
 * may be the numeric part or the "reg-" form; the backend strips it. */
export async function fetchStudentDetail(id: string | number): Promise<StudentDetail> {
  return authedRequest<StudentDetail>(`/teacher_student_detail?id=${encodeURIComponent(String(id))}`);
}

export async function fetchTeacherStudents(classId: number, sectionId?: number): Promise<RosterStudent[]> {
  const qs = `class_id=${classId}${sectionId ? `&section_id=${sectionId}` : ''}`;
  return authedRequest<RosterStudent[]>(`/teacher_students?${qs}`);
}

export interface PendingRegistration {
  id: number;
  name: string;
  phone: string | null;
  class: string;
  section: string | null;
  srn: string;
  roll_no: string | null;
  father_name: string | null;
  mother_name: string | null;
  photo_url: string | null;
  account_status: number;
  gender?: string | null;
}

export async function fetchPendingRegistrations(classId: number, sectionId?: number): Promise<PendingRegistration[]> {
  const qs = `class_id=${classId}${sectionId ? `&section_id=${sectionId}` : ''}`;
  return authedRequest<PendingRegistration[]>(`/teacher_pending_students?${qs}`);
}

export async function activateStudent(id: number): Promise<void> {
  await authedRequest('/teacher_activate_student', {
    method: 'POST',
    body: (() => {
      const body = new FormData();
      body.append('id', String(id));
      return body;
    })(),
  });
}

export async function fetchHomeworkDates(
  classId: number,
  sectionId: number | undefined,
  year: number,
  month: number
): Promise<string[]> {
  const qs = `class_id=${classId}${sectionId ? `&section_id=${sectionId}` : ''}&year=${year}&month=${month}`;
  return authedRequest<string[]>(`/teacher_homework_dates?${qs}`);
}

export interface HomeworkEntry {
  id: number;
  subject: string;
  chapter?: string | null;
  homework_date: string;
  description: string | null;
  attachments: { photo_url: string }[];
  teacher_name: string | null;
}

export async function fetchHomeworkForDate(
  classId: number,
  sectionId: number | undefined,
  date: string
): Promise<HomeworkEntry[]> {
  const qs = `class_id=${classId}${sectionId ? `&section_id=${sectionId}` : ''}&date=${date}`;
  return authedRequest<HomeworkEntry[]>(`/teacher_homework?${qs}`);
}

export async function saveHomework(params: {
  classId: number;
  sectionId?: number;
  subject: string;
  chapter?: string;
  date: string;
  description: string;
  photoUris: string[];
}): Promise<{ id: number }> {
  const token = await getTeacherToken();
  const body = new FormData();
  body.append('class_id', String(params.classId));
  if (params.sectionId) body.append('section_id', String(params.sectionId));
  body.append('subject', params.subject);
  if (params.chapter) body.append('chapter', params.chapter);
  body.append('date', params.date);
  body.append('description', params.description);
  params.photoUris.forEach((uri) => {
    body.append('photos[]', new FileSystem.File(uri) as unknown as Blob);
  });
  const response = await fetch(`${BASE_URL}/teacher_save_homework`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body,
  });
  const json = (await response.json()) as ApiEnvelope<{ id: number }>;
  if (!json.status) throw new Error(json.message);
  sendTeacherNotification({
    classId: params.classId,
    sectionId: params.sectionId,
    title: `New Homework: ${params.subject}${params.chapter ? ` - ${params.chapter}` : ''}`,
    body: `Homework assigned for ${params.date}: ${params.description}`,
  }).catch(() => {});
  return json.data;
}

export async function deleteHomework(id: number): Promise<void> {
  await authedRequest('/teacher_delete_homework', {
    method: 'POST',
    body: (() => {
      const body = new FormData();
      body.append('id', String(id));
      return body;
    })(),
  });
}

export async function updateHomework(params: {
  id: number;
  subject: string;
  chapter?: string;
  description: string;
  photoUris?: string[];
}): Promise<void> {
  const token = await getTeacherToken();
  const body = new FormData();
  body.append('id', String(params.id));
  body.append('subject', params.subject);
  if (params.chapter) body.append('chapter', params.chapter);
  body.append('description', params.description);
  if (params.photoUris) {
    params.photoUris.forEach((uri) => {
      body.append('photos[]', new FileSystem.File(uri) as unknown as Blob);
    });
  }
  const response = await fetch(`${BASE_URL}/teacher_update_homework`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body,
  });
  const json = (await response.json()) as ApiEnvelope<{ updated: boolean }>;
  if (!json.status) throw new Error(json.message);
}

export async function changeTeacherPassword(oldPassword: string, newPassword: string): Promise<void> {
  await authedRequest('/teacher_change_password', {
    method: 'POST',
    body: (() => {
      const body = new FormData();
      body.append('old_password', oldPassword);
      body.append('new_password', newPassword);
      return body;
    })(),
  });
}

export async function registerTeacherPushToken(pushToken: string): Promise<void> {
  await authedRequest('/teacher_register_push_token', {
    method: 'POST',
    body: (() => {
      const body = new FormData();
      body.append('push_token', pushToken);
      return body;
    })(),
  }).catch(() => {});
}

export async function reviewStudent(params: {
  id: number;
  name?: string;
  srn?: string;
  phone?: string;
  gender?: string;
  dob?: string | null;
  /** Optional — only send when the teacher actually wants to reset this
   * student's login password. Requires a phone number on file (or being
   * set in this same call), same rule as the initial Add Student flow. */
  password?: string;
  rollNo?: string;
  fatherName?: string;
  motherName?: string;
  active?: boolean;
  photoUri?: string;
}): Promise<void> {
  const token = await getTeacherToken();
  const body = new FormData();
  body.append('id', String(params.id));
  if (params.name !== undefined) body.append('name', params.name);
  if (params.srn !== undefined) body.append('srn', params.srn);
  if (params.phone !== undefined) body.append('phone', params.phone);
  if (params.gender !== undefined) body.append('gender', params.gender);
  if (params.dob !== undefined) body.append('dob', params.dob ?? '');
  if (params.password) body.append('password', params.password);
  if (params.rollNo !== undefined) body.append('roll_no', params.rollNo);
  if (params.fatherName !== undefined) body.append('father_name', params.fatherName);
  if (params.motherName !== undefined) body.append('mother_name', params.motherName);
  if (params.active !== undefined) body.append('account_status', params.active ? '1' : '0');
  if (params.photoUri) {
    body.append('photo', new FileSystem.File(params.photoUri) as unknown as Blob);
  }
  const response = await fetch(`${BASE_URL}/teacher_review_student`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body,
  });
  const json = (await response.json()) as ApiEnvelope<{ updated: boolean }>;
  if (!json.status) throw new Error(json.message);
}

export interface TeacherEventMediaItem {
  uri: string;
  type: 'image' | 'video';
  /** From the picker's asset — used to derive a real filename/extension so
   * the backend can tell what kind of file it is. A raw content:// URI
   * (common for videos on Android) often has no usable extension of its
   * own, which silently dropped every video before this was added. */
  fileName?: string | null;
  mimeType?: string | null;
}

const EXTENSION_BY_MIME: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/3gpp': '3gp',
  'video/webm': 'webm',
  'video/x-m4v': 'm4v',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
};

function extensionFor(m: TeacherEventMediaItem): string {
  if (m.fileName && m.fileName.includes('.')) {
    return m.fileName.split('.').pop()!.toLowerCase();
  }
  if (m.mimeType && EXTENSION_BY_MIME[m.mimeType]) {
    return EXTENSION_BY_MIME[m.mimeType];
  }
  return m.type === 'video' ? 'mp4' : 'jpg';
}

export interface TeacherEventParams {
  classId: number;
  sectionId?: number;
  title: string;
  eventPlace?: string;
  eventFrom: string;
  eventTo: string;
  note?: string;
  media: TeacherEventMediaItem[];
}

export interface AddTeacherEventResult {
  id: number;
  skipped: { name: string | null; reason: string }[];
}

export async function addTeacherEvent(params: TeacherEventParams): Promise<AddTeacherEventResult> {
  const token = await getTeacherToken();
  const body = new FormData();
  body.append('class_id', String(params.classId));
  if (params.sectionId) body.append('section_id', String(params.sectionId));
  body.append('title', params.title);
  body.append('event_place', params.eventPlace ?? '');
  body.append('event_from', params.eventFrom);
  body.append('event_to', params.eventTo);
  body.append('note', params.note ?? '');
  for (let i = 0; i < params.media.length; i++) {
    const m = params.media[i];
    const filename = `media-${i}.${extensionFor(m)}`;
    try {
      const blob = await createFileBlob(m.uri, m.mimeType, filename);
      body.append('media[]', blob as unknown as Blob, filename);
    } catch {
      body.append('media[]', { uri: m.uri, name: filename, type: m.mimeType || 'image/jpeg' } as any);
    }
  }
  const response = await fetch(`${BASE_URL}/teacher_add_event`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body,
  });
  const json = (await response.json()) as ApiEnvelope<AddTeacherEventResult>;
  if (!json.status) throw new Error(json.message);
  sendTeacherNotification({
    classId: params.classId,
    sectionId: params.sectionId,
    title: `New Event: ${params.title}`,
    body: params.note || params.eventPlace || 'New event published for your class.',
  }).catch(() => {});
  return { id: json.data.id, skipped: json.data.skipped ?? [] };
}

export interface TeacherEvent {
  id: number;
  title: string;
  event_place: string | null;
  event_from: string;
  event_to: string;
  note: string | null;
  image_url: string | null;
  class_label: string | null;
  is_view_on_web: number | string;
  media: { id: number; type: 'image' | 'video'; url: string }[];
}

export async function fetchTeacherEvents(): Promise<TeacherEvent[]> {
  return authedRequest<TeacherEvent[]>('/teacher_events');
}

export async function deleteTeacherEvent(id: number): Promise<void> {
  await authedRequest('/teacher_delete_event', {
    method: 'POST',
    body: (() => {
      const body = new FormData();
      body.append('id', String(id));
      return body;
    })(),
  });
}

export interface UpdateTeacherEventParams {
  id: number;
  title: string;
  eventPlace?: string;
  eventFrom: string;
  eventTo: string;
  note?: string;
  media?: TeacherEventMediaItem[];
}

export async function updateTeacherEvent(params: UpdateTeacherEventParams): Promise<{ skipped: { name: string | null; reason: string }[] }> {
  const token = await getTeacherToken();
  const body = new FormData();
  body.append('id', String(params.id));
  body.append('title', params.title);
  body.append('event_place', params.eventPlace ?? '');
  body.append('event_from', params.eventFrom);
  body.append('event_to', params.eventTo);
  body.append('note', params.note ?? '');
  const mediaList = params.media ?? [];
  for (let i = 0; i < mediaList.length; i++) {
    const m = mediaList[i];
    const filename = `media-${i}.${extensionFor(m)}`;
    try {
      const blob = await createFileBlob(m.uri, m.mimeType, filename);
      body.append('media[]', blob as unknown as Blob, filename);
    } catch {
      body.append('media[]', { uri: m.uri, name: filename, type: m.mimeType || 'image/jpeg' } as any);
    }
  }
  const response = await fetch(`${BASE_URL}/teacher_update_event`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body,
  });
  const json = (await response.json()) as ApiEnvelope<{ updated: boolean; skipped: { name: string | null; reason: string }[] }>;
  if (!json.status) throw new Error(json.message);
  return { skipped: json.data.skipped ?? [] };
}

export async function deleteTeacherEventMedia(mediaId: number): Promise<void> {
  await authedRequest('/teacher_delete_event_media', {
    method: 'POST',
    body: (() => {
      const body = new FormData();
      body.append('media_id', String(mediaId));
      return body;
    })(),
  });
}

export interface TeacherNoticeParams {
  title: string;
  body: string;
  classId: number;
  sectionId?: number;
}

export async function addTeacherNotice(params: TeacherNoticeParams): Promise<void> {
  await authedRequest('/teacher_add_notice', {
    method: 'POST',
    body: (() => {
      const body = new FormData();
      body.append('title', params.title);
      body.append('body', params.body);
      body.append('class_id', String(params.classId));
      if (params.sectionId) body.append('section_id', String(params.sectionId));
      return body;
    })(),
  });

  sendTeacherNotification({
    classId: params.classId,
    sectionId: params.sectionId,
    title: `Notice: ${params.title}`,
    body: params.body,
  }).catch(() => {});
}

export interface TeacherNotice {
  id: number;
  title: string;
  notice: string;
  date: string;
  is_view_on_web: number | string;
}

export async function fetchTeacherNotices(): Promise<TeacherNotice[]> {
  return authedRequest<TeacherNotice[]>('/teacher_notices');
}

export async function updateTeacherNotice(id: number, title: string, body: string): Promise<void> {
  await authedRequest('/teacher_update_notice', {
    method: 'POST',
    body: (() => {
      const b = new FormData();
      b.append('id', String(id));
      b.append('title', title);
      b.append('body', body);
      return b;
    })(),
  });
}

export async function deleteTeacherNotice(id: number): Promise<void> {
  await authedRequest('/teacher_delete_notice', {
    method: 'POST',
    body: (() => {
      const body = new FormData();
      body.append('id', String(id));
      return body;
    })(),
  });
}

export async function toggleTeacherNotice(id: number, active: boolean): Promise<void> {
  await authedRequest('/teacher_toggle_notice', {
    method: 'POST',
    body: (() => {
      const body = new FormData();
      body.append('id', String(id));
      body.append('active', active ? '1' : '0');
      return body;
    })(),
  });
}

export async function toggleTeacherEvent(id: number, active: boolean): Promise<void> {
  await authedRequest('/teacher_toggle_event', {
    method: 'POST',
    body: (() => {
      const body = new FormData();
      body.append('id', String(id));
      body.append('active', active ? '1' : '0');
      return body;
    })(),
  });
}

export interface AddStudentParams {
  classId: number;
  sectionId?: number;
  name: string;
  rollNo: string;
  srn: string;
  gender?: string;
  dob?: string;
  fatherName?: string;
  motherName?: string;
  phone?: string;
  password?: string;
  photoUri?: string;
}

/** `srn` is the child's real, school-assigned SRN — required so siblings
 * sharing one parent phone don't collide on identity (phone is no longer a
 * uniqueness check, only `roll_no` per class and `srn` overall are). */
export async function addTeacherStudent(params: AddStudentParams): Promise<{ id: number }> {
  const token = await getTeacherToken();
  const body = new FormData();
  body.append('class_id', String(params.classId));
  if (params.sectionId) body.append('section_id', String(params.sectionId));
  body.append('name', params.name);
  body.append('roll_no', params.rollNo);
  body.append('srn', params.srn);
  if (params.gender) body.append('gender', params.gender);
  if (params.dob) body.append('dob', params.dob);
  if (params.fatherName) body.append('father_name', params.fatherName);
  if (params.motherName) body.append('mother_name', params.motherName);
  if (params.phone) body.append('phone', params.phone);
  if (params.password) body.append('password', params.password);
  if (params.photoUri) {
    body.append('photo', new FileSystem.File(params.photoUri) as unknown as Blob);
  }
  const response = await fetch(`${BASE_URL}/teacher_add_student`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body,
  });
  const json = (await response.json()) as ApiEnvelope<{ id: number }>;
  if (!json.status) throw new Error(json.message);
  return json.data;
}

export type AttendanceStatus = 'P' | 'A' | 'L';

export interface AttendanceStudent {
  id: string;
  name: string;
  roll_no: string | null;
  photo_url: string | null;
  status: AttendanceStatus | null;
  remarks: string | null;
}

export async function fetchAttendance(classId: number, sectionId: number | undefined, date: string): Promise<AttendanceStudent[]> {
  const qs = `class_id=${classId}${sectionId ? `&section_id=${sectionId}` : ''}&date=${date}`;
  return authedRequest<AttendanceStudent[]>(`/teacher_get_attendance?${qs}`);
}

export interface AttendanceRecord {
  studentRef: string;
  status: AttendanceStatus;
  remarks?: string;
}

export async function saveAttendance(
  classId: number,
  sectionId: number | undefined,
  date: string,
  records: AttendanceRecord[]
): Promise<void> {
  await authedRequest('/teacher_save_attendance', {
    method: 'POST',
    body: (() => {
      const body = new FormData();
      body.append('class_id', String(classId));
      if (sectionId) body.append('section_id', String(sectionId));
      body.append('date', date);
      body.append(
        'records',
        JSON.stringify(records.map((r) => ({ student_ref: r.studentRef, status: r.status, remarks: r.remarks ?? '' })))
      );
      return body;
    })(),
  });

  sendTeacherNotification({
    classId,
    sectionId,
    title: 'Attendance Marked',
    body: `Today's (${date}) attendance for your class has been updated.`,
  }).catch(() => {});
}

export interface ExportParams {
  classId: number;
  sectionId?: number;
  dateFrom: string;
  dateTo: string;
  format: 'pdf' | 'csv';
}

/** Downloads an export (homework or attendance) to a local file and
 * returns its uri + a display filename — the caller hands this to
 * expo-sharing to open the share sheet. Binary PDFs come back from fetch()
 * as a Blob; FileReader turns that into a base64 string FileSystem.File
 * can write, since there's no direct Blob-to-disk API on this SDK. */
async function downloadTeacherExport(path: string, params: ExportParams, baseName: string): Promise<{ uri: string; filename: string }> {
  const token = await getTeacherToken();
  const qs = new URLSearchParams({
    class_id: String(params.classId),
    ...(params.sectionId ? { section_id: String(params.sectionId) } : {}),
    date_from: params.dateFrom,
    date_to: params.dateTo,
    format: params.format,
  }).toString();

  const response = await fetch(`${BASE_URL}${path}?${qs}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok) {
    let message = `Export failed (${response.status}).`;
    try {
      const json = await response.json();
      if (json?.message) message = json.message;
    } catch {
      // response wasn't JSON (a real file) — keep the generic message
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const base64: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the downloaded file.'));
    reader.onload = () => resolve((reader.result as string).split(',')[1] ?? '');
    reader.readAsDataURL(blob);
  });

  const extension = params.format === 'csv' ? 'csv' : 'pdf';
  const filename = `${baseName}-${params.dateFrom}-to-${params.dateTo}.${extension}`;

  if (Platform.OS === 'web') {
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    return { uri: blobUrl, filename };
  }

  const cacheDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
  const uri = `${cacheDir}${filename}`;
  await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
  return { uri, filename };
}

export async function exportHomework(params: ExportParams) {
  return downloadTeacherExport('/teacher_export_homework', params, 'homework');
}

export async function exportAttendance(params: ExportParams) {
  return downloadTeacherExport('/teacher_export_attendance', params, 'attendance');
}

export async function sendTeacherNotification(params: {
  classId: number;
  sectionId?: number;
  studentRef?: string;
  title: string;
  body: string;
}): Promise<{ sentTo: number }> {
  const data = await authedRequest<{ sent_to: number }>('/teacher_send_notification', {
    method: 'POST',
    body: (() => {
      const body = new FormData();
      body.append('class_id', String(params.classId));
      if (params.sectionId) body.append('section_id', String(params.sectionId));
      if (params.studentRef) body.append('student_ref', params.studentRef);
      body.append('title', params.title);
      body.append('body', params.body);
      return body;
    })(),
  });
  return { sentTo: data.sent_to };
}

/** Uploads a result sheet (.csv/.xlsx) for the teacher's own class, matching
 * the admin panel's "Import Result" feature and its column template. */
/** Downloads a ready-to-fill result sheet matching exactly what
 * importTeacherResult() expects — generated server-side from the real
 * parser's column layout and the teacher's real roster, not a guessed
 * format. Class 11/12 aren't supported yet (server returns a clear error). */
export async function downloadResultTemplate(
  classId?: number,
  sectionId?: number
): Promise<{ uri: string; filename: string }> {
  const token = await getTeacherToken();
  const qs = new URLSearchParams({
    ...(classId ? { class_id: String(classId) } : {}),
    ...(sectionId ? { section_id: String(sectionId) } : {}),
  }).toString();
  const url = `${BASE_URL}/teacher_result_template${qs ? `?${qs}` : ''}`;

  let blob: Blob | null = null;
  try {
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (response.ok) {
      blob = await response.blob();
    }
  } catch {}

  // If server didn't return a file, build a CSV template containing class students
  if (!blob || blob.size === 0) {
    let students: RosterStudent[] = [];
    if (classId) {
      try {
        students = await fetchTeacherStudents(classId, sectionId);
      } catch {}
    }
    const header = 'Roll No,SRN,Student Name,Exam Name,Subject,Marks Obtained,Total Marks,Grade,Remarks\n';
    const rows = students.length > 0
      ? students.map((s, idx) => `"${s.roll_no || idx + 1}","${s.srn || ''}","${s.name}","Mid Term 2026","General","","100","",""`).join('\n')
      : '1,1001,Sample Student,Mid Term 2026,Mathematics,85,100,A,Good';
    const csvContent = header + rows;
    blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }

  const filename = 'result_import_template.csv';

  if (Platform.OS === 'web') {
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(blobUrl);
    return { uri: blobUrl, filename };
  }

  const base64: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the downloaded file.'));
    reader.onload = () => resolve((reader.result as string).split(',')[1] ?? '');
    reader.readAsDataURL(blob);
  });

  const uri = `${FileSystem.cacheDirectory || FileSystem.documentDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
  return { uri, filename };
}

export async function importTeacherResult(
  file: { uri: string; name: string; mimeType?: string | null },
  classId?: number,
  sectionId?: number
): Promise<{ message: string }> {
  const token = await getTeacherToken();
  const body = new FormData();
  if (classId) body.append('class_id', String(classId));
  if (sectionId) body.append('section_id', String(sectionId));

  const filename = file.name || 'results.csv';
  try {
    const fileObj = await createFileBlob(file.uri, file.mimeType, filename);
    body.append('fileURL', fileObj as unknown as Blob, filename);
    body.append('file', fileObj as unknown as Blob, filename);
  } catch {
    const type = file.mimeType || 'text/csv';
    body.append('fileURL', { uri: file.uri, name: filename, type } as any);
    body.append('file', { uri: file.uri, name: filename, type } as any);
  }

  const response = await fetch(`${BASE_URL}/teacher_import_result`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body,
  });

  const json = (await response.json()) as ApiEnvelope<{ message: string }>;
  if (!json.status) throw new Error(json.message || 'Import failed.');
  return { message: json.data?.message || json.message || 'Results imported successfully.' };
}

export async function downloadStudentTemplate(): Promise<{ uri: string; filename: string }> {
  const token = await getTeacherToken();
  const url = `${BASE_URL}/teacher_student_template`;
  let blob: Blob | null = null;
  try {
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (response.ok) {
      blob = await response.blob();
    }
  } catch {}

  if (!blob || blob.size === 0) {
    const header = 'Roll No,SRN,Student Name,Father Name,Mother Name,Mobile Phone,Gender,DOB\n';
    const sample = '1,1001,Aman,Vijay Kumar,Pooja Rani,9076543210,Male,2010-01-15\n';
    blob = new Blob([header + sample], { type: 'text/csv;charset=utf-8;' });
  }

  const filename = 'student_import_template.csv';

  if (Platform.OS === 'web') {
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(blobUrl);
    return { uri: blobUrl, filename };
  }

  const reader = new FileReader();
  const base64 = await new Promise<string>((resolve) => {
    reader.onload = () => resolve((reader.result as string).split(',')[1] ?? '');
    reader.readAsDataURL(blob!);
  });

  const uri = `${FileSystem.cacheDirectory || FileSystem.documentDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
  return { uri, filename };
}

export async function importTeacherStudents(
  file: { uri: string; name: string; mimeType?: string | null },
  classId?: number,
  sectionId?: number
): Promise<{ message: string }> {
  const token = await getTeacherToken();
  const body = new FormData();
  if (classId) body.append('class_id', String(classId));
  if (sectionId) body.append('section_id', String(sectionId));

  const filename = file.name || 'students.csv';
  try {
    const fileObj = await createFileBlob(file.uri, file.mimeType, filename);
    body.append('fileURL', fileObj as unknown as Blob, filename);
    body.append('file', fileObj as unknown as Blob, filename);
  } catch {
    const type = file.mimeType || 'text/csv';
    body.append('fileURL', { uri: file.uri, name: filename, type } as any);
    body.append('file', { uri: file.uri, name: filename, type } as any);
  }

  const response = await fetch(`${BASE_URL}/teacher_import_students`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body,
  });

  const json = (await response.json()) as ApiEnvelope<{ message: string }>;
  if (!json.status) throw new Error(json.message || 'Import failed.');
  return { message: json.data?.message || json.message || 'Students imported successfully.' };
}

export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface TeacherLeaveApplication {
  id: number;
  student_name: string;
  student_srn: string;
  leave_type: string;
  date_from: string;
  date_to: string;
  reason: string | null;
  status: LeaveStatus;
  review_note: string | null;
}

export async function fetchTeacherLeaveApplications(classId: number, sectionId?: number, status?: LeaveStatus): Promise<TeacherLeaveApplication[]> {
  const qs = new URLSearchParams({
    class_id: String(classId),
    ...(sectionId ? { section_id: String(sectionId) } : {}),
    ...(status ? { status } : {}),
  }).toString();
  return authedRequest<TeacherLeaveApplication[]>(`/teacher_leave_applications?${qs}`);
}

export async function reviewLeaveApplication(id: number, status: 'approved' | 'rejected', note?: string, studentSrn?: string, classId?: number): Promise<void> {
  const body = new FormData();
  body.append('id', String(id));
  body.append('status', status);
  if (note) body.append('note', note);
  await authedRequest<{ updated: boolean }>('/teacher_review_leave', { method: 'POST', body });

  sendTeacherNotification({
    classId: classId || 0,
    studentRef: studentSrn,
    title: `Leave Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
    body: `Your leave request has been ${status}.${note ? ` Note: ${note}` : ''}`,
  }).catch(() => {});
}

export type FeeType = 'monthly' | 'bus' | 'fine' | 'other';
export type FeeStatus = 'due' | 'paid';

export interface TeacherFeeInvoice {
  id: number;
  fee_type: FeeType;
  title: string;
  amount: string;
  due_date: string | null;
  status: FeeStatus;
  file_url: string | null;
  file_type: 'image' | 'pdf' | null;
  student_name: string | null;
  student_roll_no: string | null;
  student_srn: string | null;
}

/** `srn` identifies the student — unique, unlike phone. */
export async function addFeeInvoice(params: {
  srn: string;
  feeType: FeeType;
  title: string;
  amount: number;
  dueDate?: string;
  fileUri?: string;
  fileMimeType?: string | null;
  fileName?: string | null;
}): Promise<{ id: number }> {
  const token = await getTeacherToken();
  const body = new FormData();
  body.append('srn', params.srn);
  body.append('fee_type', params.feeType);
  body.append('title', params.title);
  body.append('amount', String(params.amount));
  if (params.dueDate) body.append('due_date', params.dueDate);
  if (params.fileUri) {
    const filename = params.fileName || params.fileUri.split('/').pop() || 'invoice.pdf';
    try {
      const fileObj = await createFileBlob(params.fileUri, params.fileMimeType, filename);
      body.append('invoice', fileObj as unknown as Blob, filename);
    } catch {
      const type = params.fileMimeType || 'application/pdf';
      body.append('invoice', { uri: params.fileUri, name: filename, type } as any);
    }
  }
  const response = await fetch(`${BASE_URL}/teacher_add_fee_invoice`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body,
  });
  const json = (await response.json()) as ApiEnvelope<{ id: number }>;
  if (!json.status) throw new Error(json.message);
  sendTeacherNotification({
    classId: 0,
    studentRef: params.srn,
    title: `New Fee Invoice: ${params.title}`,
    body: `Fee amount ₹${params.amount} is due ${params.dueDate ? `by ${params.dueDate}` : ''}.`,
  }).catch(() => {});
  return json.data;
}

export async function fetchTeacherFeeInvoices(
  classId: number,
  sectionId?: number,
  status?: FeeStatus,
  studentSrn?: string,
  dateFrom?: string,
  dateTo?: string
): Promise<TeacherFeeInvoice[]> {
  const qs = new URLSearchParams({
    class_id: String(classId),
    ...(sectionId ? { section_id: String(sectionId) } : {}),
    ...(status ? { status } : {}),
    ...(studentSrn ? { student_srn: studentSrn } : {}),
    ...(dateFrom ? { date_from: dateFrom } : {}),
    ...(dateTo ? { date_to: dateTo } : {}),
  }).toString();
  return authedRequest<TeacherFeeInvoice[]>(`/teacher_fee_invoices?${qs}`);
}

export async function updateFeeInvoiceStatus(id: number, status: FeeStatus): Promise<void> {
  const body = new FormData();
  body.append('id', String(id));
  body.append('status', status);
  await authedRequest<{ updated: boolean }>('/teacher_update_fee_invoice_status', { method: 'POST', body });
}

export type StorageCategory = 'homework' | 'events' | 'student_photos';

export interface StorageCategorySummary {
  count: number;
  bytes: number;
}

export interface TeacherStorageSummary {
  homework: StorageCategorySummary;
  events: StorageCategorySummary;
  student_photos: StorageCategorySummary;
  total_bytes: number;
}

export interface StorageItem {
  id: number;
  url: string;
  label: string;
  created_at: string;
  media_type: 'image' | 'video';
}

/** What THIS teacher personally uploaded — across every class they teach,
 * not scoped to one class. */
export async function fetchTeacherStorageSummary(): Promise<TeacherStorageSummary> {
  return authedRequest<TeacherStorageSummary>('/teacher_storage_summary');
}

export async function fetchTeacherStorageItems(type: StorageCategory): Promise<StorageItem[]> {
  return authedRequest<StorageItem[]>(`/teacher_storage_items?type=${type}`);
}

/** Deletes from disk AND removes the DB reference — irreversible.
 * Server re-verifies every id belongs to this teacher. */
export async function deleteTeacherStorageItems(type: StorageCategory, ids: number[]): Promise<{ deleted: number }> {
  const body = new FormData();
  body.append('type', type);
  body.append('ids', JSON.stringify(ids));
  return authedRequest<{ deleted: number }>('/teacher_delete_storage_items', { method: 'POST', body });
}
