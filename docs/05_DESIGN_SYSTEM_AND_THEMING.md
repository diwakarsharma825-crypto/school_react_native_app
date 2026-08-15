# 05 — Design System & Theme Engine

This document outlines the styling architecture, central design tokens, dynamic database branding system, and Dark Mode contrast rules enforced in **Our School App**.

---

## 1. Design Tokens & Core Theme (`src/constants/theme.ts`)

The design system uses vanilla React Native `StyleSheet` driven by a central, immutable set of tokens ([`src/constants/theme.ts`](file:///var/www/html/school_app/school_app_react_native/src/constants/theme.ts)):

```typescript
export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  eight: 32,
};

export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 9999,
};

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
};
```

---

## 2. Dynamic Database Branding (`/app_status`)

Primary brand colors are loaded dynamically at runtime from the backend database:
- `primaryColor` (Default: Dark Navy `#123A6B`) -> Assigned to `theme.tint`
- `accentColor` (Default: Amber `#E8871E`) -> Assigned to `theme.accent`
- `appLogoUrl` -> Replaces header logo across the app
- `appTitle` -> Replaces default header title

Components access these dynamic values via the [`useTheme()`](file:///var/www/html/school_app/school_app_react_native/src/hooks/use-theme.ts) and [`useBrand()`](file:///var/www/html/school_app/school_app_react_native/src/hooks/use-brand.ts) React hooks.

---

## 3. Dark Mode Palette & Contrast Guidelines

### 3.1 Core Rule
All dark mode overrides **MUST** be explicitly scoped to `theme.dark === true` and **MUST NOT** alter `theme.dark === false` (Light Mode).

Because `theme.tint` defaults to a dark blue color (`#123A6B`), using `theme.tint` for text or borders in Dark Mode against dark card surfaces (`#111927`) results in poor contrast. The app enforces a dedicated **Dark Mode Action Palette**:

```text
┌──────────────────────────────────────┬──────────────────────────┬──────────────────────────┐
│ UI Element                           │ Light Mode (theme.dark=false) │ Dark Mode (theme.dark=true)  │
├──────────────────────────────────────┼──────────────────────────┼──────────────────────────┤
│ Outline Action Button Border          │ theme.tint               │ #60A5FA (Bright Sky Blue)│
│ Outline Action Button Fill           │ theme.surface            │ rgba(96, 165, 250, 0.15) │
│ Outline Action Button Text & Icon    │ theme.tint               │ #FFFFFF (Pure White)     │
│ Primary Action Fill Button Background │ theme.tint               │ #2563EB (Vibrant Blue)   │
│ Primary Action Fill Button Text      │ #FFFFFF (Pure White)     │ #FFFFFF (Pure White)     │
│ Present Attendance Badge Background   │ #DCFCE7                  │ rgba(22, 101, 52, 0.35)  │
│ Absent Attendance Badge Background    │ #FEE2E2                  │ rgba(153, 27, 27, 0.35)  │
│ Leave Attendance Badge Background     │ #FEF3C7                  │ rgba(146, 64, 14, 0.35)  │
│ Category Icon Badge Background       │ theme.backgroundSelected │ theme.tint               │
│ Category Icon & Title Text           │ theme.tint               │ #FFFFFF (Pure White)     │
└──────────────────────────────────────┴──────────────────────────┴──────────────────────────┘
```

---

## 4. Standard Component Library

All screens utilize standard UI primitives from `src/components/ui/`:
- **`Screen`**: Scrollable screen wrapper handling safe area insets, keyboard avoiding view, and dynamic background colors.
- **`Card`**: Elevated white/dark surface container with rounded corners (`Radius.lg`) and subtle drop shadows.
- **`ThemedText`**: Typography component supporting `title`, `subtitle`, `default`, `small`, `smallBold`, `textOnBrand`, `textSecondary`, and `tint` color modes.
- **`ExportPdfButton`**: Universal PDF export button supporting `fill`, `outline`, and `compact` variants.
- **`Loading` / `EmptyState` / `ErrorState`**: Standardized state feedback components.
