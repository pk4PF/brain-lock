export type ThemeMode = 'light' | 'dark' | 'system';

// ─────────────────────────────────────────────
// COLOUR SYSTEM - dark-first, single warm orange accent.
// We allow each *game* its own quiet accent hue (see GameAccents),
// but the rest of the app stays monochrome with one accent.
//
// "Playful but minimal":
//   - Warm cream paper for light mode (not stark white)
//   - A touch of warm tint on dark surfaces (not pure black)
//   - One accent that already feels playful (warm orange)
// ─────────────────────────────────────────────

// Cool deep-navy dark mode (Elevate-style). Warm orange accent stays so
// the brand pop reads the same; everything around it shifts to a cooler,
// quieter blue-grey so the accent has somewhere to land.
export const DarkColors = {
  background: '#0B1220',     // deep cool navy
  card: '#161E2C',           // card surface a touch lighter than bg
  cardAlt: '#1F2937',        // raised / alt surface
  border: '#243042',         // cool hairline, barely visible
  borderStrong: '#374151',   // emphasised border, for highlighted cards
  muted: '#6B7689',          // cool blue-grey muted text
  secondary: '#9CA3AF',      // secondary text, still readable on bg
  text: '#F1F5F9',           // cool off-white, no warm tint
  accent: '#FF6A1A',
  accentDark: '#E55A12',
  accentSoft: '#FF8A4A',
  accentLight: 'rgba(255,106,26,0.12)',
  accentGlow: 'rgba(255,106,26,0.22)',
  info: '#3B82F6',
  infoLight: 'rgba(59,130,246,0.10)',
  success: '#22C55E',
  successLight: 'rgba(34,197,94,0.14)',
  error: '#EF4444',
  transparent: 'transparent',
};

// Warm cream light mode - paper feel, not stark white.
// Notion-meets-Duolingo: friendly background, generous warmth.
export const LightColors: typeof DarkColors = {
  background: '#FAF6F0',     // warm cream paper
  card: '#FFFFFF',           // pure white card pops against cream
  cardAlt: '#F4EFE7',
  border: '#EBE3D5',         // warm hairline
  borderStrong: '#D8CDB8',
  muted: '#A39686',
  secondary: '#6A6056',
  text: '#1A1612',           // warm near-black
  accent: '#FF6A1A',
  accentDark: '#E55A12',
  accentSoft: '#FF8A4A',
  accentLight: 'rgba(255,106,26,0.10)',
  accentGlow: 'rgba(255,106,26,0.18)',
  info: '#3B82F6',
  infoLight: 'rgba(59,130,246,0.08)',
  success: '#16A34A',
  successLight: 'rgba(22,163,74,0.12)',
  error: '#DC2626',
  transparent: 'transparent',
};

// ─────────────────────────────────────────────
// PER-GAME ACCENTS - one place to change, used by:
//   • the games-tab tile illustration + tinted card
//   • the game's intro/HUD/result accent strokes
// Each game keeps its own personality without becoming a
// rainbow gradient screen.
// ─────────────────────────────────────────────
export const GameAccents = {
  memory:    { hue: '#8B5CF6', tintLight: 'rgba(139,92,246,0.08)', tintDark: 'rgba(139,92,246,0.12)' },
  'word-recall': { hue: '#10B981', tintLight: 'rgba(16,185,129,0.08)', tintDark: 'rgba(16,185,129,0.12)' },
  math:      { hue: '#F97316', tintLight: 'rgba(249,115,22,0.08)', tintDark: 'rgba(249,115,22,0.14)' },
  focus:     { hue: '#3B82F6', tintLight: 'rgba(59,130,246,0.08)', tintDark: 'rgba(59,130,246,0.12)' },
  // Day-1 launch batch. Hues chosen to be distinct from the existing 5
  // while still living inside the warm/cool/saturation palette.
  sequence:    { hue: '#A855F7', tintLight: 'rgba(168,85,247,0.08)',  tintDark: 'rgba(168,85,247,0.12)' },
  anagram:     { hue: '#0EA5E9', tintLight: 'rgba(14,165,233,0.08)',  tintDark: 'rgba(14,165,233,0.12)' },
  'color-match': { hue: '#EC4899', tintLight: 'rgba(236,72,153,0.08)', tintDark: 'rgba(236,72,153,0.12)' },
  'block-tap': { hue: '#F59E0B', tintLight: 'rgba(245,158,11,0.08)',  tintDark: 'rgba(245,158,11,0.14)' },
  'number-seq': { hue: '#14B8A6', tintLight: 'rgba(20,184,166,0.08)', tintDark: 'rgba(20,184,166,0.12)' },
  // Hero marketing game. Deep teal so the lit tiles pop hard against the
  // warm cream background and don't collide with Memory Match's purple.
  'tile-recall': { hue: '#0EA5A5', tintLight: 'rgba(14,165,165,0.08)', tintDark: 'rgba(14,165,165,0.12)' },
  // Viral batch. Indigo / gold / rose - distinct from every hue above.
  chimp:        { hue: '#6366F1', tintLight: 'rgba(99,102,241,0.08)',  tintDark: 'rgba(99,102,241,0.14)' },
  'cup-shuffle': { hue: '#EAB308', tintLight: 'rgba(234,179,8,0.08)',  tintDark: 'rgba(234,179,8,0.14)' },
  schulte:      { hue: '#F43F5E', tintLight: 'rgba(244,63,94,0.08)',   tintDark: 'rgba(244,63,94,0.14)' },
  // Quiz challenges
  'general-knowledge': { hue: '#06B6D4', tintLight: 'rgba(6,182,212,0.08)', tintDark: 'rgba(6,182,212,0.14)' },
  flags:        { hue: '#D946EF', tintLight: 'rgba(217,70,239,0.08)',  tintDark: 'rgba(217,70,239,0.14)' },
  // Benchmark tests. Signal red for reaction (matches the wait-state),
  // crimson for digit span, violet for timing.
  reaction:     { hue: '#E53935', tintLight: 'rgba(229,57,53,0.08)',   tintDark: 'rgba(229,57,53,0.14)' },
  'digit-span': { hue: '#DC2626', tintLight: 'rgba(220,38,38,0.08)',   tintDark: 'rgba(220,38,38,0.14)' },
  'time-stop':  { hue: '#9333EA', tintLight: 'rgba(147,51,234,0.08)',  tintDark: 'rgba(147,51,234,0.14)' },
} as const;

