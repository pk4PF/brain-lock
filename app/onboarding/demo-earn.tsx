import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { router } from 'expo-router';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { FontFamily, Spacing } from '../../src/constants/theme';
import OnboardingLayout from '../../src/components/onboarding/OnboardingLayout';
import OnboardingButton from '../../src/components/onboarding/OnboardingButton';
import OnboardingBackButton from '../../src/components/onboarding/OnboardingBackButton';
import FadeUp from '../../src/components/onboarding/FadeUp';
import { Eyebrow, SectionHeading } from '../../src/components/ui/anvil';
import { useOnboardingStepView } from '../../src/hooks/useOnboardingStepView';
import { Check } from 'lucide-react-native';

/**
 * Celebration screen after the tile-recall demo. Shows the user that
 * playing the brain game just earned them cells - closes the loop:
 * "I trained → I got paid in currency". A short confetti burst sells
 * the dopamine moment without overwhelming the page.
 *
 * Sits between tile-recall (in demo mode) and demo-spend.
 */
export default function DemoEarnScreen() {
  useOnboardingStepView('demo_earn');
  const { colors } = useThemeColors();

  return (
    <OnboardingLayout step={11} totalSteps={16}>
      <OnboardingBackButton />
      <View style={styles.content}>
        {/* Confetti sits absolute behind the headline so it doesn't push
            the layout when it fires. */}
        <Confetti />

        <View style={styles.top}>
          <FadeUp delay={0}>
            <Eyebrow>Nice work</Eyebrow>
          </FadeUp>
          <FadeUp delay={80}>
            <SectionHeading size="lg">
              You{' '}
              <Text style={{ color: colors.accent }}>earned it.</Text>
            </SectionHeading>
          </FadeUp>
        </View>

        {/* Hero - coin stack + the count. The visual carries the weight
            so we don't need a body paragraph beneath it. */}
        <View style={styles.heroWrap}>
          <FadeUp delay={200}>
            <View style={[styles.heroCheck, { backgroundColor: `${colors.accent}1A`, borderColor: `${colors.accent}40` }]}>
              <Check size={84} color={colors.accent} strokeWidth={2.6} />
            </View>
          </FadeUp>
          <FadeUp delay={400}>
            <Text style={[styles.equation, { color: colors.muted }]}>
              That time’s yours — you earned it.
            </Text>
          </FadeUp>
        </View>

        <View style={styles.bottomContainer}>
          <OnboardingButton
            label="Continue"
            onPress={() => router.push('/onboarding/demo-spend')}
          />
        </View>
      </View>
    </OnboardingLayout>
  );
}

// ─────────────────────────────────────────────────────────────
// Confetti - 14 little squares fall + spin + fade out. Pure RN
// Animated, no extra dependency. Subtle on purpose: a brief burst,
// not a permanent storm.
// ─────────────────────────────────────────────────────────────

const CONFETTI_COLORS = [
  '#F97316', // orange (accent)
  '#FDCA51', // gold (matches brain coins)
  '#34D6D6', // teal (tile-recall hue)
  '#22C55E', // green
  '#8B5CF6', // purple (memory hue)
  '#3B82F6', // blue
];

function Confetti() {
  const pieces = useRef(
    Array.from({ length: 14 }, () => ({
      anim: new Animated.Value(0),
      x: Math.random() * 100, // % across the screen
      delay: Math.random() * 400,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 6 + Math.random() * 6,
      spinDir: Math.random() > 0.5 ? 1 : -1,
    })),
  ).current;

  useEffect(() => {
    const animations = pieces.map((p) =>
      Animated.timing(p.anim, {
        toValue: 1,
        duration: 1600 + Math.random() * 600,
        delay: p.delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    Animated.parallel(animations).start();
  }, []);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => {
        const translateY = p.anim.interpolate({
          inputRange: [0, 1],
          outputRange: [-40, 700],
        });
        const rotate = p.anim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${p.spinDir * 540}deg`],
        });
        const opacity = p.anim.interpolate({
          inputRange: [0, 0.1, 0.85, 1],
          outputRange: [0, 1, 1, 0],
        });
        return (
          <Animated.View
            key={i}
            style={[
              {
                position: 'absolute',
                left: `${p.x}%`,
                top: 80,
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                borderRadius: 1.5,
                transform: [{ translateY }, { rotate }],
                opacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'space-between' },
  top: {
    paddingTop: 72,
    paddingHorizontal: Spacing.xl,
  },

  // Hero
  heroWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  heroCoin: {
    marginBottom: 18,
  },
  heroCheck: {
    width: 160,
    height: 160,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  plus: {
    fontSize: 72,
    fontFamily: FontFamily.semibold,
    letterSpacing: -3.0,
    lineHeight: 76,
  },
  equation: {
    marginTop: 6,
    fontSize: 14,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.1,
  },

  bottomContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 36,
  },
});
