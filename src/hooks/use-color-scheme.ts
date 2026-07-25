// The real Saarthak GIMSSS app always renders its light theme regardless of
// the device's system appearance setting. Force 'light' rather than
// deferring to RN's useColorScheme so the whole app has one source of truth.
export function useColorScheme(): 'light' | 'dark' {
  return 'light';
}
