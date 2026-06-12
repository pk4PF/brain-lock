import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Pressable, Easing, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Fingerprint } from 'lucide-react-native';
import { useStore } from '../../src/store/useStore';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { FontFamily, Spacing } from '../../src/constants/theme';
import { hapticLight, hapticSuccess } from '../../src/utils/haptics';
import OnboardingLayout from '../../src/components/onboarding/OnboardingLayout';
import OnboardingBackButton from '../../src/components/onboarding/OnboardingBackButton';
import LottieIcon from '../../src/components/LottieIcon';
import { useOnboardingStepView } from '../../src/hooks/useOnboardingStepView';
import { track, Events } from '../../src/services/analytics';

const HOLD_MS = 1400;

export default function CommitmentScreen() {
  useOnboardingStepView('commitment');
  const { colors } = useThemeColors();
  const { userName } = useStore();
  const firstName = userName.trim().split(/\s+/)[0] || '';
  const [committed, setCommitted] = useState(false);

  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslate = useRef(new Animated.Value(20)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;

  const holdProgress = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(cardOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(cardTranslate, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.timing(btnOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
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
        setTimeout(() => router.push('/onboarding/proof'), 900);
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
    <OnboardingLayout step={15} totalSteps={15}>
      <OnboardingBackButton />
      {committed && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={styles.confettiAnchor}>
            <LottieIcon name="confetti" size={420} loop={false} />
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.center}>
          <Animated.View
            style={[
              styles.pactCard,
              {
                backgroundColor: colors.cardAlt,
                borderColor: colors.border,
                opacity: cardOpacity,
                transform: [{ translateY: cardTranslate }],
              },
            ]}
          >
            <View style={[styles.pactIcon, { backgroundColor: `${colors.accent}1A` }]}>
              <LottieIcon name="lock" size={36} loop={false} />
            </View>

            <Text style={[styles.pactTitle, { color: colors.text }]}>
              Commitment pact
            </Text>

            <Text style={[styles.pactBody, { color: colors.secondary }]}>
              I'm locking in. Less brain rot, more brainpower.
            </Text>
          </Animated.View>
        </View>

        <Animated.View style={[styles.bottomContainer, { opacity: btnOpacity }]}>
          <Text style={[styles.tapHint, { color: colors.muted }]}>
            {committed ? '' : 'Hold to lock it in'}
          </Text>

          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <Pressable
              onPressIn={() => { setHolding(true); startHold(); }}
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
              <Animated.View
                style={[
                  styles.commitFill,
                  { width: fillWidth, backgroundColor: colors.accent },
                ]}
              />
              <View style={styles.commitTextWrap}>
                <Fingerprint
                  size={22}
                  color={holding || committed ? '#FFFFFF' : colors.accent}
                  strokeWidth={2}
                  style={{ marginBottom: 4 }}
                />
                <Text style={[styles.commitBtnText, { color: holding || committed ? '#FFFFFF' : colors.text }]}>
                  {committed ? "You're committed" : holding ? 'Committing…' : 'Hold to commit'}
                </Text>
              </View>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'space-between' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },

  pactCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  pactIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  pactTitle: {
    fontSize: 22,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.4,
    marginBottom: 16,
  },
  pactBody: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    lineHeight: 23,
    textAlign: 'center',
    paddingHorizontal: 4,
  },

  bottomContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 36,
    alignItems: 'stretch',
  },
  tapHint: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 18,
  },
  commitBtn: {
    height: 80,
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
    fontSize: 15,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.1,
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
