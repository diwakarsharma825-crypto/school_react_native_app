# Saarthak GIMSS App — Knowledge Base

Single source of truth for the Saarthak GIMSS mobile app (Expo / React Native, Android-first).
Start here, then open the file you need.

| # | Document | What's inside |
|---|----------|---------------|
| 01 | [Project Overview](01-project-overview.md) | Goal, scope, who does what, current status |
| 02 | [Specifications](02-specifications.md) | Every screen & section, mapped to the website |
| 03 | [Architecture](03-architecture.md) | How data flows, folder structure, the API swap-point |
| 04 | [Design System](04-design-system.md) | Colors, spacing, typography, components |
| 05 | [**API Integration**](05-apis.md) | **Endpoint contract — fill in your real links here** |
| 06 | [Setup & Run](06-setup-and-run.md) | Install, run on Android emulator / phone, troubleshoot |
| 07 | [Roadmap](07-roadmap.md) | Phases done and remaining, path to Play Store |

## TL;DR

- **What:** A dynamic, professional Android app replicating the school website
  (https://www.saarthakgimsss12a.org/). Every section is data-driven.
- **Stack:** Expo SDK 57, Expo Router, React Native 0.86, TypeScript, `expo-image`.
- **Status:** Full clickable skeleton complete and running on the Android emulator with
  placeholder data. Next step is wiring the real API (see doc 05).
- **The important bit:** To go live, only **one file** changes — `src/data/api.ts`.
  The contract for it lives in [05-apis.md](05-apis.md).

## Division of work

- **Backend (you):** provide + host the API endpoints in doc 05.
- **App (Claude):** everything mobile — UI, navigation, data wiring, native build, store prep.
