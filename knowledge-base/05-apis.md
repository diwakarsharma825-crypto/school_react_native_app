# 05 · API Integration Contract

> **This is the file to fill in.** It defines every endpoint the app needs, the exact JSON
> shape it expects, and how it plugs into the code. Give the values here and the app goes live.

- **App-side code that consumes these:** `src/data/api.ts` (the only file that changes).
- **Data shapes (TypeScript):** `src/data/types.ts`.
- **Today:** `api.ts` has `USE_MOCK = true` and returns placeholder data. Setting `BASE_URL`
  and flipping `USE_MOCK = false` (or per-function) switches to your live API.

---

## Step 1 — Base configuration

Fill these in and hand them back (or paste a Postman/Swagger link and Claude maps everything):

```
BASE_URL   =  https://__________________________   (e.g. https://api.saarthakgimsss12a.org)
Auth       =  none | API key header | bearer token   (which? and header name if any)
Format      =  JSON
```

If auth is needed, say how (e.g. header `x-api-key: <key>`), and how the key is provided.

---

## Step 2 — Endpoints

For each row: the app function, the HTTP call it will make, and the model it maps to.
**Method is GET unless noted.** Fill the "Your URL / path" column (or confirm the suggested path).

| # | App function (`api.ts`) | Suggested path | Your URL / path | Returns (model) |
|---|-------------------------|----------------|-----------------|-----------------|
| 1 | `fetchBanners()` | `/banners` | ______________ | `Banner[]` |
| 2 | `fetchFacilities()` | `/facilities` | ______________ | `Facility[]` |
| 3 | `fetchStats()` | `/stats` | ______________ | `Stat[]` |
| 4 | `fetchPrincipalMessage()` | `/principal` | ______________ | `PrincipalMessage` |
| 5 | `fetchEvents()` | `/events` | ______________ | `EventItem[]` |
| 6 | `fetchEvent(id)` | `/events/{id}` | ______________ | `EventItem` |
| 7 | `fetchNews()` | `/news` | ______________ | `NewsItem[]` |
| 8 | `fetchNewsItem(id)` | `/news/{id}` | ______________ | `NewsItem` |
| 9 | `fetchAnnouncements()` | `/announcements` | ______________ | `Announcement[]` |
| 10 | `fetchGallery()` | `/gallery` | ______________ | `GalleryImage[]` |
| 11 | `fetchContact()` | `/contact` | ______________ | `ContactInfo` |
| 12 | `fetchResult(class, roll)` | `/result?class={c}&roll={r}` | ______________ | `ResultRecord` |

> If your API returns a wrapper like `{ "data": [...] , "status": "ok" }`, that's fine — just
> note it and Claude will unwrap `.data` in `api.ts`. Field names not matching the shapes below
> are also fine; note the differences and they'll be mapped.

---

## Step 3 — Expected JSON shapes

These mirror `src/data/types.ts`. Match them if you can; otherwise send your actual shapes and
they'll be mapped. Dates: ISO `YYYY-MM-DD` preferred (any parseable date works).

### 1. Banner[] — hero carousel
```json
[
  {
    "id": "b1",
    "title": "Welcome to Saarthak GIMSS",
    "subtitle": "Vedic Culture · Scientific Approach · Communication",
    "imageUrl": "https://.../banner1.jpg",
    "ctaLabel": "Admissions Open",
    "ctaHref": "contact"
  }
]
```
`subtitle`, `ctaLabel`, `ctaHref` optional. `ctaHref` may be a screen name
(`events` | `gallery` | `contact`) or omitted.

### 2. Facility[] — Our Facilities cards
```json
[
  { "id": "f1", "title": "Our Teachers", "description": "…", "icon": "people", "imageUrl": "https://.../t.jpg" }
]
```
`icon` = an Ionicons name (`people`, `happy`, `book`, `school`…). `imageUrl` optional.

### 3. Stat[] — achievement counters
```json
[
  { "id": "s1", "label": "Teachers", "value": 22, "icon": "people" },
  { "id": "s2", "label": "Students", "value": 2759, "icon": "school" },
  { "id": "s3", "label": "Events", "value": 3, "icon": "calendar" }
]
```
`value` must be a number (the app animates 0 → value).

