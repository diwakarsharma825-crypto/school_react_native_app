# 07 · Roadmap

## Phase status

| Phase | Status |
|-------|--------|
| 1. Scaffold project + navigation + design system | ✅ Done |
| 2. Full clickable skeleton (all screens, mock data) | ✅ Done |
| 3. Run on Android emulator | ✅ Done |
| 4. **Wire real API** | ⏳ Blocked on API links → [05-apis.md](05-apis.md) |
| 5. Branding (app icon + splash) | ⬜ Not started |
| 6. Polish (animations, edge cases, offline) | ⬜ Not started |
| 7. Build APK → internal test → Play Store | ⬜ Not started |

## Phase 4 — Wire real API (next)

1. Receive base URL + endpoints (or Postman/Swagger).
2. Set `BASE_URL`, flip `USE_MOCK`, map JSON → models in `src/data/api.ts`.
3. Verify each section shows live data on the emulator; check loading/error/offline.
4. Optionally add `@tanstack/react-query` for caching + offline.

## Phase 5 — Branding

- App icon: replace `assets/images/icon.png` (school logo, 1024×1024).
- Android adaptive icon: `assets/images/android-icon-*.png` + `app.json → android.adaptiveIcon`.
- Splash: `app.json → expo-splash-screen` plugin (currently blue `#208AEF`; set brand blue
  `#123A6B` + logo).
- App name shown under the icon: `app.json → name`.

## Phase 6 — Polish

- Screen transition + list animations (reanimated 4 is available).
- Real "Result not found" handling once the result API behavior is known.
- Empty/error copy per section; retry behavior.
- Optional: dark-mode banner overlays, image placeholders/blurhash.

## Phase 7 — Ship to Play Store

Uses **EAS Build** (cloud build — no local Gradle needed).

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview      # → APK to sideload/test
eas build -p android --profile production    # → .aab for Play Store
```

Requirements:
- **Google Play Developer account** ($25 one-time).
- **Android keystore** — EAS can generate & manage it. **Back it up**: losing it means you can
  never update the app on the Play Store again (see `expo-getting-started.md` §11).
- Store listing: app name, description, screenshots, privacy policy URL, content rating.

## Possible later features

- Push notifications (`expo-notifications`) for announcements/events.
- Student/parent login + secure result access (`expo-secure-store`).
- Online fee payment.
- Offline caching of last-loaded content.
