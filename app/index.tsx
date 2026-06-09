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
    // DEV: always show onboarding on app start, fully reset so the sliders
    // and survey screens start blank and the cream theme is forced.
    if (__DEV__) {
      const { settings } = useStore.getState();
      useStore.setState({
        onboardingComplete: false,
        dailyGamesCompleted: 0,
        appsUnlocked: false,
        // Clear survey answers so sliders open at default, not previous run.
        userName: '',
        userAge: null,
        dailyScreenTimeHours: 0,
        userGoals: [],
        userStruggles: [],
        // Clear the review-prompt flag every dev session. Without this, once
        // the flag is set the in-onboarding review screen + the global
        // maybeShowReviewPrompt() helper short-circuit forever.
        reviewPromptShownAt: null,
        settings: {
          ...settings,
          // Force the cream/light onboarding palette every fresh session.
          theme: 'light',
          screenTimeAuthorized: false,
          screenTimeAppCount: 0,
        },
      });
      router.replace('/onboarding');
      return;
    }

    // Track the last-seen app version for analytics / future "What's new"
    // gating, but DO NOT reset onboardingComplete. A returning user (especially
    // a paying customer) must never be force-routed back through onboarding +
    // paywall on update - that's a refund-request UX. If we ever need to show
    // returning users a new flow, do it via a What's New modal gated on
    // version delta, not by wiping their progress.
    if (lastAppVersion !== APP_VERSION) {
      useStore.setState({ lastAppVersion: APP_VERSION });
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
