import AsyncStorage from '@react-native-async-storage/async-storage';

import { BASE_URL } from './api';

const TOKEN_KEY = 'saarthak.teacher_token';

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

export interface TeacherProfileClass {
  class_id: number;
  class_name: string;
  section_id: number | null;
  section_name: string | null;
  stream: string | null;
}

export interface TeacherProfile {
  signature_url: string | null;
  completed: boolean;
  classes: TeacherProfileClass[];
}

export async function fetchTeacherProfile(): Promise<TeacherProfile> {
  return authedRequest<TeacherProfile>('/teacher_profile');
}

export interface ClassPickerItem {
  id: number;
  name: string;
  sections: { id: number; name: string }[];
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
    body.append('signature', { uri: signatureUri, name: 'signature.jpg', type: 'image/jpeg' } as unknown as Blob);
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
  homework_date: string;
  description: string | null;
  attachments: { photo_url: string }[];
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
  date: string;
  description: string;
  photoUris: string[];
}): Promise<{ id: number }> {
  const token = await getTeacherToken();
  const body = new FormData();
  body.append('class_id', String(params.classId));
  if (params.sectionId) body.append('section_id', String(params.sectionId));
  body.append('subject', params.subject);
  body.append('date', params.date);
  body.append('description', params.description);
  params.photoUris.forEach((uri, i) => {
    body.append('photos[]', { uri, name: `photo-${i}.jpg`, type: 'image/jpeg' } as unknown as Blob);
  });
  const response = await fetch(`${BASE_URL}/teacher_save_homework`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body,
  });
  const json = (await response.json()) as ApiEnvelope<{ id: number }>;
  if (!json.status) throw new Error(json.message);
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
