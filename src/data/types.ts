// Shapes mirror the live API's response `data` payloads
// (see sarthak-backend Api.php). Every list item that has an image field
// also carries a `<field>_url` absolute URL added server-side — prefer
// those `_url` fields directly, never construct upload paths on the client.

export interface Slider {
  id: number | string;
  title?: string;
  subtitle?: string;
  image?: string;
  image_url: string;
}

export interface Settings {
  school_name: string;
  address: string;
  phone: string;
  email: string;
  logo_url: string | null;
  front_logo_url: string | null;
  about_text?: string | null;
  about_image_url?: string | null;
  courses_text?: string | null;
  course_image_url?: string | null;
  principle_text?: string | null;
  principle_image_url?: string | null;
  footer?: string | null;
  facebook_url?: string | null;
  twitter_url?: string | null;
  instagram_url?: string | null;
  linkedin_url?: string | null;
  youtube_url?: string | null;
  google_plus_url?: string | null;
  pinterest_url?: string | null;
}

export interface Stats {
  total_students: number;
  total_teachers: number;
  total_staff: number;
  total_events: number;
}

export interface NewsItem {
  id: number | string;
  title: string;
  /** Rich-text (often HTML) body — the only content field the API returns. */
  news?: string;
  date: string;
  image?: string;
  image_url: string;
}

export interface EventItem {
  id: number | string;
  title: string;
  /** Rich-text (often HTML) body. */
  note?: string;
  event_from: string;
  event_to?: string;
  event_place?: string | null;
  image?: string;
  image_url: string;
}

export interface Notice {
  id: number | string;
  title: string;
  /** Rich-text (often HTML) body. */
  notice?: string;
  date: string;
}

export interface Holiday {
  id: number | string;
  title: string;
  /** Rich-text (often HTML) body. */
  note?: string;
  date_from: string;
  date_to?: string;
}

export interface Feedback {
  id: number | string;
  name?: string;
  message?: string;
  photo?: string;
  photo_url?: string | null;
}

export interface HomeData {
  sliders: Slider[];
  notices: Notice[];
  events: EventItem[];
  news: NewsItem[];
  feedbacks: Feedback[];
  stats: Stats;
}

export interface GalleryAlbum {
  id: number | string;
  title: string;
  /** No dedicated date field from the API — derive a display date from this. */
  created_at?: string;
  cover_image_url: string | null;
  image_count: number;
}

export interface GalleryImage {
  id: number | string;
  gallery_id?: number | string;
  title?: string;
  caption?: string;
  image?: string;
  image_url: string;
}

export interface Teacher {
  id: number | string;
  teacher_name: string;
  type?: string;
  designation?: string;
  qualification?: string;
  total_experience?: string;
  photo_url: string | null;
}

export interface Student {
  id: number | string;
  name: string;
  class?: string;
  section?: string;
  photo?: string;
  photo_url: string | null;
}

export interface StaffMember {
  id: number | string;
  name: string;
  designation?: string;
  photo?: string;
  photo_url: string | null;
}

export interface MandatoryDisclosureDoc {
  title: string;
  image_url: string;
}

export interface DynamicPage {
  id: number | string;
  page_slug: string;
  title: string;
  description?: string;
}

export interface ResultSession {
  id: number | string;
  label: string;
}

export interface ResultCheckResponse {
  valid: boolean;
  student: {
    id: number | string;
    name: string;
    srn: string;
    class: string;
    section: string;
  };
  pdf_url: string;
}
