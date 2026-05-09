import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Easing } from 'react-native';
import { router } from 'expo-router';
import { Lock, Unlock, Zap, ArrowRight } from 'lucide-react-native';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { hapticMedium } from '../../src/utils/haptics';
import { FontFamily, Spacing } from '../../src/constants/theme';
import OnboardingLayout from '../../src/components/onboarding/OnboardingLayout';
import OnboardingBackButton from '../../src/components/onboarding/OnboardingBackButton';
import FadeUp from '../../src/components/onboarding/FadeUp';
import { SectionHeading } from '../../src/components/ui/anvil';
import { useOnboardingStepView } from '../../src/hooks/useOnboardingStepView';

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
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(unlockOpacity, {
        toValue: 1,
        duration: 500,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.timing(swapAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Auto-advance to review after a brief celebratory pause
  useEffect(() => {
    if (!unlocked) return;
    const t = setTimeout(() => {
      router.push('/onboarding/review');
    }, 1500);
    return () => clearTimeout(t);
  }, [unlocked]);

  return (
    <OnboardingLayout step={11}>
      <OnboardingBackButton />
      <View style={styles.content}>
        <View style={styles.top}>
          <FadeUp delay={0}>
            <SectionHeading size="lg">
              Now spend them.
            </SectionHeading>
          </FadeUp>
        </View>

        <View style={styles.center}>
          {/* Visual: lock → unlock. Locked uses neutral surface (it's the
              default state, not an error). Unlocked uses brand accent
              because that's the success moment. Semantic green is reserved
              for the "Unlocked. Easy." confirmation line below. */}
          <FadeUp delay={260}>
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
          </FadeUp>

          <FadeUp delay={360}>
            <View
              style={[
                styles.creditsCard,
                {
                  backgroundColor: colors.card,
                  borderColor: unlocked ? colors.success : colors.border,
                  borderWidth: unlocked ? 1.5 : 1,
                },
              ]}
            >
              <View style={styles.creditsRow}>
                <Zap
                  size={16}
                  color={unlocked ? colors.muted : colors.accent}
                  fill={unlocked ? 'transparent' : colors.accent}
                />
                <Text
                  style={[
                    styles.creditsLabel,
                    {
                      color: unlocked ? colors.muted : colors.text,
                      textDecorationLine: unlocked ? 'line-through' : 'none',
                    },
                  ]}
                >
                  5 brain cells
                </Text>
              </View>
              <ArrowRight size={14} color={colors.muted} strokeWidth={2} />
              <Text style={[styles.creditsValue, { color: unlocked ? colors.success : colors.text }]}>
                5 minutes
              </Text>
            </View>
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
