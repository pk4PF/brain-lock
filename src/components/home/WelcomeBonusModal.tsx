import { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { FontFamily, Spacing } from '../../constants/theme';
import { hapticMedium } from '../../utils/haptics';

interface Props {
  visible: boolean;
  onClaim: () => void;
}

/**
 * Post-onboarding "earned starting balance" reveal.
 *
 * Hybrid celebratory tone (per the user's pick): we *do* allow some pop -
 * the big "30" springs in, the accent ring pulses once, a few sparkles
 * fade up around the number. But the copy stays Brainlock voice: numbers
 * over adjectives, no "Amazing work!", no flame emoji, no jar of gold
 * coins. The bonus is framed as *earned* (you finished onboarding - that
 * was the work), not as a free dopamine gift.
 */
export default function WelcomeBonusModal({ visible, onClaim }: Props) {
  const { colors } = useThemeColors();

  // Spring-in for the big number + sparkles.
  const numberScale = useRef(new Animated.Value(0.4)).current;
  const numberOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.85)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const sparkleA = useRef(new Animated.Value(0)).current;
  const sparkleB = useRef(new Animated.Value(0)).current;
  const sparkleC = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    numberScale.setValue(0.4);
    numberOpacity.setValue(0);
    ringScale.setValue(0.85);
    ringOpacity.setValue(0);
    sparkleA.setValue(0);
    sparkleB.setValue(0);
    sparkleC.setValue(0);

    Animated.sequence([
      Animated.delay(160),
      Animated.parallel([
        Animated.spring(numberScale, {
          toValue: 1,
          friction: 5.5,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.timing(numberOpacity, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(ringOpacity, {
          toValue: 1,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(ringScale, {
          toValue: 1.18,
          duration: 540,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(ringOpacity, {
          toValue: 0,
          duration: 540,
          delay: 80,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.stagger(120, [
      Animated.spring(sparkleA, {
        toValue: 1,
        friction: 5,
        tension: 80,
        delay: 240,
        useNativeDriver: true,
      }),
      Animated.spring(sparkleB, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.spring(sparkleC, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    // Mid-tone haptic to anchor the moment.
    const t = setTimeout(hapticMedium, 200);
    return () => clearTimeout(t);
  }, [visible]);

  const sparkleStyle = (anim: Animated.Value, x: number, y: number, delayDeg: number) => ({
    position: 'absolute' as const,
    left: x,
    top: y,
    opacity: anim,
    transform: [
      { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) },
      { rotate: `${delayDeg}deg` },
    ],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <View style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
          {/* Eyebrow */}
          <Text style={[styles.eyebrow, { color: colors.muted }]}>
            ONBOARDING COMPLETE
          </Text>

          {/* Headline */}
          <Text style={[styles.headline, { color: colors.text }]}>
            Starting balance
          </Text>

          {/* Big number with accent ring + sparkles */}
          <View style={styles.numberWrap}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.ring,
                {
                  borderColor: colors.accent,
                  opacity: ringOpacity,
                  transform: [{ scale: ringScale }],
                },
              ]}
            />

            <Animated.Text
              style={[
                styles.bigNumber,
                {
                  color: colors.accent,
                  opacity: numberOpacity,
                  transform: [{ scale: numberScale }],
                },
              ]}
            >
              25
            </Animated.Text>

            <Animated.View style={sparkleStyle(sparkleA, -28, -10, -18)}>
              <Sparkles size={18} color={colors.accent} strokeWidth={2.2} />
            </Animated.View>
            <Animated.View style={sparkleStyle(sparkleB, 130, 4, 14)}>
              <Sparkles size={14} color={colors.accent} strokeWidth={2.2} />
            </Animated.View>
            <Animated.View style={sparkleStyle(sparkleC, -10, 92, -8)}>
              <Sparkles size={12} color={colors.accent} strokeWidth={2.2} />
            </Animated.View>
          </View>

          <Text style={[styles.unit, { color: colors.muted }]}>BRAIN CELLS</Text>

          {/* Body */}
          <Text style={[styles.body, { color: colors.text }]}>
            Your starting balance. Spend them now to unlock 15-30 minutes,
            or save up and earn more.
          </Text>

          {/* CTA */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onClaim}
            style={[styles.cta, { backgroundColor: colors.accent }]}
          >
            <Text style={styles.ctaLabel}>Claim</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const RING_SIZE = 180;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: 'center',
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    letterSpacing: 1.6,
    marginBottom: 6,
  },
  headline: {
    fontSize: 26,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.6,
    marginBottom: 18,
    textAlign: 'center',
  },
  numberWrap: {
    height: RING_SIZE,
    width: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2,
  },
  bigNumber: {
    fontSize: 110,
    fontFamily: FontFamily.semibold,
    letterSpacing: -4,
    lineHeight: 118,
    fontVariant: ['tabular-nums'],
  },
  unit: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    letterSpacing: 1.8,
    marginTop: 2,
  },
  body: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 18,
    marginBottom: 22,
    paddingHorizontal: 4,
  },
  cta: {
    width: '100%',
    height: 54,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.2,
  },
});
