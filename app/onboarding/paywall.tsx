import { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    ScrollView,
    ActivityIndicator,
    Alert,
    Dimensions,
    Easing,
} from 'react-native';
import { router } from 'expo-router';
import { Check, Zap, Brain, Shield, TrendingUp, Target } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { type PurchasesPackage } from 'react-native-purchases';
import { FontSize, FontFamily } from '../../src/constants/theme';
import { useStore } from '../../src/store/useStore';
import {
    getOfferings,
    purchasePackage,
    restorePurchases,
    checkPremiumStatus,
} from '../../src/services/revenueCat';

const { width: SW, height: SH } = Dimensions.get('window');

// ── COLORS ──
const AMBER = '#E8850C';
const AMBER_DARK = '#E09000';
const BG = '#FBF7F2';
const BG_CARD = '#FFFFFF';
const TEXT = '#1A1A2E';
const TEXT_DIM = '#6B7280';
const TEXT_MUTED = '#9CA3AF';
const BORDER = 'rgba(0,0,0,0.08)';
const GREEN = '#22C55E';

// ── STRUGGLE → PAYWALL PERSONALIZATION ──
const STRUGGLE_HEADLINES: Record<string, string> = {
    screen_time: 'Take back 70 days a year',
    social_media: 'Break the doomscroll cycle',
    focus: 'Train your brain to focus again',
    procrastination: 'Replace procrastination with progress',
    habits: 'Build habits that actually stick',
    brain_training: 'Get sharper every single day',
};

// ── YOUR 4-WEEK JOURNEY ──
const JOURNEY = [
    {
        week: 1,
        title: 'Build the habit',
        outcome: 'One small challenge before your apps unlock. You start choosing when to use your phone instead of reacting on impulse.',
        icon: Zap,
        metric: 'Day 1',
        metricLabel: 'results',
    },
    {
        week: 2,
        title: 'Sharper focus',
        outcome: 'Fewer interruptions means longer, deeper focus sessions. You start getting more done without even trying.',
        icon: Target,
        metric: '+23min',
        metricLabel: 'deep focus',
    },
    {
        week: 3,
        title: 'Better memory',
        outcome: 'Daily cognitive training strengthens your working memory. You recall things faster and think more clearly.',
        icon: Brain,
        metric: '+25%',
        metricLabel: 'memory',
    },
    {
        week: 4,
        title: 'The new normal',
        outcome: 'No more losing evenings to mindless scrolling. You get that time back for sleep, hobbies, and people you care about.',
        icon: TrendingUp,
        metric: '-2h',
        metricLabel: 'daily',
    },
];


// ── VALUE PROPS ──
const VALUE_PROPS = [
    'Unlimited brain-training games',
    'Personalized difficulty scaling',
    'Detailed cognitive stats & trends',
    'Full app-blocking controls',
    'New game modes every month',
];

interface PlanInfo {
    id: string;
    label: string;
    period: string;
    badge?: string;
    pkg: PurchasesPackage | null;
    price: string;
    perDay?: string;
}

