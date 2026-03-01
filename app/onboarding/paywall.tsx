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
} from 'react-native';
import { router } from 'expo-router';
import { Check, Zap, Brain, Shield, TrendingUp } from 'lucide-react-native';
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

// ── COLORS (Warm light) ──
const AMBER = '#F5A623';
const AMBER_DARK = '#E09000';
const BG = '#FBF7F2';
const BG_CARD = '#FFFFFF';
const TEXT = '#1A1A2E';
const TEXT_DIM = '#6B7280';
const TEXT_MUTED = '#9CA3AF';
const BORDER = 'rgba(0,0,0,0.08)';

// ── STRUGGLE → PAYWALL PERSONALIZATION ──
const STRUGGLE_HEADLINES: Record<string, string> = {
    screen_time: 'Take back 70 days a year',
    social_media: 'Break the doomscroll cycle',
    focus: 'Train your brain to focus again',
    procrastination: 'Replace procrastination with progress',
    habits: 'Build habits that actually stick',
    brain_training: 'Get sharper every single day',
};

// ── COMPACT JOURNEY DATA ──
const JOURNEY = [
    { week: 1, title: 'Build the habit', outcome: 'Challenges before apps — effort becomes reward', icon: Zap },
    { week: 2, title: 'Feel the friction', outcome: 'Mindless pickups drop, you notice impulses', icon: Shield },
    { week: 3, title: 'Getting sharper', outcome: 'Memory and focus visibly improve', icon: Brain },
    { week: 4, title: 'The new normal', outcome: 'Your phone is a tool again, not a crutch', icon: TrendingUp },
];

interface PlanInfo {
    id: string;
    label: string;
    period: string;
    badge?: string;
    pkg: PurchasesPackage | null;
    price: string;
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
    const plansSectionAnim = useRef(new Animated.Value(0)).current;
    const planCardAnims = useRef([new Animated.Value(0), new Animated.Value(0)]).current;

