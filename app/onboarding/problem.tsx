import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { FontFamily, Spacing } from '../../src/constants/theme';
import OnboardingLayout from '../../src/components/onboarding/OnboardingLayout';
import OnboardingBackButton from '../../src/components/onboarding/OnboardingBackButton';
import FadeUp from '../../src/components/onboarding/FadeUp';
import { useOnboardingStepView } from '../../src/hooks/useOnboardingStepView';
import { hapticLight } from '../../src/utils/haptics';

/**
 * Problem screen - paints the pain in the user's own words.
 *
 * Pattern: lowercase editorial typography, one accent word in the headline,
 * a quiet sub-line, and a tap-anywhere-to-continue affordance. Lifted from
 * the Prayer-Lock-style "problem → solution" pacing that converts well in
 * mobile onboarding (problem screen is followed by `solution.tsx`).
 */
export default function ProblemScreen() {
  useOnboardingStepView('problem');
  const { colors } = useThemeColors();
  const insets = useSafeAreaInsets();

  const next = () => {
    hapticLight();
    router.push('/onboarding/solution');
  };

  return (
    <OnboardingLayout step={1} totalSteps={15}>
      <OnboardingBackButton />
      <Pressable
        onPress={next}
        style={[
          styles.container,
          { paddingTop: insets.top + 92, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <View style={styles.top}>
          <FadeUp delay={120}>
            <Text style={[styles.symptom, { color: colors.text }]}>
              Focus is harder than it used to be.
            </Text>
          </FadeUp>
          <FadeUp delay={560}>
            <Text style={[styles.symptom, { color: colors.text }]}>
              Your thumb opens the app before you even notice.
            </Text>
          </FadeUp>
          <FadeUp delay={1000}>
            <Text style={[styles.symptom, { color: colors.text }]}>
              That fog setting in? That's brain rot.
            </Text>
          </FadeUp>
          <View style={{ height: 28 }} />
          <FadeUp delay={1440}>
            <Text style={[styles.punch, { color: colors.accent }]}>
              Sound familiar?
            </Text>
          </FadeUp>
        </View>

        <FadeUp delay={2100}>
          <View style={styles.tapRow}>
            <Text style={[styles.tapText, { color: colors.muted }]}>tap to continue</Text>
            <ArrowRight size={16} color={colors.accent} strokeWidth={2.2} />
          </View>
        </FadeUp>
      </Pressable>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
    justifyContent: 'space-between',
  },
  top: {
    alignItems: 'flex-start',
  },
  headline: {
    fontSize: 48,
    fontFamily: FontFamily.medium,
    letterSpacing: -1.6,
    lineHeight: 54,
  },
  symptom: {
    fontSize: 28,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.8,
    lineHeight: 36,
    marginBottom: 16,
  },
  punch: {
    fontSize: 38,
    fontFamily: FontFamily.medium,
    letterSpacing: -1.2,
    lineHeight: 44,
  },
  body: {
    fontSize: 17,
    fontFamily: FontFamily.regular,
    lineHeight: 26,
    letterSpacing: -0.1,
  },
  tapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  tapText: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    letterSpacing: 0.1,
  },
});
