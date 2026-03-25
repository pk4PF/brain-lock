import { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    ActivityIndicator,
    Alert,
    Dimensions,
    Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, CheckCircle, Star, Brain, Shield, Zap, Lock, X } from 'lucide-react-native';
import LottieView from 'lottie-react-native';
import { type PurchasesPackage } from 'react-native-purchases';
import { FontSize, FontFamily, Spacing, BorderRadius } from '../../src/constants/theme';
import { useStore } from '../../src/store/useStore';
import OnboardingLayout from '../../src/components/onboarding/OnboardingLayout';
import OnboardingButton from '../../src/components/onboarding/OnboardingButton';
import OnboardingBackButton from '../../src/components/onboarding/OnboardingBackButton';
import {
    getOfferings,
    purchasePackage,
    restorePurchases,
    checkPremiumStatus,
} from '../../src/services/revenueCat';

const { width: SW } = Dimensions.get('window');

const AMBER = '#F5A623';
const AMBER_DIM = 'rgba(245,166,35,0.08)';
const AMBER_GLOW = 'rgba(245,166,35,0.25)';
const TEXT_PRIMARY = '#1A1A2E';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';

interface PlanInfo {
    id: string;
    label: string;
    pkg: PurchasesPackage | null;
    price: string;
    perMonth: string;
}