    useEffect(() => {
        Animated.spring(headerAnim, {
            toValue: 1, friction: 8, tension: 60, useNativeDriver: true,
        }).start();

        // Pulsing glow on brain icon
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowPulse, { toValue: 1.18, duration: 1500, useNativeDriver: true }),
                Animated.timing(glowPulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
            ])
        ).start();

        setTimeout(() => {
            Animated.spring(journeyAnim, {
                toValue: 1, friction: 8, tension: 60, useNativeDriver: true,
            }).start();
        }, 300);

        setTimeout(() => {
            Animated.spring(plansSectionAnim, {
                toValue: 1, friction: 8, tension: 60, useNativeDriver: true,
            }).start();
            Animated.stagger(150, planCardAnims.map((a) =>
                Animated.spring(a, { toValue: 1, friction: 8, tension: 50, useNativeDriver: true })
            )).start();
        }, 600);
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

    const weeklyPkg = packages.find(
        (p) => p.packageType === 'MONTHLY' || p.product.identifier.includes('monthly')
    ) ?? null;
    const lifetimePkg = packages.find(
        (p) => p.packageType === 'ANNUAL' || p.product.identifier.includes('yearly') || p.product.identifier.includes('annual')
    ) ?? null;

    const plans: PlanInfo[] = [
        {
            id: 'weekly',
            label: 'Monthly',
            period: '/mo',
            pkg: weeklyPkg,
            price: weeklyPkg?.product.priceString ?? '$9.99',
        },
        {
            id: 'yearly',
            label: 'Lifetime',
            period: '/year',
            badge: 'BEST VALUE',
            pkg: lifetimePkg,
            price: lifetimePkg?.product.priceString ?? '$49.99',
        },
    ];

    const handlePurchase = async () => {
        const plan = plans.find((p) => p.id === selectedPlan);
        if (!plan?.pkg) {
            setSubscription(selectedPlan);
            router.push('/onboarding/letsgo');
            return;
        }
        setPurchasing(true);
        try {
            const customerInfo = await purchasePackage(plan.pkg);
            if (checkPremiumStatus(customerInfo)) setSubscription(plan.id);
            router.push('/onboarding/letsgo');
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
                        <LinearGradient
                            colors={[AMBER, '#FF6B35']}
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
                            Here's what changes when you{'\n'}start training before scrolling
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
                                        colors={[`rgba(245,166,35,${0.25 + i * 0.08})`, `rgba(255,107,53,${0.15 + i * 0.06})`]}
                                        style={styles.timelineIcon}
                                    >
                                        <Icon size={16} color={AMBER} />
                                    </LinearGradient>
                                    {!isLast && <View style={styles.timelineLine} />}
                                </View>
                                {/* Right column: text */}
                                <View style={styles.timelineRight}>
                                    <Text style={styles.timelineWeek}>Week {step.week}</Text>
                                    <Text style={styles.timelineTitle}>{step.title}</Text>
                                    <Text style={styles.timelineOutcome}>{step.outcome}</Text>
                                </View>
                            </View>
                        );
                    })}
                </Animated.View>

                {/* ── PLANS ── */}
                <Animated.View style={[styles.plansSection, anim(plansSectionAnim)]}>
                    <Text style={styles.plansLabel}>CHOOSE YOUR PLAN</Text>
                    {loading ? (
                        <ActivityIndicator color={AMBER} style={{ paddingVertical: 40 }} />
                    ) : (
                        <View style={styles.plansStack}>
                            {/* ── YEARLY ── */}
                            <Animated.View style={anim(planCardAnims[0], 16)}>
                                <TouchableOpacity
                                    style={[styles.planRow, selectedPlan === 'yearly' ? styles.planRowSel : styles.planRowDefault]}
                                    onPress={() => setSelectedPlan('yearly')}
                                    activeOpacity={0.8}
                                >
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
                                        <Text style={[styles.planPriceMain, selectedPlan === 'yearly' && styles.planPriceMainSel]}>$4.17</Text>
                                        <Text style={styles.planPricePeriod}>/mo</Text>
                                    </View>
                                </TouchableOpacity>
                            </Animated.View>

                            {/* ── MONTHLY ── */}
                            <Animated.View style={anim(planCardAnims[1], 16)}>
                                <TouchableOpacity
                                    style={[styles.planRow, selectedPlan === 'weekly' ? styles.planRowSel : styles.planRowDefault]}
                                    onPress={() => setSelectedPlan('weekly')}
                                    activeOpacity={0.8}
                                >
                                    <View style={[styles.planRadio, selectedPlan === 'weekly' && styles.planRadioSel]}>
                                        {selectedPlan === 'weekly' && <View style={styles.planRadioDot} />}
                                    </View>
                                    <View style={styles.planInfo}>
                                        <Text style={[styles.planName, selectedPlan === 'weekly' && styles.planNameSel]}>Monthly</Text>
                                        <Text style={styles.planTrial}>3-day free trial</Text>
                                    </View>
                                    <View style={styles.planPriceWrap}>
                                        <Text style={[styles.planPriceMain, selectedPlan === 'weekly' && styles.planPriceMainSel]}>$9.99</Text>
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
                    <TouchableOpacity
                        style={styles.ctaBtn}
                        onPress={handlePurchase}
                        activeOpacity={0.85}
                    >
                        <LinearGradient
                            colors={[AMBER, '#FF6B35']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.ctaBtnInner}
                        >
                            <Text style={styles.ctaBtnText}>
                                {purchasing ? 'Processing...' : 'Start Your Free Trial'}
                            </Text>
                            {!purchasing && (
                                <Text style={styles.ctaBtnSub}>No charge for 3 days. Cancel anytime.</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                    <View style={styles.ctaLinksRow}>
                        <TouchableOpacity onPress={handleRestore} disabled={purchasing} style={styles.ctaLink}>
                            <Text style={styles.ctaLinkText}>Restore purchase</Text>
                        </TouchableOpacity>
                        <View style={styles.ctaDot} />
                        <TouchableOpacity onPress={() => router.push('/onboarding/letsgo')} style={styles.ctaLink}>
                            <Text style={styles.ctaLinkTextDim}>Maybe later</Text>
                        </TouchableOpacity>
                    </View>
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

    // Ambient orbs — warm and subtle on light
    orb1: {
        position: 'absolute', top: -80, left: -100,
        width: 300, height: 300, borderRadius: 150,
        backgroundColor: 'rgba(245,166,35,0.10)',
    },
    orb2: {
        position: 'absolute', bottom: SH * 0.15, right: -100,
        width: 340, height: 340, borderRadius: 170,
        backgroundColor: 'rgba(255,107,53,0.08)',
    },
    orb3: {
        position: 'absolute', top: SH * 0.4, left: -60,
        width: 220, height: 220, borderRadius: 110,
        backgroundColor: 'rgba(245,166,35,0.07)',
    },

    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 160 },

    // ── HEADER ──
    header: {
        alignItems: 'center',
        paddingTop: 64,
        paddingHorizontal: 32,
        paddingBottom: 8,
    },
    brainHeroWrap: {
        width: 96, height: 96,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 24,
    },
    brainGlowRing: {
        position: 'absolute',
        width: 96, height: 96, borderRadius: 48,
        backgroundColor: 'rgba(245,166,35,0.12)',
    },
    brainCircle: {
        width: 68, height: 68, borderRadius: 34,
        justifyContent: 'center', alignItems: 'center',
        shadowColor: AMBER,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 18,
        elevation: 8,
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
        marginTop: 32,
        marginHorizontal: 20,
        backgroundColor: BG_CARD,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: BORDER,
        padding: 24,
        marginBottom: 32,
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
        backgroundColor: 'rgba(245,166,35,0.18)',
        marginVertical: 4,
    },
    timelineRight: {
        flex: 1,
        paddingBottom: 24,
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
    },
    planRowDefault: {
        backgroundColor: BG_CARD,
        borderWidth: 1.5,
        borderColor: BORDER,
    },
    planRowSel: {
        backgroundColor: 'rgba(245,166,35,0.06)',
        borderWidth: 2,
        borderColor: AMBER,
        shadowColor: AMBER,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
        elevation: 4,
    },
    planRadio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    planRadioSel: {
        borderColor: AMBER,
        backgroundColor: AMBER,
    },
    planRadioDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
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
        paddingHorizontal: 8,
        paddingVertical: 2,
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
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 18,
        elevation: 10,
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
    ctaLinksRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        gap: 8,
    },
    ctaLink: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 4,
    },
    ctaLinkText: {
        fontSize: 13,
        fontFamily: FontFamily.medium,
        color: TEXT_MUTED,
    },
    ctaLinkTextDim: {
        fontSize: 12,
        fontFamily: FontFamily.regular,
        color: '#C4C4C4',
    },
    ctaDot: {
        width: 3, height: 3, borderRadius: 1.5,
        backgroundColor: '#D1D5DB',
    },
});
