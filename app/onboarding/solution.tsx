import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { FontFamily, Spacing } from '../../src/constants/theme';
import OnboardingLayout from '../../src/components/onboarding/OnboardingLayout';
import FadeUp from '../../src/components/onboarding/FadeUp';
import { useOnboardingStepView } from '../../src/hooks/useOnboardingStepView';
import { hapticLight } from '../../src/utils/haptics';

/**
 * Solution screen — immediately answers the pain set up by `problem.tsx`.
 *
 * Same minimal editorial style: one big lowercase line with a single accent
 * word, a quiet "it's simple / every day / you …" rhythm beneath, tap to
 * continue. Within the first three onboarding screens the user now knows
 * exactly what BrainLock does.
 */
export default function SolutionScreen() {
  useOnboardingStepView('solution');
  const { colors } = useThemeColors();
  const insets = useSafeAreaInsets();

  const next = () => {
    hapticLight();
    router.push('/onboarding/howitworks');
  };

  return (
    <OnboardingLayout>
      <Pressable
        onPress={next}
        style={[
          styles.container,
          { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <View style={styles.top}>
          <FadeUp delay={80}>
            <Text style={[styles.headline, { color: colors.text }]}>
              BrainLock helps you put your brain{' '}
              <Text style={{ color: colors.accent }}>back in charge</Text>.
            </Text>
          </FadeUp>
        </View>

        <FadeUp delay={520}>
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
  body: {
    fontSize: 17,
    fontFamily: FontFamily.regular,
    lineHeight: 26,
    letterSpacing: -0.1,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingVertical: 14,
  },
  stepNum: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    letterSpacing: 1.5,
    width: 26,
    fontVariant: ['tabular-nums'],
  },
  stepText: {
    flex: 1,
    fontSize: 18,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  stepDivider: {
    height: 1,
    width: '100%',
  },
  tagline: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    lineHeight: 22,
    letterSpacing: -0.1,
    fontStyle: 'italic',
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
