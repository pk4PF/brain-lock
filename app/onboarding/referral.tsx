import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../../src/store/useStore';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { hapticLight } from '../../src/utils/haptics';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../src/constants/theme';
import OnboardingLayout from '../../src/components/onboarding/OnboardingLayout';
import OnboardingButton from '../../src/components/onboarding/OnboardingButton';
import OnboardingBackButton from '../../src/components/onboarding/OnboardingBackButton';
import FadeUp from '../../src/components/onboarding/FadeUp';
import { Eyebrow, SectionHeading } from '../../src/components/ui/anvil';
import { useOnboardingStepView } from '../../src/hooks/useOnboardingStepView';
import {
  setPersonProperties,
  track,
  Events,
} from '../../src/services/analytics';

/**
 * "How did you hear about us?" attribution prompt.
 *
 * Sits right after `solution` (the problem + solution intro pair) and
 * before `name`. Capturing attribution this early means we get the answer
 * even from users who bounce before the paywall, which matters more for
 * marketing spend decisions than only-paying-users data. We mirror the
 * choice onto the PostHog person profile (`setPersonProperties`) so every
 * downstream event (purchase_started, purchase_completed, …) carries
 * `referral_source` automatically.
 *
 * Order chosen by user: YouTube → Reddit → X → Social → App Store →
 * Friend / family. No "Other" / "Ad in another app" - the buckets
 * here are the ones we can actually act on for marketing spend.
 */
const OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'youtube',         label: 'YouTube' },
  { value: 'reddit',          label: 'Reddit' },
  { value: 'x',               label: 'X' },
  { value: 'social',          label: 'TikTok / Instagram / Facebook' },
  { value: 'app_store',       label: 'App Store' },
  { value: 'friend_family',   label: 'Friend or family' },
];

export default function ReferralScreen() {
  useOnboardingStepView('referral');
  const { colors } = useThemeColors();
  const { referralSource, setReferralSource } = useStore();
  const [selected, setSelected] = useState<string | null>(referralSource);

  const advance = () => {
    if (!selected) return;
    setReferralSource(selected);
    // Mirror onto the PostHog person profile so every downstream event
    // (purchase_started, purchase_completed, …) is automatically
    // attributable.
    setPersonProperties({ referral_source: selected });
    track(Events.ReferralSourceSelected, { source: selected });
    router.push('/onboarding/name');
  };

  const onPick = (value: string) => {
    hapticLight();
    setSelected(value);
  };

  return (
    <OnboardingLayout step={3} totalSteps={12}>
      <OnboardingBackButton />
      <View style={styles.content}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <FadeUp delay={0}>
            <Eyebrow>One thing</Eyebrow>
          </FadeUp>
          <FadeUp delay={80}>
            <SectionHeading size="lg">
              How did you hear about us?
            </SectionHeading>
          </FadeUp>
          <FadeUp delay={260}>
            <View style={styles.list}>
              {OPTIONS.map((opt) => {
                const isSelected = selected === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    activeOpacity={0.78}
                    onPress={() => onPick(opt.value)}
                    style={[
                      styles.row,
                      {
                        backgroundColor: isSelected ? colors.accentLight : colors.card,
                        borderColor: isSelected ? colors.accent : colors.border,
                        borderWidth: isSelected ? 1.5 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.rowLabel,
                        { color: isSelected ? colors.accent : colors.text },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </FadeUp>
        </ScrollView>

        <View style={styles.bottomContainer}>
          <OnboardingButton
            label="Continue"
            onPress={advance}
            disabled={!selected}
          />
        </View>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  scrollContent: {
    paddingTop: 72,
    paddingHorizontal: Spacing.xl,
    paddingBottom: 16,
  },
  list: {
    marginTop: Spacing.xl,
    gap: 10,
  },
  row: {
    paddingVertical: 18,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  rowLabel: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.2,
  },
  bottomContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 36,
    paddingTop: 12,
  },
});
