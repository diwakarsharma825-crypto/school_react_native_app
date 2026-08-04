export const Brand = {
  blue: '#123A6B',
  blueDark: '#0C2A4E',
  blueLight: '#2E6FBE',
  /** Brighter blue used as the dark-theme tint — #2E6FBE reads too dim as
   * text/icon/border on the dark surfaces, so dark mode steps up to this
   * for adequate contrast across every screen at once. */
  blueBright: '#5B9BE8',
  saffron: '#E8871E',
  saffronLight: '#F5A623',
  green: '#2E7D32',
  red: '#C62828',
  gold: '#B8860B',
  white: '#FFFFFF',
};

/** Pastel tile colors for the home quick-action grid (Result/Notices/Disclosure/Contact). */
export const TileColors = {
  orange: { bg: '#FDECD8', fg: '#E8871E' },
  blue: { bg: '#DCE8F7', fg: '#2E6FBE' },
  green: { bg: '#DFF1E1', fg: '#2E7D32' },
  red: { bg: '#FBE2E2', fg: '#C62828' },
};

/** Cycled avatar palette for teacher initials avatars. */
export const AvatarPalette = ['#DCE8F7', '#FDECD8', '#DFF1E1', '#F4E3F7', '#FDE8E8'];
export const AvatarFgPalette = ['#2E6FBE', '#E8871E', '#2E7D32', '#8E44AD', '#C62828'];

export const Colors = {
  light: {
    text: '#151718',
    textSecondary: '#5A6472',
    textOnBrand: '#FFFFFF',
    background: '#F5F7FA',
    surface: '#FFFFFF',
    backgroundElement: '#EEF1F5',
    backgroundSelected: '#E7EEF8',
    border: '#E1E5EA',
    tint: Brand.blue,
    accent: Brand.saffron,
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: '#9BA3AE',
    textOnBrand: '#FFFFFF',
    background: '#0C1117',
    surface: '#171C24',
    backgroundElement: '#1E242D',
    backgroundSelected: '#233047',
    border: '#2A313C',
    tint: Brand.blueBright,
    accent: Brand.saffronLight,
  },
};

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
};
