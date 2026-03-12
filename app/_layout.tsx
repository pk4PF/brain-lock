import { useEffect, useState, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { TamaguiProvider } from 'tamagui';
import tamaguiConfig from '../tamagui.config';
import { useStore } from '../src/store/useStore';
import { useThemeColors } from '../src/hooks/useThemeColors';
import { initRevenueCat, getCurrentCustomerInfo, checkPremiumStatus } from '../src/services/revenueCat';
import { ScreenTime } from 'screen-time-module';
import { preloadSounds } from '../src/utils/sounds';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';

// Prevent the native splash from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [storeReady, setStoreReady] = useState(false);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    const unsub = useStore.persist.onFinishHydration(() => {
      setStoreReady(true);
    });
    if (useStore.persist.hasHydrated()) {
      setStoreReady(true);
    }

    // Initialize RevenueCat and re-validate subscription
    initRevenueCat()
      .then(async () => {
        const { isPremium, clearSubscription } = useStore.getState();
        if (isPremium) {
          try {
            const customerInfo = await getCurrentCustomerInfo();
            if (!checkPremiumStatus(customerInfo)) {
              clearSubscription();
              console.log('Subscription expired or revoked — cleared premium status');
            }
          } catch (err) {
            console.warn('Failed to validate subscription:', err);
          }
        }
      })
      .catch((err) => console.warn('RevenueCat init failed:', err));

    // Reset daily unlock if it's a new day
    useStore.getState().checkDailyReset();

    // Re-apply shields on app launch (respects unlock state)
    ScreenTime.ensureBlocking().catch(() => {});

    // Preload sound effects (non-blocking)
    preloadSounds();

    return () => unsub();
  }, []);

  const ready = storeReady && fontsLoaded;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) return null;

  return <ThemedApp />;
}

function ThemedApp() {
  const { colors, isDark } = useThemeColors();

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={isDark ? 'dark' : 'light'}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      />
    </TamaguiProvider>
  );
}
