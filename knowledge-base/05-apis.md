# 05 · API Integration Contract (REAL — verified against the live server)

> This used to be a template to fill in. It no longer is — the real API was found and
> documented directly from `sarthak-backend/application/modules/web/controllers/Api.php`
> plus live requests against the production server. **If you're adding a new screen, open
> `Api.php` and read the real method, or `fetch()` the real endpoint in a browser console —
> do not guess field names from what "sounds right".** Guessed field names caused multiple
> runtime crashes and blank UI in this session (see the note at the bottom).

## Base configuration

```
BASE_URL = https://www.saarthakgimsss12a.org/api
Auth     = none (public read endpoints; CORS is open, * origin)
Format   = JSON, always wrapped: { "status": bool, "message": string, "data": T }
```

`src/data/api.ts`'s `getJson<T>()` unwraps `.data` — functions return `T` directly, already
unwrapped. `USE_MOCK` is `false` by default; `src/data/mock.ts` still exists as an offline
reference/fallback but is not imported by `api.ts`.

## Endpoints and their REAL field names

| App function | Path | Real fields you actually get | Notes |
|---|---|---|---|
| `fetchHome()` | `GET /home` | `{ sliders, notices, events, news, feedbacks, stats }` | One call for the whole Home screen |
| `fetchSettings()` | `GET /settings` | `school_name, address, phone, email, logo_url, front_logo_url, about_text, about_image_url, courses_text, course_image_url, principle_text, principle_image_url, footer, facebook_url, twitter_url, instagram_url, linkedin_url, youtube_url` | Rich-text fields (`about_text`, `courses_text`, `principle_text`) are **raw HTML** — run through `stripHtml()` |
| `fetchStats()` | `GET /stats` | `total_students, total_teachers, total_staff, total_events` | |
| `fetchSliders()` | `GET /sliders` | `id, title?, subtitle?, image_url` | Home banner carousel |
| `fetchNews(limit)` / `fetchNewsItem(id)` | `GET /news`, `/news/{id}` | `id, title, date, image_url, news` (⚠️ **not** `description` — the body/excerpt column is literally called `news`) | |
| `fetchNotices(limit)` / `fetchNotice(id)` | `GET /notices`, `/notices/{id}` | `id, title, date, notice` (⚠️ body is `notice`, HTML) | |
| `fetchHolidays()` | `GET /holidays` | `id, title, date_from, date_to, note` (⚠️ **no** `date` field — it's `date_from`/`date_to`; body is `note`) | |
| `fetchEvents(limit)` / `fetchEvent(id)` | `GET /events`, `/events/{id}` | `id, title, event_from, event_to, event_place, note, image_url` (⚠️ **no** `date`/`description`/`location` — they're `event_from`, `note`, `event_place`) | |
| `fetchGalleries()` | `GET /galleries` | `id, title, cover_image_url, image_count, created_at` (⚠️ **no** dedicated `date` field — derive display date from `created_at`, format `"YYYY-MM-DD HH:MM:SS"`, split off the date part before formatting) | List is ALBUMS, not flat photos |
| `fetchGalleryImages(albumId)` | `GET /galleries/{id}` | one album's images | |
| `fetchTeachers()` | `GET /teachers` | `id, teacher_name, type, designation, qualification, total_experience, photo_url` (⚠️ **not** `name`/`subject`/`experience` — this crashed the app once already) | `photo_url` is often `null` — UI falls back to colored initials avatar |
| `fetchStaff()` | `GET /staff` | similar shape to teachers, field names not yet double-checked against live data — verify before using | Currently unused by any screen |
| `fetchMandatoryDisclosure()` | `GET /mandatory_disclosure` | `[{ title, image_url }]` | Static curated list server-side |
| `fetchPages(slug?)` | `GET /pages`, `/pages/{slug}` | dynamic CMS pages | |
| `fetchResultSessions()` | `GET /result_sessions` | `[{ id, label }]` | Academic year dropdown |
| `checkResult({session_id, srn, dob})` | `POST /result_check` | `{ valid, student: {id,name,srn,class,section}, pdf_url }` | Real lookup is **session + SRN + DOB**, not class+roll like an early mock guessed |
| `/result_pdf?id=&h=` | `GET` (opened via `Linking`, not fetched as JSON) | streams a PDF | Signed link from `result_check`'s response, don't construct it yourself |
| `registerDevice()` | `POST /device_register` | `{ device_id, phone?, push_token?, platform, model?, os_version?, app_version, ... }` | Fire-and-forget on every launch |
| `fetchAppStatus()` | `GET /app_status?device_id=` | `{ enabled, reason, title, message, dev_name, phone, email, whatsapp }` | See 01-project-overview.md's "App restriction" section |
| `fetchNotifications()` | `GET /notifications` | `[{ id, title, body, image_url?, video_url?, created_at }]` | `body` may be HTML — strip it |

## Known gaps / unverified

- `StaffMember`/`fetchStaff()` — type exists in `types.ts` but no screen consumes it yet and
  its exact field names haven't been confirmed against a live response the way teachers'
  were. Verify before building a "Our Staff" screen.
- `top-students.tsx` — the backend has **no ranked/topper field** on `/students`. The
  current screen is a placeholder pointing users to News/Notices where topper
  announcements actually get posted (see the "TOPPERS OF CLASS X & XII" news post). If real
  topper data becomes available server-side, redesign this screen properly.

## The lesson, for next time

Every one of the "known gaps" above, and several bugs already fixed this session
(teachers screen crash, blank date badges on event/news cards, raw HTML rendering in
principal's message), came from **assuming a field name instead of checking the real
response**. The fix is always the same: open `Api.php` for the PHP-side truth, or run
`fetch('https://www.saarthakgimsss12a.org/api/<endpoint>').then(r=>r.json())` in a browser
console pointed at the running app, and read the actual JSON before writing the TypeScript
type.
