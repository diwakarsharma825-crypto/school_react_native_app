import { BASE_URL } from './api';

interface ApiEnvelope<T> {
  status: boolean;
  message: string;
  data: T;
}

export interface HomeworkEntry {
  id: number;
  subject: string;
  homework_date: string;
  description: string | null;
  attachments: { photo_url: string }[];
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`);
  const json = (await response.json()) as ApiEnvelope<T>;
  if (!json.status) throw new Error(json.message || 'Request failed');
  return json.data;
}

export async function fetchHomeworkDates(
  className: string,
  section: string | undefined,
  year: number,
  month: number
): Promise<string[]> {
  const qs = `class=${encodeURIComponent(className)}${section ? `&section=${encodeURIComponent(section)}` : ''}&year=${year}&month=${month}`;
  return getJson<string[]>(`/student_homework_dates?${qs}`);
}

export async function fetchHomeworkForDate(
  className: string,
  section: string | undefined,
  date: string
): Promise<HomeworkEntry[]> {
  const qs = `class=${encodeURIComponent(className)}${section ? `&section=${encodeURIComponent(section)}` : ''}&date=${date}`;
  return getJson<HomeworkEntry[]>(`/student_homework?${qs}`);
}

export interface StudentLoginResult {
  name: string;
  srn: string;
  class: string;
  section: string;
}

/** Real, server-verified student login against `result_students` (SRN or
 * phone + md5 password) — replaces the earlier unverified local-only form.
 * Class/section come back from the DB record itself, not picked manually. */
export async function studentLogin(identifier: string, password: string): Promise<StudentLoginResult> {
  const body = new FormData();
  body.append('identifier', identifier);
  body.append('password', password);
  const response = await fetch(`${BASE_URL}/student_login`, { method: 'POST', body });
  const json = (await response.json()) as ApiEnvelope<StudentLoginResult>;
  if (!json.status) throw new Error(json.message || 'Login failed');
  return json.data;
}
