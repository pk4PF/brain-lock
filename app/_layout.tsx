import { useEffect, useState, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { TamaguiProvider } from 'tamagui';
import tamaguiConfig from '../tamagui.config';
import { useStore } from '../src/store/useStore';
import { Colors } from '../src/constants/theme';
import { initRevenueCat } from '../src/services/revenueCat';
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

    // Initialize RevenueCat
    initRevenueCat().catch((err) =>
      console.warn('RevenueCat init failed:', err)
    );

    return () => unsub();
  }, []);

  const ready = storeReady && fontsLoaded;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) return null;

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'slide_from_right',
        }}
      />
    </TamaguiProvider>
  );
}