export default function PaywallScreen() {
    const { setSubscription, userName } = useStore();
    const insets = useSafeAreaInsets();

    const [step, setStep] = useState(0);
    const [packages, setPackages] = useState<PurchasesPackage[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<string>('annual');
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);

    // Animations
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;

    // Step 1 stagger anims
    const heroAnim = useRef(new Animated.Value(0)).current;
    const titleAnim = useRef(new Animated.Value(0)).current;
    const cardsAnim = useRef(new Animated.Value(0)).current;
    const btnAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.stagger(150, [
            Animated.spring(heroAnim, { toValue: 1, friction: 8, tension: 60, useNativeDriver: true }),
            Animated.spring(titleAnim, { toValue: 1, friction: 8, tension: 60, useNativeDriver: true }),
            Animated.spring(cardsAnim, { toValue: 1, friction: 8, tension: 60, useNativeDriver: true }),
            Animated.spring(btnAnim, { toValue: 1, friction: 8, tension: 60, useNativeDriver: true }),
        ]).start();
    }, []);

    // Fetch offerings
    useEffect(() => {
        (async () => {
            try {
                const offering = await getOfferings();
                if (offering) setPackages(offering.availablePackages);
            } catch (err) {
                if (__DEV__) console.warn('Failed to load offerings:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const animateToStep = (nextStep: number) => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: -20, duration: 150, useNativeDriver: true }),
        ]).start(() => {
            setStep(nextStep);
            slideAnim.setValue(25);
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
                Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
            ]).start();
        });
    };

    const monthlyPkg = packages.find(
        (p) => p.packageType === 'MONTHLY' || p.product.identifier.includes('monthly')
    ) ?? null;
    const annualPkg = packages.find(
        (p) => p.packageType === 'ANNUAL' || p.product.identifier.includes('yearly') || p.product.identifier.includes('annual')
    ) ?? null;

    const plans: PlanInfo[] = [
        {
            id: 'monthly',
            label: 'Monthly',
            pkg: monthlyPkg,
            price: monthlyPkg?.product.priceString ?? '$4.99',
            perMonth: monthlyPkg?.product.priceString ?? '$4.99',
        },
        {
            id: 'annual',
            label: 'Yearly',
            pkg: annualPkg,
            price: annualPkg?.product.priceString ?? '$29.99',
            perMonth: '$2.50',
        },
    ];

    const handlePurchase = async () => {
        const plan = plans.find((p) => p.id === selectedPlan);
        if (!plan?.pkg) {
            if (__DEV__) {
                setSubscription(selectedPlan);
                router.push('/onboarding/letsgo');
            } else {
                Alert.alert('Unable to load plans', 'Please check your connection and try again.');
            }
            return;
        }
        setPurchasing(true);
        try {
            const customerInfo = await purchasePackage(plan.pkg);
            if (checkPremiumStatus(customerInfo)) {
                setSubscription(plan.id);
                router.push('/onboarding/letsgo');
            } else {
                Alert.alert('Purchase issue', 'Your purchase could not be verified. Please try again or contact support.');
            }
        } catch (err: any) {
            if (!err.userCancelled) Alert.alert('Purchase failed', 'Please try again later.');
        } finally {
            setPurchasing(false);
        }
    };

    const handleRestore = async () => {
        setPurchasing(true);
        try {
            const customerInfo = await restorePurchases();
            if (checkPremiumStatus(customerInfo)) {
                setSubscription('restored');
                Alert.alert('Restored!', 'Your premium access has been restored.');
                router.push('/onboarding/letsgo');
            } else {
                Alert.alert('No purchases found', "We couldn't find any previous purchases on this account.");
            }
        } catch (err) {
            Alert.alert('Restore failed', 'Please try again later.');
        } finally {
            setPurchasing(false);
        }
    };

    const handleBack = () => {
        if (step > 0) animateToStep(step - 1);
        else router.back();
    };

    const entryAnim = (anim: Animated.Value, y = 25) => ({
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [y, 0] }) }],
    });

    // ── FEATURES for step 1 ──
    const FEATURES = [
        { icon: <Lock size={18} color={AMBER} />, title: 'Smart App Lock', desc: 'Earn screen time through brain challenges' },
        { icon: <Brain size={18} color={AMBER} />, title: 'Brain Games', desc: 'Sharpen memory, focus & reaction time' },
        { icon: <Zap size={18} color={AMBER} />, title: 'Daily Streaks', desc: 'Build lasting habits that stick' },
        { icon: <Shield size={18} color={AMBER} />, title: 'Progress Stats', desc: 'Track your improvement over time' },
    ];

    // ═══════════════════════════════════════
    // STEP 1 — Try for free
    // ═══════════════════════════════════════
    const renderStep1 = () => (
        <View style={styles.stepWrap}>
            <View style={styles.centerSection}>
                {/* Brain animation */}
                <Animated.View style={[styles.heroCircle, entryAnim(heroAnim, 15)]}>
                    <View style={styles.heroGlow} />
                    <LottieView
                        source={require('../../assets/animations/brain.json')}
                        autoPlay
                        loop
                        speed={0.6}
                        style={styles.heroLottie}
                    />
                </Animated.View>

                <Animated.View style={entryAnim(titleAnim)}>
                    <Text style={styles.title}>
                        We want you to{'\n'}try <Text style={styles.titleAccent}>Brain Lock</Text> for free
                    </Text>
                    <Text style={styles.tagline}>THE #1 APP FOR FOCUS & BRAIN TRAINING</Text>
                </Animated.View>

                {/* Feature list — clean rows, not a grid */}
                <Animated.View style={[styles.featureCard, entryAnim(cardsAnim)]}>
                    {FEATURES.map((f, i) => (
                        <View key={i} style={[styles.featureRow, i < FEATURES.length - 1 && styles.featureRowBorder]}>
                            <View style={styles.featureIcon}>{f.icon}</View>
                            <View style={styles.featureText}>
                                <Text style={styles.featureTitle}>{f.title}</Text>
                                <Text style={styles.featureDesc}>{f.desc}</Text>
                            </View>
                        </View>
                    ))}
                </Animated.View>
            </View>

            <Animated.View style={[styles.bottomSection, entryAnim(btnAnim)]}>
                <View style={styles.noBadge}>
                    <Shield size={13} color={AMBER} />
                    <Text style={styles.noBadgeText}>NO PAYMENT DUE NOW</Text>
                </View>
                <OnboardingButton label="Try for $0.00" onPress={() => animateToStep(1)} />
                <Text style={styles.priceNote}>
                    7 days free, then {plans[1].price} per year ({plans[1].perMonth}/mo)
                </Text>
            </Animated.View>
        </View>
    );

    // ═══════════════════════════════════════
    // STEP 2 — Reminder reassurance
    // ═══════════════════════════════════════
    const renderStep2 = () => (
        <View style={styles.stepWrap}>
            <View style={styles.centerSection}>
                <Text style={styles.title}>
                    We'll send you{'\n'}a reminder before{'\n'}your free trial ends
                </Text>

                {/* Bell illustration */}
                <View style={styles.bellContainer}>
                    <View style={styles.bellOuter} />
                    <View style={styles.bellInner}>
                        <Bell size={44} color={TEXT_MUTED} strokeWidth={1.5} />
                    </View>
                    <View style={styles.bellBadge}>
                        <Text style={styles.bellBadgeText}>1</Text>
                    </View>
                </View>

                <Text style={styles.reassurance}>
                    You'll get a notification 2 days before{'\n'}your trial ends. Cancel anytime.
                </Text>
            </View>

            <View style={styles.bottomSection}>
                <View style={styles.noBadge}>
                    <Shield size={13} color={AMBER} />
                    <Text style={styles.noBadgeText}>NO PAYMENT DUE NOW</Text>
                </View>
                <OnboardingButton label="Continue for free" onPress={() => animateToStep(2)} />
                <Text style={styles.priceNote}>
                    7 days free, then {plans[1].price} per year ({plans[1].perMonth}/mo)
                </Text>
            </View>
        </View>
    );

    // ═══════════════════════════════════════
    // STEP 3 — Timeline + Plan picker
    // ═══════════════════════════════════════
    const renderStep3 = () => (
        <View style={styles.stepWrap}>
            <View style={styles.centerSection}>
                <Text style={styles.title}>
                    Start your 7-day{'\n'}<Text style={styles.titleAccent}>FREE</Text> trial to continue
                </Text>

                {/* Timeline card */}
                <View style={styles.timelineCard}>
                    {/* Today */}
                    <View style={styles.tlRow}>
                        <View style={styles.tlLeft}>
                            <View style={[styles.tlDot, styles.tlDotActive]}>
                                <CheckCircle size={14} color="#FFF" />
                            </View>
                            <View style={styles.tlLine} />
                        </View>
                        <View style={styles.tlContent}>
                            <Text style={styles.tlLabel}>Today</Text>
                            <Text style={styles.tlDesc}>Get full access to all Premium features for free.</Text>
                        </View>
                    </View>

                    {/* Day 5 */}
                    <View style={styles.tlRow}>
                        <View style={styles.tlLeft}>
                            <View style={[styles.tlDot, styles.tlDotActive]}>
                                <Bell size={12} color="#FFF" />
                            </View>
                            <View style={styles.tlLine} />
                        </View>
                        <View style={styles.tlContent}>
                            <Text style={styles.tlLabel}>Day 5</Text>
                            <Text style={styles.tlDesc}>We'll remind you before your free trial ends.</Text>
                        </View>
                    </View>

                    {/* Day 7 */}
                    <View style={styles.tlRow}>
                        <View style={styles.tlLeft}>
                            <View style={[styles.tlDot, styles.tlDotGold]}>
                                <Star size={12} color="#FFF" />
                            </View>
                        </View>
                        <View style={styles.tlContent}>
                            <Text style={styles.tlLabel}>Day 7</Text>
                            <Text style={styles.tlDesc}>Your Premium membership begins.{'\n'}Cancel any time before.</Text>
                        </View>
                    </View>
                </View>

                {/* Plan selector */}
                {loading ? (
                    <ActivityIndicator color={AMBER} style={{ marginTop: 20 }} />
                ) : (
                    <View style={styles.planRow}>
                        {plans.map((plan) => {
                            const selected = selectedPlan === plan.id;
                            return (
                                <TouchableOpacity
                                    key={plan.id}
                                    style={[styles.planCard, selected && styles.planCardSelected]}
                                    onPress={() => setSelectedPlan(plan.id)}
                                    activeOpacity={0.7}
                                >
                                    {plan.id === 'annual' && (
                                        <View style={styles.planBadge}>
                                            <Text style={styles.planBadgeText}>7 DAYS FREE</Text>
                                        </View>
                                    )}
                                    <Text style={[styles.planLabel, selected && styles.planLabelActive]}>{plan.label}</Text>
                                    <Text style={[styles.planPrice, selected && styles.planPriceActive]}>
                                        {plan.id === 'annual' ? plan.perMonth : plan.price}
                                    </Text>
                                    <Text style={styles.planPeriod}>/mo</Text>
                                    {selected && (
                                        <View style={styles.planCheck}>
                                            <CheckCircle size={16} color={AMBER} />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
            </View>

            <View style={styles.bottomSection}>
                <View style={styles.noBadge}>
                    <Shield size={13} color={AMBER} />
                    <Text style={styles.noBadgeText}>NO PAYMENT DUE NOW</Text>
                </View>
                <OnboardingButton
                    label={purchasing ? 'Processing...' : 'Start My 7-day Free Trial'}
                    onPress={handlePurchase}
                />
                <Text style={styles.priceNote}>
                    7 days free, then {plans[1].price} per year ({plans[1].perMonth}/mo)
                </Text>
                <View style={styles.legalRow}>
                    <TouchableOpacity onPress={() => Linking.openURL('https://brainlockapp.com/terms')}>
                        <Text style={styles.legalLink}>Terms of Use</Text>
                    </TouchableOpacity>
                    <Text style={styles.legalDot}> · </Text>
                    <TouchableOpacity onPress={() => Linking.openURL('https://brainlockapp.com/privacy')}>
                        <Text style={styles.legalLink}>Privacy Policy</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    const steps = [renderStep1, renderStep2, renderStep3];

    return (
        <OnboardingLayout>
            <OnboardingBackButton onPress={handleBack} />

            {/* Restore button */}
            <TouchableOpacity
                style={[styles.restoreBtn, { top: insets.top + 14 }]}
                onPress={handleRestore}
                disabled={purchasing}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
                <Text style={styles.restoreText}>Restore</Text>
            </TouchableOpacity>

            {/* Close button on step 3 */}
            {step === 2 && (
                <TouchableOpacity
                    style={[styles.closeBtn, { top: insets.top + 14 }]}
                    onPress={() => router.push('/onboarding/letsgo')}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                    <X size={18} color={TEXT_MUTED} />
                </TouchableOpacity>
            )}

            <Animated.View
                style={[
                    styles.animWrap,
                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                ]}
            >
                {steps[step]()}
            </Animated.View>
        </OnboardingLayout>
    );
}

// ═══════════════════════════════════════
// STYLES
// ═══════════════════════════════════════
const styles = StyleSheet.create({
    animWrap: {
        flex: 1,
    },
    stepWrap: {
        flex: 1,
        justifyContent: 'space-between',
    },
    centerSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },

    // ── Header extras ──
    restoreBtn: {
        position: 'absolute',
        right: 20,
        zIndex: 10,
    },
    restoreText: {
        fontSize: FontSize.sm,
        fontFamily: FontFamily.medium,
        color: TEXT_MUTED,
    },
    closeBtn: {
        position: 'absolute',
        right: 60,
        zIndex: 10,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(0,0,0,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // ── Titles ──
    title: {
        fontSize: 28,
        fontFamily: FontFamily.bold,
        color: TEXT_PRIMARY,
        textAlign: 'center',
        lineHeight: 36,
        letterSpacing: -0.3,
        marginBottom: 8,
    },
    titleAccent: {
        color: AMBER,
    },
    tagline: {
        fontSize: 11,
        fontFamily: FontFamily.heavy,
        color: AMBER,
        letterSpacing: 1.5,
        textAlign: 'center',
        marginBottom: 24,
    },
    reassurance: {
        fontSize: FontSize.md,
        fontFamily: FontFamily.regular,
        color: TEXT_SECONDARY,
        textAlign: 'center',
        lineHeight: 22,
        marginTop: 28,
    },

    // ── Step 1: Hero ──
    heroCircle: {
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    heroGlow: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: AMBER_DIM,
        borderWidth: 1,
        borderColor: AMBER_GLOW,
    },
    heroLottie: {
        width: 72,
        height: 72,
    },

    // ── Step 1: Feature list card ──
    featureCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        borderColor: 'rgba(245,166,35,0.12)',
        shadowColor: AMBER,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 3,
        overflow: 'hidden',
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    featureRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.04)',
    },
    featureIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: AMBER_DIM,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    featureText: {
        flex: 1,
    },
    featureTitle: {
        fontSize: FontSize.md,
        fontFamily: FontFamily.semibold,
        color: TEXT_PRIMARY,
        marginBottom: 2,
    },
    featureDesc: {
        fontSize: FontSize.sm,
        fontFamily: FontFamily.regular,
        color: TEXT_SECONDARY,
        lineHeight: 18,
    },

    // ── Step 2: Bell ──
    bellContainer: {
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 32,
    },
    bellOuter: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: AMBER_DIM,
    },
    bellInner: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(156,163,137,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bellBadge: {
        position: 'absolute',
        top: 14,
        right: 18,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#E53935',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2.5,
        borderColor: '#F8F9FB',
    },
    bellBadgeText: {
        fontSize: 11,
        fontFamily: FontFamily.bold,
        color: '#FFFFFF',
    },

    // ── Step 3: Timeline card ──
    timelineCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        borderColor: 'rgba(245,166,35,0.12)',
        shadowColor: AMBER,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 3,
        padding: 20,
        marginBottom: 20,
    },
    tlRow: {
        flexDirection: 'row',
    },
    tlLeft: {
        alignItems: 'center',
        width: 32,
        marginRight: 14,
    },
    tlDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tlDotActive: {
        backgroundColor: AMBER,
    },
    tlDotGold: {
        backgroundColor: '#FFB300',
    },
    tlLine: {
        width: 2,
        flex: 1,
        minHeight: 20,
        backgroundColor: AMBER_GLOW,
        marginVertical: 4,
    },
    tlContent: {
        flex: 1,
        paddingBottom: 16,
    },
    tlLabel: {
        fontSize: FontSize.md,
        fontFamily: FontFamily.bold,
        color: TEXT_PRIMARY,
        marginBottom: 3,
    },
    tlDesc: {
        fontSize: FontSize.sm,
        fontFamily: FontFamily.regular,
        color: TEXT_SECONDARY,
        lineHeight: 18,
    },

    // ── Step 3: Plan selector ──
    planRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    planCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: BorderRadius.lg,
        borderWidth: 1.5,
        borderColor: 'rgba(0,0,0,0.06)',
        paddingVertical: 16,
        paddingHorizontal: 12,
        alignItems: 'center',
    },
    planCardSelected: {
        borderColor: AMBER,
        borderWidth: 2,
        shadowColor: AMBER,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 3,
    },
    planBadge: {
        position: 'absolute',
        top: -10,
        backgroundColor: AMBER,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 8,
    },
    planBadgeText: {
        fontSize: 9,
        fontFamily: FontFamily.heavy,
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    planLabel: {
        fontSize: FontSize.sm,
        fontFamily: FontFamily.semibold,
        color: TEXT_MUTED,
        marginBottom: 4,
        marginTop: 4,
    },
    planLabelActive: {
        color: TEXT_PRIMARY,
    },
    planPrice: {
        fontSize: 22,
        fontFamily: FontFamily.heavy,
        color: TEXT_MUTED,
        letterSpacing: -0.5,
    },
    planPriceActive: {
        color: TEXT_PRIMARY,
    },
    planPeriod: {
        fontSize: 12,
        fontFamily: FontFamily.medium,
        color: TEXT_MUTED,
    },
    planCheck: {
        position: 'absolute',
        top: 8,
        right: 8,
    },

    // ── Bottom (shared) ──
    bottomSection: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: 56,
        alignItems: 'center',
    },
    noBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
    },
    noBadgeText: {
        fontSize: 11,
        fontFamily: FontFamily.heavy,
        color: AMBER,
        letterSpacing: 0.8,
    },
    priceNote: {
        fontSize: 12,
        fontFamily: FontFamily.regular,
        color: TEXT_MUTED,
        textAlign: 'center',
        marginTop: 10,
    },
    legalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    legalLink: {
        fontSize: 11,
        fontFamily: FontFamily.medium,
        color: TEXT_MUTED,
        textDecorationLine: 'underline',
    },
    legalDot: {
        fontSize: 11,
        color: TEXT_MUTED,
    },
});
