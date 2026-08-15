# 02 — Complete Screen Directory & Routing Catalog

This document details every screen in the application, including route paths, target role, layout components, state dependencies, and connected REST API endpoints.

---

## 1. Public & General Visitor Screens

| # | Route Path | Screen File | Role | Primary Purpose & Features | Connected API Endpoints |
|---|------------|-------------|------|----------------------------|-------------------------|
| 1 | `/(tabs)` | `src/app/(tabs)/index.tsx` | All | Home Screen: Hero carousel, Principal Message, Top Achievers, Quick Stats, Feature Tiles. Auto-swaps to Student/Teacher Dashboard in `instituteMode`. | `GET /home`, `GET /settings`, `GET /sliders`, `GET /top_achievers`, `GET /app_status` |
| 2 | `/(tabs)/events` | `src/app/(tabs)/events.tsx` | All | Event Catalog & Calendar: Displays school events, photo galleries, location, and dates. Includes PDF export button. | `GET /events` |
| 3 | `/event/[id]` | `src/app/event/[id].tsx` | All | Event Detail View: Detailed view of event description, venue, and full photo album. | `GET /events` |
| 4 | `/(tabs)/gallery` | `src/app/(tabs)/gallery.tsx` | All | Gallery Albums Grid: Photos & videos organized by album. | `GET /galleries` |
| 5 | `/gallery/[id]` | `src/app/gallery/[id].tsx` | All | Album Photos View: Fullscreen light-box viewer for photos in selected album. | `GET /galleries` |
| 6 | `/(tabs)/more` | `src/app/(tabs)/more.tsx` | All | More Menu: Comprehensive menu for profile, account options, settings, notifications, disclosures, and logout. | `GET /settings`, `GET /app_status` |
| 7 | `/about` | `src/app/about.tsx` | All | About School Screen: School history, mission, leadership, facilities, and accreditations. | `GET /settings` |
| 8 | `/contact` | `src/app/contact.tsx` | All | Contact Us Screen: Phone numbers, email addresses, address, Google Maps location link, and contact form. | `GET /settings` |
| 9 | `/teachers` | `src/app/teachers.tsx` | All | Faculty Directory: List of teaching staff with names, subjects, qualifications, and photos. | `GET /teachers` |
| 10 | `/news` | `src/app/news/index.tsx` | All | News Bulletin List: School news, sports updates, press releases, and articles. | `GET /news` |
| 11 | `/news/[id]` | `src/app/news/[id].tsx` | All | News Detail View: Complete news article content, images, and publishing date. | `GET /news/{id}` |
| 12 | `/notices` | `src/app/notices.tsx` | All | School Announcements: Circulars, exam dates, parent-teacher meeting notices with PDF export. | `GET /notices` |
| 13 | `/disclosure` | `src/app/disclosure.tsx` | All | Mandatory Disclosures: CBSE / Education Board mandatory regulatory PDFs and compliance documents. | `GET /settings` |
| 14 | `/top-students` | `src/app/top-students.tsx` | All | Top Student Achievers: Honor roll list categorized by academic year or marks. | `GET /top_achievers` |
| 15 | `/achiever-detail` | `src/app/achiever-detail.tsx` | All | Achiever Spotlight: Detailed profile of student achiever with achievement summary and photos. | `GET /top_achievers` |
| 16 | `/notifications` | `src/app/notifications.tsx` | All | Notification Center: Direct push notification log for class announcements and personal alerts. | `GET /notifications` |

---

## 2. Student & Parent Portal Screens

