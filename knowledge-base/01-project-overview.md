# 01 · Project Overview

## Goal

A professional **Android app** (React Native / Expo) that is a **dynamic replica** of the
Saarthak GIMSS school website / school-ERP (https://www.saarthakgimsss12a.org/) — every
section driven by the real live API — matching the actual production app pixel-for-pixel.

## ⚠️ Read this before touching this project

This project's source code has been **lost and rebuilt from scratch twice** in past sessions
because it was never committed to git. Both times, the rebuild started from *written specs*
(this knowledge-base) instead of the real app, and both times the specs turned out to be
wrong in ways that only showed up once real screenshots were compared. **This version of the
docs was rewritten by directly reverse-engineering a real production APK and the real live
API** — treat it as ground truth, not a guess.

**If you are rebuilding this app from scratch again:**
1. Check `git log` in `saarthak-app/` first — the current repo *is* committed. Don't discard
   history; if `src/` looks empty again, `git checkout` should recover it before you rebuild
   anything.
2. If source is genuinely gone again, look for `Saarthak-GIMSSS.apk` at the project root
   (recovered once already from git history) or any other `.apk` backup — install it on an
   Android emulator and screenshot every screen before writing new code. Don't trust a written
   spec (including this one) over the real app if they ever disagree.
3. **Always `git add` + `git commit` early and often.** The single biggest risk to this
   project is losing work again.

## Scope

**In scope**
- Android app (iOS also builds from the same code, but Android is the shipping target).
- All real app sections as native screens (see 03-architecture.md).
- Data-driven content from the **real live API** — no mock data by default anymore.
- Loading / error / empty / pull-to-refresh states everywhere, with a **branded loading
  state** (school logo + spinner + label) rather than a generic spinner.
- Light theme (the real app does **not** follow system dark mode — see 04-design-system.md).
- Per-device access restriction (admin can lock out one specific device, independent of the
  global app on/off switch) — see the "App restriction" section below.

**Out of scope (for now)**
- True multi-tenant (one app instance serving many schools' data at runtime) — this backend
  is one database per school. The actual ask clarified during this session was narrower:
  **reuse this same codebase per school** (their own DB, their own branding via `/settings`,
  already supported) **plus let each school's admin choose which sections are visible** —
  see "Section visibility" below, which *is* built.
- A dedicated E-Library / class-wise syllabus module (inspired by
  gmssssbarara.com/elibrary) — explicitly deferred, not started. Would need new backend
  CRUD + admin UI + app screens; the section-toggle system below is designed to fit it in
  later as just another entry once it exists.
- Login/auth for students/parents, online fee payment.

## Section visibility — admin turns whole app sections on/off

Each school's admin can hide sections they don't want, independent of the app codebase.
Toggle at **App Control → App Sections**. Togglable keys (`app_sections` table): `events`,
`gallery`, `notices`, `result`, `teachers`, `top_students`, `disclosure`. Home, Contact,
and About are always on and not part of this list.

Delivered via the same `/api/app_status?device_id=` call the device-restriction check
already makes (`enabled_sections: { key: bool }` in the response) — one round trip covers
both concerns. App-side: `src/hooks/use-sections.tsx` (`SectionsProvider` /
`useSectionEnabled` / `useSections`), wired at the root of `src/app/_layout.tsx`. Defaults
to all-enabled (`ALL_SECTIONS_ENABLED`) if the field is missing (older/undeployed backend)
or the request fails — **fail open**, same policy as the restriction check, so a network
hiccup never hides content unexpectedly.

Every togglable section is hidden in **three places** when off — check all three when
adding a new togglable section:
1. **Nav entry point** — tab (`href: null` in `(tabs)/_layout.tsx`) or More-menu row
   (filtered out in `(tabs)/more.tsx`) or home quick-action tile (`QuickActionGrid.tsx`).
2. **Home cross-links** — e.g. the "Latest Events" block on Home only renders if `events`
   is on.
3. **The screen itself** — guarded with `<SectionUnavailable />`
   (`src/components/ui/SectionUnavailable.tsx`) as a fallback for stale deep links/bookmarks,
   placed *after* all hooks in the component (rules-of-hooks — see the note in
   `notices.tsx` if you're tempted to early-return before a `useMemo`).

## App restriction (kill-switch) — how it actually works

There are **two independent gates**, both checked via `GET /api/app_status?device_id=<id>`:
1. **Global**: `app_config.app_enabled` (one row, id=1) — admin toggle at
   *App Control* in the CMS. Turning this off locks out **every** user.
2. **Per-device**: `app_devices.blocked` / `blocked_reason` — admin toggle at
   *App Control → Per-Device Restrictions*, keyed by the device's stable install id
   (`device_id`, sent by the app on every launch and registered via
   `POST /api/device_register`). Blocking one device does **not** affect anyone else.

If either gate fails, the app shows a full-screen lock screen (title/message/developer
contact, all admin-configurable) instead of the normal UI. See `src/app/_layout.tsx`,
`src/data/app-status.ts`, `src/lib/device.ts`, `src/components/ui/LockScreen.tsx`.

**Backend files for this** (`sarthak-backend/application/modules/`):
- `appcontrol/controllers/Appcontrol.php`, `appcontrol/models/Appcontrol_Model.php`,
  `appcontrol/views/appcontrol/{index,devices}.php` — the admin UI.
- `web/controllers/Api.php` — `app_status()` and `device_register()`, the public endpoints
  the app calls.

⚠️ These backend files were edited **locally only** as of this writing — confirm they've
actually been deployed to the live server (`saarthakgimsss12a.org`) before relying on
per-device blocking in production. The app-side code already calls the new contract either
way; it just needs the server to have the matching code.

## Roles

| Area | Owner |
|------|-------|
| Backend (PHP/CodeIgniter, `sarthak-backend/`) | **You** |
| Mobile app (`saarthak-app/`) | Claude |
| Native build + Play Store submission | Claude (you approve / provide store account) |

## Key facts

- **Project path:** `saarthak-app/` (this repo's root has both `saarthak-app/` and
  `sarthak-backend/` side by side).
- **Package/slug:** `saarthak-app`, Android package `org.saarthakgimsss.app`.
- **Router:** Expo Router (file-based, under `src/app/`).
- **Path alias:** `@/` → `src/`.
- **Base API URL:** `https://www.saarthakgimsss12a.org/api` (see 05-apis.md for the full
  real contract — this is not a placeholder, it's genuinely live and reachable).
