import { useEffect, useState, useRef } from 'react';
import { AppState, Text, TextInput } from 'react-native';

// Cap iOS Dynamic Type / accessibility text scaling at 1.5× project-wide.
// Without this, users on maximum accessibility settings get 3× scaling, which
// pushes Continue buttons off-screen and breaks fixed layouts. 1.5× is the
// sweet spot: still meaningfully larger for accessibility, doesn't shred
// layouts. Per-screen overrides are still possible by passing
// `maxFontSizeMultiplier` directly to a Text element.
// Use defaultProps assignment (the @ts-expect-error is for the missing
// type - the property exists at runtime in RN).
// @ts-expect-error: defaultProps is a valid RN escape hatch for global text caps
Text.defaultProps = Text.defaultProps || {};
// @ts-expect-error: as above
Text.defaultProps.maxFontSizeMultiplier = 1.5;
// @ts-expect-error: as above
TextInput.defaultProps = TextInput.defaultProps || {};
// @ts-expect-error: as above
TextInput.defaultProps.maxFontSizeMultiplier = 1.5;
import { Stack, usePathname, useGlobalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { TamaguiProvider } from 'tamagui';
import { PostHogProvider } from 'posthog-react-native';
import tamaguiConfig from '../tamagui.config';
import { useStore } from '../src/store/useStore';
import { useThemeColors } from '../src/hooks/useThemeColors';
import { initRevenueCat, getCurrentCustomerInfo, checkPremiumStatus, addSubscriptionListener } from '../src/services/revenueCat';
import { initAnalytics, identify, setPersonProperties, getPostHogClient, track } from '../src/services/analytics';
import Constants from 'expo-constants';
import { ScreenTime } from 'screen-time-module';
import { preloadSounds } from '../src/utils/sounds';
import {
  useFonts,
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
} from '@expo-google-fonts/geist';
import * as SplashScreen from 'expo-splash-screen';

// Prevent the native splash from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [storeReady, setStoreReady] = useState(false);

  const [fontsLoaded] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
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
      const { userName, userStruggles, ageBand, isPremium, subscriptionPlan, referralSource } = useStore.getState();
      if (userName) {
        identify(userName, { userName });
      }
      setPersonProperties({
        userName,
        userStruggles,
        ageBand,
        isPremium,
        subscriptionPlan,
        referral_source: referralSource,
      });

      // Probe event. Used to verify the PostHog connection is healthy on
      // every install — the first thing we look for in PostHog → Activity →
      // Live Events when investigating a silent funnel.
      track('app_launched', {
        version: Constants.expoConfig?.version ?? 'unknown',
        build:
          Constants.expoConfig?.ios?.buildNumber ??
          Constants.expoConfig?.android?.versionCode ??
          'unknown',
      });
    });

    // Initialize RevenueCat and re-validate subscription. Use the PostHog
    // distinctId as the RevenueCat appUserID so paying customers in the
    // RevenueCat dashboard match users in PostHog instead of showing as
    // "Anonymous". On first run for existing anonymous customers, logIn()
    // aliases the $RCAnonymousID to this ID so entitlements carry over.
    let unsubListener: (() => void) | undefined;
    let rcAppUserID: string | undefined;
    try {
      const ph = getPostHogClient();
      const id = ph?.getDistinctId();
      if (typeof id === 'string' && id.length > 0) rcAppUserID = id;
    } catch (err) {
      if (__DEV__) console.warn('Failed to read PostHog distinctId for RC:', err);
    }
    initRevenueCat(rcAppUserID)
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
              if (__DEV__) console.log('Subscription expired or revoked - cleared premium status');
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
            if (__DEV__) console.log('Subscription state changed - cleared premium');
          } else if (!state.isPremium && isActive) {
            state.setSubscription('restored');
            if (__DEV__) console.log('Subscription state changed - restored premium');
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
