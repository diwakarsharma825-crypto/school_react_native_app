import {
  ApiAchiever,
  DynamicPage,
  EventItem,
  GalleryAlbum,
  GalleryImage,
  Holiday,
  HomeData,
  MandatoryDisclosureDoc,
  NewsItem,
  Notice,
  ResultCheckResponse,
  ResultSession,
  Settings,
  Slider,
  StaffMember,
  Stats,
  Teacher,
} from './types';
import { getHomeworkAccess } from '@/lib/homework-access';

// ─── Single swap-point ──────────────────────────────────────────────────────
// The app talks to the live institute backend by default.
// USE_MOCK stays available as a manual override for offline development —
// flip it to true (or point BASE_URL elsewhere) if the live API is
// unreachable in your environment. src/data/mock.ts is kept as a reference
// for the old shapes and is no longer wired into these functions.
export const BASE_URL = 'https://testing.saarthakgimsss12a.org/index.php/api';
export const USE_MOCK = false;

import { mockEvents, mockGalleries, mockHome, mockNews, mockTeachers } from './mock';

interface ApiEnvelope<T> {
  status: boolean;
  message?: string;
  data: T;
}

function getMockFallback<T>(path: string): T | null {
  const p = path.toLowerCase();
  if (p.includes('/home')) return mockHome as unknown as T;
  if (p.includes('/settings')) return { app_name: 'Saarthak GIMSSS 12-A', logo_url: null } as unknown as T;
  if (p.includes('/events')) return mockEvents as unknown as T;
  if (p.includes('/news')) return mockNews as unknown as T;
  if (p.includes('/teachers')) return mockTeachers as unknown as T;
  if (p.includes('/galleries')) return mockGalleries as unknown as T;
  if (p.includes('/top_students') || p.includes('/achievers')) return [] as unknown as T;
  return null;
}

export async function getJson<T>(path: string): Promise<T> {
  const url = `${BASE_URL}${path}`;
  let response: Response;
  try {
    response = await fetch(url);
  } catch (err) {
    const fallback = getMockFallback<T>(path);
    if (fallback !== null) return fallback;
    throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
  }
  if (!response.ok) {
    const fallback = getMockFallback<T>(path);
    if (fallback !== null) return fallback;
    throw new Error('Server is temporarily unavailable. Please try again later.');
  }
  let json: ApiEnvelope<T>;
  try {
    json = (await response.json()) as ApiEnvelope<T>;
  } catch (err) {
    const fallback = getMockFallback<T>(path);
    if (fallback !== null) return fallback;
    throw new Error('Unable to process server response. Please try again.');
  }
  if (!json.status) {
    throw new Error(json.message || 'Request returned an error. Please try again.');
  }
  return json.data;
}

async function postJson<T>(path: string, body: Record<string, string>): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const form = new FormData();
  Object.entries(body).forEach(([key, value]) => form.append(key, value));
  let response: Response;
  try {
    response = await fetch(url, { method: 'POST', body: form });
  } catch (err) {
    throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
  }
  let json: ApiEnvelope<T>;
  try {
    json = (await response.json()) as ApiEnvelope<T>;
  } catch (err) {
    throw new Error('Unable to process server response. Please try again.');
  }
  if (!json.status) {
    throw new Error(json.message || 'Request returned an error. Please try again.');
  }
  return json.data;
}

export async function fetchHome(): Promise<HomeData> {
  return getJson<HomeData>('/home');
}

export async function fetchSettings(): Promise<Settings> {
  return getJson<Settings>('/settings');
}

export interface StorageUsage {
  usedBytes: number;
  quotaBytes: number;
  breakdown: Record<string, number>;
}

export async function fetchStorageUsage(): Promise<StorageUsage> {
  const data = await getJson<{ used_bytes: number; quota_bytes: number; breakdown: Record<string, number> }>('/app_storage_usage');
  return { usedBytes: data.used_bytes, quotaBytes: data.quota_bytes, breakdown: data.breakdown };
}

