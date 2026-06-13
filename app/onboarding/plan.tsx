import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Check, X, ArrowDown } from 'lucide-react-native';
import { useStore } from '../../src/store/useStore';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { FontFamily, Spacing } from '../../src/constants/theme';
import { goalPhrases } from '../../src/constants/goals';
import OnboardingLayout from '../../src/components/onboarding/OnboardingLayout';
import OnboardingButton from '../../src/components/onboarding/OnboardingButton';
import OnboardingBackButton from '../../src/components/onboarding/OnboardingBackButton';
import FadeUp from '../../src/components/onboarding/FadeUp';
import { useOnboardingStepView } from '../../src/hooks/useOnboardingStepView';

const FIRST_NAME = (full: string) => full.trim().split(/\s+/)[0] || 'You';

/**
 * Value screen. Replaces the old vague 4-week timeline (Foundation / Shift /
 * Rewire / Comeback) with a concrete before -> after: what life is now vs
 * what Brainlock actually gives you. On-brand (brain rot -> brainpower) and
 * anchored by the user's real reclaimed-hours number.
 *
 * "With Brainlock" bullets describe what the PRODUCT does (locks apps, trains
 * focus, frees hours), not guaranteed outcomes, so nothing is overclaimed.
 */

const NOW_ITEMS = [
  'Scrolling on autopilot',
  'Focus that won’t hold',
  'Hours gone to the feed',
];


export default function PlanScreen() {
  useOnboardingStepView('plan');
  const { colors } = useThemeColors();
  const { userName, userGoals } = useStore();
  const firstName = FIRST_NAME(userName);

  // Echo back what they said they'd do with the time — their own words from
  // the goals screen — as the final, personal payoff line.
  const phrases = goalPhrases(userGoals);
  const goalLine =
    phrases.length === 2
      ? `Time to ${phrases[0]} and ${phrases[1]}`
      : phrases.length === 1
        ? `Time to ${phrases[0]}`
        : 'Time for what actually matters';

  const withItems = [
    'The apps that rot your brain, blocked',
    'Your Brainpower Score climbs as you train',
    goalLine,
  ];

  // Stagger entrance.
  const anims = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    Animated.stagger(
      120,
      anims.map((a) =>
        Animated.spring(a, { toValue: 1, friction: 7, tension: 70, useNativeDriver: true }),
      ),
    ).start();
  }, []);

  const slideUp = (a: Animated.Value) => ({
    opacity: a,
    transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  });

  return (
    <OnboardingLayout step={14} totalSteps={15}>
      <OnboardingBackButton />
      <View style={styles.content}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.eyebrow, { color: colors.muted }]}>WHAT CHANGES</Text>
          <Text style={[styles.title, { color: colors.text }]}>
            In a week, {firstName}, you get{'\n'}
            <Text style={{ color: colors.accent }}>your brain back</Text>.
          </Text>
          <Text style={[styles.sub, { color: colors.secondary }]}>
            Less brain rot. More brainpower.
          </Text>

          {/* NOW */}
          <Animated.View style={slideUp(anims[0])}>
            <View style={[styles.panel, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
              <Text style={[styles.panelLabel, { color: colors.muted }]}>NOW</Text>
              {NOW_ITEMS.map((t) => (
                <View key={t} style={styles.row}>
                  <View style={[styles.bullet, { backgroundColor: `${colors.muted}22` }]}>
                    <X size={13} color={colors.muted} strokeWidth={2.6} />
                  </View>
                  <Text style={[styles.rowText, { color: colors.secondary }]}>{t}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Arrow */}
          <Animated.View style={[styles.arrowWrap, slideUp(anims[1])]}>
            <View style={[styles.arrowCircle, { backgroundColor: colors.accent }]}>
              <ArrowDown size={18} color="#FFFFFF" strokeWidth={2.6} />
            </View>
          </Animated.View>

          {/* WITH BRAINLOCK */}
          <Animated.View style={slideUp(anims[2])}>
            <View style={[styles.panel, styles.panelHero, { backgroundColor: `${colors.accent}10`, borderColor: colors.accent }]}>
              <Text style={[styles.panelLabel, { color: colors.accent }]}>WITH BRAINLOCK</Text>
              {withItems.map((t, i) => (
                <View key={t} style={styles.row}>
                  <View style={[styles.bullet, { backgroundColor: `${colors.accent}22` }]}>
                    <Check size={13} color={colors.accent} strokeWidth={3} />
                  </View>
                  <Text
                    style={[
                      styles.rowText,
                      { color: colors.text },
                      i === withItems.length - 1 && { fontFamily: FontFamily.semibold },
                    ]}
                  >
                    {t}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
        </ScrollView>

        <View style={[styles.bottomContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <OnboardingButton
            label="Let's go"
            onPress={() => router.push('/onboarding/commitment')}
          />
        </View>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  scrollContent: {
    paddingTop: 52,
    paddingHorizontal: 24,
    paddingBottom: 14,
  },
  eyebrow: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    letterSpacing: 1.8,
    textAlign: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 27,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.8,
    lineHeight: 32,
    textAlign: 'center',
  },
  sub: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    letterSpacing: -0.2,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 18,
  },
  panel: {
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  panelHero: {
    borderWidth: 1.5,
  },
  panelLabel: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    letterSpacing: 1.6,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 9,
  },
  bullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    fontSize: 16,
    fontFamily: FontFamily.regular,
    letterSpacing: -0.2,
  },
  arrowWrap: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  arrowCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 32,
    paddingTop: 14,
    borderTopWidth: 1,
  },
});
