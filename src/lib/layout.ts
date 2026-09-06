import type { Href } from 'expo-router';

import type { SectionKey } from '@/data/app-status';

/** Every screen an admin-configured home-tile or bottom-tab slot can point
 * to — keep in sync with the backend's Appcontrol_Model::$target_catalog. */
export type LayoutTarget =
  | 'home'
  | 'events'
  | 'gallery'
  | 'more'
  | 'notices'
  | 'result'
  | 'disclosure'
  | 'contact'
  | 'about'
  | 'teachers'
  | 'top_students'
  | 'notifications'
  | 'homework'
  | 'syllabus'
  | 'teacher_subjects'
  | 'teacher_promote'
  | 'login'
  | 'classmates'
  | 'url';

export const TARGET_ROUTES: Record<Exclude<LayoutTarget, 'url'>, Href> = {
  home: '/(tabs)',
  events: '/(tabs)/events',
  gallery: '/(tabs)/gallery',
  more: '/(tabs)/more',
  notices: '/notices',
  result: '/result',
  disclosure: '/disclosure',
  contact: '/contact',
  about: '/about',
  teachers: '/teachers',
  top_students: '/top-students',
  notifications: '/notifications',
  homework: '/homework',
  syllabus: '/syllabus',
  teacher_subjects: '/teacher-subjects',
  teacher_promote: '/teacher-promote',
  login: '/login',
  classmates: '/classmates',
};

/** Only some targets correspond to an admin-togglable section (see
 * SectionKey) — used to show the "Coming Soon" lock badge on a tile/tab
 * whose target has been turned off in App Sections. */
export const TARGET_SECTION_KEY: Partial<Record<LayoutTarget, SectionKey>> = {
  events: 'events',
  gallery: 'gallery',
  notices: 'notices',
  result: 'result',
  teachers: 'teachers',
  top_students: 'top_students',
  disclosure: 'disclosure',
  classmates: 'classmates',
};

export interface LayoutItem {
  label: string;
  icon: string;
  colorBg: string | null;
  colorFg: string | null;
  target: LayoutTarget;
  targetUrl: string | null;
}