export type GameAccentKey = keyof typeof GameAccents;

export const Colors = DarkColors;
export type ThemeColors = typeof DarkColors;

export function getColors(mode: 'light' | 'dark'): ThemeColors {
  return mode === 'dark' ? DarkColors : LightColors;
}

// ─────────────────────────────────────────────
// GRADIENTS - kept for legacy components, but new
// surfaces should NOT use gradients. Use solid
// `card` + 1px `border` instead.
// ─────────────────────────────────────────────
export const Gradients = {
  light: {
    cta: ['#FF6A1A', '#FF6A1A'] as [string, string],
    heroPrimary: ['#FF6A1A', '#FF6A1A', '#FF6A1A'] as [string, string, string],
    heroWarm: ['#FFFFFF', '#FAFAFA'] as [string, string],
    cardWarm: ['#FFFFFF', '#FAFAFA'] as [string, string],
    cardSurface: ['#FFFFFF', '#FAFAFA'] as [string, string],
    heroDeep: ['#0B0B0B', '#121212', '#0B0B0B'] as [string, string, string],
    heroGreen: ['#0B0B0B', '#121212', '#0B0B0B'] as [string, string, string],
  },
  dark: {
    cta: ['#FF6A1A', '#FF6A1A'] as [string, string],
    heroPrimary: ['#0B1220', '#161E2C', '#0B1220'] as [string, string, string],
    heroWarm: ['#0B1220', '#161E2C'] as [string, string],
    cardWarm: ['#161E2C', '#0F151F'] as [string, string],
    cardSurface: ['#161E2C', '#1F2937'] as [string, string],
    heroDeep: ['#0B1220', '#161E2C', '#0B1220'] as [string, string, string],
    heroGreen: ['#0B1220', '#161E2C', '#0B1220'] as [string, string, string],
  },
};

// ─────────────────────────────────────────────
// SPACING - strict 8pt grid
// ─────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  xxxxl: 56,
};

// ─────────────────────────────────────────────
// TYPOGRAPHY - Geist. One display per screen, medium for labels,
// regular for body. Bumped a notch in v1.1 - original sizes felt
// too small/SaaS-y on real devices.
// ─────────────────────────────────────────────
export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 26,
  hero: 34,
};

export const FontFamily = {
  regular:  'Geist_400Regular',
  medium:   'Geist_500Medium',
  semibold: 'Geist_600SemiBold',
  bold:     'Geist_700Bold',
  heavy:    'Geist_700Bold', // We only load up to 700 to keep the bundle small
};

export const FontWeight = {
  regular:  '400' as const,
  medium:   '500' as const,
  semibold: '600' as const,
  bold:     '700' as const,
  heavy:    '700' as const,
};

// ─────────────────────────────────────────────
// SHAPE - restrained radii. 16 max for cards.
// ─────────────────────────────────────────────
export const BorderRadius = {
  sm:   8,
  md:   12,
  lg:   14,
  xl:   16,
  xxl:  18,
  full: 999,
};

// Hairline borders replace shadows on dark surfaces.
export const Shadows = {
  card: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  cardStrong: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 28,
    elevation: 12,
  },
};

export const Heights = {
  sm: 36,
  md: 44,
  lg: 52,
};
