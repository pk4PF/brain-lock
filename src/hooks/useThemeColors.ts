import { useColorScheme } from 'react-native';
import { useStore } from '../store/useStore';
import { getColors, Gradients, type ThemeColors } from '../constants/theme';

export function useThemeColors() {
  const systemScheme = useColorScheme();
  const themePref = useStore((s) => s.settings.theme);

  // Light-first product. We render the warm-cream light palette unless the
  // user has explicitly chosen dark mode in settings. Friendlier first
  // impression for onboarding and matches the brand mood.
  void systemScheme;
  const mode = themePref === 'dark' ? 'dark' : 'light';

  const isDark = mode === 'dark';

  return {
    colors: getColors(mode) as ThemeColors,
    isDark,
    gradients: isDark ? Gradients.dark : Gradients.light,
  };
}
