import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Pressable, Easing, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../../src/store/useStore';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { FontFamily, Spacing } from '../../src/constants/theme';
import { hapticLight, hapticMedium, hapticSuccess } from '../../src/utils/haptics';
import OnboardingLayout from '../../src/components/onboarding/OnboardingLayout';
import LottieIcon from '../../src/components/LottieIcon';
import { Eyebrow, SectionHeading, MutedText } from '../../src/components/ui/anvil';
import { useOnboardingStepView } from '../../src/hooks/useOnboardingStepView';
import { track, Events } from '../../src/services/analytics';

const FIRST_NAME = (full: string) => full.trim().split(/\s+/)[0] || '';

// How long the user must hold the button to lock in.
const HOLD_MS = 1400;

/**
 * "Lock it in" commitment screen.
 *
 * The CTA is hold-to-confirm: a progress bar fills inside the button while
 * pressed; releasing early resets it. Holding to completion fires a success
 * haptic and advances. Physical, deliberate, hard to mis-tap. The point is
 * that the user *feels* themselves making the commitment, not just clicking
 * through another screen.
 */
export default function CommitmentScreen() {
  useOnboardingStepView('commitment');
  const { colors } = useThemeColors();
  const { userName } = useStore();
  const firstName = FIRST_NAME(userName);
  const [committed, setCommitted] = useState(false);

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subOpacity = useRef(new Animated.Value(0)).current;

  // Hold progress 0 -> 1
  const holdProgress = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(subOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const startHold = () => {
    if (committed) return;
    hapticLight();
    animRef.current = Animated.timing(holdProgress, {
      toValue: 1,
      duration: HOLD_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    animRef.current.start(({ finished }) => {
      if (finished) {
        hapticSuccess();
        setCommitted(true);
        track(Events.CommitmentLocked);
        // Use router.replace, NOT push: pressing back from the next screen
        // would otherwise return here with committed=true, leaving the
        // button disabled and the user stuck. Replace pops this screen off
        // the stack so back navigation skips past it.
        setTimeout(() => router.replace('/onboarding/inside'), 900);
      }
    });
  };

  const cancelHold = () => {
    if (committed) return;
    if (animRef.current) {
      animRef.current.stop();
      animRef.current = null;
    }
    Animated.timing(holdProgress, {
      toValue: 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  const fillWidth = holdProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Subtle scale dip when the user is currently holding.
  const [holding, setHolding] = useState(false);
  const buttonScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.spring(buttonScale, {
      toValue: holding ? 0.97 : 1,
      friction: 6,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, [holding]);

  return (
    <OnboardingLayout step={6}>
      {committed && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={styles.confettiAnchor}>
            <LottieIcon name="confetti" size={420} loop={false} />
          </View>
        </View>
      )}

      {/* ScrollView wrap so the hold-to-lock-in button never gets pushed
          off-screen under iOS Display Zoom + Dynamic Type. The Pressable
          inside still captures touches normally. */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.center}>
          <Animated.View style={{ opacity: titleOpacity, alignItems: 'center' }}>
            <Eyebrow style={styles.eyebrowCenter}>
              {firstName ? `${firstName}, lock it in` : 'Lock it in'}
            </Eyebrow>
          </Animated.View>

          <Animated.View style={{ opacity: titleOpacity, alignItems: 'center' }}>
            <SectionHeading size="lg" align="center">
              Take back{'\n'}your time.
            </SectionHeading>
          </Animated.View>

          <View style={{ height: 14 }} />

          <Animated.View style={{ opacity: subOpacity, alignItems: 'center' }}>
            <MutedText size="md" align="center" style={styles.sub}>
              From now on, your phone works for you. Not the other way around.
            </MutedText>
          </Animated.View>
        </View>

        <View style={styles.bottomContainer}>
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <Pressable
              onPressIn={() => { setHolding(true);  startHold(); }}
              onPressOut={() => { setHolding(false); cancelHold(); }}
              disabled={committed}
              style={[
                styles.commitBtn,
                {
                  backgroundColor: colors.cardAlt,
                  borderColor: holding ? colors.accent : colors.borderStrong,
                },
                holding ? (Platform.OS === 'ios'
                  ? {
                      shadowColor: colors.accent,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 12,
                    }
                  : { elevation: 4 }) : null,
              ]}
            >
              {/* Filling bar */}
              <Animated.View
                style={[
                  styles.commitFill,
                  { width: fillWidth, backgroundColor: colors.accent },
                ]}
              />
              {/* Text on top */}
              <View style={styles.commitTextWrap}>
                <Text style={[styles.commitBtnText, { color: holding || committed ? '#FFFFFF' : colors.text }]}>
                  {committed ? "You're in" : holding ? 'Locking in…' : 'Hold to lock in'}
                </Text>
              </View>
            </Pressable>
          </Animated.View>

          <Text style={[styles.hint, { color: colors.muted }]}>
            {committed ? '' : 'Press and hold the button.'}
          </Text>
        </View>
      </ScrollView>
    </OnboardingLayout>
  );
}

// Suppress unused-import lints if the LinearGradient/hapticMedium references
// get pruned in future refactors. They're harmless to keep.
void LinearGradient;
void hapticMedium;

const styles = StyleSheet.create({
  // flexGrow inside ScrollView contentContainerStyle so the layout stays
  // identical when content fits, but can scroll under accessibility settings.
  content: { flexGrow: 1, justifyContent: 'space-between' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  eyebrowCenter: {
    textAlign: 'center',
    marginBottom: 16,
  },
  sub: {
    maxWidth: 320,
  },
  bottomContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 36,
    alignItems: 'stretch',
  },
  commitBtn: {
    height: 60,
    borderRadius: 999,
    borderWidth: 1.5,
    overflow: 'hidden',
    justifyContent: 'center',
    position: 'relative',
  },
  commitFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 999,
  },
  commitTextWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commitBtnText: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.1,
  },
  hint: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    marginTop: 12,
    height: 16,
  },
  confettiAnchor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
});
