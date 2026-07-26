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

// ─── Single swap-point ──────────────────────────────────────────────────────
// The app talks to the real, live Saarthak GIMSSS backend by default.
// USE_MOCK stays available as a manual override for offline development —
// flip it to true (or point BASE_URL elsewhere) if the live API is
// unreachable in your environment. src/data/mock.ts is kept as a reference
// for the old shapes and is no longer wired into these functions.
export const BASE_URL = 'https://testing.saarthakgimsss12a.org/api';
export const USE_MOCK = false;

interface ApiEnvelope<T> {
  status: boolean;
  message: string;
  data: T;
}

export async function getJson<T>(path: string): Promise<T> {
  const url = `${BASE_URL}${path}`;
  let response: Response;
  try {
    response = await fetch(url);
  } catch (err) {
    throw new Error(`Network request failed for ${url}`);
  }
  if (!response.ok) {
    throw new Error(`Request to ${url} failed with status ${response.status}`);
  }
  let json: ApiEnvelope<T>;
  try {
    json = (await response.json()) as ApiEnvelope<T>;
  } catch (err) {
    throw new Error(`Invalid JSON response from ${url}`);
  }
  if (!json.status) {
    throw new Error(json.message || `Request to ${url} returned an error`);
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
    throw new Error(`Network request failed for ${url}`);
  }
  let json: ApiEnvelope<T>;
  try {
    json = (await response.json()) as ApiEnvelope<T>;
  } catch (err) {
    throw new Error(`Invalid JSON response from ${url}`);
  }
  if (!json.status) {
    throw new Error(json.message || `Request to ${url} returned an error`);
  }
  return json.data;
}

export async function fetchHome(): Promise<HomeData> {
  return getJson<HomeData>('/home');
}

export async function fetchSettings(): Promise<Settings> {
  return getJson<Settings>('/settings');
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

export async function checkResult(sessionId: string, srn: string, dob: string): Promise<ResultCheckResponse> {
  return postJson<ResultCheckResponse>('/result_check', { session_id: sessionId, srn, dob });
}

export interface AppNotification {
  id: number | string;
  title: string;
  body: string;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
}

export async function fetchNotifications(limit = 50): Promise<AppNotification[]> {
  return getJson<AppNotification[]>(`/notifications?limit=${limit}`);
}
