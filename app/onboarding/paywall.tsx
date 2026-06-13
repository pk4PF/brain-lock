import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  BackHandler,
  ScrollView,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, ShieldCheck, Star, ChevronDown, Lock, Zap } from 'lucide-react-native';
import { FontFamily, Spacing } from '../../src/constants/theme';
import { goalPhrases } from '../../src/constants/goals';
import { useStore } from '../../src/store/useStore';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { hapticLight, hapticMedium } from '../../src/utils/haptics';
import OnboardingLayout from '../../src/components/onboarding/OnboardingLayout';
import { usePaywallPurchase } from '../../src/components/paywall/usePaywallPurchase';
import { useOnboardingStepView } from '../../src/hooks/useOnboardingStepView';

const POST_PURCHASE_ROUTE = '/(tabs)' as const;
const FIRST_NAME = (full: string) => full.trim().split(/\s+/)[0] || '';

export default function OnboardingPaywallScreen() {
  useOnboardingStepView('paywall');
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();
  const { isPremium, completeOnboarding, setSubscription, userName, userGoals } = useStore();
  const firstName = FIRST_NAME(userName);

  const {
    loading,
    purchasing,
    weeklyPrice,
    annualPrice,
    annualPerWeek,
    annualSavingsPct,
    selectedPlan,
    setSelectedPlan,
    purchase,
    restore,
  } = usePaywallPurchase({ visible: true, source: 'onboarding' });

  const finishOnboarding = () => {
    completeOnboarding();
    router.replace(POST_PURCHASE_ROUTE);
  };

  const handleCancel = () => {
    // Re-show the winback on every abandonment so the discount is always the
    // safety net - we'd rather show it again than lose them over a vanished
    // offer. (The offer copy softens after the first view; see final-offer.)
    router.push('/onboarding/final-offer');
  };

  useEffect(() => {
    if (isPremium) finishOnboarding();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremium]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const handleStart = () => purchase(finishOnboarding, handleCancel);
  const handleRestore = () => restore(finishOnboarding);
  const handleDevSkip = () => {
    setSubscription(selectedPlan);
    finishOnboarding();
  };

  const phrases = goalPhrases(userGoals);
  const heroSub =
    phrases.length === 2
      ? `So you can ${phrases[0]} and ${phrases[1]}, instead of scrolling.`
      : phrases.length === 1
        ? `So you can ${phrases[0]}, instead of scrolling.`
        : 'Build your Brainpower Score. Block what keeps draining it.';

  // Static CTA. The idle pulse was removed - constant motion read as
  // overstimulating on an already-busy paywall.
  const ctaPulse = useRef(new Animated.Value(1)).current;

  return (
    <OnboardingLayout hideOrbs>
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollBody,
            {
              paddingTop: insets.top + 6,
              paddingBottom: insets.bottom + 170,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* ───────────── Social proof badge ───────────── */}
          <View style={styles.socialProof}>
            <View style={[styles.ratingBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={13} color="#FACC15" fill="#FACC15" strokeWidth={0} />
                ))}
              </View>
              <Text style={[styles.ratingText, { color: colors.text }]}>5.0</Text>
              <View style={[styles.ratingDivider, { backgroundColor: colors.border }]} />
              <Text style={[styles.ratingLabel, { color: colors.muted }]}>App Store</Text>
            </View>
          </View>

          {/* ──────────────── Hero ──────────────── */}
          <View style={styles.heroWrap}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.heroLogo}
              resizeMode="contain"
            />
            <Text style={[styles.headline, { color: colors.text }]}>
              Less brain rot.{'\n'}
              <Text style={{ color: colors.accent }}>More brainpower.</Text>
            </Text>
            <Text style={[styles.sub, { color: colors.secondary }]}>
              {heroSub}
            </Text>
          </View>

          {/* Compact value strip - what you're paying for, without a wall of text. */}
          <View style={styles.perks}>
            {[
              'Your Brainpower Score, measured daily',
              "Today's Brain Workout, fresh every day",
              '15+ brain games, unlimited plays',
              'Block the apps that rot your brain',
              'Track every cognitive area as you train',
              'Climb the ranks, all the way to Elite',
            ].map((p) => (
              <View key={p} style={styles.perkRow}>
                <Check size={15} color={colors.accent} strokeWidth={3} />
                <Text style={[styles.perkText, { color: colors.text }]}>{p}</Text>
              </View>
            ))}
          </View>

          {/* ────────────── Plan cards ──────────────── */}
          <View style={styles.planSection}>
            <Text style={[styles.sectionEyebrow, { color: colors.muted }]}>CHOOSE YOUR PLAN</Text>

            {/* Yearly (dominant) */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => { hapticLight(); setSelectedPlan('annual'); }}
            >
              <View
                style={[
                  styles.yearlyCard,
                  {
                    backgroundColor: selectedPlan === 'annual' ? `${colors.accent}0D` : colors.card,
                    borderColor: selectedPlan === 'annual' ? colors.accent : colors.border,
                    borderWidth: selectedPlan === 'annual' ? 2 : 1,
                  },
                ]}
              >
                <View style={[styles.saveBadge, { backgroundColor: colors.accent }]}>
                  <Text style={styles.saveBadgeText}>
                    {annualSavingsPct > 0 ? `SAVE ${annualSavingsPct}%` : 'BEST VALUE'}
                  </Text>
                </View>

                <View style={styles.yearlyBody}>
                  <View style={styles.yearlyLeft}>
                    <View style={[styles.radio, { borderColor: selectedPlan === 'annual' ? colors.accent : colors.borderStrong }]}>
                      {selectedPlan === 'annual' && <View style={[styles.radioDot, { backgroundColor: colors.accent }]} />}
                    </View>
                    <View>
                      <Text style={[styles.yearlyTitle, { color: colors.text }]}>Yearly</Text>
                      <Text style={[styles.yearlyCaption, { color: colors.muted }]}>
                        {annualPrice} billed once a year
                      </Text>
                    </View>
                  </View>

                  <View style={styles.yearlyRight}>
                    <Text style={[styles.yearlyWeekPrice, { color: colors.text }]}>
                      {annualPerWeek.replace('/wk', '')}
                    </Text>
                    <Text style={[styles.yearlyWeekLabel, { color: colors.muted }]}>/week</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>

            {/* Weekly (secondary) */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => { hapticLight(); setSelectedPlan('weekly'); }}
            >
              <View
                style={[
                  styles.weeklyCard,
                  {
                    backgroundColor: selectedPlan === 'weekly' ? `${colors.accent}0D` : colors.card,
                    borderColor: selectedPlan === 'weekly' ? colors.accent : colors.border,
                    borderWidth: selectedPlan === 'weekly' ? 2 : 1,
                  },
                ]}
              >
                <View style={styles.weeklyBody}>
                  <View style={styles.weeklyLeft}>
                    <View style={[styles.radio, { borderColor: selectedPlan === 'weekly' ? colors.accent : colors.borderStrong }]}>
                      {selectedPlan === 'weekly' && <View style={[styles.radioDot, { backgroundColor: colors.accent }]} />}
                    </View>
                    <View>
                      <Text style={[styles.weeklyTitle, { color: colors.text }]}>Weekly</Text>
                      <Text style={[styles.weeklyCaption, { color: colors.muted }]}>{weeklyPrice} billed weekly</Text>
                    </View>
                  </View>
                  <View style={styles.weeklyRight}>
                    <Text style={[styles.weeklyPrice, { color: colors.text }]}>{weeklyPrice}</Text>
                    <Text style={[styles.weeklyPriceLabel, { color: colors.muted }]}>/week</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>

          </View>

          {/* One quiet trust line - everything else is cut for calm. */}
          <Text style={[styles.trustLine, { color: colors.muted }]}>
            Cancel anytime · Secured by Apple
          </Text>

          {/* Footer links */}
          <View style={styles.subRow}>
            <TouchableOpacity onPress={handleRestore} disabled={purchasing}>
              <Text style={[styles.subLink, { color: colors.secondary }]}>Restore</Text>
            </TouchableOpacity>
            <View style={[styles.subDot, { backgroundColor: colors.borderStrong }]} />
            <TouchableOpacity onPress={() => Linking.openURL('https://plbtk.com#terms')}>
              <Text style={[styles.subLink, { color: colors.secondary }]}>Terms</Text>
            </TouchableOpacity>
            <View style={[styles.subDot, { backgroundColor: colors.borderStrong }]} />
            <TouchableOpacity onPress={() => Linking.openURL('https://plbtk.com#privacy')}>
              <Text style={[styles.subLink, { color: colors.secondary }]}>Privacy</Text>
            </TouchableOpacity>
          </View>

          {__DEV__ && (
            <TouchableOpacity
              onPress={handleDevSkip}
              style={[styles.devSkipBtn, { borderColor: colors.borderStrong }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.devSkipText, { color: colors.muted }]}>Skip (dev)</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* ──────────── Sticky CTA ──────────── */}
        <View pointerEvents="box-none" style={styles.stickyWrap}>
          <LinearGradient
            colors={[`${colors.background}00`, colors.background]}
            style={styles.stickyFade}
            pointerEvents="none"
          />
          <View style={[styles.stickyInner, { paddingBottom: insets.bottom + 12, backgroundColor: colors.background }]}>
            {loading ? (
              <View style={[styles.loadingBtn, { backgroundColor: colors.cardAlt }]}>
                <ActivityIndicator color={colors.accent} />
              </View>
            ) : (
              <Animated.View style={{ transform: [{ scale: ctaPulse }] }}>
                <TouchableOpacity
                  activeOpacity={0.88}
                  disabled={purchasing}
                  onPress={() => { hapticMedium(); handleStart(); }}
                  style={Platform.select({
                    ios: {
                      shadowColor: colors.accent,
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.35,
                      shadowRadius: 14,
                      borderRadius: 999,
                    },
                    android: { elevation: 6, borderRadius: 999 },
                  })}
                >
                  <LinearGradient
                    colors={[colors.accent, colors.accentDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.ctaButton}
                  >
                    <Text style={styles.ctaButtonText}>
                      {purchasing
                        ? 'Processing…'
                        : selectedPlan === 'annual'
                          ? `Start — ${annualPerWeek}`
                          : `Start — ${weeklyPrice}/wk`}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            )}
            <Text style={[styles.stickyMicrocopy, { color: colors.muted }]}>
              Cancel anytime, no questions asked
            </Text>
          </View>
        </View>
      </View>
    </OnboardingLayout>
  );
}

// ───────────────────────────────────────────────────────────────
// Data
// ───────────────────────────────────────────────────────────────

const INCLUSIONS = [
  'Lock the apps that rot your brain',
  'Your Brainpower Score, measured and tracked',
  '15+ games in the Brain Gym to drive it down',
  'Box breathing and calm reps',
  'Unlimited unlocks, new reps every month',
];

const FAQS: { q: string; a: string }[] = [
  {
    q: 'Will this work for me?',
    a: 'If you commit, yes. The lock does the willpower for you.',
  },
  {
    q: 'Is it worth it?',
    a: 'Less than a coffee a month for your attention back.',
  },
  {
    q: 'How is this different from other apps?',
    a: 'Other apps just track your screen time. We give you a Brainpower Score, block what rots it, and give you a Brain Gym to build it up.',
  },
  {
    q: 'Does it actually reduce screen time?',
    a: 'That’s the whole design. Every unlock lowers your Brainpower Score, so scrolling has a visible cost — and that cost is what breaks the reflex.',
  },
];

// ───────────────────────────────────────────────────────────────
// FAQ subcomponent
// ───────────────────────────────────────────────────────────────

function FaqItem({
  q, a, colors, initiallyOpen,
}: { q: string; a: string; colors: any; initiallyOpen?: boolean }) {
  const [open, setOpen] = useState(!!initiallyOpen);
  const rotate = useRef(new Animated.Value(initiallyOpen ? 1 : 0)).current;

  const toggle = () => {
    hapticLight();
    Animated.timing(rotate, {
      toValue: open ? 0 : 1,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    setOpen(!open);
  };

  const arrowRotate = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <View style={[styles.faqCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity activeOpacity={0.8} onPress={toggle} style={styles.faqHead}>
        <Text style={[styles.faqQ, { color: colors.text }]}>{q}</Text>
        <Animated.View style={{ transform: [{ rotate: arrowRotate }] }}>
          <ChevronDown size={18} color={colors.muted} strokeWidth={2.4} />
        </Animated.View>
      </TouchableOpacity>
      {open && (
        <Text style={[styles.faqA, { color: colors.secondary }]}>{a}</Text>
      )}
    </View>
  );
}

// ───────────────────────────────────────────────────────────────
// Styles
// ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollBody: {
    paddingHorizontal: 22,
  },

  // Social proof
  socialProof: {
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    gap: 6,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.2,
  },
  ratingDivider: {
    width: 1,
    height: 14,
  },
  ratingLabel: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },

  // Hero
  heroWrap: {
    alignItems: 'center',
    marginBottom: 18,
  },
  trustLine: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    marginTop: 12,
    letterSpacing: 0.1,
  },
  heroLogo: {
    width: 46,
    height: 46,
    borderRadius: 12,
    marginBottom: 10,
  },
  headline: {
    fontSize: 30,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.8,
    lineHeight: 34,
    textAlign: 'center',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  sub: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 12,
  },

  // Value strip
  perks: {
    gap: 9,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  perkText: {
    fontSize: 14.5,
    fontFamily: FontFamily.regular,
    letterSpacing: -0.2,
  },

  // Plans
  planSection: {
    marginBottom: 14,
    gap: 10,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    letterSpacing: 1.6,
    marginBottom: 10,
  },

  // Yearly card (dominant)
  yearlyCard: {
    borderRadius: 16,
  },
  saveBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    zIndex: 2,
  },
  saveBadgeText: {
    fontSize: 10,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.7,
    color: '#FFFFFF',
  },
  yearlyBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 18,
  },
  yearlyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  yearlyTitle: {
    fontSize: 17,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  yearlyCaption: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
  },
  yearlyRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  yearlyWeekPrice: {
    fontSize: 20,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
  },
  yearlyWeekLabel: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    marginLeft: 1,
  },

  // Weekly card (secondary)
  weeklyCard: {
    borderRadius: 16,
  },
  weeklyBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 18,
  },
  weeklyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weeklyTitle: {
    fontSize: 17,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  weeklyCaption: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
  },
  weeklyRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  weeklyPrice: {
    fontSize: 20,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
  },
  weeklyPriceLabel: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    marginLeft: 1,
  },

  // Radio
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },

  // Comparison callout
  comparisonCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  comparisonText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.1,
  },

  // Trust row
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 22,
    paddingHorizontal: 4,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    letterSpacing: 0.1,
  },
  trustDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },

  // Inclusions
  includesCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  includesTitle: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  includeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 0,
  },
  includeTick: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  includeText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FontFamily.regular,
    lineHeight: 20,
  },

  // FAQ
  faqCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  faqHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  faqQ: {
    flex: 1,
    fontSize: 15,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.2,
  },
  faqA: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    lineHeight: 21,
    marginTop: 10,
  },

  // Footer
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 26,
  },
  subLink: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
  },
  subDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  devSkipBtn: {
    marginTop: 18,
    alignSelf: 'center',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  devSkipText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },

  // Sticky CTA
  stickyWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  stickyFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 56,
  },
  stickyInner: {
    paddingTop: 14,
    paddingHorizontal: 22,
  },
  ctaButton: {
    height: 58,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.2,
  },
  loadingBtn: {
    height: 58,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyMicrocopy: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 0.1,
  },
});
