import {
  Announcement,
  Banner,
  ContactInfo,
  EventItem,
  Facility,
  GalleryImage,
  NewsItem,
  PrincipalMessage,
  ResultRecord,
  Stat,
} from './types';
import {
  findMockResult,
  mockAnnouncements,
  mockBanners,
  mockContact,
  mockEvents,
  mockFacilities,
  mockGallery,
  mockNews,
  mockPrincipalMessage,
  mockStats,
} from './mock';

// ─── Single swap-point ──────────────────────────────────────────────────────
// Today: USE_MOCK = true, every function resolves mock data after a short
// simulated delay. Going live: set BASE_URL, flip USE_MOCK to false (or drop
// it per-function) and confirm/adjust paths + field-mapping below.
export const BASE_URL = 'https://www.saarthakgimsss12a.org/api';
export const USE_MOCK = true;

const MOCK_DELAY_MS = 400;

function delay<T>(value: T, ms: number = MOCK_DELAY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
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
  try {
    return (await response.json()) as T;
  } catch (err) {
    throw new Error(`Invalid JSON response from ${url}`);
  }
}

export async function fetchBanners(): Promise<Banner[]> {
  if (USE_MOCK) return delay(mockBanners);
  return getJson<Banner[]>('/banners');
}

export async function fetchFacilities(): Promise<Facility[]> {
  if (USE_MOCK) return delay(mockFacilities);
  return getJson<Facility[]>('/facilities');
}

export async function fetchStats(): Promise<Stat[]> {
  if (USE_MOCK) return delay(mockStats);
  return getJson<Stat[]>('/stats');
}

export async function fetchPrincipalMessage(): Promise<PrincipalMessage> {
  if (USE_MOCK) return delay(mockPrincipalMessage);
  return getJson<PrincipalMessage>('/principal');
}

export async function fetchEvents(): Promise<EventItem[]> {
  if (USE_MOCK) return delay(mockEvents);
  return getJson<EventItem[]>('/events');
}

export async function fetchEvent(id: string): Promise<EventItem> {
  if (USE_MOCK) {
    const found = mockEvents.find((e) => e.id === id);
    if (!found) throw new Error('Event not found');
    return delay(found);
  }
  return getJson<EventItem>(`/events/${id}`);
}

export async function fetchNews(): Promise<NewsItem[]> {
  if (USE_MOCK) return delay(mockNews);
  return getJson<NewsItem[]>('/news');
}

export async function fetchNewsItem(id: string): Promise<NewsItem> {
  if (USE_MOCK) {
    const found = mockNews.find((n) => n.id === id);
    if (!found) throw new Error('News item not found');
    return delay(found);
  }
  return getJson<NewsItem>(`/news/${id}`);
}

export async function fetchAnnouncements(): Promise<Announcement[]> {
  if (USE_MOCK) return delay(mockAnnouncements);
  return getJson<Announcement[]>('/announcements');
}

export async function fetchGallery(): Promise<GalleryImage[]> {
  if (USE_MOCK) return delay(mockGallery);
  return getJson<GalleryImage[]>('/gallery');
}

export async function fetchContact(): Promise<ContactInfo> {
  if (USE_MOCK) return delay(mockContact);
  return getJson<ContactInfo>('/contact');
}

export async function fetchResult(className: string, roll: string): Promise<ResultRecord> {
  if (USE_MOCK) {
    const found = findMockResult(className, roll);
    if (!found) throw new Error('No result found for the given class and roll number.');
    return delay(found);
  }
  return getJson<ResultRecord>(`/result?class=${encodeURIComponent(className)}&roll=${encodeURIComponent(roll)}`);
}
