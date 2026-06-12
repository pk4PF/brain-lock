import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Easing } from 'react-native';
import { router } from 'expo-router';
import { Lock, Unlock } from 'lucide-react-native';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { hapticMedium } from '../../src/utils/haptics';
import { FontFamily, Spacing } from '../../src/constants/theme';
// Unlock durations and what each costs your brain rot - mirrors the live
// picker on Home.
const TIERS = [
  { minutes: 15, rot: 15 },
  { minutes: 30, rot: 30 },
  { minutes: 60, rot: 60 },
];
import OnboardingLayout from '../../src/components/onboarding/OnboardingLayout';
import OnboardingBackButton from '../../src/components/onboarding/OnboardingBackButton';
import FadeUp from '../../src/components/onboarding/FadeUp';
import { SectionHeading, MutedText } from '../../src/components/ui/anvil';
import { useOnboardingStepView } from '../../src/hooks/useOnboardingStepView';

/**
 * Demo of the unlock flow. The user taps the lock to see it animate open -
 * pure visual demo, NO real unlock happens. Teaches the new model: you can
 * unlock anytime, but the longer you open, the more your Brainpower Score drops
 * (15m +3 / 30m +5 / 60m +10), mirroring the live picker on Home.
 */
export default function DemoSpendScreen() {
  useOnboardingStepView('demo_spend');
  const { colors } = useThemeColors();

  const [unlocked, setUnlocked] = useState(false);
  const swapAnim = useRef(new Animated.Value(0)).current;
  const lockOpacity = useRef(new Animated.Value(1)).current;
  const unlockOpacity = useRef(new Animated.Value(0)).current;

  const handleUnlock = () => {
    if (unlocked) return;
    hapticMedium();
    setUnlocked(true);
    Animated.parallel([
      Animated.timing(lockOpacity, {
        toValue: 0,
        duration: 380,
        useNativeDriver: true,
      }),
      Animated.timing(unlockOpacity, {
        toValue: 1,
        duration: 520,
        delay: 80,
        useNativeDriver: true,
      }),
      Animated.timing(swapAnim, {
        toValue: 1,
        duration: 620,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Auto-advance to review after a brief celebratory pause once the user
  // has played out the lock -> unlock animation.
  useEffect(() => {
    if (!unlocked) return;
    const t = setTimeout(() => router.push('/onboarding/review'), 1500);
    return () => clearTimeout(t);
  }, [unlocked]);

  return (
    <OnboardingLayout step={11} totalSteps={15}>
      <OnboardingBackButton />
      <View style={styles.content}>
        <View style={styles.top}>
          <FadeUp delay={0}>
            <SectionHeading size="lg">
              Need your apps?
            </SectionHeading>
          </FadeUp>
          <View style={{ height: 8 }} />
          <FadeUp delay={100}>
            <MutedText size="md">
              Unlock anytime — but the longer you scroll, the more your Brainpower Score drops.
            </MutedText>
          </FadeUp>
        </View>

        <View style={styles.center}>
          {/* Visual: lock -> unlock. Locked uses neutral surface (default
              state, not an error). Unlocked uses brand accent because that's
              the success moment. The whole stack is tappable so the user
              can play out the visual once. */}
          <FadeUp delay={260}>
            <TouchableOpacity activeOpacity={0.85} onPress={handleUnlock} disabled={unlocked}>
              <View style={styles.demo}>
                <Animated.View
                  style={[
                    styles.bigIcon,
                    {
                      backgroundColor: colors.cardAlt,
                      borderColor: colors.border,
                      opacity: lockOpacity,
                    },
                  ]}
                >
                  <Lock size={48} color={colors.muted} strokeWidth={1.6} />
                </Animated.View>
                <Animated.View
                  style={[
                    styles.bigIcon,
                    styles.unlockOverlay,
                    {
                      backgroundColor: colors.accentLight,
                      borderColor: colors.accent,
                      opacity: unlockOpacity,
                      transform: [
                        {
                          scale: swapAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Unlock size={48} color={colors.accent} strokeWidth={1.6} />
                </Animated.View>
              </View>
            </TouchableOpacity>
          </FadeUp>

          <FadeUp delay={360}>
            <View style={styles.tierRow}>
              {TIERS.map((t) => (
                <View
                  key={t.minutes}
                  style={[
                    styles.tierCard,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.tierValue, { color: colors.text }]}>{t.minutes}</Text>
                  <Text style={[styles.tierUnit, { color: colors.muted }]}>min</Text>
                  <View style={[styles.tierCostPill, { backgroundColor: `${colors.accent}1A` }]}>
                    <Text style={[styles.tierCostText, { color: colors.accent }]}>−{t.rot} score</Text>
                  </View>
                </View>
              ))}
            </View>
          </FadeUp>

          {/* Preview tag - small, muted, sits below the card so the user
              never confuses this animation with a real action. */}
          <FadeUp delay={440}>
            <Text style={[styles.previewNote, { color: colors.muted }]}>
              {unlocked
                ? 'Preview only - your real unlock waits on Home.'
                : 'Preview - this won’t unlock anything yet.'}
            </Text>
          </FadeUp>
        </View>

        <View style={styles.bottomContainer}>
          {!unlocked ? (
            <TouchableOpacity activeOpacity={0.9} onPress={handleUnlock}>
              <View style={[styles.tapBtn, { backgroundColor: colors.accent }]}>
                <Unlock size={16} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.tapBtnText}>Tap to unlock</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.unlockedNote}>
              <Text style={[styles.unlockedText, { color: colors.accent }]}>
                Open — it costs you.
              </Text>
            </View>
          )}
        </View>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'space-between' },
  top: {
    paddingTop: 72,
    paddingHorizontal: Spacing.xl,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  demo: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    position: 'relative',
  },
  bigIcon: {
    width: 120,
    height: 120,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  tierRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  tierCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  tierLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  tierValue: {
    fontSize: 26,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  tierUnit: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    marginTop: 1,
  },
  tierCostPill: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tierCostText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.2,
  },
  previewNote: {
    marginTop: 14,
    fontSize: 12,
    fontFamily: FontFamily.regular,
    letterSpacing: 0.1,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  bottomContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 40,
    alignItems: 'center',
  },
  tapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    paddingHorizontal: 36,
    borderRadius: 999,
    minWidth: 220,
  },
  tapBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.1,
  },
  unlockedNote: {
    paddingVertical: 18,
  },
  unlockedText: {
    fontSize: 16,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.2,
  },
});
