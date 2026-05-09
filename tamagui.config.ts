import { defaultConfig } from '@tamagui/config/v5';
import { createFont, createTamagui } from 'tamagui';

// Geist — Vercel's open-source typeface (SIL OFL). Loaded via
// @expo-google-fonts/geist in _layout.tsx. Geist on Google Fonts ships
// 100–900 weights; we only load 400/500/600/700 to keep the bundle small.
// Heavier numeric weights fall back to 700.
const geistFont = createFont({
  family: 'Geist_400Regular',
  size: defaultConfig.fonts.body.size,
  lineHeight: defaultConfig.fonts.body.lineHeight,
  letterSpacing: defaultConfig.fonts.body.letterSpacing,
  weight: defaultConfig.fonts.body.weight,
  face: {
    400: { normal: 'Geist_400Regular' },
    500: { normal: 'Geist_500Medium' },
    600: { normal: 'Geist_600SemiBold' },
    700: { normal: 'Geist_700Bold' },
    800: { normal: 'Geist_700Bold' },
    900: { normal: 'Geist_700Bold' },
  },
});

const tamaguiConfig = createTamagui({
  ...defaultConfig,
  fonts: {
    // Body and heading both use Geist so every Tamagui <Text>
    // automatically picks up the loaded font.
    ...defaultConfig.fonts,
    body: geistFont,
    heading: geistFont,
  },
});

export type AppConfig = typeof tamaguiConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default tamaguiConfig;
