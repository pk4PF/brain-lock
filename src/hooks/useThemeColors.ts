import { useColorScheme } from 'react-native';
import { useStore } from '../store/useStore';
import { getColors, Gradients, type ThemeColors } from '../constants/theme';

export function useThemeColors() {
  const systemScheme = useColorScheme();
  const themePref = useStore((s) => s.settings.theme);

  const mode = themePref === 'system'
    ? (systemScheme ?? 'light')
    : themePref;

  const isDark = mode === 'dark';

  return {
    colors: getColors(mode) as ThemeColors,
    isDark,
    gradients: isDark ? Gradients.dark : Gradients.light,
  };
}
