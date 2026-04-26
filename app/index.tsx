import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import { useStore } from '../src/store/useStore';
import { Colors } from '../src/constants/theme';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

export default function Index() {
  const { onboardingComplete, lastAppVersion } = useStore();

  useEffect(() => {
    // DEV: always show onboarding on app start
    if (__DEV__) {
      const { settings } = useStore.getState();
      useStore.setState({
        onboardingComplete: false,
        dailyGamesCompleted: 0,
        appsUnlocked: false,
        settings: {
          ...settings,
          screenTimeAuthorized: false,
          screenTimeAppCount: 0,
          screenTimeScheduleEnabled: false,
        },
      });
      router.replace('/onboarding');
      return;
    }

    // Version mismatch — reset onboarding so returning users see the new flow
    if (lastAppVersion !== APP_VERSION) {
      useStore.setState({
        onboardingComplete: false,
        lastAppVersion: APP_VERSION,
      });
      router.replace('/onboarding');
      return;
    }

    if (onboardingComplete) {
      router.replace('/(tabs)');
    } else {
      router.replace('/onboarding');
    }
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
});
