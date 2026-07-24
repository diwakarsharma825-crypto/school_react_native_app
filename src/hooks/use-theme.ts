import { Colors } from '@/constants/theme';
import { useColorScheme } from './use-color-scheme';

export function useTheme() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? Colors.dark : Colors.light;
}
