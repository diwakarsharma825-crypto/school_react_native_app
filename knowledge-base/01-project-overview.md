# 01 · Project Overview

## Goal

Build a professional **Android app** (React Native / Expo) that is a **dynamic replica** of the
Saarthak GIMSS school website (https://www.saarthakgimsss12a.org/) — every section driven by
data from the school's API — with a cleaner, more professional UI than the original site.

## Scope

**In scope**
- Android app (iOS also builds from the same code, but Android is the shipping target).
- All website sections as native screens (see [02-specifications.md](02-specifications.md)).
- Data-driven content: banners, facilities, stats, events, news, announcements, gallery,
  results, principal's message, contact — all fetched from the API.
- Loading / error / empty / pull-to-refresh states everywhere.
- Light + dark mode.

**Out of scope (for now)**
- Content-management admin panel (the school edits via the existing backend).
- Push notifications, login/auth, online fee payment — possible later phases.

## Roles

| Area | Owner |
|------|-------|
| Backend API (endpoints, data, hosting) | **You** (backend dev) |
| Mobile app (UI, navigation, data wiring) | Claude |
| Native build + Play Store submission | Claude (you approve / provide store account) |

## Current status — as of this build

- ✅ Expo project scaffolded (`saarthak-app/`, Expo SDK 57).
- ✅ Full clickable **skeleton**: all screens, navigation, professional UI.
- ✅ Dynamic data layer with a single swap-point (`src/data/api.ts`), currently returning
  **mock/placeholder** data (`USE_MOCK = true`).
- ✅ Verified: bundles cleanly for Android, TypeScript passes, runs on the Android emulator.
- ⏳ **Next:** wire the real API (see [05-apis.md](05-apis.md)).
- ⏳ Then: app icon + splash branding, then EAS build → APK / Play Store.

## Key facts

- **Project path:** `/Users/jatin/Desktop/React App/saarthak-app`
- **Package/slug:** `saarthak-app`
- **Router:** Expo Router (file-based, under `src/app/`)
- **Path alias:** `@/` → `src/`
- **Node:** 21.7.3 (works; Node 22 LTS recommended if Metro misbehaves)
