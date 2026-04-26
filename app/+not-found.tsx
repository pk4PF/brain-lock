import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useStore } from '../src/store/useStore';
import { Colors } from '../src/constants/theme';

// Catch-all for unmatched routes (e.g. brainlock:/// deep links from notifications)
export default function NotFound() {
  const { onboardingComplete } = useStore();

  useEffect(() => {
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
