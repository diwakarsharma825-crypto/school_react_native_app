import { Redirect } from 'expo-router';
import React from 'react';

// Superseded by src/app/notices.tsx (News/Notice/Holiday tabs sourced from
// the real /news, /notices, /holidays endpoints). Kept as a redirect so any
// stale deep link to /announcements still lands somewhere useful.
export default function AnnouncementsRedirect() {
  return <Redirect href="/notices" />;
}