| # | Route Path | Screen File | Role | Primary Purpose & Features | Connected API Endpoints |
|---|------------|-------------|------|----------------------------|-------------------------|
| 17 | `/student-dashboard` | `src/app/student-dashboard.tsx` | Student | Student Dashboard: Overview card, quick action tiles (Homework, Attendance, Leave, Result, Fees), recent homework preview, and child switcher for multi-child parents. | `GET /student_homework`, `GET /student_attendance`, `GET /student_leave_applications` |
| 18 | `/homework` | `src/app/homework.tsx` | Student | Homework Calendar & Access Form: Student login/lookup form, daily homework calendar, subject filter, search bar, attachments viewer, and PDF export button. | `POST /student_login`, `GET /student_homework` |
| 19 | `/student-attendance` | `src/app/student-attendance.tsx` | Student | Student Attendance Record: Monthly calendar grid, present/absent summary percentages, and PDF export button. | `GET /student_attendance` |
| 20 | `/apply-leave` | `src/app/apply-leave.tsx` | Student | Student Leave Screen: Submit leave requests (Sick, Casual, Emergency), date pickers, reason field, leave history log, and PDF export button. | `GET /student_leave_applications`, `POST /student_apply_leave`, `POST /student_notify_teacher_leave` |
| 21 | `/result` | `src/app/result.tsx` | Student | Report Card & Marks View: Exam session selector, subject marks table, total percentage, grades, teacher remarks, and printable report card PDF. | `GET /student_result` |
| 22 | `/fees` | `src/app/fees.tsx` | Student | Fee Invoices & Receipts: Invoice history, fee due amounts, payment status badges (Paid/Due), due dates, and PDF receipt exporter. | `GET /student_fee_invoices` |
| 23 | `/profile` | `src/app/profile.tsx` | Student/Teacher | User Profile View: Avatar, personal details (SRN, Roll No, Class, Parents' names, Email, Contact), and Edit Profile action button. | `GET /teacher_profile`, `GET /student_details` |
| 24 | `/change-password` | `src/app/change-password.tsx` | Student/Teacher | Change Password View: Form for updating current password with validation and success feedback. | `POST /change_password` |

---

## 3. Teacher & Administrative Portal Screens

| # | Route Path | Screen File | Role | Primary Purpose & Features | Connected API Endpoints |
|---|------------|-------------|------|----------------------------|-------------------------|
| 25 | `/teacher-login` | `src/app/teacher-login.tsx` | Teacher | Teacher Login Screen: Email & Password authentication form, push token registration, and direct redirect to `/teacher-dashboard`. | `POST /teacher_login`, `POST /device_register` |
| 26 | `/login` | `src/app/login.tsx` | All | Role Choice Screen: Animated choice cards for "I'm a Student" vs "I'm a Teacher", auto-redirecting authenticated users to their respective dashboards. | `GET /app_status` |
| 27 | `/teacher-dashboard` | `src/app/teacher-dashboard.tsx` | Teacher | Teacher Dashboard: Class selector dropdown, class roster count, attendance status widget, quick action toolbar (Add Student, Import Excel, Export PDF, Notify Class), and quick navigation tiles. | `GET /teacher_profile`, `GET /teacher_students` |
| 28 | `/teacher-attendance` | `src/app/teacher-attendance.tsx` | Teacher | Mark Class Attendance: High-contrast 3-status action bar ("All Present", "All Absent", "All Leave"), student list toggle chips, date picker, save button, and PDF mark sheet export. | `GET /teacher_students`, `POST /teacher_save_attendance` |
| 29 | `/teacher-homework` | `src/app/teacher-homework.tsx` | Teacher | Manage Homework: Daily homework list assigned by teacher, subject filter, edit/delete options, and PDF export button. | `GET /teacher_homework`, `POST /teacher_delete_homework` |
| 30 | `/teacher-homework-add` | `src/app/teacher-homework-add.tsx` | Teacher | Add / Edit Homework: Form to create homework entries, class/section selector, subject picker, chapter name, description text, photo attachment picker, and submit handler. | `POST /teacher_save_homework` |
| 31 | `/teacher-events` | `src/app/teacher-events.tsx` | Teacher | Manage Events: Published events list, photo gallery media manager, delete action, and PDF export button. | `GET /teacher_events`, `POST /teacher_delete_event` |
| 32 | `/teacher-event-add` | `src/app/teacher-event-add.tsx` | Teacher | Add Event Screen: Form to publish school events, venue name, date range picker, event description, photo/video attachment picker, and submit handler. | `POST /teacher_add_event` |
| 33 | `/teacher-notices` | `src/app/teacher-notices.tsx` | Teacher | Manage Notices: Published circulars list, target audience status, delete action, and PDF export button. | `GET /teacher_notices`, `POST /teacher_delete_notice` |
| 34 | `/teacher-add-notice` | `src/app/teacher-add-notice.tsx` | Teacher | Add Notice Screen: Form to broadcast notices, title, message body, target class picker, attachment upload, and submit handler. | `POST /teacher_add_notice` |
| 35 | `/teacher-leaves` | `src/app/teacher-leaves.tsx` | Teacher | Student Leave Applications: Pending/Approved/Rejected tab filter, student leave details, approval/rejection modal with remarks field, and PDF export. | `GET /teacher_leave_applications`, `POST /teacher_review_leave` |
| 36 | `/teacher-fees` | `src/app/teacher-fees.tsx` | Teacher | Class Fee Invoices: List of fee dues, add fee invoice button, status filter (Due/Paid), and PDF fee statement export. | `GET /teacher_fee_invoices`, `POST /teacher_add_fee_invoice` |
| 37 | `/teacher-students` | `src/app/teacher-students.tsx` | Teacher | Student Roster Toolbar: 2-column grid layout for toolbar buttons (Add Student, Import Excel, Export PDF, Notify Class, Import Result) and searchable student list. | `GET /teacher_students` |
| 38 | `/teacher-add-student` | `src/app/teacher-add-student.tsx` | Teacher | Add New Student Form: Manual student entry form (Name, Roll No, SRN, Father's Name, Mother's Name, Mobile, Gender, DOB, Photo Upload). | `POST /teacher_add_student` |
| 39 | `/teacher-student-review` | `src/app/teacher-student-review.tsx` | Teacher | Review Student Profile: Detailed student review view, editing options, attendance history, and parent contact options. | `GET /teacher_student_details`, `POST /teacher_update_student` |
| 40 | `/teacher-import-students` | `src/app/teacher-import-students.tsx` | Teacher | Import Students (Excel/CSV): Web-compatible Excel template download (`download_student_template`), file picker for `.csv`/`.xlsx`, validation preview, and bulk import submit. | `GET /download_student_template`, `POST /teacher_import_students` |
| 41 | `/teacher-import-result` | `src/app/teacher-import-result.tsx` | Teacher | Import Student Results (Excel/CSV): Exam name picker, result template download, Excel/CSV file upload, and bulk marks import submit. | `GET /teacher_result_template`, `POST /teacher_import_results` |
| 42 | `/teacher-profile-setup` | `src/app/teacher-profile-setup.tsx` | Teacher | Teacher Profile Setup: Signature canvas drawer ("Redraw signature"), subject selection, and profile information update. | `GET /teacher_profile`, `POST /teacher_profile_update` |
| 43 | `/teacher-export` | `src/app/teacher-export.tsx` | Teacher | Class Reports Export: Form to select export options (Student Roster, Attendance Summary, Homework Summary, Fee Summary) into PDF or Excel formats. | `GET /teacher_export_data` |
| 44 | `/teacher-storage` | `src/app/teacher-storage.tsx` | Teacher | Teacher Storage Usage: Storage bar showing total uploaded bytes across Homework Photos, Event Media, and Student Photos with category item download and delete options. | `GET /teacher_storage_summary`, `POST /delete_teacher_storage` |
| 45 | `/storage-usage` | `src/app/storage-usage.tsx` | All | App Storage Usage: Category breakdown of system storage quota and usage percentages. | `GET /app_storage_usage` |
| 46 | `/teacher-forgot-password` | `src/app/teacher-forgot-password.tsx` | Teacher | Forgot Password View: Password reset request form via email/SMS OTP verification. | `POST /teacher_forgot_password` |
