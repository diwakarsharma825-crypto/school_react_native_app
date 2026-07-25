const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** Formats an ISO date string ("2026-09-28") into a readable form ("28 Sep 2026"). */
export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/** Formats an ISO date string into a short form ("Sep 28"). */
export function formatDateShort(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

const HTML_ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
};

/**
 * Settings fields like principle_text/about_text come from a rich-text
 * editor as raw HTML (often Word-pasted markup). Strip tags and decode
 * entities so it reads as plain text in native Text components.
 */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  const withoutTags = html.replace(/<[^>]*>/g, ' ');
  const decoded = withoutTags.replace(/&[a-z#0-9]+;/gi, (entity) => HTML_ENTITIES[entity] ?? ' ');
  return decoded.replace(/\s+/g, ' ').trim();
}

/** Plain-text excerpt for card previews, from a rich-text/HTML field. */
export function excerptFrom(html: string | null | undefined, maxLen = 110): string {
  const text = stripHtml(html);
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen).trim()}…`;
}
