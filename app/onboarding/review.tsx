import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import { router } from 'expo-router';
import { track, Events } from '../../src/services/analytics';
import { Star } from 'lucide-react-native';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { Spacing } from '../../src/constants/theme';
import { useStore } from '../../src/store/useStore';
import OnboardingLayout from '../../src/components/onboarding/OnboardingLayout';
import OnboardingButton from '../../src/components/onboarding/OnboardingButton';
import OnboardingBackButton from '../../src/components/onboarding/OnboardingBackButton';
import FadeUp from '../../src/components/onboarding/FadeUp';
import { Eyebrow, SectionHeading, MutedText } from '../../src/components/ui/anvil';
import { useOnboardingStepView } from '../../src/hooks/useOnboardingStepView';

/**
 * Apple's SKStoreReviewController has hard environmental limits:
 *   • iOS Simulator: NEVER displays the prompt (Apple silently no-ops)
 *   • TestFlight: usually doesn't show
 *   • App Store production: shows per Apple's 3-per-year rate limit
 *   • Already-rated users: never shown again
 *
 * Design choice: ONE persistent Continue button, always visible, never
 * swapping components. The native prompt fires in the background after a
 * short delay; if it fails (Expo Go, missing native module, simulator,
 * throttled), we silently swallow the error. The user controls the flow
 * via the Continue button - no flicker, no auto-advance, no AppState
 * gymnastics.
 */

const PROMPT_DELAY_MS = 900; // wait for the stars to finish animating

/**
 * Bulletproof native-prompt firing. Wrapped in a Promise.resolve().then()
 * so any synchronous throw from `require()` (which can happen with the
 * Expo Modules architecture when the native module isn't in the binary)
 * gets converted to a promise rejection we can catch.
 */
async function tryRequestReview(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const StoreReview = require('expo-store-review');
    if (!(await StoreReview.isAvailableAsync())) return false;
    await StoreReview.requestReview();
    return true;
  } catch (err) {
    if (__DEV__) console.warn('[ReviewScreen] prompt unavailable:', err);
    return false;
  }
}

export default function ReviewScreen() {
  useOnboardingStepView('review');
  const { colors } = useThemeColors();
  const { markReviewPromptShown } = useStore();
  const advancedRef = useRef(false);

  // Stagger the star animation in.
  const starAnims = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    Animated.stagger(
      90,
      starAnims.map((a) =>
        Animated.spring(a, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      ),
    ).start();
  }, []);

  const advance = () => {
    if (advancedRef.current) return;
    advancedRef.current = true;
    markReviewPromptShown();
    router.push('/onboarding/calibrating');
  };

  // Fire the native prompt once on mount, in the background. We don't react
  // to its outcome - the user advances via the Continue button.
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      if (cancelled) return;
      const shown = await tryRequestReview();
      if (shown) track(Events.ReviewPromptShown);
    }, PROMPT_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  return (
    <OnboardingLayout step={12} totalSteps={15}>
      <OnboardingBackButton />
      <View style={styles.content}>
        <View style={styles.center}>
          <View style={styles.stars}>
            {starAnims.map((anim, i) => (
              <Animated.View
                key={i}
                style={{
                  transform: [
                    {
                      scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
                    },
                  ],
                  opacity: anim,
                }}
              >
                <Star size={28} color={colors.accent} fill={colors.accent} strokeWidth={0} />
              </Animated.View>
            ))}
          </View>

          <FadeUp delay={500}>
            <SectionHeading size="lg" align="center">
              Rate Brainlock
            </SectionHeading>
          </FadeUp>
          <View style={{ height: 12 }} />
          <FadeUp delay={580}>
            <MutedText size="md" align="center" style={styles.sub}>
              A quick rating helps others find us.
            </MutedText>
          </FadeUp>
        </View>

        {/* Single persistent button - never swaps, never flickers. */}
        <View style={styles.bottomContainer}>
          <OnboardingButton label="Continue" onPress={advance} />
        </View>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'space-between' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  stars: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  eyebrowCenter: {
    textAlign: 'center',
    marginBottom: 4,
  },
  sub: {
    maxWidth: 320,
  },
  bottomContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 40,
  },
});
