import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Easing } from 'react-native';
import { router } from 'expo-router';
import { Lock, Unlock, Check, ArrowRight } from 'lucide-react-native';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { hapticMedium } from '../../src/utils/haptics';
import { FontFamily, Spacing } from '../../src/constants/theme';
import OnboardingLayout from '../../src/components/onboarding/OnboardingLayout';
import OnboardingBackButton from '../../src/components/onboarding/OnboardingBackButton';
import FadeUp from '../../src/components/onboarding/FadeUp';
import { SectionHeading, MutedText } from '../../src/components/ui/anvil';
import { useOnboardingStepView } from '../../src/hooks/useOnboardingStepView';

/**
 * Demo of the spend flow. The user taps the lock to see it animate open -
 * pure visual demo, NO real spend or unlock happens. Copy makes it clear
 * the actual unlock happens once they're in the app proper.
 *
 * Numbers (5 cells -> 5 minutes) are illustrative since this is a preview.
 * Real tiers are 15-30 min on Home.
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
    <OnboardingLayout step={12} totalSteps={16}>
      <OnboardingBackButton />
      <View style={styles.content}>
        <View style={styles.top}>
          <FadeUp delay={0}>
            <SectionHeading size="lg">
              You earned it.
            </SectionHeading>
          </FadeUp>
          <View style={{ height: 8 }} />
          <FadeUp delay={100}>
            <MutedText size="md">
              Tap the lock to see how it works. Real unlocks happen in the main app.
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
            <View
              style={[
                styles.creditsCard,
                {
                  backgroundColor: colors.card,
                  borderColor: unlocked ? colors.accent : colors.border,
                  borderWidth: unlocked ? 1.5 : 1,
                },
              ]}
            >
              <View style={styles.creditsRow}>
                <Check size={16} color={colors.accent} strokeWidth={3} />
                <Text style={[styles.creditsLabel, { color: colors.text }]}>
                  Pass
                </Text>
              </View>
              <ArrowRight size={14} color={colors.muted} strokeWidth={2} />
              <Text style={[styles.creditsValue, { color: colors.text }]}>
                15–60 min
              </Text>
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
              <Text style={[styles.unlockedText, { color: colors.success }]}>
                Unlocked. Easy.
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
  creditsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    width: '100%',
    gap: 12,
  },
  creditsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  creditsLabel: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.1,
  },
  creditsValue: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.1,
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
