# Saarthak School App — Architecture & Knowledge Base Document

Comprehensive technical specification, architectural design, state management, routing rules, styling system, and developer guidelines for the Saarthak School App (React Native / Expo Web).

---

## 1. System Architecture & Tech Stack

- **Framework**: React Native with Expo SDK 52 (`expo-router` v4)
- **Platforms**: Mobile (Android / iOS) and Web (Static export & live preview via Dev Server on port `8081`)
- **Language**: TypeScript (`strict: true`)
- **Styling**: Vanilla React Native `StyleSheet` with central Design Tokens ([`src/constants/theme.ts`](file:///var/www/html/school_app/school_app_react_native/src/constants/theme.ts))
- **Navigation & Routing**: File-based routing with `expo-router` Stack and Tab layouts
- **PDF Export Engine**: Custom HTML/CSS template renderer with Expo Print & Web window print helpers ([`src/components/ui/ExportPdfButton.tsx`](file:///var/www/html/school_app/school_app_react_native/src/components/ui/ExportPdfButton.tsx))

---

## 2. Authentication & Navigation Architecture

### 2.1 Student Authentication Flow
- **Hook**: [`useStudentAuth`](file:///var/www/html/school_app/school_app_react_native/src/hooks/use-student-auth.tsx)
- **Login Credentials**: SRN or Mobile Number + Password.
- **Multi-Child Support**: Supports parent logins with multiple registered children under a single account.
- **Login Callback & Redirection**:
  1. Successful `studentLogin()` API call returns student access payload.
  2. Saves local child profile via `saveHomeworkChildren()`.
  3. Executes `refreshStudentAuth()`.
  4. Immediately executes `router.replace('/student-dashboard')` to land on the **Student Dashboard**.

### 2.2 Teacher Authentication Flow
- **Hook**: [`useTeacherAuth`](file:///var/www/html/school_app/school_app_react_native/src/hooks/use-teacher-auth.tsx)
- **Login Credentials**: Teacher Email + Password.
- **Token Persistence**: Auth token stored securely locally; auto-fetched via `fetchTeacherProfile()`.
- **Login Callback & Redirection**:
  1. Successful `teacherLogin()` API call receives authorization token and user info.
  2. Updates teacher state via `setLoggedIn(true)`.
  3. Immediately executes `router.replace('/teacher-dashboard')` to land on the **Teacher Dashboard**.
  4. **Guarding**: `TeacherDashboardScreen` checks `checking`, `loggedIn`, and `profile` with safe optional chaining (`profile?.name`, `profile?.email`, `profile?.permissions`). Does **not** forcibly redirect to `/teacher-profile-setup`.

---

## 3. UI Design System & Dark Mode Guidelines

### 3.1 Dark Mode Palette & Contrast Enforcement
- **Dynamic Brand Colors**: Brand primary (`theme.tint`) and accent (`theme.accent`) are fetched dynamically from database (`/app_status`).
- **Dark Mode Rule**: All color overrides **MUST** be explicitly conditional on `theme.dark === true` and **MUST NOT** alter `theme.dark === false` (Light Mode).
- **Standardized Dark Mode Action Palette**:
  - **Outline Action Buttons** (e.g. Export PDF, Redraw Signature, File Pickers, Template Download):
    - Border: `theme.dark ? '#60A5FA' : theme.tint` (Bright Sky Blue)
    - Background: `theme.dark ? 'rgba(96, 165, 250, 0.15)' : theme.surface` (Translucent Sky Blue)
    - Text & Icons: `theme.dark ? '#FFFFFF' : theme.tint` (Pure Bright White)
  - **Primary Action Fill Buttons** (e.g. Add Student, Add Notice, Import Excel):
    - Background: `theme.dark ? '#2563EB' : theme.tint` (Vibrant Blue)
    - Text & Icons: `theme.dark ? '#FFFFFF' : '#FFFFFF'` (Pure Bright White)
  - **Status Card Badges (Attendance Bulk Actions)**:
    - Present: `rgba(22, 101, 52, 0.35)` background fill with white text (`#FFFFFF`)
    - Absent: `rgba(153, 27, 27, 0.35)` background fill with white text (`#FFFFFF`)
    - Leave: `rgba(146, 64, 14, 0.35)` background fill with white text (`#FFFFFF`)
  - **Category Row Icon Badges (Storage Usage, Profile)**:
    - Icon Circle Background: `theme.dark ? theme.tint : theme.backgroundSelected`
    - Icon & Title Text: `theme.dark ? '#FFFFFF' : theme.tint` (Pure Bright White)

---

## 4. Web Platform Compatibility Guidelines

### 4.1 Excel Template Downloads & Exports
- Expo `FileSystem.writeAsStringAsync` and `FileSystem.downloadAsync` are native-only and throw runtime errors on Web (`Platform.OS === 'web'`).
- **Web Download Helper Pattern**:
  ```typescript
  if (Platform.OS === 'web') {
    const blob = new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }
  ```

---

## 5. Universal PDF Export System

### 5.1 `ExportPdfButton` Component
- **Path**: [`src/components/ui/ExportPdfButton.tsx`](file:///var/www/html/school_app/school_app_react_native/src/components/ui/ExportPdfButton.tsx)
- Standardized across all 15+ screens in the application:
  - Student Leave History ([`apply-leave.tsx`](file:///var/www/html/school_app/school_app_react_native/src/app/apply-leave.tsx))
  - Teacher Leave Management ([`teacher-leaves.tsx`](file:///var/www/html/school_app/school_app_react_native/src/app/teacher-leaves.tsx))
  - Student Attendance ([`student-attendance.tsx`](file:///var/www/html/school_app/school_app_react_native/src/app/student-attendance.tsx))
  - Teacher Attendance Mark Sheet ([`teacher-attendance.tsx`](file:///var/www/html/school_app/school_app_react_native/src/app/teacher-attendance.tsx))
  - Homework Calendar & List ([`homework.tsx`](file:///var/www/html/school_app/school_app_react_native/src/app/homework.tsx) & [`teacher-homework.tsx`](file:///var/www/html/school_app/school_app_react_native/src/app/teacher-homework.tsx))
  - Announcements / Notices ([`notices.tsx`](file:///var/www/html/school_app/school_app_react_native/src/app/notices.tsx) & [`teacher-notices.tsx`](file:///var/www/html/school_app/school_app_react_native/src/app/teacher-notices.tsx))
  - Event Schedules ([`events.tsx`](file:///var/www/html/school_app/school_app_react_native/src/app/(tabs)/events.tsx) & [`teacher-events.tsx`](file:///var/www/html/school_app/school_app_react_native/src/app/teacher-events.tsx))
  - Fee Invoices ([`fees.tsx`](file:///var/www/html/school_app/school_app_react_native/src/app/fees.tsx) & [`teacher-fees.tsx`](file:///var/www/html/school_app/school_app_react_native/src/app/teacher-fees.tsx))
  - Class Student Roster ([`teacher-dashboard.tsx`](file:///var/www/html/school_app/school_app_react_native/src/app/teacher-dashboard.tsx))

---

## 6. Build & Verification Commands

- **Local Web Server**:
  `node server.js` (runs on `http://localhost:8081`)
- **Static Web Export**:
  `npx expo export --platform web`
- **TypeScript Check**:
  `npx tsc --noEmit`
