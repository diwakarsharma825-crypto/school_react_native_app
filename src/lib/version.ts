/** Compares two dotted version strings ("1.2.0" vs "1.10.0"). Returns
 * negative if a<b, 0 if equal, positive if a>b. Missing/garbage segments
 * are treated as 0 so partial versions ("1.2") still compare sensibly. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/** True when the installed version is strictly below the required minimum. */
export function isUpdateRequired(currentVersion: string, minVersion: string | null | undefined): boolean {
  if (!minVersion) return false;
  return compareVersions(currentVersion, minVersion) < 0;
}
