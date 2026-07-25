# 04 · Design System

Matches the real production app exactly (verified against a recovered APK, screenshotted
screen-by-screen). Deep academic blue + saffron accent, **light theme only**. All tokens
live in `src/constants/theme.ts`.

## Theme is light-only, by design

`src/hooks/use-color-scheme.ts` (and its `.web.ts` variant) always return `'light'`,
regardless of the device's system theme. This is intentional — the real app does not
support/follow dark mode. Don't "fix" this to follow `useColorScheme()` from React Native
without checking with the real app first.

## Brand colors (`Brand`)

| Token | Hex | Use |
|-------|-----|-----|
| `blue` | `#123A6B` | Header background, primary buttons, section accents |
| `blueDark` | `#0C2A4E` | The navy "at a glance" stats card, gradients |
| `blueLight` | `#2E6FBE` | Secondary tint |
| `saffron` | `#E8871E` | Accent — CTAs ("Contact Us" button, "View →" pills, "Read more"
  arrow buttons), date badges |
| `saffronLight` | `#F5A623` | Secondary accent |
| `green` / `red` / `gold` | — | Status colors |

## Semantic colors (`Colors.light`)

`text`, `textSecondary`, `textOnBrand`, `background` (very light gray, not white), `surface`
(white cards), `backgroundElement`, `backgroundSelected`, `border`, `tint`, `accent`.

## Spacing / Radius / Shadow

- `Spacing`: `half=2 · one=4 · two=8 · three=16 · four=24 · five=32 · six=64`.
- `Radius`: `sm=8 · md=12 · lg=16 · xl=24 · pill=999` — cards use generous rounding
  (16-20px), pill badges use `pill`.
- `Shadow.card`: soft elevation on every white card.

## Screen chrome

Two distinct header styles — this matters, don't merge them:

- **Top-level tab screens** (Home/Events/Gallery/More): `AppHeader` — navy background,
  circular school logo on the left, school name bold white, **address as a subtitle line
  directly under the name**, and a notification bell icon on the right (→ `/notifications`).
- **Detail/sub screens** (event, news, teachers, contact, etc.): `DetailHeader` — navy
  background, back-arrow + plain title, no logo, no bell, no address.

## Branded loading state

Every screen's loading state (`src/components/ui/states.tsx` → `Loading`) shows the
**circular school logo centered, with a small spinner and a label** ("Loading home…",
"Loading gallery…") — never a bare `ActivityIndicator`. This is a real, deliberate detail
from the production app.

## Typography

`ThemedText` with `type`: `title`, `subtitle`, `default`, `small`, `smallBold`, `link`,
`code`. Color via `themeColor` prop.

## Home screen layout (exact order — see 03-architecture.md for the components)

1. **Banner carousel** — real photo, badge chip top-left ("✨ Saarthak GIMSSS"), dark
   gradient overlay, bold white title + subtitle, orange "Contact Us" CTA button, many-dot
   pagination below.
2. **Quick-action grid** — 4 tiles (Result / Notices / Disclosure / Contact), each a white
   card with a pastel-colored circular icon.
3. **Principal's Message** — circular photo, quote icon, italic text, expand/collapse
   "Read more ⌄" (in-place, not a navigation).
4. **"OUR SCHOOL AT A GLANCE"** — full-width navy card, 3 columns (Students/Teachers/Events),
   each with an icon, big count, label, and a small orange "View →" pill.
5. **"Latest News"** — horizontally-scrollable `MediaCard`s, "See all ›" → `/news`.
6. **"Latest Events"** — same pattern, "See all ›" → the Events tab.

## Reusable components (`src/components/ui/`)

| Component | Purpose |
|-----------|---------|
| `Screen` | Page wrapper: safe area, scroll, pull-to-refresh, max width |
| `Card` | Elevated white surface; tappable when given `onPress` |
| `SectionHeader` | Accent bar + title + optional "See all ›" action |
| `Button` | `primary` / `accent` / `outline`, optional icon + loading spinner |
| `Badge` | Small pill |
| `MediaCard` | News/event card — image, orange date pill, navy category pill, title,
  excerpt (auto-stripped of HTML via `excerptFrom`), "Read more" + orange arrow button.
  Fixed `width` for horizontal home rows, full-width for list screens. |
| `ArticleDetail` | Hero + meta (date, location for events) + body (auto-stripped of HTML) |
| `AppHeader` / `DetailHeader` | See "Screen chrome" above |
| `LockScreen` | Full-screen block shown when the device-restriction check fails |
| `Loading` / `ErrorState` / `EmptyState` | Standard data states — `Loading` is branded, see above |

## Home components (`src/components/home/`)

`Carousel` (auto-advance + dots + CTA), `QuickActionGrid`, `PrincipalCard` (expand/collapse),
`StatsRow` (the navy "at a glance" card).

## Icons

`@expo/vector-icons` → **Ionicons** throughout.

## Branding assets

`assets/images/{icon,splash-icon,favicon,android-icon-background,android-icon-foreground,
android-icon-monochrome}.png` are the **real** school logo/adaptive-icon, extracted directly
from a recovered production APK (`Saarthak-GIMSSS.apk`) via `aapt2 dump resources` →
identify the `mipmap/ic_launcher_*` webp files → `sips -s format png` to convert. If these
ever need regenerating from a fresh APK, that's the process — don't hand-draw placeholders.
