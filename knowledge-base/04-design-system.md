# 04 · Design System

A professional take on the school's blue identity: deep academic blue + saffron accent.
All tokens live in `src/constants/theme.ts`.

## Brand colors (`Brand`)

| Token | Hex | Use |
|-------|-----|-----|
| `blue` | `#123A6B` | Primary — headers, buttons, links |
| `blueDark` | `#0C2A4E` | Gradients, overlays |
| `blueLight` | `#2E6FBE` | Dark-mode tint, secondary |
| `saffron` | `#E8871E` | Accent — CTAs, badges, highlights |
| `saffronLight` | `#F5A623` | Dark-mode accent |
| `green` / `red` / `gold` | — | Status (holiday / alert / merit) |

## Semantic colors (`Colors.light` / `Colors.dark`)

`text`, `textSecondary`, `textOnBrand`, `background`, `surface`, `backgroundElement`,
`backgroundSelected`, `border`, `tint`, `accent`. Screens read these via `useTheme()` so
light/dark switch automatically.

## Spacing scale (`Spacing`)

`half=2 · one=4 · two=8 · three=16 · four=24 · five=32 · six=64` — always use these, never
raw pixel numbers, so rhythm stays consistent.

## Radius & shadow

- `Radius`: `sm=8 · md=12 · lg=16 · xl=24 · pill=999`
- `Shadow.card`: soft elevation used by all cards (works on iOS + Android).

## Typography

`ThemedText` component with `type`: `title`, `subtitle`, `default`, `small`, `smallBold`,
`link`, `code`. Color via `themeColor` prop (defaults to `text`).

## Reusable components (`src/components/ui/`)

| Component | Purpose |
|-----------|---------|
| `Screen` | Page wrapper: safe area, scroll, pull-to-refresh, max width |
| `Card` | Elevated surface; tappable when given `onPress` |
| `SectionHeader` | Accent bar + title + optional "See all ›" action |
| `Button` | `primary` / `accent` / `outline`, optional icon + loading spinner |
| `Badge` | Small pill (dates, categories) |
| `MediaCard` | Image + title + date card (list + compact/horizontal variants) |
| `ArticleDetail` | Hero + meta + body (shared by event & news detail) |
| `Loading` / `ErrorState` / `EmptyState` | Standard data states |

## Home components (`src/components/home/`)

`Carousel` (auto-advance + dots), `StatsRow` (count-up animation), `FacilityCard`,
`PrincipalCard`.

## Icons

`@expo/vector-icons` → **Ionicons**. Pass Ionicons names in data where an icon is needed
(e.g. `Facility.icon = "people"`, `Stat.icon = "school"`).

## To rebrand

Change `Brand.blue` / `Brand.saffron` in `theme.ts` and every screen updates. Replace the
app icon & splash in `assets/` + `app.json` (see [07-roadmap.md](07-roadmap.md)).
