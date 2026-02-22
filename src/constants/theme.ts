export const Colors = {
  // Light-mode base
  background: '#F8F9FB',
  card: '#FFFFFF',
  cardAlt: '#F0F1F5',
  border: '#E5E7EB',
  // Text hierarchy (dark on light)
  muted: '#9CA3AF',
  secondary: '#6B7280',
  text: '#1A1A2E',
  // Primary accent (amber/gold)
  accent: '#F5A623',
  accentDark: '#FF6B35',
  accentLight: 'rgba(245,166,35,0.10)',
  accentGlow: 'rgba(245,166,35,0.20)',
  // Semantic
  success: '#22C55E',
  error: '#EF4444',
  transparent: 'transparent',
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
