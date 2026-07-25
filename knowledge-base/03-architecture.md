# 03 · Architecture

## Data flow

```
[Real live School Backend API — saarthakgimsss12a.org/api]
        │  JSON over HTTPS, envelope: { status, message, data }
        ▼
src/data/api.ts        ← SINGLE SWAP-POINT. One async function per section.
        │                 USE_MOCK = false by default — hits the real API.
        ▼
src/hooks/use-fetch.ts ← { data, loading, error, refetch } wrapper
        │
        ▼
Screens (src/app/**)   ← render data + loading/error/empty/refresh states
```

The app never calls `fetch` directly from a screen. Screens call typed functions from
`api.ts` through the `useFetch` hook.

Separately, `src/data/app-status.ts` handles the device-restriction check
(`GET /app_status?device_id=`) and device registration (`POST /device_register`) — this
runs once at app launch from `src/app/_layout.tsx`, independent of `USE_MOCK`, because it's
infrastructure (kill-switch) rather than content.

## Folder structure

```
saarthak-app/
├── knowledge-base/          ← this documentation
├── Saarthak-GIMSSS.apk      ← a real prior production build, kept as a design reference
│                               (install on an emulator to see the real app if in doubt)
├── src/
│   ├── app/                 ← ROUTES (file = screen)
│   │   ├── _layout.tsx      ← root Stack, device-restriction gate + lock screen,
│   │   │                      DetailHeader wiring for every detail route
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx  ← bottom tabs (Home/Events/Gallery/More), AppHeader
│   │   │   ├── index.tsx    ← Home (carousel, quick actions, principal, stats, news, events)
│   │   │   ├── events.tsx   ← full-width event card list
│   │   │   ├── gallery.tsx  ← 2-col ALBUM grid (not a flat photo grid)
│   │   │   └── more.tsx     ← Explore / Information / Follow-Us sections
│   │   ├── event/[id].tsx, news/[id].tsx   ← detail routes
│   │   ├── news/index.tsx                  ← "See all" news list
│   │   ├── gallery/[id].tsx                ← one album's photos + lightbox
│   │   ├── notices.tsx                     ← News/Notice/Holiday segmented tabs
│   │   ├── notifications.tsx               ← in-app notification inbox
│   │   ├── teachers.tsx, top-students.tsx, disclosure.tsx
│   │   ├── result.tsx       ← session + SRN + DOB → PDF report card
│   │   ├── contact.tsx, about.tsx
│   │   └── announcements.tsx               ← redirects to /notices (legacy route kept)
│   ├── components/
│   │   ├── ui/   Card, Button, Badge, Screen, SectionHeader, ThemedText,
│   │   │         MediaCard (news/event card w/ date+category pills),
│   │   │         ArticleDetail (detail hero+meta+body, strips HTML),
│   │   │         AppHeader (logo+name+address+bell), DetailHeader (back+title),
│   │   │         LockScreen (device-restriction full-screen block),
│   │   │         states.tsx (branded Loading + ErrorState + EmptyState)
│   │   └── home/ Carousel, QuickActionGrid, PrincipalCard, StatsRow
│   ├── constants/theme.ts   ← design tokens — see 04-design-system.md
│   ├── data/
│   │   ├── types.ts         ← TS models — MUST mirror sarthak-backend's Api.php exactly
│   │   │                      (real field names like teacher_name/event_from/note, not
│   │   │                      guessed ones like name/date/description — see 05-apis.md)
│   │   ├── mock.ts           ← reference-only, NOT imported by api.ts anymore
│   │   ├── api.ts            ← THE SWAP-POINT, USE_MOCK = false
│   │   └── app-status.ts     ← device-restriction check + registration (see 01-project-overview.md)
│   ├── hooks/  use-fetch.ts, use-theme.ts, use-color-scheme.ts (always 'light')
│   └── lib/    format.ts (formatDate/formatDateShort/stripHtml/excerptFrom), device.ts
├── app.json                 ← Expo config; icons at assets/images/ are the REAL logo,
│                               extracted from the recovered APK via aapt2 + sips
├── package.json
└── tsconfig.json            ← path alias @/ → src/
```

## Key modules

- **`src/data/api.ts`** — `BASE_URL`, `USE_MOCK`, `getJson()` helper (unwraps the
  `{status,message,data}` envelope), one function per section. See 05-apis.md.
- **`src/data/types.ts`** — the contract shapes. **These must match the real API field
  names exactly** — this has been a repeated source of runtime crashes (undefined.trim(),
  blank date badges) when a screen assumed a plausible-but-wrong field name. When adding a
  new screen, check the actual response shape (`fetch(...).then(r=>r.json())` in a browser
  console against the real `BASE_URL`) rather than guessing from the Api.php PHP method name.
- **`src/lib/format.ts`** — `stripHtml()`/`excerptFrom()` matter more than they look: most
  CMS text fields (principal message, about text, event/news/notice bodies) come back as
  raw HTML (often Word-pasted `<p class="MsoNormal">` markup). Always run rich-text fields
  through these before rendering in a plain `<Text>`.
- **`src/components/ui/states.tsx`** — `Loading` shows the circular school logo + spinner +
  label, matching the real app's branded loading state. Use it everywhere instead of a bare
  `ActivityIndicator`.

## Design decisions

- **No global state library** — screens fetch what they need via `useFetch`.
- **Managed Expo workflow**, but `android/` currently exists locally (generated by
  `expo prebuild`) for local Gradle builds — regenerate with `npx expo prebuild --platform
  android --no-install` if it's ever deleted/stale; don't hand-edit generated native files.
- **File-based routing** — a file in `src/app/` *is* a route; no manual route registration.
- **Light theme only** — `useColorScheme()` always returns `'light'` regardless of the
  system setting, matching the real app's behavior (see 04-design-system.md).
