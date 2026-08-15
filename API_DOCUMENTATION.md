# Saarthak School App — Complete API Documentation

Comprehensive technical documentation for all backend REST API endpoints consumed by the Saarthak School App (React Native / Expo Web application).

---

## 1. Overview & Base Configuration

- **Base URL**: `https://testing.saarthakgimsss12a.org/api`
- **Response Format**: Standardized JSON envelope
  ```json
  {
    "status": true,
    "message": "Operation successful",
    "data": { ... }
  }
  ```
- **Authentication Header (Teacher Endpoints)**:
  `Authorization: Bearer <TEACHER_AUTH_TOKEN>`

---

## 2. Public & General Endpoints

### 2.1 Fetch App Status & Configuration
- **Endpoint**: `GET /app_status`
- **Query Parameters**: `device_id` (string, optional)
- **Description**: Returns dynamic institute branding, colors, home tiles, bottom tabs configuration, section toggles, and minimum required app version.
- **Sample Response**:
  ```json
  {
    "status": true,
    "data": {
      "enabled": true,
      "instituteMode": true,
      "primaryColor": "#123A6B",
      "accentColor": "#E8871E",
      "appTitle": "Saarthak GIMSSS 12A",
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

### 2.2 Fetch Home Screen Content
- **Endpoint**: `GET /home`
- **Description**: Returns carousel banners, principal message, top statistics, latest news highlights, and upcoming events.

### 2.3 Fetch School Settings
- **Endpoint**: `GET /settings`
- **Description**: Returns school contact details, social links, email, phone numbers, address, and Google Map coordinates.

### 2.4 Fetch Academic Year
- **Endpoint**: `GET /current_academic_year`
- **Description**: Returns active academic session label (e.g. `2025-2026`).

### 2.5 Fetch Top Achievers
- **Endpoint**: `GET /top_achievers`
- **Query Parameters**: `limit` (integer, optional)
- **Description**: Returns honor roll and top student achievers list.

---

## 3. Student Endpoints

### 3.1 Student Login
- **Endpoint**: `POST /student_login`
- **Request Body (JSON)**:
  ```json
  {
    "identifier": "SRN123456",
    "password": "student_password"
  }
  ```
- **Response**: Array of student profile records (supports parents with multiple children registered under the same phone/SRN).

### 3.2 Student Attendance Records
- **Endpoint**: `GET /student_attendance`
- **Query Parameters**: `srn` (string), `month` (integer, 1-12), `year` (integer)
- **Description**: Returns daily attendance logs (Present, Absent, Leave) with monthly percentage breakdown.

### 3.3 Student Homework Records
- **Endpoint**: `GET /student_homework`
- **Query Parameters**: `class_name` (string), `section` (string, optional), `date` (string, YYYY-MM-DD)
- **Description**: Returns assigned homework by date, including subject, chapter, teacher remarks, and attachment image URLs.

### 3.4 Student Leave Applications
- **Endpoint**: `GET /student_leave_applications`
- **Query Parameters**: `srn` (string)
- **Description**: Returns leave request history with status (`Pending`, `Approved`, `Rejected`).

### 3.5 Submit Student Leave Request
- **Endpoint**: `POST /student_apply_leave`
- **Request Body (JSON)**:
  ```json
  {
    "srn": "SRN123456",
    "leave_type": "Sick Leave",
    "start_date": "2026-08-20",
    "end_date": "2026-08-22",
    "reason": "High fever"
  }
  ```

### 3.6 Student Fee Invoices
- **Endpoint**: `GET /student_fee_invoices`
- **Query Parameters**: `srn` (string)
- **Description**: Returns list of fee invoices, payment status (`Paid`, `Due`), due dates, amounts, and receipt PDF links.

---

## 4. Teacher Endpoints

### 4.1 Teacher Login
- **Endpoint**: `POST /teacher_login`
- **Request Body (JSON)**:
  ```json
  {
    "email": "teacher@school.edu",
    "password": "securepassword"
  }
  ```
- **Response**:
  ```json
  {
    "status": true,
    "data": {
      "token": "eyJhbGciOi...",
      "name": "Ms. Krishna",
      "email": "teacher@school.edu",
      "subject": "Mathematics",
      "class_id": 5,
      "class_name": "Class 10th",
      "section": "A"
    }
  }
  ```

### 4.2 Fetch Teacher Profile
- **Endpoint**: `GET /teacher_profile`
- **Header**: `Authorization: Bearer <TOKEN>`
- **Description**: Returns teacher details, signature URL, class assignments, and per-teacher section permissions (`notices`, `events`, `attendance`, `leave`, `fees`, `result`).

### 4.3 Update Teacher Profile / Signature
- **Endpoint**: `POST /teacher_profile_update`
- **Header**: `Authorization: Bearer <TOKEN>`
- **Request Body (JSON)**:
  ```json
  {
    "name": "Ms. Krishna",
    "signature_base64": "data:image/png;base64,..."
  }
  ```

### 4.4 Fetch Class Roster / Students
- **Endpoint**: `GET /teacher_students`
- **Query Parameters**: `class_id` (integer), `section_id` (integer, optional)
- **Description**: Returns student list for active class including roll numbers, names, SRNs, father details, and contact numbers.

### 4.5 Save Class Attendance
- **Endpoint**: `POST /teacher_save_attendance`
- **Header**: `Authorization: Bearer <TOKEN>`
- **Request Body (JSON)**:
  ```json
  {
    "class_id": 5,
    "section_id": 2,
    "date": "2026-08-15",
    "records": [
      { "student_id": 101, "status": "Present", "remarks": "" },
      { "student_id": 102, "status": "Absent", "remarks": "Uninformed" }
    ]
  }
  ```

### 4.6 Manage Homework (Add / Delete)
- **Endpoint**: `POST /teacher_add_homework`
- **Header**: `Authorization: Bearer <TOKEN>`
- **FormData**: `class_id`, `section_id`, `subject_id`, `homework_date`, `chapter`, `description`, `attachments[]` (files)

### 4.7 Manage Notices & Events
- **Endpoints**:
  - `POST /teacher_add_notice`
  - `POST /teacher_add_event`
  - `POST /teacher_delete_notice`
  - `POST /teacher_delete_event`

### 4.8 Review Student Leave Applications
- **Endpoint**: `POST /teacher_review_leave`
- **Header**: `Authorization: Bearer <TOKEN>`
- **Request Body (JSON)**:
  ```json
  {
    "application_id": 42,
    "status": "Approved",
    "remarks": "Approved by class teacher"
  }
  ```

### 4.9 Excel Import & Template Downloads
- **Download Excel Template**: `GET /download_student_template?type=students`
  - Support: On Web (`Platform.OS === 'web'`), handled via browser `Blob` and `URL.createObjectURL`.
- **Import Students (Excel/CSV)**: `POST /teacher_import_students`
  - Multipart form upload (`file`).
- **Import Student Results (Excel/CSV)**: `POST /teacher_import_results`
  - Multipart form upload (`file`, `exam_name`, `class_id`).

---

## 5. Error Handling Standards

All endpoints return HTTP 200 with standard error structures for business logic failures:
```json
{
  "status": false,
  "message": "Invalid email or password provided."
}
```
HTTP 401 Unauthorized is returned when `Bearer` token is invalid or expired.