### 4. PrincipalMessage — single object
```json
{ "name": "Dr. A. Sharma", "role": "Principal, Saarthak GIMSS", "photoUrl": "https://.../p.jpg", "message": "…" }
```

### 5 & 6. EventItem / EventItem[]
```json
{
  "id": "e1",
  "title": "Annual Sports Day",
  "date": "2026-09-28",
  "location": "School Grounds, Sector 12-A",
  "imageUrl": "https://.../e.jpg",
  "excerpt": "Short one-line summary for the card.",
  "body": "Full description shown on the detail screen."
}
```
`location` optional. List endpoint returns an array of these; detail endpoint returns one.

### 7 & 8. NewsItem / NewsItem[]
```json
{ "id": "n1", "title": "CBSE Toppers Announced", "date": "2026-06-15", "imageUrl": "https://.../n.jpg", "excerpt": "…", "body": "…" }
```

### 9. Announcement[] — News / Notice / Holiday
```json
[
  { "id": "a1", "kind": "notice",  "title": "Fee submission open", "date": "2026-07-10", "detail": "…" },
  { "id": "a2", "kind": "holiday", "title": "Independence Day",     "date": "2026-08-15", "detail": "…" },
  { "id": "a3", "kind": "news",    "title": "New Science Lab",      "date": "2026-07-05", "detail": "…" }
]
```
`kind` must be one of: `"news"`, `"notice"`, `"holiday"` (used by the segmented tabs).

### 10. GalleryImage[]
```json
[
  { "id": "g1", "imageUrl": "https://.../1.jpg", "caption": "Sports Day", "album": "Events" }
]
```
`caption`, `album` optional.

### 11. ContactInfo — single object
```json
{
  "address": "Saarthak GIMSS, Sector 12-A, Panchkula, Haryana 134109",
  "phone": "+91 00000 00000",
  "email": "info@saarthakgimsss12a.org",
  "mapUrl": "https://maps.google.com/?q=Sector+12A+Panchkula",
  "social": { "facebook": "https://…", "youtube": "https://…", "instagram": "https://…" }
}
```

### 12. ResultRecord — report card lookup
```json
{
  "studentName": "…",
  "className": "Class VIII-A",
  "rollNo": "23",
  "term": "Term 1, 2026",
  "percentage": 88.4,
  "subjects": [
    { "name": "English", "marks": 86, "max": 100, "grade": "A" }
  ]
}
```
Query params: `class` and `roll` (adjust to your API — e.g. admission number — and note it).
Consider what happens for "not found" (404 vs empty) so the app shows the right message.

---

## Step 4 — How it gets wired (Claude does this)

In `src/data/api.ts`, each function currently looks like:

```ts
export async function fetchEvents(): Promise<EventItem[]> {
  if (USE_MOCK) return delay().then(() => mockEvents);
  return getJson<EventItem[]>('/events');   // ← real endpoint
}
```

Going live means: set `BASE_URL`, set `USE_MOCK = false`, confirm each path, and add any
field-mapping. Example if your API differs (wrapped + different keys):

```ts
export async function fetchEvents(): Promise<EventItem[]> {
  const res = await getJson<{ data: any[] }>('/api/v1/events');
  return res.data.map((e) => ({
    id: String(e.event_id),
    title: e.name,
    date: e.event_date,
    location: e.venue,
    imageUrl: e.image,
    excerpt: e.short_desc,
    body: e.description,
  }));
}
```

## Notes / gotchas

- **CORS** doesn't apply (native app), but **HTTPS is required** for release builds
  (Android blocks plain `http://` by default).
- **Image URLs** must be publicly reachable absolute URLs.
- Keep responses reasonably small; pagination can be added later if lists grow large.
- Send even a **partial** set of endpoints — the app wires per-section, so any live endpoint
  can go in while the rest stay on mock.

## Checklist to hand back

- [ ] Base URL
- [ ] Auth details (if any)
- [ ] The 12 endpoint paths (or a Postman/Swagger link)
- [ ] Any fields that differ from the shapes above
- [ ] Result lookup params (class + roll? admission no.?) and not-found behavior
