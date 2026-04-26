export type ThemeMode = 'light' | 'dark' | 'system';

export const LightColors = {
  background: '#FBF5EC',
  card: '#FFFFFF',
  cardAlt: '#F5EFE6',
  border: '#E8DFD3',
  muted: '#9C9389',
  secondary: '#6B6359',
  text: '#1A1A2E',
  accent: '#E8850C',
  accentDark: '#D4700A',
  accentLight: 'rgba(232,133,12,0.10)',
  accentGlow: 'rgba(232,133,12,0.20)',
  info: '#3B82F6',
  infoLight: 'rgba(59,130,246,0.10)',
  success: '#22C55E',
  error: '#EF4444',
  transparent: 'transparent',
};

export const DarkColors: typeof LightColors = {
  background: '#0B0B10',
  card: '#141420',
  cardAlt: '#1C1C2E',
  border: '#2A2A3C',
  muted: '#6B7280',
  secondary: '#9CA3AF',
  text: '#F0F0F5',
  accent: '#FFD54F',
  accentDark: '#FFC107',
  accentLight: 'rgba(255,213,79,0.12)',
  accentGlow: 'rgba(255,213,79,0.25)',
  info: '#60A5FA',
  infoLight: 'rgba(96,165,250,0.12)',
  success: '#22C55E',
  error: '#EF4444',
  transparent: 'transparent',
};

// Backward compat
export const Colors = LightColors;

export type ThemeColors = typeof LightColors;

export function getColors(mode: 'light' | 'dark'): ThemeColors {
  return mode === 'dark' ? DarkColors : LightColors;
}

export const Gradients = {
  light: {
    cardWarm: ['#FFFFFF', '#FFF8EE'] as [string, string],
    heroGreen: ['#1B6B3C', '#145830', '#0D4025'] as [string, string, string],
    heroPrimary: ['#C46A08', '#A85506', '#8B4205'] as [string, string, string],
    heroDeep: ['#2C1810', '#4A2812', '#2C1810'] as [string, string, string],
    cardSurface: ['#FFFFFF', '#FDFAF5'] as [string, string],
  },
  dark: {
    cardWarm: ['#141420', '#1A1814'] as [string, string],
    heroGreen: ['#0A2A1A', '#0D3520', '#082E18'] as [string, string, string],
    heroPrimary: ['#1A1508', '#251C06', '#1A1508'] as [string, string, string],
    heroDeep: ['#1A1508', '#251C06', '#1A1508'] as [string, string, string],
    cardSurface: ['#141420', '#18182A'] as [string, string],
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 24,
  xxxl: 32,
  xxxxl: 48,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 28,
  hero: 32,
};

export const FontFamily = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  heavy: 'PlusJakartaSans_800ExtraBold',
};

export const FontWeight = {
  regular: '400' as const,
  medium: '400' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '700' as const,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 12,
  xl: 12,
  xxl: 12,
  full: 999,
};

export const Shadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
};

export const Heights = {
  sm: 36,
  md: 44,
  lg: 52,
};
