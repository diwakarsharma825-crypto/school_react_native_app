import { Colors } from '@/constants/theme';
import { useBrand } from './use-brand';
import { useThemeMode } from './use-theme-mode';

export function useTheme() {
  const { mode } = useThemeMode();
  const brand = useBrand();
  const base = mode === 'dark' ? Colors.dark : Colors.light;
  const dark = mode === 'dark';

  return {
    ...base,
    dark,
    tint: brand.primaryColor ?? base.tint,
    accent: brand.accentColor ?? base.accent,
  };
}
