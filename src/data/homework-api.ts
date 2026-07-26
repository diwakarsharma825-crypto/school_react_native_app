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
