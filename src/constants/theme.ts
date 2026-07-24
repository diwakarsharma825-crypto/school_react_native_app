export const Brand = {
  blue: '#123A6B',
  blueDark: '#0C2A4E',
  blueLight: '#2E6FBE',
  saffron: '#E8871E',
  saffronLight: '#F5A623',
  green: '#2E7D32',
  red: '#C62828',
  gold: '#B8860B',
  white: '#FFFFFF',
};

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
    tint: Brand.blueLight,
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
