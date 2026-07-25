// Reference-only mock data kept for offline development. Not imported by
// src/data/api.ts anymore — the app talks to the live backend by default
// (see USE_MOCK in api.ts). Shapes match src/data/types.ts.
import { EventItem, GalleryAlbum, HomeData, NewsItem, Teacher } from './types';

export const mockNews: NewsItem[] = [
  {
    id: 'n1',
    title: 'CBSE Class XII Toppers Announced',
    date: '2026-06-15',
    image_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
    news: 'Our students excel with outstanding results in CBSE Class XII board exams.',
  },
];

export const mockEvents: EventItem[] = [
  {
    id: 'e1',
    title: 'Annual Sports Day',
    event_from: '2026-09-28',
    event_place: 'School Grounds, Sector 12-A',
    image_url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800',
    note: 'A day of athletic events, races and team spirit for all classes.',
  },
];

export const mockGalleries: GalleryAlbum[] = [
  {
    id: 'g1',
    title: 'Annual Sports Day',
    created_at: '2026-06-15 00:00:00',
    cover_image_url: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=600',
    image_count: 12,
  },
];

export const mockTeachers: Teacher[] = [
  {
    id: 't1',
    teacher_name: 'Priya Kapoor',
    designation: 'Mathematics',
    qualification: 'M.Sc, B.Ed',
    total_experience: '8 years',
    photo_url: null,
  },
];

export const mockHome: HomeData = {
  sliders: [],
  notices: [],
  events: mockEvents,
  news: mockNews,
  feedbacks: [],
  stats: { total_students: 2759, total_teachers: 22, total_staff: 40, total_events: 3 },
};
