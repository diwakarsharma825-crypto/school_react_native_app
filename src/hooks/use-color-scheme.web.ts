// The real Saarthak GIMSSS app always renders its light theme regardless of
// the device's system appearance setting. Force 'light' on web too.
export function useColorScheme(): 'light' | 'dark' {
  return 'light';
}
