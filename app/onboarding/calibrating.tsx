import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { router } from 'expo-router';
import { Check, Brain } from 'lucide-react-native';
import { FontFamily, Spacing } from '../../src/constants/theme';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import OnboardingLayout from '../../src/components/onboarding/OnboardingLayout';
import FadeUp from '../../src/components/onboarding/FadeUp';
import { Eyebrow, SectionHeading } from '../../src/components/ui/anvil';
import { useOnboardingStepView } from '../../src/hooks/useOnboardingStepView';

/**
 * Personalisation loading screen.
 *
 * Sits at the END of the survey/demo run, right before the 4-week plan
 * reveal. The faux-progress animation visibly uses the answers the user
 * just gave, and primes the upcoming plan + paywall to feel earned.
 *
 * Pattern: Noom / Cal AI / BetterHelp playbook. Three sequential ticks,
 * then auto-advance to /onboarding/plan.
 */

interface Step {
  label: string;
  ms: number; // when the tick lands
}

const STEPS: Step[] = [
  { label: 'Reading your answers',         ms: 700  },
  { label: 'Calibrating your training',    ms: 1700 },
  { label: 'Building your blocking plan',  ms: 2700 },
];

const TOTAL_MS = 3500;
const ADVANCE_MS = 4100;

export default function CalibratingScreen() {
  useOnboardingStepView('calibrating');
  const { colors } = useThemeColors();
  const [doneIdx, setDoneIdx] = useState(-1);

  const ringRotate = useRef(new Animated.Value(0)).current;
  const ringFill   = useRef(new Animated.Value(0)).current;

  // Ring sweep.
  useEffect(() => {
    Animated.loop(
      Animated.timing(ringRotate, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
    Animated.timing(ringFill, {
      toValue: 1,
      duration: TOTAL_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, []);

  // Step ticks.
  useEffect(() => {
    const timers = STEPS.map((s, i) =>
      setTimeout(() => setDoneIdx(i), s.ms),
    );
    const advance = setTimeout(() => {
      router.replace('/onboarding/plan');
    }, ADVANCE_MS);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(advance);
    };
  }, []);

  const rotate = ringRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <OnboardingLayout step={10} totalSteps={12}>
      <View style={styles.content}>
        <View style={styles.center}>
          {/* Spinning accent ring with a brain in the middle */}
          <FadeUp delay={0}>
            <View style={styles.ringWrap}>
              <Animated.View
                style={[
                  styles.ring,
                  { borderColor: colors.cardAlt, transform: [{ rotate }] },
                ]}
              >
                <View style={[styles.ringHead, { backgroundColor: colors.accent }]} />
              </Animated.View>
              <View style={[styles.ringInner, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Brain size={36} color={colors.accent} strokeWidth={1.6} />
              </View>
            </View>
          </FadeUp>

          <FadeUp delay={220}>
            <SectionHeading size="lg" align="center" style={{ marginTop: 18 }}>
              Building your plan
            </SectionHeading>
          </FadeUp>

          <View style={styles.steps}>
            {STEPS.map((s, i) => {
              const done = i <= doneIdx;
              return (
                <View key={i} style={styles.stepRow}>
                  <View
                    style={[
                      styles.tick,
                      {
                        backgroundColor: done ? `${colors.success}1F` : colors.cardAlt,
                        borderColor: done ? `${colors.success}55` : colors.border,
                      },
                    ]}
                  >
                    {done ? (
                      <Check size={13} color={colors.success} strokeWidth={3} />
                    ) : (
                      <View style={[styles.tickPending, { backgroundColor: colors.muted }]} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      { color: done ? colors.text : colors.muted },
                    ]}
                  >
                    {s.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },

  ringWrap: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
  },
  ringHead: {
    position: 'absolute',
    top: -6,
    left: '50%',
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: -4,
  },
  ringInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  steps: {
    marginTop: 36,
    width: '100%',
    maxWidth: 320,
    gap: 14,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tick: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickPending: {
    width: 5,
    height: 5,
    borderRadius: 3,
    opacity: 0.6,
  },
  stepLabel: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.1,
  },
});
