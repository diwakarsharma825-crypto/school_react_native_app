# 03 · Architecture

## Data flow

```
[School Backend API]
        │  JSON over HTTPS
        ▼
src/data/api.ts        ← SINGLE SWAP-POINT. One async function per section.
        │                 (today: returns mock; live: fetch(BASE_URL + path))
        ▼
src/hooks/use-fetch.ts ← { data, loading, error, refetch } wrapper
        │
        ▼
Screens (src/app/**)   ← render data + loading/error/empty/refresh states
```

The app never calls `fetch` directly from a screen. Screens call typed functions from
`api.ts` through the `useFetch` hook. This is why going live only touches `api.ts`.

## Folder structure

```
saarthak-app/
├── knowledge-base/          ← this documentation
├── src/
│   ├── app/                 ← ROUTES (file = screen)
│   │   ├── _layout.tsx      ← root Stack + branded header
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx  ← bottom tab bar (Home/Events/Gallery/More)
│   │   │   ├── index.tsx    ← Home
│   │   │   ├── events.tsx
│   │   │   ├── gallery.tsx
│   │   │   └── more.tsx
│   │   ├── event/[id].tsx   ← dynamic route: event detail
│   │   ├── news/[id].tsx    ← dynamic route: news detail
│   │   ├── announcements.tsx
│   │   ├── result.tsx
│   │   ├── contact.tsx
│   │   └── about.tsx
│   ├── components/
│   │   ├── ui/              ← Card, Button, Badge, Screen, SectionHeader,
│   │   │                      MediaCard, ArticleDetail, states (loading/error/empty)
│   │   └── home/            ← Carousel, StatsRow, FacilityCard, PrincipalCard
│   ├── constants/theme.ts   ← design tokens (colors, spacing, radius, shadow)
│   ├── data/
│   │   ├── types.ts         ← TypeScript models (one per section)
│   │   ├── mock.ts          ← placeholder data (same shape as the API)
│   │   └── api.ts           ← THE SWAP-POINT
│   ├── hooks/
│   │   ├── use-fetch.ts     ← data fetching
│   │   ├── use-theme.ts     ← current light/dark palette
│   │   └── use-color-scheme.ts
│   └── lib/format.ts        ← date formatting helper
├── app.json                 ← Expo config (name, icon, splash, plugins)
├── package.json
└── tsconfig.json            ← path alias @/ → src/
```

## Key modules

- **`src/data/api.ts`** — `BASE_URL`, `USE_MOCK`, `getJson()` helper, and one function per
  section. See [05-apis.md](05-apis.md).
- **`src/data/types.ts`** — the contract shapes. The API's JSON is mapped onto these.
- **`src/hooks/use-fetch.ts`** — no external deps; returns `{ data, loading, error, refetch }`.
- **`src/components/ui/screen.tsx`** — every screen's outer wrapper (safe area, scroll,
  pull-to-refresh, max content width).

## Design decisions

- **No global state library** (Redux/Zustand) yet — screens fetch what they need via
  `useFetch`. Add `@tanstack/react-query` later if caching/offline becomes important
  (noted in `api.ts`).
- **Managed Expo workflow** — no `android/`/`ios/` folders until a native module requires
  `expo prebuild`. Keeps builds simple (EAS handles native).
- **File-based routing** — a file in `src/app/` *is* a route; no manual route registration.
