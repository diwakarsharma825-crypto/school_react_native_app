# 03 — API Integration & Endpoints Reference

This document provides a comprehensive specification of all backend REST API endpoints consumed by **Our School App** across Public, Student, and Teacher modules.

---

## 1. Data Layer Architecture

The API client layer is partitioned into three specialized modules inside `src/data/`:
1. **[`api.ts`](file:///var/www/html/school_app/school_app_react_native/src/data/api.ts)**: Handles public data endpoints, settings, sliders, news, achievers, gallery, and general app status.
2. **[`teacher-api.ts`](file:///var/www/html/school_app/school_app_react_native/src/data/teacher-api.ts)**: Handles authenticated teacher endpoints, class rosters, attendance submission, homework management, leave application review, Excel template downloads, and bulk imports.
3. **[`homework-api.ts`](file:///var/www/html/school_app/school_app_react_native/src/data/homework-api.ts)**: Handles student authentication, homework lookups, student attendance history, leave application submissions, and fee invoice lookups.

---

## 2. API Endpoint Matrix

### 2.1 Public & App-Wide Endpoints

#### `GET /app_status`
- **Purpose**: Dynamic application configuration and dynamic brand styling.
- **Query Params**: `device_id` (string, optional)
- **Response Shape**:
  ```json
  {
    "status": true,
    "data": {
      "enabled": true,
      "instituteMode": true,
      "primaryColor": "#123A6B",
      "accentColor": "#E8871E",
      "appTitle": "Institute Portal",
      "minVersion": "1.0.0",
      "enabledSections": {
        "homework": true,
        "attendance": true,
        "notices": true,
        "events": true,
        "gallery": true,
        "result": true,
        "fees": true
      }
    }
  }
  ```

#### `GET /home`
- **Purpose**: Home screen content payload.
- **Response**: Banners array, Principal message object, counter statistics, news highlights, and upcoming events.

#### `GET /settings`
- **Purpose**: Institute contact profile.
- **Response**: School name, full address, email, phone numbers, WhatsApp contact, Google Maps coordinates, and social media handles.

#### `POST /device_register`
- **Purpose**: Device FCM token and location registration.
- **FormData**: `device_id`, `user_type` (`student` | `teacher`), `phone`, `push_token`, `latitude`, `longitude`, `full_name`, `class`, `section`.

---

### 2.2 Student Endpoints

#### `POST /student_login`
- **Purpose**: Authenticates student or parent credentials.
- **FormData**: `identifier` (SRN or Phone), `password`.
- **Response**: Returns array of matching student profiles (supports parents with multiple enrolled children).

#### `GET /student_homework`
- **Purpose**: Fetches assigned homework for a given date.
- **Query Params**: `class` (string), `section` (string, optional), `date` (string, YYYY-MM-DD).

#### `GET /student_attendance`
- **Purpose**: Fetches student attendance record history.
- **Query Params**: `identifier` (SRN/phone), `month` (integer, 1-12), `year` (integer).

#### `POST /student_apply_leave`
- **Purpose**: Submits a student leave application.
- **FormData**: `srn`, `leave_type` (`Sick` | `Casual` | `Emergency`), `date_from`, `date_to`, `reason`.

#### `GET /student_leave_applications`
- **Purpose**: Lists submitted leave requests and approval status (`Pending`, `Approved`, `Rejected`).
- **Query Params**: `srn`.

#### `GET /student_fee_invoices`
- **Purpose**: Lists student fee invoices and payment receipts.
- **Query Params**: `srn`.

---

### 2.3 Teacher Endpoints (Requires `Authorization: Bearer <TOKEN>`)

#### `POST /teacher_login`
- **Purpose**: Authenticates teacher credentials.
- **FormData**: `email`, `password`.
- **Response**: Returns authorization `token`, teacher name, subject, assigned `class_id`, `class_name`, `section`.

#### `GET /teacher_profile`
- **Purpose**: Fetches logged-in teacher details, signature URL, assigned classes, and permissions dictionary (`notices`, `events`, `attendance`, `leave`, `fees`, `result`).

#### `GET /teacher_students`
- **Purpose**: Fetches class roster list.
- **Query Params**: `class_id` (integer), `section_id` (integer, optional).

#### `POST /teacher_save_attendance`
- **Purpose**: Saves daily attendance and triggers automated FCM push notifications to absent students' parents.
- **FormData**: `class_id`, `section_id`, `date`, `records` (JSON array string).

#### `POST /teacher_save_homework`
- **Purpose**: Creates a new homework entry with attachment photos.
- **FormData**: `class_id`, `section_id`, `subject`, `date`, `description`, `attachments[]` (files).

#### `POST /teacher_add_notice`
- **Purpose**: Publishes a new announcement circular.
- **FormData**: `class_id`, `section_id`, `title`, `body`, `attachment` (file, optional).

#### `POST /teacher_add_event`
- **Purpose**: Publishes a new school event with media gallery.
- **FormData**: `class_id`, `section_id`, `title`, `event_place`, `event_from`, `event_to`, `note`, `media[]` (files).

#### `POST /teacher_review_leave`
- **Purpose**: Approves or rejects a student leave request.
- **FormData**: `id`, `status` (`approved` | `rejected`), `note`.

#### `GET /download_student_template`
- **Purpose**: Downloads Excel template for student enrollment or results.
- **Query Params**: `type` (`students` | `results`).
- **Web Compatibility**: On `Platform.OS === 'web'`, uses browser `Blob` and `URL.createObjectURL(blob)` for error-free file downloads.

#### `POST /teacher_import_students` & `POST /teacher_import_results`
- **Purpose**: Uploads Excel (`.xlsx`) or CSV (`.csv`) files for bulk student roster or exam marks import.
- **FormData**: `file`, `class_id`, `section_id`, `exam_name` (optional).
