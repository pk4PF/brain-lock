import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
  Animated,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, X as XIcon } from 'lucide-react-native';
import { FontFamily, Spacing } from '../../src/constants/theme';
import { useStore } from '../../src/store/useStore';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import OnboardingLayout from '../../src/components/onboarding/OnboardingLayout';
import OnboardingButton from '../../src/components/onboarding/OnboardingButton';
import { usePaywallPurchase } from '../../src/components/paywall/usePaywallPurchase';
import { useOnboardingStepView } from '../../src/hooks/useOnboardingStepView';

const POST_PURCHASE_ROUTE = '/(tabs)' as const;

// Discount config. Source-of-truth display values; the actual purchase still
// runs against the regular annual RevenueCat product. To make the £24.99
// price real you must configure an introductory offer on the annual product
// in App Store Connect. The display copy here is purely marketing.
const DISCOUNTED_YEARLY = 24.99;
const DISCOUNTED_PER_MONTH = DISCOUNTED_YEARLY / 12;
const FULL_MONTHLY = 12.99;
const DISCOUNT_PCT = Math.round((1 - DISCOUNTED_YEARLY / (FULL_MONTHLY * 12)) * 100);

const BULLETS: string[] = [
  'Lowest price ever. Limited offer.',
  'Put your brain back in charge.',
  'Train memory, attention, speed, recall.',
  'Earn your screen time. For real this time.',
];

export default function FinalOfferScreen() {
  useOnboardingStepView('final_offer');
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();
  const { isPremium, completeOnboarding } = useStore();

  const {
    loading,
    purchasing,
    setSelectedPlan,
    purchase,
  } = usePaywallPurchase({ visible: true, source: 'final-offer' });

  // Force-select annual on this screen - the offer is annual-only.
  useEffect(() => {
    setSelectedPlan('annual');
  }, []);

  // Hard-gate Android back so users can't escape without a decision.
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

  // Subtle entrance animation
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
  // Closing the offer must NOT mark the user as onboarded - that gives free
  // access to the app. Send them back to the paywall instead so the only
  // way out is paying or restoring.
  const handleClose = () => {
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
        {/* Close (X) button to exit the offer */}
        <TouchableOpacity
          style={[styles.closeBtn, { top: insets.top + 12 }]}
          onPress={handleClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <XIcon size={20} color={colors.muted} />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.headlineWrap, slideUp(headlineAnim)]}>
            <Text style={[styles.eyebrow, { color: colors.muted }]}>
              LIMITED TIME OFFER
            </Text>
            <Text style={[styles.bigOff, { color: colors.text }]}>
              {DISCOUNT_PCT}% OFF
            </Text>
            <Text style={[styles.subline, { color: colors.secondary }]}>
              Put your brain back in charge. You'll never see this price again.
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
            <Text style={[styles.priceWas, { color: colors.muted }]}>
              £{FULL_MONTHLY.toFixed(2)}/mo
            </Text>
            <Text style={[styles.priceNow, { color: colors.text }]}>
              £{DISCOUNTED_PER_MONTH.toFixed(2)} / month
            </Text>
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
                label={purchasing ? 'Processing…' : 'Claim my limited time offer'}
                onPress={purchasing ? () => {} : handleClaim}
              />
              <Text style={[styles.billedNote, { color: colors.muted }]}>
                Billed yearly at £{DISCOUNTED_YEARLY.toFixed(2)} per year
              </Text>
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
  closeBtn: {
    position: 'absolute',
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    zIndex: 10,
  },
  headlineWrap: {
    alignItems: 'center',
    marginBottom: 32,
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
});
