import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useStore } from '../src/store/useStore';
import { Colors } from '../src/constants/theme';

export default function Index() {
  const { onboardingComplete } = useStore();

  useEffect(() => {
    // DEV: always show onboarding on app start
    if (__DEV__) {
      useStore.setState({ onboardingComplete: false });
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
