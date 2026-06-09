import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { BookOpen, Trophy, Heart } from 'lucide-react-native';
import { useStore } from '../../src/store/useStore';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { FontFamily, Spacing } from '../../src/constants/theme';
import OnboardingLayout from '../../src/components/onboarding/OnboardingLayout';
import OnboardingButton from '../../src/components/onboarding/OnboardingButton';
import OnboardingBackButton from '../../src/components/onboarding/OnboardingBackButton';
import FadeUp from '../../src/components/onboarding/FadeUp';
import { useOnboardingStepView } from '../../src/hooks/useOnboardingStepView';

const LIFE_EXPECTANCY = 80;

/**
 * "If you continue..." pain reveal.
 *
 * Three pain cards tuned for a young ambitious target customer:
 *   1. Books unread        - knowledge they're trading away
 *   2. Skills they could master  - 10,000-hour rule framing
 *   3. Hours with people they love  - relationship theft
 *
 * Marathons (too abstract) and sleep (doesn't move our audience) are
 * cut. Each card has its own accent icon + bold title + one-line body
 * that uses the user's actual numbers so the lifetime figure feels
 * personal, not generic.
 */

interface PainCard {
  Icon: any;
  iconColor: string;
  title: string;
}

function buildCards(lifetimeYears: number, lifetimeHours: number, accentHue: string): PainCard[] {
  // 10 hours per book (low-end estimate, rounds nicely).
  const books = Math.round(lifetimeHours / 10 / 100) * 100;

  // 10,000-hour mastery rule. Round down to whole skills.
  const masteries = Math.max(1, Math.floor(lifetimeHours / 10000));

  // Real-life-ratio framing: half the screen-time becomes "with people."
  // We frame it as hours/day × 365 × yearsRemaining ÷ 2, in hours.
  // Then convert to a daily rhythm: "2h/day for X years."
  const peopleHours = Math.round(lifetimeHours / 2);

  return [
    {
      Icon: BookOpen,
      iconColor: '#8B5CF6',
      title: `${books.toLocaleString()} books unread`,
    },
    {
      Icon: Trophy,
      iconColor: accentHue,
      title: `${masteries} skill${masteries === 1 ? '' : 's'} you could master`,
    },
    {
      Icon: Heart,
      iconColor: '#E53935',
      title: `${peopleHours.toLocaleString()} hours with people you love`,
    },
  ];
}

export default function InsecurityScreen() {
  useOnboardingStepView('lifetime');
  const { colors } = useThemeColors();
  const { dailyScreenTimeHours, userAge } = useStore();

  const hours = dailyScreenTimeHours > 0 ? dailyScreenTimeHours : 4;
  const age   = userAge && userAge > 0 ? userAge : 22;

  const yearsRemaining = Math.max(1, LIFE_EXPECTANCY - age);
  const lifetimeHours = hours * 365 * yearsRemaining;
  const lifetimeYears = lifetimeHours / 24 / 365;
  const lifeShare = Math.round((lifetimeYears / yearsRemaining) * 100);

  const cards = buildCards(lifetimeYears, lifetimeHours, colors.accent);

  // Counter-animated hero number.
  const counter = useRef(new Animated.Value(0)).current;
  const [displayYears, setDisplayYears] = useState(0);
  useEffect(() => {
    const id = counter.addListener(({ value }) => setDisplayYears(value));
    Animated.timing(counter, {
      toValue: lifetimeYears,
      duration: 1500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => { counter.removeListener(id); };
  }, [lifetimeYears]);

  const heroValue = displayYears >= 10
    ? displayYears.toFixed(0)
    : displayYears.toFixed(1);

  return (
    <OnboardingLayout step={7} totalSteps={12}>
      <OnboardingBackButton />
      <View style={styles.content}>
        <ScrollView
          contentContainerStyle={styles.scrollBody}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero - compact, single type stack. */}
          <View style={styles.hero}>
            <FadeUp delay={0}>
              <Text style={[styles.heroEyebrow, { color: colors.muted }]}>
                IF NOTHING CHANGES, YOU WILL SPEND
              </Text>
            </FadeUp>
            <FadeUp delay={80} travel={22}>
              <Text style={[styles.heroBig, { color: colors.accent }]}>{heroValue}</Text>
            </FadeUp>
            <FadeUp delay={180}>
              <Text style={[styles.heroLabel, { color: colors.text }]}>
                years on a screen
              </Text>
            </FadeUp>
            <FadeUp delay={260}>
              <Text style={[styles.heroSub, { color: colors.muted }]}>
                That's {lifeShare}% of your remaining life.
              </Text>
            </FadeUp>
          </View>

          {/* Pain cards - 3 visceral hits. */}
          <View style={styles.cards}>
            {cards.map((c, i) => (
              <FadeUp key={i} delay={380 + i * 90}>
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.iconBadge, { backgroundColor: `${c.iconColor}1F`, borderColor: `${c.iconColor}40` }]}>
                    <c.Icon size={18} color={c.iconColor} strokeWidth={2.2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{c.title}</Text>
                  </View>
                </View>
              </FadeUp>
            ))}
          </View>

        </ScrollView>

        <View style={[styles.bottomContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <OnboardingButton
            label="I want it back"
            onPress={() => router.push('/onboarding/goal')}
          />
        </View>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  scrollBody: {
    paddingTop: 84,
    paddingBottom: 24,
  },

  // Hero
  hero: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: 22,
  },
  heroEyebrow: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    letterSpacing: 1.6,
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 18,
  },
  heroBig: {
    fontSize: 112,
    fontFamily: FontFamily.medium,
    letterSpacing: -4.5,
    lineHeight: 116,
    fontVariant: ['tabular-nums'],
  },
  heroLabel: {
    fontSize: 18,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.2,
    marginTop: 4,
  },
  heroSub: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    marginTop: 10,
    letterSpacing: -0.1,
  },

  // Pain cards
  cards: {
    paddingHorizontal: Spacing.xl,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 17,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  cardBody: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    lineHeight: 20,
  },

  // Counter
  counterCard: {
    marginTop: 16,
    marginHorizontal: Spacing.xl,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  counterEyebrow: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    letterSpacing: 1.6,
    marginBottom: 6,
  },
  counterLine: {
    fontSize: 16,
    fontFamily: FontFamily.regular,
    letterSpacing: -0.1,
    lineHeight: 23,
  },

  // Bottom CTA bar
  bottomContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 32,
    paddingTop: 14,
    borderTopWidth: 1,
  },
});
