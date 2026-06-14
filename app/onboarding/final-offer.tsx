import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
  Animated,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import { FontFamily, Spacing } from '../../src/constants/theme';
import { useStore } from '../../src/store/useStore';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import OnboardingLayout from '../../src/components/onboarding/OnboardingLayout';
import OnboardingButton from '../../src/components/onboarding/OnboardingButton';
import { usePaywallPurchase } from '../../src/components/paywall/usePaywallPurchase';
import { useOnboardingStepView } from '../../src/hooks/useOnboardingStepView';

const POST_PURCHASE_ROUTE = '/(tabs)' as const;
const numeric = (s: string) => Number(s.replace(/[^\d.]/g, '')) || 0;

// Mirrors the paywall value strip so the winback shows the full offer.
const BULLETS: string[] = [
  'Your Brainpower Score, measured daily',
  "Today's Brain Workout, fresh every day",
  '15+ brain games, unlimited plays',
  'Block the apps that rot your brain',
  'Track every cognitive area as you train',
  'Climb the ranks, all the way to Elite',
];

export default function FinalOfferScreen() {
  useOnboardingStepView('final_offer');
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();
  const { isPremium, completeOnboarding, markWinbackSeen, winbackSeen } = useStore();

  // First view gets the punchy "one-time" urgency; repeat views soften to an
  // honest "best price" framing (the offer now re-shows on every abandonment).
  const firstView = useRef(!winbackSeen).current;
  useEffect(() => {
    markWinbackSeen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    loading,
    purchasing,
    annualPrice,
    winbackPrice,
    purchase,
  } = usePaywallPurchase({ visible: true, source: 'final-offer' });

  const off = (() => {
    const a = numeric(annualPrice);
    const wb = numeric(winbackPrice);
    return a > 0 ? Math.max(0, Math.round((1 - wb / a) * 100)) : 0;
  })();

  // Per-week equivalent of the winback annual price, so the yearly figure
  // reads as tiny (e.g. £24.99/yr ≈ £0.48 a week).
  const winbackPerWeek = (() => {
    const wb = numeric(winbackPrice);
    const sym = winbackPrice.replace(/[\d.,\s]/g, '') || '£';
    return wb > 0 ? `${sym}${(wb / 52).toFixed(2)}` : '';
  })();

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const finishOnboarding = () => {
    completeOnboarding();
    router.replace(POST_PURCHASE_ROUTE);
  };

  useEffect(() => {
    if (isPremium) finishOnboarding();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremium]);

  const headlineAnim = useRef(new Animated.Value(0)).current;
  const bulletsAnim = useRef(new Animated.Value(0)).current;
  const priceAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.stagger(120, [
      Animated.spring(headlineAnim, { toValue: 1, friction: 7, tension: 70, useNativeDriver: true }),
      Animated.spring(bulletsAnim, { toValue: 1, friction: 7, tension: 70, useNativeDriver: true }),
      Animated.spring(priceAnim, { toValue: 1, friction: 7, tension: 70, useNativeDriver: true }),
    ]).start();
  }, []);

  const slideUp = (a: Animated.Value) => ({
    opacity: a,
    transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [22, 0] }) }],
  });

  const handleClaim = () => purchase(finishOnboarding);
  const handleDecline = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/onboarding/paywall');
    }
  };

  return (
    <OnboardingLayout>
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 },
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.headlineWrap, slideUp(headlineAnim)]}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.eyebrow, { color: colors.accent }]}>
              {firstView ? 'ONE-TIME OFFER' : 'YOUR BEST PRICE'}
            </Text>
            <Text style={[styles.bigOff, { color: colors.text }]}>
              {off > 0 ? `${off}% off` : 'Half price'}
            </Text>
            <Text style={[styles.subline, { color: colors.secondary }]}>
              A full year for {winbackPrice}. That&rsquo;s just {winbackPerWeek} a week.
            </Text>
          </Animated.View>

          <Animated.View style={[styles.bullets, slideUp(bulletsAnim)]}>
            {BULLETS.map((text) => (
              <View key={text} style={styles.bulletRow}>
                <View style={[styles.bulletDot, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}>
                  <Check size={11} color={colors.accent} strokeWidth={3} />
                </View>
                <Text style={[styles.bulletText, { color: colors.text }]}>{text}</Text>
              </View>
            ))}
          </Animated.View>

          <Animated.View style={[styles.priceRow, slideUp(priceAnim)]}>
            <Text style={[styles.priceWas, { color: colors.muted }]}>{annualPrice}/yr</Text>
            <Text style={[styles.priceNow, { color: colors.text }]}>{winbackPrice}/yr</Text>
          </Animated.View>
        </ScrollView>

        <View style={styles.footer}>
          {loading ? (
            <View style={styles.loadingBtn}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : (
            <>
              <OnboardingButton
                label={purchasing ? 'Processing…' : `Get it for ${winbackPrice}/year`}
                onPress={purchasing ? () => {} : handleClaim}
              />
              <TouchableOpacity
                activeOpacity={0.6}
                onPress={handleDecline}
                hitSlop={{ top: 10, bottom: 10, left: 16, right: 16 }}
              >
                <Text style={[styles.noThanks, { color: colors.muted }]}>No thanks</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: Spacing.xl },
  body: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: 40,
  },
  headlineWrap: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 14,
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    letterSpacing: 1.6,
    marginBottom: 10,
  },
  bigOff: {
    fontSize: 64,
    fontFamily: FontFamily.medium,
    letterSpacing: -2.4,
    lineHeight: 68,
    textAlign: 'center',
    marginBottom: 8,
  },
  subline: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
  },
  urgency: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    textAlign: 'center',
    letterSpacing: -0.1,
    marginTop: 10,
  },
  bullets: {
    gap: 14,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  bulletDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  priceWas: {
    fontSize: 18,
    fontFamily: FontFamily.regular,
    textDecorationLine: 'line-through',
  },
  priceNow: {
    fontSize: 28,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.8,
  },
  footer: {
    alignItems: 'center',
    gap: 10,
  },
  loadingBtn: {
    width: '100%',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  billedNote: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    marginTop: 4,
    textAlign: 'center',
  },
  noThanks: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    marginTop: 12,
    textAlign: 'center',
    textDecorationLine: 'underline',
    opacity: 0.7,
  },
});
