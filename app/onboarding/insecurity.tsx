import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, ScrollView, NativeModules, Platform } from 'react-native';
import { router } from 'expo-router';
import { TrendingUp, Dumbbell, Brain } from 'lucide-react-native';
import { useStore } from '../../src/store/useStore';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { FontFamily, Spacing } from '../../src/constants/theme';
import OnboardingLayout from '../../src/components/onboarding/OnboardingLayout';
import OnboardingButton from '../../src/components/onboarding/OnboardingButton';
import OnboardingBackButton from '../../src/components/onboarding/OnboardingBackButton';
import FadeUp from '../../src/components/onboarding/FadeUp';
import { useOnboardingStepView } from '../../src/hooks/useOnboardingStepView';

interface PainCard {
  Icon: any;
  iconColor: string;
  title: string;
  basis: string;
}

// Localised minimum wage so the £ figure isn't wrong for non-UK users.
// Read the device region from RN's built-in locale (no extra native module).
function deviceRegion(): string {
  try {
    const raw =
      Platform.OS === 'ios'
        ? NativeModules.SettingsManager?.settings?.AppleLocale ||
          NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
          ''
        : NativeModules.I18nManager?.localeIdentifier || '';
    const m = String(raw).match(/[-_]([A-Za-z]{2})/);
    return m ? m[1].toUpperCase() : 'GB';
  } catch {
    return 'GB';
  }
}

// { currency symbol, hourly minimum wage in local currency }. Falls back to UK.
const WAGE_TABLE: Record<string, { symbol: string; wage: number }> = {
  US: { symbol: '$', wage: 7.25 },    // US federal minimum
  GB: { symbol: '£', wage: 12.21 },   // UK National Living Wage, Apr 2025
  CA: { symbol: 'C$', wage: 17.3 },   // CAD federal minimum
  AU: { symbol: 'A$', wage: 24.1 },   // AUD national minimum
  IE: { symbol: '€', wage: 13.5 },    // Ireland
  NZ: { symbol: 'NZ$', wage: 23.15 },
};
const REGION = deviceRegion();
const { symbol: CURRENCY, wage: MIN_WAGE } = WAGE_TABLE[REGION] ?? WAGE_TABLE.GB;

function buildCards(moneyLost: number, skillsMastered: number, accentHue: string): PainCard[] {
  return [
    {
      Icon: TrendingUp,
      iconColor: accentHue,
      title: `${CURRENCY}${moneyLost.toLocaleString()}`,
      basis: 'and that’s only at minimum wage',
    },
    {
      Icon: Dumbbell,
      iconColor: '#0EA5A5',
      title: 'The body you keep putting off',
      basis: 'every hour was a workout you could’ve done',
    },
    {
      Icon: Brain,
      iconColor: '#8B5CF6',
      title: `${skillsMastered} skills mastered`,
      basis: '10,000 hours of practice makes an expert',
    },
  ];
}

export default function InsecurityScreen() {
  useOnboardingStepView('lifetime');
  const { colors } = useThemeColors();
  const { dailyScreenTimeHours, userAge } = useStore();

  const hours = dailyScreenTimeHours > 0 ? dailyScreenTimeHours : 4;

  // Future-focused loss aversion: project this habit over the user's
  // remaining years and convert to YEARS OF WAKING LIFE - the deepest pain
  // lever (a finite life + the people in it), not hours or skipped workouts.
  // A loss you can still prevent motivates harder than a sunk cost.
  const age = userAge && userAge > 0 ? userAge : 25;
  const remainingYears = Math.max(1, 80 - age);          // ~summers left
  const futureHours = Math.round(hours * 365 * remainingYears);
  const wakingYears = Math.max(1, Math.round(futureHours / (16 * 365)));

  const moneyLost = Math.round(futureHours * MIN_WAGE);
  const skillsMastered = Math.max(1, Math.floor(futureHours / 10000));

  const cards = buildCards(moneyLost, skillsMastered, colors.accent);

  // Counter-animated hero number (hours this year).
  const counter = useRef(new Animated.Value(0)).current;
  const [displayHours, setDisplayHours] = useState(0);
  useEffect(() => {
    const id = counter.addListener(({ value }) => setDisplayHours(value));
    Animated.timing(counter, {
      toValue: wakingYears,
      duration: 1500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => { counter.removeListener(id); };
  }, [wakingYears]);

  const heroValue = Math.round(displayHours).toLocaleString();

  return (
    <OnboardingLayout step={7} totalSteps={15}>
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
                IF YOU LIVE TO 80, YOU&rsquo;LL LOSE
              </Text>
            </FadeUp>
            <FadeUp delay={80} travel={22}>
              <Text style={[styles.heroBig, { color: colors.accent }]}>{heroValue}</Text>
            </FadeUp>
            <FadeUp delay={180}>
              <Text style={[styles.heroLabel, { color: colors.text }]}>
                years of your life
              </Text>
            </FadeUp>
          </View>

          {/* The math, shown plainly so the number reads as fact, not scare. */}
          <FadeUp delay={330}>
            <View style={[styles.mathCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.mathText, { color: colors.muted }]}>
                {hours}h a day × your next {remainingYears} years
                {'  =  '}
                <Text style={{ color: colors.text, fontFamily: FontFamily.semibold }}>
                  {wakingYears} years of your life
                </Text>
              </Text>
            </View>
          </FadeUp>

          {/* Lead-in so the cards read as one clear "what that time was worth" beat. */}
          <FadeUp delay={400}>
            <Text style={[styles.cardsLabel, { color: colors.muted }]}>
              THAT TIME COULD HAVE BEEN
            </Text>
          </FadeUp>

          {/* Pain cards - 3 visceral hits. */}
          <View style={styles.cards}>
            {cards.map((c, i) => (
              <FadeUp key={i} delay={440 + i * 90}>
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.iconBadge, { backgroundColor: `${c.iconColor}1F`, borderColor: `${c.iconColor}40` }]}>
                    <c.Icon size={18} color={c.iconColor} strokeWidth={2.2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{c.title}</Text>
                    <Text style={[styles.cardBody, { color: colors.muted }]}>{c.basis}</Text>
                  </View>
                </View>
              </FadeUp>
            ))}
          </View>

          {/* Hope pivot - turns the doom into agency right before the CTA. */}
          <FadeUp delay={820}>
            <Text style={[styles.hopeLine, { color: colors.text }]}>
              None of this is set. Start now and it never happens.
            </Text>
          </FadeUp>

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
    fontSize: 64,
    fontFamily: FontFamily.medium,
    letterSpacing: -2.5,
    lineHeight: 72,
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

  // Math breakdown
  mathCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: 22,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  mathText: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    letterSpacing: -0.1,
    lineHeight: 19,
    textAlign: 'center',
  },
  cardsLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    letterSpacing: 1.6,
    textAlign: 'center',
    marginBottom: 14,
  },

  // Hope pivot
  hopeLine: {
    fontSize: 17,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.3,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing.xl,
    marginTop: 26,
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