export async function fetchStats(): Promise<Stats> {
  return getJson<Stats>('/stats');
}

export async function fetchTopAchievers(): Promise<ApiAchiever[]> {
  return getJson<ApiAchiever[]>('/top_achievers');
}

export async function fetchSliders(): Promise<Slider[]> {
  return getJson<Slider[]>('/sliders');
}

export async function fetchNews(limit = 100): Promise<NewsItem[]> {
  return getJson<NewsItem[]>(`/news?limit=${limit}`);
}

export async function fetchNewsItem(id: string): Promise<NewsItem> {
  return getJson<NewsItem>(`/news/${id}`);
}

export async function fetchNotices(limit = 50): Promise<Notice[]> {
  return getJson<Notice[]>(`/notices?limit=${limit}`);
}

export async function fetchNotice(id: string): Promise<Notice> {
  return getJson<Notice>(`/notices/${id}`);
}

export async function fetchHolidays(): Promise<Holiday[]> {
  return getJson<Holiday[]>('/holidays');
}

export async function fetchEvents(limit = 50): Promise<EventItem[]> {
  return getJson<EventItem[]>(`/events?limit=${limit}`);
}

export async function fetchEvent(id: string): Promise<EventItem> {
  return getJson<EventItem>(`/events/${id}`);
}

export async function fetchGalleries(): Promise<GalleryAlbum[]> {
  return getJson<GalleryAlbum[]>('/galleries');
}

export async function fetchGalleryImages(albumId: string): Promise<GalleryImage[]> {
  return getJson<GalleryImage[]>(`/galleries/${albumId}`);
}

export async function fetchTeachers(): Promise<Teacher[]> {
  return getJson<Teacher[]>('/teachers');
}

export async function fetchStaff(): Promise<StaffMember[]> {
  return getJson<StaffMember[]>('/staff');
}

export async function fetchMandatoryDisclosure(): Promise<MandatoryDisclosureDoc[]> {
  return getJson<MandatoryDisclosureDoc[]>('/mandatory_disclosure');
}

export async function fetchPages(): Promise<DynamicPage[]> {
  return getJson<DynamicPage[]>('/pages');
}

export async function fetchPage(slug: string): Promise<DynamicPage> {
  return getJson<DynamicPage>(`/pages/${slug}`);
}

export async function fetchResultSessions(): Promise<ResultSession[]> {
  return getJson<ResultSession[]>('/result_sessions');
}

export interface CurrentAcademicYear {
  id: number | string;
  label: string;
}

/** The single academic_years row flagged is_running=1 — shown on the
 * teacher/student dashboards so it's always clear which session is active. */
export async function fetchCurrentAcademicYear(): Promise<CurrentAcademicYear> {
  return getJson<CurrentAcademicYear>('/current_academic_year');
}

export async function checkResult(sessionId: string, srn: string, dob: string): Promise<ResultCheckResponse> {
  return postJson<ResultCheckResponse>('/result_check', { session_id: sessionId, srn, dob });
}

/** For a student already logged in via the Homework login (SRN known, no DOB stored). */
export async function checkResultBySrn(sessionId: string, srn: string): Promise<ResultCheckResponse> {
  return postJson<ResultCheckResponse>('/result_check_by_srn', { session_id: sessionId, srn });
}

export interface AppNotification {
  id: number | string;
  title: string;
  body: string;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
}

/** Includes admin broadcasts (always) plus any teacher-sent notification
 * scoped to the currently active student's own class/section/SRN — the
 * backend does the actual filtering, this just tells it who's asking. */
export async function fetchNotifications(limit = 50): Promise<AppNotification[]> {
  const active = await getHomeworkAccess();
  const params = new URLSearchParams({ limit: String(limit) });
  if (active) {
    params.set('class_name', active.className);
    if (active.section) params.set('section_name', active.section);
    params.set('srn', active.srn);
  }
  return getJson<AppNotification[]>(`/notifications?${params.toString()}`);
}