export default function PaywallScreen() {
    const { setSubscription, userName, userStruggles } = useStore();

    const [packages, setPackages] = useState<PurchasesPackage[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<string>('yearly');
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);

    // Animations
    const headerAnim = useRef(new Animated.Value(0)).current;
    const glowPulse = useRef(new Animated.Value(1)).current;
    const journeyAnim = useRef(new Animated.Value(0)).current;

    const valuePropsAnim = useRef(new Animated.Value(0)).current;
    const plansSectionAnim = useRef(new Animated.Value(0)).current;
    const planCardAnims = useRef([new Animated.Value(0), new Animated.Value(0)]).current;
    const ctaPulse = useRef(new Animated.Value(1)).current;
    const shimmer = useRef(new Animated.Value(0)).current;
    const metricAnims = useRef(JOURNEY.map(() => new Animated.Value(0))).current;

    useEffect(() => {
        // Header entrance
        Animated.spring(headerAnim, {
            toValue: 1, friction: 8, tension: 60, useNativeDriver: true,
        }).start();

        // Brain icon glow pulse
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowPulse, { toValue: 1.25, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(glowPulse, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();



        // Journey section
        setTimeout(() => {
            Animated.spring(journeyAnim, {
                toValue: 1, friction: 8, tension: 60, useNativeDriver: true,
            }).start();
            // Stagger metric badges
            Animated.stagger(200, metricAnims.map((a) =>
                Animated.spring(a, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true })
            )).start();
        }, 400);

        // Value props
        setTimeout(() => {
            Animated.spring(valuePropsAnim, {
                toValue: 1, friction: 8, tension: 60, useNativeDriver: true,
            }).start();
        }, 600);

        // Plans section
        setTimeout(() => {
            Animated.spring(plansSectionAnim, {
                toValue: 1, friction: 8, tension: 60, useNativeDriver: true,
            }).start();
            Animated.stagger(150, planCardAnims.map((a) =>
                Animated.spring(a, { toValue: 1, friction: 8, tension: 50, useNativeDriver: true })
            )).start();
        }, 800);

        // CTA button glow pulse
        Animated.loop(
            Animated.sequence([
                Animated.timing(ctaPulse, { toValue: 1.03, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(ctaPulse, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();

        // Shimmer on selected plan
        Animated.loop(
            Animated.timing(shimmer, {
                toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true,
            })
        ).start();
    }, []);

    // Fetch offerings
    useEffect(() => {
        (async () => {
            try {
                const offering = await getOfferings();
                if (offering) setPackages(offering.availablePackages);
            } catch (err) {
                console.warn('Failed to load offerings:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const monthlyPkg = packages.find(
        (p) => p.packageType === 'MONTHLY' || p.product.identifier.includes('monthly')
    ) ?? null;
    const yearlyPkg = packages.find(
        (p) => p.packageType === 'ANNUAL' || p.product.identifier.includes('yearly') || p.product.identifier.includes('annual')
    ) ?? null;

    const plans: PlanInfo[] = [
        {
            id: 'yearly',
            label: 'Yearly',
            period: '/year',
            badge: 'MOST POPULAR',
            pkg: yearlyPkg,
            price: yearlyPkg?.product.priceString ?? '$49.99',

        },
        {
            id: 'monthly',
            label: 'Monthly',
            period: '/mo',
            pkg: monthlyPkg,
            price: monthlyPkg?.product.priceString ?? '$9.99',
        },
    ];

    const retryLoadOfferings = async () => {
        setLoading(true);
        try {
            const offering = await getOfferings();
            if (offering) setPackages(offering.availablePackages);
        } catch (err) {
            console.warn('Failed to reload offerings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async () => {
        // Dev-only bypass — skip paywall in development builds
        if (__DEV__) {
            console.warn('⚠️ DEV MODE: Skipping paywall — this does NOT happen in production builds');
            setSubscription(selectedPlan);
            router.push('/onboarding/letsgo');
            return;
        }

        const plan = plans.find((p) => p.id === selectedPlan);
        if (!plan?.pkg) {
            Alert.alert(
                'Unable to load plans',
                'Please check your internet connection and try again.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Retry', onPress: retryLoadOfferings },
                ]
            );
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

    const anim = (a: Animated.Value, ty = 24) => ({
        opacity: a,
        transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [ty, 0] }) }],
    });

    const displayName = userName ? userName.split(' ')[0] : '';
    const primaryStruggle = userStruggles?.[0];
    const personalizedHeadline = primaryStruggle ? STRUGGLE_HEADLINES[primaryStruggle] : null;

    const shimmerTranslate = shimmer.interpolate({
        inputRange: [0, 1],
        outputRange: [-SW, SW],
    });

    return (
        <View style={styles.container}>
            {/* Ambient orbs */}
            <View style={styles.orb1} />
            <View style={styles.orb2} />
            <View style={styles.orb3} />

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ── HEADER ── */}
                <Animated.View style={[styles.header, anim(headerAnim)]}>
                    <View style={styles.brainHeroWrap}>
                        <Animated.View style={[styles.brainGlowRing, { transform: [{ scale: glowPulse }] }]} />
                        <Animated.View style={[styles.brainGlowRing2, { transform: [{ scale: glowPulse }], opacity: glowPulse.interpolate({ inputRange: [1, 1.25], outputRange: [0.5, 0] }) }]} />
                        <LinearGradient
                            colors={[AMBER, '#D4700A']}
                            style={styles.brainCircle}
                        >
                            <Brain size={36} color="#FFFFFF" strokeWidth={2.2} />
                        </LinearGradient>
                    </View>
                    <Text style={styles.headerTitle}>
                        {displayName ? `${displayName}, your plan` : 'Your plan'} is ready
                    </Text>
                    {personalizedHeadline ? (
                        <Text style={styles.headerSub}>
                            {personalizedHeadline}.{'\n'}Here's your 4-week path.
                        </Text>
                    ) : (
                        <Text style={styles.headerSub}>
                            Earn your screen time. Get sharper.{'\n'}Here's what happens in 4 weeks.
                        </Text>
                    )}
                </Animated.View>


                {/* ── JOURNEY TIMELINE ── */}
                <Animated.View style={[styles.journeyCard, anim(journeyAnim)]}>
                    <Text style={styles.journeyLabel}>YOUR 4-WEEK TRANSFORMATION</Text>
                    {JOURNEY.map((step, i) => {
                        const Icon = step.icon;
                        const isLast = i === JOURNEY.length - 1;
                        return (
                            <View key={step.week} style={styles.timelineRow}>
                                {/* Left column: icon + connector */}
                                <View style={styles.timelineLeft}>
                                    <LinearGradient
                                        colors={[`rgba(232,133,12,${0.25 + i * 0.1})`, `rgba(255,107,53,${0.15 + i * 0.08})`]}
                                        style={styles.timelineIcon}
                                    >
                                        <Icon size={16} color={AMBER} />
                                    </LinearGradient>
                                    {!isLast && <View style={styles.timelineLine} />}
                                </View>
                                {/* Right column: text + metric badge */}
                                <View style={styles.timelineRight}>
                                    <View style={styles.timelineHeaderRow}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.timelineWeek}>Week {step.week}</Text>
                                            <Text style={styles.timelineTitle}>{step.title}</Text>
                                        </View>
                                        <Animated.View style={[{
                                            transform: [{
                                                scale: metricAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
                                            }],
                                            opacity: metricAnims[i],
                                            marginLeft: 8,
                                        }]}>
                                            <LinearGradient
                                                colors={[AMBER, '#D4700A']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={styles.metricBadge}
                                            >
                                                <Text style={styles.metricValue}>{step.metric}</Text>
                                                <Text style={styles.metricLabel}>{step.metricLabel}</Text>
                                            </LinearGradient>
                                        </Animated.View>
                                    </View>
                                    <Text style={styles.timelineOutcome}>{step.outcome}</Text>
                                </View>
                            </View>
                        );
                    })}
                </Animated.View>

                {/* ── VALUE PROPS ── */}
                <Animated.View style={[styles.valuePropsCard, anim(valuePropsAnim)]}>
                    <Text style={styles.valuePropsTitle}>Everything you get</Text>
                    {VALUE_PROPS.map((prop, i) => (
                        <View key={i} style={styles.valuePropRow}>
                            <View style={styles.checkCircle}>
                                <Check size={12} color="#FFFFFF" strokeWidth={3} />
                            </View>
                            <Text style={styles.valuePropText}>{prop}</Text>
                        </View>
                    ))}
                </Animated.View>

                {/* ── PLANS ── */}
                <Animated.View style={[styles.plansSection, anim(plansSectionAnim)]}>
                    <Text style={styles.plansLabel}>CHOOSE YOUR PLAN</Text>
                    {loading ? (
                        <ActivityIndicator color={AMBER} style={{ paddingVertical: 40 }} />
                    ) : (
                        <View style={styles.plansStack}>
                            {/* ── YEARLY (recommended) ── */}
                            <Animated.View style={anim(planCardAnims[0], 16)}>
                                <TouchableOpacity
                                    style={[styles.planRow, selectedPlan === 'yearly' ? styles.planRowSel : styles.planRowDefault]}
                                    onPress={() => setSelectedPlan('yearly')}
                                    activeOpacity={0.8}
                                >
                                    {/* Shimmer overlay on selected */}
                                    {selectedPlan === 'yearly' && (
                                        <Animated.View style={[styles.planShimmer, {
                                            transform: [{ translateX: shimmerTranslate }],
                                        }]} />
                                    )}
                                    <View style={[styles.planRadio, selectedPlan === 'yearly' && styles.planRadioSel]}>
                                        {selectedPlan === 'yearly' && <View style={styles.planRadioDot} />}
                                    </View>
                                    <View style={styles.planInfo}>
                                        <View style={styles.planNameRow}>
                                            <Text style={[styles.planName, selectedPlan === 'yearly' && styles.planNameSel]}>Yearly</Text>
                                            <LinearGradient
                                                colors={[AMBER, '#FF8C00']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={styles.planBadge}
                                            >
                                                <Text style={styles.planBadgeText}>SAVE 58%</Text>
                                            </LinearGradient>
                                        </View>
                                        <Text style={styles.planTrial}>3-day free trial</Text>
                                    </View>
                                    <View style={styles.planPriceWrap}>
                                        <Text style={[styles.planPriceMain, selectedPlan === 'yearly' && styles.planPriceMainSel]}>{plans[0].price}</Text>
                                        <Text style={styles.planPricePeriod}>/year</Text>
                                    </View>
                                </TouchableOpacity>

                            </Animated.View>

                            {/* ── MONTHLY ── */}
                            <Animated.View style={anim(planCardAnims[1], 16)}>
                                <TouchableOpacity
                                    style={[styles.planRow, selectedPlan === 'monthly' ? styles.planRowSel : styles.planRowDefault]}
                                    onPress={() => setSelectedPlan('monthly')}
                                    activeOpacity={0.8}
                                >
                                    <View style={[styles.planRadio, selectedPlan === 'monthly' && styles.planRadioSel]}>
                                        {selectedPlan === 'monthly' && <View style={styles.planRadioDot} />}
                                    </View>
                                    <View style={styles.planInfo}>
                                        <Text style={[styles.planName, selectedPlan === 'monthly' && styles.planNameSel]}>Monthly</Text>
                                        <Text style={styles.planTrial}>3-day free trial</Text>
                                    </View>
                                    <View style={styles.planPriceWrap}>
                                        <Text style={[styles.planPriceMain, selectedPlan === 'monthly' && styles.planPriceMainSel]}>{plans[1].price}</Text>
                                        <Text style={styles.planPricePeriod}>/mo</Text>
                                    </View>
                                </TouchableOpacity>
                            </Animated.View>
                        </View>
                    )}
                </Animated.View>

                <View style={{ height: 16 }} />
            </ScrollView>

            {/* ── STICKY CTA ── */}
            <View style={styles.stickyWrap}>
                <LinearGradient
                    colors={['rgba(251,247,242,0)', 'rgba(251,247,242,0.95)', BG]}
                    style={styles.stickyGradient}
                    pointerEvents="none"
                />
                <View style={styles.stickyInner}>
                    <Animated.View style={{ width: '100%', transform: [{ scale: ctaPulse }] }}>
                        <TouchableOpacity
                            style={styles.ctaBtn}
                            onPress={handlePurchase}
                            activeOpacity={0.85}
                            disabled={purchasing}
                        >
                            <LinearGradient
                                colors={[AMBER, '#D4700A']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.ctaBtnInner}
                            >
                                <Text style={styles.ctaBtnText}>
                                    {purchasing ? 'Processing...' : 'Start Your Free Trial'}
                                </Text>
                                {!purchasing && (
                                    <Text style={styles.ctaBtnSub}>No charge for 3 days · Cancel anytime</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                    <TouchableOpacity onPress={handleRestore} disabled={purchasing} style={styles.restoreBtn}>
                        <Text style={styles.restoreText}>Restore purchase</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BG,
    },

    // Ambient orbs
    orb1: {
        position: 'absolute', top: -80, left: -100,
        width: 300, height: 300, borderRadius: 150,
        backgroundColor: 'rgba(232,133,12,0.10)',
    },
    orb2: {
        position: 'absolute', bottom: SH * 0.15, right: -100,
        width: 340, height: 340, borderRadius: 170,
        backgroundColor: 'rgba(255,107,53,0.08)',
    },
    orb3: {
        position: 'absolute', top: SH * 0.4, left: -60,
        width: 220, height: 220, borderRadius: 110,
        backgroundColor: 'rgba(232,133,12,0.07)',
    },

    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 180 },

    // ── HEADER ──
    header: {
        alignItems: 'center',
        paddingTop: 64,
        paddingHorizontal: 32,
        paddingBottom: 8,
    },
    brainHeroWrap: {
        width: 100, height: 100,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 24,
    },
    brainGlowRing: {
        position: 'absolute',
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: 'rgba(232,133,12,0.15)',
    },
    brainGlowRing2: {
        position: 'absolute',
        width: 130, height: 130, borderRadius: 65,
        backgroundColor: 'rgba(232,133,12,0.08)',
    },
    brainCircle: {
        width: 70, height: 70, borderRadius: 35,
        justifyContent: 'center', alignItems: 'center',
        shadowColor: AMBER,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 10,
    },
    headerTitle: {
        fontSize: 26,
        fontFamily: FontFamily.bold,
        color: TEXT,
        textAlign: 'center',
        letterSpacing: -0.5,
        lineHeight: 32,
        marginBottom: 8,
    },
    headerSub: {
        fontSize: 15,
        fontFamily: FontFamily.regular,
        color: TEXT_DIM,
        textAlign: 'center',
        lineHeight: 22,
    },


    // ── JOURNEY TIMELINE ──
    journeyCard: {
        marginTop: 24,
        marginHorizontal: 20,
        backgroundColor: BG_CARD,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: BORDER,
        padding: 24,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    journeyLabel: {
        fontSize: 11,
        fontFamily: FontFamily.heavy,
        color: AMBER,
        letterSpacing: 1.5,
        marginBottom: 20,
        textAlign: 'center',
    },
    timelineRow: {
        flexDirection: 'row',
    },
    timelineLeft: {
        alignItems: 'center',
        width: 40,
        marginRight: 14,
    },
    timelineIcon: {
        width: 36, height: 36, borderRadius: 18,
        justifyContent: 'center', alignItems: 'center',
    },
    timelineLine: {
        width: 2,
        flex: 1,
        backgroundColor: 'rgba(232,133,12,0.18)',
        marginVertical: 4,
    },
    timelineRight: {
        flex: 1,
        paddingBottom: 24,
    },
    timelineHeaderRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    timelineWeek: {
        fontSize: 10,
        fontFamily: FontFamily.bold,
        color: AMBER,
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    timelineTitle: {
        fontSize: 17,
        fontFamily: FontFamily.bold,
        color: TEXT,
        letterSpacing: -0.3,
        marginBottom: 4,
    },
    timelineOutcome: {
        fontSize: 13,
        fontFamily: FontFamily.regular,
        color: TEXT_DIM,
        lineHeight: 19,
    },

    // Metric badges
    metricBadge: {
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        alignItems: 'center',
        minWidth: 64,
        shadowColor: AMBER,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    metricValue: {
        fontSize: 15,
        fontFamily: FontFamily.heavy,
        color: '#FFFFFF',
        letterSpacing: -0.3,
    },
    metricLabel: {
        fontSize: 9,
        fontFamily: FontFamily.semibold,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 1,
    },

    // ── VALUE PROPS ──
    valuePropsCard: {
        marginHorizontal: 20,
        backgroundColor: BG_CARD,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: BORDER,
        padding: 24,
        marginBottom: 24,
    },
    valuePropsTitle: {
        fontSize: 16,
        fontFamily: FontFamily.bold,
        color: TEXT,
        marginBottom: 16,
    },
    valuePropRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    checkCircle: {
        width: 22, height: 22, borderRadius: 11,
        backgroundColor: GREEN,
        justifyContent: 'center', alignItems: 'center',
    },
    valuePropText: {
        fontSize: 14,
        fontFamily: FontFamily.medium,
        color: TEXT,
        flex: 1,
    },

    // ── PLANS ──
    plansSection: {
        marginBottom: 16,
    },
    plansLabel: {
        fontSize: 11,
        fontFamily: FontFamily.heavy,
        color: TEXT_MUTED,
        letterSpacing: 1.5,
        marginBottom: 16,
        textAlign: 'center',
    },
    plansStack: {
        paddingHorizontal: 20,
        gap: 10,
    },
    planRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 16,
        gap: 14,
        overflow: 'hidden',
    },
    planRowDefault: {
        backgroundColor: BG_CARD,
        borderWidth: 1.5,
        borderColor: BORDER,
    },
    planRowSel: {
        backgroundColor: 'rgba(232,133,12,0.06)',
        borderWidth: 2,
        borderColor: AMBER,
        shadowColor: AMBER,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.22,
        shadowRadius: 20,
        elevation: 6,
    },
    planShimmer: {
        position: 'absolute',
        top: 0, left: 0, bottom: 0,
        width: 80,
        backgroundColor: 'rgba(255,255,255,0.15)',
        transform: [{ skewX: '-20deg' }],
    },
    planRadio: {
        width: 22, height: 22, borderRadius: 11,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        justifyContent: 'center', alignItems: 'center',
    },
    planRadioSel: {
        borderColor: AMBER,
        backgroundColor: AMBER,
    },
    planRadioDot: {
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: '#FFFFFF',
    },
    planInfo: {
        flex: 1,
    },
    planNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 3,
    },
    planName: {
        fontSize: 16,
        fontFamily: FontFamily.bold,
        color: TEXT,
    },
    planNameSel: {
        color: TEXT,
    },
    planBadge: {
        paddingHorizontal: 8, paddingVertical: 2,
        borderRadius: 6,
    },
    planBadgeText: {
        fontSize: 9,
        fontFamily: FontFamily.heavy,
        color: '#FFFFFF',
        letterSpacing: 0.8,
    },
    planTrial: {
        fontSize: 12,
        fontFamily: FontFamily.medium,
        color: TEXT_DIM,
    },
    planPriceWrap: {
        alignItems: 'flex-end',
    },
    planPriceMain: {
        fontSize: 22,
        fontFamily: FontFamily.heavy,
        color: TEXT,
        letterSpacing: -0.5,
    },
    planPriceMainSel: {
        color: AMBER,
    },
    planPricePeriod: {
        fontSize: 12,
        fontFamily: FontFamily.medium,
        color: TEXT_MUTED,
        marginTop: -2,
    },


    // ── STICKY CTA ──
    stickyWrap: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
    },
    stickyGradient: {
        height: 32,
    },
    stickyInner: {
        backgroundColor: BG,
        paddingHorizontal: 20,
        paddingBottom: 36,
        alignItems: 'center',
    },
    ctaBtn: {
        width: '100%',
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: AMBER,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 22,
        elevation: 12,
    },
    ctaBtnInner: {
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
    },
    ctaBtnText: {
        fontSize: 17,
        fontFamily: FontFamily.bold,
        color: '#0A0A0F',
        letterSpacing: 0.3,
    },
    ctaBtnSub: {
        fontSize: 12,
        fontFamily: FontFamily.medium,
        color: 'rgba(10,10,15,0.5)',
        marginTop: 2,
    },
    restoreBtn: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        marginTop: 6,
    },
    restoreText: {
        fontSize: 13,
        fontFamily: FontFamily.medium,
        color: TEXT_MUTED,
    },
});
