# 02 · Specifications — Screens & Sections

Every website section, mapped to an app screen, with the data it needs. Source website:
https://www.saarthakgimsss12a.org/

## Navigation model

- **Bottom tabs (4):** Home · Events · Gallery · More
- **Push screens (from tabs):** Event detail, News detail, Announcements, Result, Contact, About
- Root is a Stack; the tabs live in a `(tabs)` group so detail screens push over the tab bar.
- Branded blue header across all screens.

## Screens

### Home — `src/app/(tabs)/index.tsx`
The landing screen; assembles multiple sections.
| Section | Component | Data source (api.ts) |
|---------|-----------|----------------------|
| Hero carousel (auto-advancing banners + CTA) | `home/carousel.tsx` | `fetchBanners()` |
| Achievement stats (animated count-up) | `home/stat-counter.tsx` | `fetchStats()` |
| Our Facilities (Teachers / Students / Courses) | `home/facility-card.tsx` | `fetchFacilities()` |
| Principal's Message | `home/principal-card.tsx` | `fetchPrincipalMessage()` |
| Latest Events strip (horizontal) | `ui/media-card.tsx` | `fetchEvents()` |
| Latest News strip (horizontal) | `ui/media-card.tsx` | `fetchNews()` |
- Pull-to-refresh refetches all sections.
- CTA / "See all" / cards navigate to the relevant screens.

### Events — `src/app/(tabs)/events.tsx`
Vertical list of event cards → tap opens **Event detail** (`event/[id].tsx`).
Data: `fetchEvents()`, `fetchEvent(id)`.

### Gallery — `src/app/(tabs)/gallery.tsx`
2-column photo grid; tap a photo → full-screen zoom lightbox modal with caption.
Data: `fetchGallery()`.

### More — `src/app/(tabs)/more.tsx`
Menu hub. Groups:
- **Explore:** About, Announcements, Result / Report Card, Contact
- **Information:** Mandatory Disclosure, Terms & Conditions, Privacy Policy
- **Follow Us:** Facebook, YouTube, Instagram (open in browser)

### Announcements — `src/app/announcements.tsx`
Segmented control **News / Notice / Holiday**, filters a single list.
Data: `fetchAnnouncements()` (each item has a `kind`).

### Result / Report Card — `src/app/result.tsx`
Form (class + roll number) → result card with subject table and percentage.
Data: `fetchResult(className, rollNo)`.

### Contact — `src/app/contact.tsx`
Address / phone / email rows with tap actions (open maps, dial, email), Call + Directions
buttons, and social icons. Data: `fetchContact()`.

### About — `src/app/about.tsx`
School intro, "Our Values" (Vedic Culture / Scientific Approach / Communication),
Principal's message, and legal links. Data: `fetchPrincipalMessage()`.

### Event detail / News detail — `src/app/event/[id].tsx`, `src/app/news/[id].tsx`
Shared `ui/article-detail.tsx`: hero image, title, date, location (events), body text.

## Cross-cutting requirements

- Every data screen shows **Loading**, **Error (+retry)**, and **Empty** states
  (`ui/states.tsx`) and supports **pull-to-refresh** where it's a scroll list.
- Images via `expo-image` (memory/disk cached, fade-in). Remote URLs come from the API.
- Fully themed light/dark. No hardcoded content in screens — all via `api.ts`.
