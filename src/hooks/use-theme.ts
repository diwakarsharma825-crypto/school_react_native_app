import { Colors } from '@/constants/theme';
import { useThemeMode } from './use-theme-mode';

export function useTheme() {
  const { mode } = useThemeMode();
  return mode === 'dark' ? Colors.dark : Colors.light;
}
