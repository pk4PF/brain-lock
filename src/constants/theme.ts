export type ThemeMode = 'light' | 'dark' | 'system';

export const LightColors = {
  background: '#F8F9FB',
  card: '#FFFFFF',
  cardAlt: '#F0F1F5',
  border: '#E5E7EB',
  muted: '#9CA3AF',
  secondary: '#6B7280',
  text: '#1A1A2E',
  accent: '#F5A623',
  accentDark: '#FF6B35',
  accentLight: 'rgba(245,166,35,0.10)',
  accentGlow: 'rgba(245,166,35,0.20)',
  info: '#3B82F6',
  infoLight: 'rgba(59,130,246,0.10)',
  success: '#22C55E',
  error: '#EF4444',
  transparent: 'transparent',
};

export const DarkColors: typeof LightColors = {
  background: '#0F0F14',
  card: '#1A1A24',
  cardAlt: '#22222E',
  border: '#2E2E3A',
  muted: '#6B7280',
  secondary: '#9CA3AF',
  text: '#F0F0F5',
  accent: '#F5A623',
  accentDark: '#FF6B35',
  accentLight: 'rgba(245,166,35,0.12)',
  accentGlow: 'rgba(245,166,35,0.25)',
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
  },
  dark: {
    cardWarm: ['#1A1A24', '#1F1A14'] as [string, string],
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
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
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  heavy: 'Inter_800ExtraBold',
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
};
