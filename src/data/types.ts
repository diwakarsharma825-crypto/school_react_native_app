export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export interface Facility {
  id: string;
  title: string;
  description: string;
  icon: string;
  imageUrl?: string;
}

export interface Stat {
  id: string;
  label: string;
  value: number;
  icon: string;
}

export interface PrincipalMessage {
  name: string;
  role: string;
  photoUrl: string;
  message: string;
}

export interface EventItem {
  id: string;
  title: string;
  date: string;
  location?: string;
  imageUrl: string;
  excerpt: string;
  body: string;
}

export interface NewsItem {
  id: string;
  title: string;
  date: string;
  imageUrl: string;
  excerpt: string;
  body: string;
}

export type AnnouncementKind = 'news' | 'notice' | 'holiday';

export interface Announcement {
  id: string;
  kind: AnnouncementKind;
  title: string;
  date: string;
  detail: string;
}

export interface GalleryImage {
  id: string;
  imageUrl: string;
  caption?: string;
  album?: string;
}

export interface ContactInfo {
  address: string;
  phone: string;
  email: string;
  mapUrl: string;
  social: {
    facebook?: string;
    youtube?: string;
    instagram?: string;
  };
}

export interface ResultSubject {
  name: string;
  marks: number;
  max: number;
  grade: string;
}

export interface ResultRecord {
  studentName: string;
  className: string;
  rollNo: string;
  term: string;
  percentage: number;
  subjects: ResultSubject[];
}
