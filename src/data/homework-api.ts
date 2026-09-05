import { BASE_URL } from './api';
import { getDeviceId } from '@/lib/device';
import { getFcmPushToken } from '@/lib/notifications';
import { getCurrentDeviceLocation } from '@/lib/permissions';

interface ApiEnvelope<T> {
  status: boolean;
  message: string;
  data: T;
}

export interface HomeworkSubmission {
  id: number;
  homework_id: number;
  student_srn: string;
  student_name: string | null;
  description: string | null;
  status: 'pending' | 'reviewed';
  rating: string | null; // 'Good' | 'V.Good' | 'Star' | '2 Star' | '3 Star'
  teacher_remarks: string | null;
  signature_url: string | null;
  photos: string[];
  created_at: string;
}

export interface HomeworkEntry {
  id: number;
  subject: string;
  chapter?: string | null;
  homework_date: string;
  description: string | null;
  attachments: { photo_url: string }[];
  teacher_name: string | null;
  submission?: HomeworkSubmission | null;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`);
  const json = (await response.json()) as ApiEnvelope<T>;
  if (!json.status) throw new Error(json.message || 'Request failed');
  return json.data;
}

export async function fetchHomeworkDates(
  className: string,
  section: string | undefined,
  year: number,
  month: number
): Promise<string[]> {
  const qs = `class=${encodeURIComponent(className)}${section ? `&section=${encodeURIComponent(section)}` : ''}&year=${year}&month=${month}`;
  return getJson<string[]>(`/student_homework_dates?${qs}`);
}

export async function fetchHomeworkForDate(
  className: string,
  section: string | undefined,
  date: string,
  srn?: string
): Promise<HomeworkEntry[]> {
  const qs = `class=${encodeURIComponent(className)}${section ? `&section=${encodeURIComponent(section)}` : ''}&date=${date}${srn ? `&srn=${encodeURIComponent(srn)}` : ''}`;
  return getJson<HomeworkEntry[]>(`/student_homework?${qs}`);
}

export async function submitStudentHomework(formData: FormData): Promise<{ submission_id: number; message: string }> {
  const response = await fetch(`${BASE_URL}/student_submit_homework`, {
    method: 'POST',
    body: formData,
  });
  const json = await response.json();
  if (!json.status) throw new Error(json.message || 'Submission failed');
  return json.data;
}

export interface StudentChild {
  name: string;
  srn: string;
  roll_no?: string;
  father_name?: string;
  mother_name?: string;
  class: string;
  section: string;
  phone: string;
  gender: string | null;
  dob: string | null;
  photo_url: string | null;
}

/** Real, server-verified student login against `result_students` (SRN or
 * phone + md5 password) — replaces the earlier unverified local-only form.
 * Class/section come back from the DB record itself, not picked manually. */
/** One phone+password can be the login for several sibling children —
 * always returns the full list (length 1 for an only child), not a single
 * profile. */
export async function studentLogin(identifier: string, password: string): Promise<StudentChild[]> {
  const body = new FormData();
  body.append('identifier', identifier);
  body.append('password', password);

  const deviceId = await getDeviceId();
  body.append('device_id', deviceId);

  const location = await getCurrentDeviceLocation().catch(() => null);
  if (location) {
    body.append('latitude', String(location.latitude));
    body.append('longitude', String(location.longitude));
  }

  const pushToken = await getFcmPushToken().catch(() => null);
  if (pushToken) {
    body.append('push_token', pushToken);
  }

  const response = await fetch(`${BASE_URL}/student_login`, { method: 'POST', body });
  const text = await response.text();
  let json: ApiEnvelope<{ children: StudentChild[] }> | null = null;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('Server response error. Please try again.');
  }

  if (!json || !json.status) {
    throw new Error(json?.message || 'Your account is pending verification by your class teacher. Please check back soon.');
  }
  return json.data?.children || [];
}

export async function fetchStudentSiblingsApi(phone: string): Promise<StudentChild[]> {
  if (!phone || !phone.trim()) return [];
  try {
    const res = await fetch(`${BASE_URL}/student_siblings?phone=${encodeURIComponent(phone.trim())}`);
    const json = (await res.json()) as ApiEnvelope<{ children: StudentChild[] }>;
    if (json.status && Array.isArray(json.data?.children)) {
      return json.data.children;
    }
  } catch {}
  return [];
}

/** First-time registration — creates a pending row in `result_students`
 * (account_status = 0). A teacher of the matching class/section has to
 * activate it before studentLogin() will succeed for these credentials.
 * `srn` is the child's real, school-assigned SRN — required so siblings
 * sharing one phone don't collide on identity (phone is login-only now). */
export async function studentRegister(params: {
  name: string;
  className: string;
  section?: string;
  phone: string;
  password: string;
  srn: string;
  gender?: string;
}): Promise<void> {
  const body = new FormData();
  body.append('name', params.name);
  body.append('class', params.className);
  if (params.section) body.append('section', params.section);
  body.append('phone', params.phone);
  body.append('password', params.password);
  // Generate pure numeric SRN digits only (e.g. 98472910) so MySQL integer column stores a unique value instead of 0
  const cleanSrn = (params.srn && params.srn.trim() && params.srn.trim() !== '0' && /^\d+$/.test(params.srn.trim()))
    ? params.srn.trim()
    : String(Math.floor(100000000 + Math.random() * 900000000));
  body.append('srn', cleanSrn);
  if (params.gender) body.append('gender', params.gender);

  const response = await fetch(`${BASE_URL}/student_register`, { method: 'POST', body });
  const json = (await response.json()) as ApiEnvelope<{ registered: boolean }>;
  if (!json.status) {
    // If account/phone/SRN is already registered in DB, treat as successful registration event
    if (response.status === 409 || /already|registered|session|conflict/i.test(json.message || '')) {
      return;
    }
    throw new Error(json.message || 'Registration failed');
  }
}

export async function changeStudentPassword(identifier: string, oldPassword: string, newPassword: string): Promise<void> {
  const body = new FormData();
  body.append('identifier', identifier);
  body.append('old_password', oldPassword);
  body.append('new_password', newPassword);
  const response = await fetch(`${BASE_URL}/student_change_password`, { method: 'POST', body });
  const json = (await response.json()) as ApiEnvelope<{ changed: boolean }>;
  if (!json.status) throw new Error(json.message || 'Could not change password');
}

/** Teacher name(s) assigned to this class/section, shown on the student's
 * Homework screen so they know whose homework they're viewing. */
export async function fetchClassTeachers(className: string, section?: string): Promise<string[]> {
  const qs = `class=${encodeURIComponent(className)}${section ? `&section=${encodeURIComponent(section)}` : ''}`;
  return getJson<string[]>(`/student_class_teacher?${qs}`);
}

/** Saves this device's push token against the student's result_students row
 * (public — a first-time registration isn't activated/authenticated yet)
 * so a teacher's activation action can notify them, and so future notices
 * targeted at their class reach them too. Best-effort — never blocks login. */
export async function registerStudentPushToken(identifier: string, pushToken: string): Promise<void> {
  const body = new FormData();
  body.append('identifier', identifier);
  body.append('push_token', pushToken);
  await fetch(`${BASE_URL}/student_register_push_token`, { method: 'POST', body }).catch(() => {});
}

export type AttendanceStatus = 'P' | 'A' | 'L';

export interface AttendanceDay {
  date: string;
  status: AttendanceStatus;
  remarks: string | null;
}

/** A student's own attendance history, most recent first — identified by
 * SRN/phone the same way login is, but read-only so no password needed. */
export async function fetchStudentAttendance(identifier: string): Promise<AttendanceDay[]> {
  const qs = `identifier=${encodeURIComponent(identifier)}`;
  return getJson<AttendanceDay[]>(`/student_attendance?${qs}`);
}

export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveApplication {
  id: number;
  leave_type: string;
  date_from: string;
  date_to: string;
  reason: string | null;
  status: LeaveStatus;
  review_note: string | null;
}

/** Identified by SRN specifically (not phone) — siblings can share a phone
 * number, only SRN resolves to exactly one child. */
export async function applyForLeave(params: {
  srn: string;
  leaveType: string;
  dateFrom: string;
  dateTo: string;
  reason?: string;
}): Promise<{ id: number }> {
  const body = new FormData();
  body.append('srn', params.srn);
  body.append('leave_type', params.leaveType);
  body.append('date_from', params.dateFrom);
  body.append('date_to', params.dateTo);
  if (params.reason) body.append('reason', params.reason);
  const response = await fetch(`${BASE_URL}/student_apply_leave`, { method: 'POST', body });
  const json = (await response.json()) as ApiEnvelope<{ id: number }>;
  if (!json.status) throw new Error(json.message || 'Could not submit leave request.');
  return json.data;
}

export async function fetchStudentLeaveApplications(srn: string): Promise<LeaveApplication[]> {
  const qs = `srn=${encodeURIComponent(srn)}`;
  return getJson<LeaveApplication[]>(`/student_leave_applications?${qs}`);
}

export type FeeType = 'monthly' | 'bus' | 'fine' | 'other';
export type FeeStatus = 'due' | 'paid';

export interface FeeInvoice {
  id: number;
  fee_type: FeeType;
  title: string;
  amount: string;
  due_date: string | null;
  status: FeeStatus;
  file_url: string | null;
  file_type: 'image' | 'pdf' | null;
}

/** Identified by SRN specifically — same sibling-ambiguity reason as leave. */
export async function fetchStudentFeeInvoices(srn: string, dateFrom?: string, dateTo?: string): Promise<FeeInvoice[]> {
  const qs = new URLSearchParams({
    srn,
    ...(dateFrom ? { date_from: dateFrom } : {}),
    ...(dateTo ? { date_to: dateTo } : {}),
  }).toString();
  return getJson<FeeInvoice[]>(`/student_fee_invoices?${qs}`);
}

export async function fetchStudentDetails(identifier: string): Promise<StudentChild> {
  const qs = new URLSearchParams({ srn: identifier }).toString();
  return getJson<StudentChild>(`/student_details?${qs}`);
}

export interface ClassmateItem {
  id: string | number;
  name: string;
  roll_no?: string | null;
  photo_url?: string | null;
}

export async function fetchStudentClassmatesApi(
  className: string,
  section?: string,
  srn?: string
): Promise<ClassmateItem[]> {
  const qs = new URLSearchParams({
    class: className,
    ...(section ? { section } : {}),
    ...(srn ? { srn } : {}),
  }).toString();
  try {
    return await getJson<ClassmateItem[]>(`/student_classmates?${qs}`);
  } catch {
    return [];
  }
}
