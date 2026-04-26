import { useEffect, useState, useRef } from 'react';
import { AppState } from 'react-native';
import { Stack, usePathname, useGlobalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { TamaguiProvider } from 'tamagui';
import { PostHogProvider } from 'posthog-react-native';
import tamaguiConfig from '../tamagui.config';
import { useStore } from '../src/store/useStore';
import { useThemeColors } from '../src/hooks/useThemeColors';
import { initRevenueCat, getCurrentCustomerInfo, checkPremiumStatus, addSubscriptionListener } from '../src/services/revenueCat';
import { initAnalytics, identify, setPersonProperties, getPostHogClient } from '../src/services/analytics';
import { ScreenTime } from 'screen-time-module';
import { preloadSounds } from '../src/utils/sounds';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import * as SplashScreen from 'expo-splash-screen';

// Prevent the native splash from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [storeReady, setStoreReady] = useState(false);

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    const unsub = useStore.persist.onFinishHydration(() => {
      setStoreReady(true);
    });
    if (useStore.persist.hasHydrated()) {
      setStoreReady(true);
    }

    // Initialize PostHog analytics
    initAnalytics().then(() => {
      const { userName, userStruggles, ageBand, isPremium, subscriptionPlan } = useStore.getState();
      if (userName) {
        identify(userName, { userName });
      }
      setPersonProperties({
        userName,
        userStruggles,
        ageBand,
        isPremium,
        subscriptionPlan,
      });
    });

    // Initialize RevenueCat and re-validate subscription
    let unsubListener: (() => void) | undefined;
    initRevenueCat()
      .then(async () => {
        // Clear stale 'lifetime' plan left over from old dev bypass
        if (useStore.getState().subscriptionPlan === 'lifetime') {
          useStore.getState().clearSubscription();
        }

        const { isPremium, clearSubscription } = useStore.getState();
        if (isPremium) {
          try {
            const customerInfo = await getCurrentCustomerInfo();
            if (!checkPremiumStatus(customerInfo)) {
              clearSubscription();
              if (__DEV__) console.log('Subscription expired or revoked — cleared premium status');
            }
          } catch (err) {
            if (__DEV__) console.warn('Failed to validate subscription:', err);
          }
        }

        // Listen for real-time subscription state changes
        unsubListener = addSubscriptionListener((customerInfo) => {
          const state = useStore.getState();
          const isActive = checkPremiumStatus(customerInfo);
          if (state.isPremium && !isActive) {
            state.clearSubscription();
            if (__DEV__) console.log('Subscription state changed — cleared premium');
          } else if (!state.isPremium && isActive) {
            state.setSubscription('restored');
            if (__DEV__) console.log('Subscription state changed — restored premium');
          }
        });
      })
      .catch((err) => { if (__DEV__) console.warn('RevenueCat init failed:', err); });

    // Reset daily unlock if it's a new day
    useStore.getState().checkDailyReset();

    // Re-apply shields on app launch (respects unlock state)
    ScreenTime.ensureBlocking().catch(() => {});

    // Preload sound effects (non-blocking)
    preloadSounds();

    // Check unlock expiry when app comes to foreground
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        useStore.getState().checkUnlockExpiry();
      }
    });

    return () => {
      unsub();
      unsubListener?.();
      appStateSub.remove();
    };
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
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const previousPathname = useRef<string | undefined>(undefined);

  // Manual screen tracking for Expo Router
  useEffect(() => {
    if (previousPathname.current !== pathname) {
      const client = getPostHogClient();
      client?.screen(pathname, {
        previous_screen: previousPathname.current ?? null,
        ...params,
      });
      previousPathname.current = pathname;
    }
  }, [pathname, params]);

  const posthogClient = getPostHogClient();

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={isDark ? 'dark' : 'light'}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {posthogClient ? (
        <PostHogProvider
          client={posthogClient}
          autocapture={{
            captureScreens: false,
            captureTouches: true,
            propsToCapture: ['testID'],
          }}
        >
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: 'slide_from_right',
            }}
          />
        </PostHogProvider>
      ) : (
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'slide_from_right',
          }}
        />
      )}
    </TamaguiProvider>
  );
}
