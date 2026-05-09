import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Brain, Coins, Lock, Unlock, Trophy } from 'lucide-react-native';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { FontFamily, Spacing } from '../../src/constants/theme';
import OnboardingLayout from '../../src/components/onboarding/OnboardingLayout';
import OnboardingButton from '../../src/components/onboarding/OnboardingButton';
import OnboardingBackButton from '../../src/components/onboarding/OnboardingBackButton';
import FadeUp from '../../src/components/onboarding/FadeUp';
import { SectionHeading } from '../../src/components/ui/anvil';
import { useOnboardingStepView } from '../../src/hooks/useOnboardingStepView';

/**
 * Single-screen "how it works" explainer.
 *
 * One job: tell the user how brain cells become screen time. Four steps
 * that mirror the actual product loop:
 *
 *   1. Block apps                         (the trigger)
 *   2. Train your brain                   (the input)
 *   3. Earn brain cells                   (the currency)
 *   4. Spend cells to unlock apps         (the payoff)
 *
 * Iconography tells the same story visually: Lock → Brain → Coins →
 * Unlock. Locked at the start, unlocked at the end — the steps in between
 * are the work that earns the user from one state to the other.
 *
 * Cards are vertically connected by a hairline so it reads as a flow,
 * not four independent boxes.
 */

interface Step {
  Icon: any;
  title: string;
}

const STEPS: Step[] = [
  {
    Icon: Lock,
    title: 'Block apps',
  },
  {
    Icon: Brain,
    title: 'Train your brain',
  },
  {
    Icon: Coins,
    title: 'Earn brain cells',
  },
  {
    Icon: Unlock,
    title: 'Spend braincells to unlock apps',
  },
];

export default function HowItWorksScreen() {
  useOnboardingStepView('howitworks');
  const { colors } = useThemeColors();

  return (
    <OnboardingLayout step={8}>
      <OnboardingBackButton />
      <View style={styles.content}>
        <ScrollView
          contentContainerStyle={styles.scrollBody}
          showsVerticalScrollIndicator={false}
        >
          {/* One big heading, no eyebrow + headline + body stack. The 4-step
              flow below tells the rest of the story without prose. */}
          <FadeUp delay={0}>
            <SectionHeading size="lg">
              How it works
            </SectionHeading>
          </FadeUp>

          <View style={{ height: 28 }} />

          {/* Step list - cards connected by a thin vertical guide. */}
          <View style={styles.steps}>
            {STEPS.map((s, i) => (
              <View key={s.title}>
                <FadeUp delay={260 + i * 90}>
                  <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[styles.iconPlate, { backgroundColor: `${colors.accent}1F`, borderColor: `${colors.accent}40` }]}>
                      <s.Icon size={20} color={colors.accent} strokeWidth={2.2} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardTitle, { color: colors.text }]}>{s.title}</Text>
                    </View>
                  </View>
                </FadeUp>

                {/* Connector between cards */}
                {i < STEPS.length - 1 && (
                  <View style={styles.connectorWrap}>
                    <View style={[styles.connector, { backgroundColor: colors.border }]} />
                  </View>
                )}
              </View>
            ))}

            {/* Outcome — visually distinct from the 4 steps. Solid filled
                accent so it reads as the destination, not another step.
                Connector above is dashed to mark a category change. */}
            <View style={styles.connectorWrap}>
              <View style={[styles.connector, { backgroundColor: colors.border, height: 18 }]} />
            </View>

            <FadeUp delay={260 + STEPS.length * 90 + 60}>
              <View style={[styles.outcomeCard, { backgroundColor: colors.accent }]}>
                <View style={styles.outcomeIconPlate}>
                  <Trophy size={20} color="#FFFFFF" strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.outcomeLabel}>YOU GET</Text>
                  <Text style={styles.outcomeTitle}>Your brain, back in charge.</Text>
                </View>
              </View>
            </FadeUp>
          </View>
        </ScrollView>

        <View style={[styles.bottomContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <OnboardingButton
            label="Continue"
            onPress={() => router.push('/onboarding/referral')}
          />
        </View>
      </View>
    </OnboardingLayout>
  );
}

const ICON_PLATE = 38;

const styles = StyleSheet.create({
  content: { flex: 1 },
  scrollBody: {
    paddingTop: 84,
    paddingHorizontal: Spacing.xl,
    paddingBottom: 24,
  },

  // Step list
  steps: {
    gap: 0,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconPlate: {
    width: ICON_PLATE,
    height: ICON_PLATE,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.2,
  },

  // Connector between cards
  connectorWrap: {
    // Align the line under the icon plate inside the card.
    // Card: padding 14 left + iconPlate width / 2.
    paddingLeft: 14 + ICON_PLATE / 2 - 1,
  },
  connector: {
    width: 2,
    height: 14,
    marginVertical: 0,
  },

  bottomContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 32,
    paddingTop: 14,
    borderTopWidth: 1,
  },

  // Outcome — solid filled accent card, the only inverted card on the
  // screen. White icon plate + label + headline so the card reads as
  // a destination, not another step.
  outcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
  },
  outcomeIconPlate: {
    width: ICON_PLATE,
    height: ICON_PLATE,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outcomeLabel: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    letterSpacing: 1.6,
    color: 'rgba(255,255,255,0.78)',
    marginBottom: 2,
  },
  outcomeTitle: {
    fontSize: 17,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.3,
    color: '#FFFFFF',
  },
});
