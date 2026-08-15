# 04 — Authentication, Security & Permission Architecture

This document specifies the authentication mechanics, token storage security, Role-Based Access Control (RBAC), device registration security, and route guarding implemented in **Our School App**.

---

## 1. Authentication Dual Architecture

The application implements two parallel authentication systems tailored to its user roles:

```text
                             Authentication Entry
                                       │
                ┌──────────────────────┴──────────────────────┐
                ▼                                             ▼
       Student / Parent Auth                         Teacher Auth
      (useStudentAuth Hook)                     (useTeacherAuth Hook)
                │                                             │
    SRN / Mobile + Password                     Teacher Email + Password
                │                                             │
        POST /student_login                           POST /teacher_login
                │                                             │
      Child Roster Array                             Bearer Auth Token
                │                                             │
    Local Multi-Child Storage                      Secure Storage / Storage
                │                                             │
    Direct Dashboard Redirect                     Direct Dashboard Redirect
     (/student-dashboard)                           (/teacher-dashboard)
```

---

## 2. Token Security & Authorization Flow

### 2.1 Teacher Bearer Tokens
- Upon successful login via `POST /teacher_login`, the server returns a JWT / Session Token.
- Tokens are stored locally and attached automatically to every outgoing teacher request:
  ```typescript
  export async function authedRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await getTeacherToken();
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
    // ...
  }
  ```
- **Session Expiration**: If backend returns HTTP 401 Unauthorized or invalid JSON status, `useTeacherAuth` clears local state (`setLoggedIn(false)`), safely logging out the user.

### 2.2 Student Credentials & Multi-Child Access
- Student auth does not rely on transient tokens; instead, successful credentials return student profile payloads containing `srn`, `rollNo`, `name`, `className`, and `section`.
- Parent accounts with multiple children store all child profiles in encrypted local storage (`saveHomeworkChildren()`).
- Parents can switch between children using `switchChild(srn)` without re-authenticating.

---

## 3. Route Guarding & Navigation Security

Protected screens enforce role access checks via `useFocusEffect` hooks and loading guards:

```typescript
// Teacher Guard Pattern in teacher-dashboard.tsx, teacher-attendance.tsx, etc.
useFocusEffect(
  useCallback(() => {
    if (checking) return;
    if (!loggedIn) {
      router.replace('/teacher-login');
    }
  }, [checking, loggedIn])
);

if (checking || !loggedIn || !profile) {
  return (
    <Screen scroll={false}>
      <Loading label="Loading teacher portal…" />
    </Screen>
  );
}
```

### Protection Summary:
- **Teacher Screens** (`/teacher-dashboard`, `/teacher-attendance`, `/teacher-homework`, `/teacher-events`, `/teacher-notices`, `/teacher-leaves`, `/teacher-fees`, `/teacher-export`, `/teacher-storage`, `/teacher-import-students`, `/teacher-import-result`): Blocked if `teacherLoggedIn` is false.
- **Student Screens** (`/student-dashboard`, `/homework`, `/student-attendance`, `/apply-leave`, `/result`, `/fees`): Blocked or redirected if student auth is unverified.
- **Role Selection** (`/login`, `/teacher-login`): Auto-redirects authenticated users directly to their active dashboard.

---

## 4. Push Notification & Location Security

- **FCM Token Registration**:
  Upon permission grant, device tokens and GPS coordinates (`latitude`, `longitude`) are sent to `POST /device_register` to receive targeted push alerts (e.g. absent notifications, emergency circulars, new homework assignments).
- **Targeted Notification Filtering**:
  Backend push notification payloads are scoped strictly by `class_id` and `section_id` to prevent cross-class data leaks.
