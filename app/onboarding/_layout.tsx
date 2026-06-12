import { Stack } from 'expo-router';
import { useThemeColors } from '../../src/hooks/useThemeColors';

export default function OnboardingLayout() {
  const { colors } = useThemeColors();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {/* Paywall is a hard gate - disable swipe-back & hardware back */}
      <Stack.Screen name="paywall" options={{ gestureEnabled: false }} />
      {/* Winback: no close button - swipe-back is the only exit (and it's
          a one-time offer, so leaving burns it). */}
      <Stack.Screen name="final-offer" options={{ gestureEnabled: true, fullScreenGestureEnabled: true }} />
    </Stack>
  );
}
