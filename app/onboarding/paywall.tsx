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
import { Check, RotateCcw, Zap, Brain, Shield, TrendingUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { type PurchasesPackage } from 'react-native-purchases';
import LottieView from 'lottie-react-native';
import { FontSize, FontFamily } from '../../src/constants/theme';
import { useStore } from '../../src/store/useStore';
import {
    getOfferings,
    purchasePackage,
    restorePurchases,
    checkPremiumStatus,
} from '../../src/services/revenueCat';

const { width: SW, height: SH } = Dimensions.get('window');
const AMBER = '#F5A623';
const AMBER_DARK = '#E09000';
const AMBER_DIM = 'rgba(245,166,35,0.08)';
const AMBER_GLOW = 'rgba(245,166,35,0.20)';
const TEXT = '#1A1A2E';
const MUTED = '#9CA3AF';
const SECONDARY = '#6B7280';
const BG = '#F8F9FB';

// ── WEEK JOURNEY DATA ──
interface WeekData {
    week: number;
    title: string;
    desc: string;
    points: string[];
    accent: string;
    bg: string;
    icon: React.ReactNode;
}

const WEEKS: WeekData[] = [
    {
        week: 1,
        title: 'Build the habit',
        desc: 'Your brain starts associating effort with reward',
        points: [
            'Quick challenges before opening apps',
            'You earn your screen time, not just get it',
            'The pause before scrolling becomes natural',
        ],
        accent: AMBER,
        bg: 'rgba(245,166,35,0.06)',
        icon: <Zap size={20} color={AMBER} />,
    },
    {
        week: 2,
        title: 'Feel the friction',
        desc: 'A healthy buffer forms between impulse and action',
        points: [
            'Mindless phone pickups start to drop',
            'You notice when you reach for apps out of boredom',
            'Focus comes a little easier each day',
        ],
        accent: '#8B5CF6',
        bg: 'rgba(139,92,246,0.06)',
        icon: <Shield size={20} color="#8B5CF6" />,
    },
    {
        week: 3,
        title: 'Getting sharper',
        desc: 'The brain games themselves start feeling easier',
        points: [
            'Your memory and reaction time visibly improve',
            'Screen time is more intentional, less impulsive',
            'You start choosing what deserves your attention',
        ],
        accent: '#3B82F6',
        bg: 'rgba(59,130,246,0.06)',
        icon: <Brain size={20} color="#3B82F6" />,
    },
    {
        week: 4,
        title: 'The new normal',
        desc: "You won't magically stop using your phone \u2014 but you'll use it on your terms",
        points: [
            'Scrolling less feels normal, not forced',
            'You\'re proud of the streak you\'ve built',
            'Your phone is a tool again, not a crutch',
        ],
        accent: '#10B981',
        bg: 'rgba(16,185,129,0.06)',
        icon: <TrendingUp size={20} color="#10B981" />,
    },
];

// ── WITHOUT / WITH COMPARISON ──
const WITHOUT_ITEMS = [
    { icon: '📱', text: 'Open apps on autopilot, scroll for hours' },
    { icon: '😶', text: 'Feel guilty after, promise to stop tomorrow' },
    { icon: '🧠', text: 'Attention span gets shorter every month' },
    { icon: '🔁', text: 'Same cycle, no friction, nothing changes' },
];

const WITH_ITEMS = [
    { icon: '🔒', text: 'A quick challenge before you open distracting apps' },
    { icon: '💡', text: 'Your brain gets a workout instead of junk food' },
    { icon: '📈', text: 'Memory and focus improve week over week' },
    { icon: '⏱️', text: 'Screen time you actually earned feels different' },
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
    const { setSubscription, userName } = useStore();

    const [packages, setPackages] = useState<PurchasesPackage[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<string>('yearly');
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);
    const [showWith, setShowWith] = useState(false);

    // Animations
    const headerAnim = useRef(new Animated.Value(0)).current;
    const weekAnims = useRef(WEEKS.map(() => new Animated.Value(0))).current;
    const compareAnim = useRef(new Animated.Value(0)).current;
    const plansSectionAnim = useRef(new Animated.Value(0)).current;
    const planCardAnims = useRef([new Animated.Value(0), new Animated.Value(0)]).current;

    useEffect(() => {
        Animated.spring(headerAnim, {
            toValue: 1, friction: 8, tension: 60, useNativeDriver: true,
        }).start();

        // Stagger week cards
        setTimeout(() => {
            Animated.stagger(100, weekAnims.map((a) =>
                Animated.spring(a, { toValue: 1, friction: 8, tension: 60, useNativeDriver: true })
            )).start();
        }, 200);

        setTimeout(() => {
            Animated.spring(compareAnim, {
                toValue: 1, friction: 8, tension: 60, useNativeDriver: true,
            }).start();
        }, 600);

        setTimeout(() => {
            Animated.spring(plansSectionAnim, {
                toValue: 1, friction: 8, tension: 60, useNativeDriver: true,
            }).start();
            Animated.stagger(150, planCardAnims.map((a) =>
                Animated.spring(a, { toValue: 1, friction: 8, tension: 50, useNativeDriver: true })
            )).start();
        }, 800);
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

    // Resolve live packages from RevenueCat, falling back to hardcoded display values
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
                    <View style={styles.checkBadge}>
                        <LottieView
                            source={require('../../assets/animations/success.json')}
                            autoPlay
                            loop={false}
                            style={{ width: 56, height: 56 }}
                        />
                    </View>
                    <Text style={styles.headerTitle}>
                        {displayName ? `${displayName}, your plan` : 'Your plan'} is ready
                    </Text>
                    <Text style={styles.headerSub}>
                        Here's what actually happens when you{'\n'}start training before scrolling
                    </Text>
                </Animated.View>

                {/* ── JOURNEY ── */}
                <View style={styles.journeySection}>
                    <Text style={styles.sectionLabel}>YOUR 4-WEEK JOURNEY</Text>

                    {WEEKS.map((w, i) => (
                        <Animated.View key={w.week} style={[styles.weekCard, { backgroundColor: w.bg }, anim(weekAnims[i])]}>
                            <View style={styles.weekHeader}>
                                <View style={[styles.weekIconWrap, { backgroundColor: w.bg }]}>
                                    {w.icon}
                                </View>
                                <View style={styles.weekHeaderText}>
                                    <Text style={styles.weekNum}>Week {w.week}</Text>
                                    <Text style={styles.weekTitle}>{w.title}</Text>
                                </View>
                            </View>
                            <Text style={styles.weekDesc}>{w.desc}</Text>
                            {w.points.map((p, j) => (
                                <View key={j} style={styles.weekPointRow}>
                                    <View style={[styles.weekDot, { backgroundColor: w.accent }]} />
                                    <Text style={styles.weekPointText}>{p}</Text>
                                </View>
                            ))}
                        </Animated.View>
                    ))}
                </View>

                {/* ── HONEST NOTE & BEFORE/AFTER HIDDEN FOR SIMPLICITY ── */}

                {/* ── PLANS ── */}
                <Animated.View style={[styles.plansSection, anim(plansSectionAnim)]}>
                    <Text style={[styles.sectionLabel, { textAlign: 'center', paddingHorizontal: 0 }]}>CHOOSE YOUR PLAN</Text>
                    {loading ? (
                        <ActivityIndicator color={AMBER} style={{ paddingVertical: 40 }} />
                    ) : (
                        <View style={styles.plansRow}>
                            {/* ── YEARLY ── */}
                            {(() => {
                                const sel = selectedPlan === 'yearly';
                                return (
                                    <Animated.View style={{ flex: 1, ...anim(planCardAnims[0], 20) }}>
                                        <TouchableOpacity
                                            style={[styles.planCard, sel ? styles.planCardSel : styles.planCardDefault]}
                                            onPress={() => setSelectedPlan('yearly')}
                                            activeOpacity={0.8}
                                        >
                                            {/* Best value badge */}
                                            <LinearGradient
                                                colors={[AMBER, '#FF8C00']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={styles.planBadge}
                                            >
                                                <Text style={styles.planBadgeText}>BEST VALUE</Text>
                                            </LinearGradient>

                                            <Text style={[styles.planLabel, sel && styles.planLabelSel]}>Yearly</Text>

                                            <View style={styles.planPriceRow}>
                                                <Text style={[styles.planCurrency, sel && styles.planCurrencySel]}>$</Text>
                                                <Text style={[styles.planPrice, sel && styles.planPriceSel]}>4.17</Text>
                                                <Text style={styles.planPeriod}>/mo</Text>
                                            </View>

                                            {/* Savings callout */}
                                            <View style={styles.savingsRow}>
                                                <Text style={styles.savingsStrike}>$9.99</Text>
                                                <View style={styles.savingsBadge}>
                                                    <Text style={styles.savingsBadgeText}>Save 58%</Text>
                                                </View>
                                            </View>

                                            <View style={[styles.trialPill, sel && styles.trialPillSel]}>
                                                <Text style={[styles.trialPillText, sel && styles.trialPillTextSel]}>3-day free trial</Text>
                                            </View>

                                            {/* Radio */}
                                            <View style={[styles.planRadio, sel && styles.planRadioSel]}>
                                                {sel && <View style={styles.planRadioDot} />}
                                            </View>
                                        </TouchableOpacity>
                                    </Animated.View>
                                );
                            })()}

                            {/* ── MONTHLY ── */}
                            {(() => {
                                const sel = selectedPlan === 'weekly';
                                return (
                                    <Animated.View style={{ flex: 1, ...anim(planCardAnims[1], 20) }}>
                                        <TouchableOpacity
                                            style={[styles.planCard, sel ? styles.planCardSel : styles.planCardDefault]}
                                            onPress={() => setSelectedPlan('weekly')}
                                            activeOpacity={0.8}
                                        >
                                            {/* Empty badge spacer to align with yearly */}
                                            <View style={styles.planBadgeSpacer} />

                                            <Text style={[styles.planLabel, sel && styles.planLabelSel]}>Monthly</Text>

                                            <View style={styles.planPriceRow}>
                                                <Text style={[styles.planCurrency, sel && styles.planCurrencySel]}>$</Text>
                                                <Text style={[styles.planPrice, sel && styles.planPriceSel]}>9.99</Text>
                                                <Text style={styles.planPeriod}>/mo</Text>
                                            </View>

                                            {/* Spacer to align with savings row */}
                                            <View style={styles.savingsRowSpacer} />

                                            <View style={[styles.trialPill, sel && styles.trialPillSel]}>
                                                <Text style={[styles.trialPillText, sel && styles.trialPillTextSel]}>3-day free trial</Text>
                                            </View>

                                            {/* Radio */}
                                            <View style={[styles.planRadio, sel && styles.planRadioSel]}>
                                                {sel && <View style={styles.planRadioDot} />}
                                            </View>
                                        </TouchableOpacity>
                                    </Animated.View>
                                );
                            })()}
                        </View>
                    )}
                </Animated.View>

                {/* spacer for sticky CTA */}
                <View style={{ height: 16 }} />
            </ScrollView>

            {/* ── STICKY CTA ── */}
            <View style={styles.stickyWrap}>
                <LinearGradient
                    colors={['rgba(248,249,251,0)', 'rgba(248,249,251,0.95)', BG]}
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
                                {purchasing
                                    ? 'Processing...'
                                    : selectedPlan === 'yearly'
                                        ? 'Try Yearly Free for 3 Days'
                                        : 'Try Monthly Free for 3 Days'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                    <View style={styles.ctaLinksRow}>
                        <TouchableOpacity onPress={handleRestore} disabled={purchasing} style={styles.ctaLink}>
                            <RotateCcw size={11} color={MUTED} style={{ marginRight: 4 }} />
                            <Text style={styles.ctaLinkText}>Restore</Text>
                        </TouchableOpacity>
                        <View style={styles.ctaDot} />
                        <TouchableOpacity onPress={() => router.push('/onboarding/letsgo')} style={styles.ctaLink}>
                            <Text style={styles.ctaLinkText}>Continue free</Text>
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

    // Ambient orbs
    orb1: {
        position: 'absolute', top: -40, left: -60,
        width: 240, height: 240, borderRadius: 120,
        backgroundColor: 'rgba(245,166,35,0.06)',
    },
    orb2: {
        position: 'absolute', bottom: SH * 0.12, right: -80,
        width: 300, height: 300, borderRadius: 150,
        backgroundColor: 'rgba(245,166,35,0.05)',
    },
    orb3: {
        position: 'absolute', top: SH * 0.4, left: -40,
        width: 160, height: 160, borderRadius: 80,
        backgroundColor: 'rgba(255,107,53,0.03)',
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
    checkBadge: {
        width: 64, height: 64, borderRadius: 32,
        backgroundColor: AMBER_DIM,
        borderWidth: 1.5, borderColor: AMBER_GLOW,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 20,
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
        color: SECONDARY,
        textAlign: 'center',
        lineHeight: 22,
    },

    // ── SECTION LABEL ──
    sectionLabel: {
        fontSize: 11,
        fontFamily: FontFamily.heavy,
        color: MUTED,
        letterSpacing: 1.5,
        marginBottom: 16,
        paddingHorizontal: 24,
    },

    // ── JOURNEY ──
    journeySection: {
        marginTop: 32,
    },
    weekCard: {
        marginHorizontal: 20,
        marginBottom: 12,
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.04)',
    },
    weekHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    weekIconWrap: {
        width: 40, height: 40, borderRadius: 12,
        justifyContent: 'center', alignItems: 'center',
        marginRight: 12,
    },
    weekHeaderText: {
        flex: 1,
    },
    weekNum: {
        fontSize: 11,
        fontFamily: FontFamily.semibold,
        color: MUTED,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginBottom: 1,
    },
    weekTitle: {
        fontSize: 18,
        fontFamily: FontFamily.bold,
        color: TEXT,
        letterSpacing: -0.3,
    },
    weekDesc: {
        fontSize: 13,
        fontFamily: FontFamily.regular,
        color: SECONDARY,
        lineHeight: 20,
        marginBottom: 14,
    },
    weekPointRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    weekDot: {
        width: 6, height: 6, borderRadius: 3,
        marginTop: 6, marginRight: 10,
    },
    weekPointText: {
        flex: 1,
        fontSize: 14,
        fontFamily: FontFamily.medium,
        color: TEXT,
        lineHeight: 20,
    },

    // ── HONEST ──
    honestCard: {
        marginHorizontal: 20,
        marginTop: 8,
        marginBottom: 32,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.04)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
    },
    honestTitle: {
        fontSize: 17,
        fontFamily: FontFamily.bold,
        color: TEXT,
        marginBottom: 8,
        letterSpacing: -0.2,
    },
    honestText: {
        fontSize: 14,
        fontFamily: FontFamily.regular,
        color: SECONDARY,
        lineHeight: 22,
    },

    // ── COMPARE ──
    compareSection: {
        marginBottom: 32,
    },
    toggleWrap: {
        flexDirection: 'row',
        marginHorizontal: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 4,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        marginBottom: 16,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 11,
        alignItems: 'center',
    },
    toggleBtnActive: {
        backgroundColor: 'rgba(239,68,68,0.08)',
    },
    toggleBtnActiveAmber: {
        backgroundColor: AMBER_DIM,
    },
    toggleBtnText: {
        fontSize: 13,
        fontFamily: FontFamily.semibold,
        color: MUTED,
    },
    toggleBtnTextActive: {
        color: TEXT,
    },
    compareCard: {
        marginHorizontal: 20,
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
    },
    compareCardWithout: {
        backgroundColor: 'rgba(239,68,68,0.04)',
        borderColor: 'rgba(239,68,68,0.1)',
    },
    compareCardWith: {
        backgroundColor: AMBER_DIM,
        borderColor: AMBER_GLOW,
    },
    compareRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 14,
    },
    compareEmoji: {
        fontSize: 18,
        marginRight: 12,
        marginTop: 0,
    },
    compareText: {
        flex: 1,
        fontSize: 14,
        fontFamily: FontFamily.medium,
        color: '#6B7280',
        lineHeight: 21,
    },
    compareTextWith: {
        color: TEXT,
    },

    // ── FEATURES ──
    featuresSection: {
        marginBottom: 32,
    },
    featuresCard: {
        marginHorizontal: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.04)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    featureCheckCircle: {
        width: 24, height: 24, borderRadius: 12,
        backgroundColor: AMBER_DIM,
        justifyContent: 'center', alignItems: 'center',
        marginRight: 12,
    },
    featureText: {
        flex: 1,
        fontSize: 14,
        fontFamily: FontFamily.medium,
        color: TEXT,
        lineHeight: 20,
    },

    // ── PLANS ──
    plansSection: {
        marginBottom: 16,
    },
    plansRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
    },

    // ── SHARED CARD BASE ──
    planCard: {
        flex: 1,
        borderRadius: 20,
        alignItems: 'center',
        paddingTop: 32,
        paddingBottom: 18,
        paddingHorizontal: 16,
        position: 'relative',
    },
    planCardDefault: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
    },
    planCardSel: {
        backgroundColor: '#FEEBC8',
        borderWidth: 2.5,
        borderColor: AMBER,
        shadowColor: AMBER,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 6,
    },

    // ── BADGE (yearly only) ──
    planBadge: {
        position: 'absolute',
        top: -12,
        alignSelf: 'center',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 10,
        zIndex: 10,
    },
    planBadgeText: {
        fontSize: 10,
        fontFamily: FontFamily.heavy,
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    planBadgeSpacer: {
        height: 0,
    },

    // ── SHARED LABEL ──
    planLabel: {
        fontSize: 13,
        fontFamily: FontFamily.bold,
        color: MUTED,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    planLabelSel: {
        color: SECONDARY,
    },

    // ── SHARED PRICE ROW ──
    planPriceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 8,
        height: 44,
    },
    planCurrency: {
        fontSize: 18,
        fontFamily: FontFamily.bold,
        color: TEXT,
        marginRight: 1,
    },
    planCurrencySel: {
        color: AMBER_DARK,
    },
    planPrice: {
        fontSize: 36,
        fontFamily: FontFamily.heavy,
        color: TEXT,
        letterSpacing: -1.5,
    },
    planPriceSel: {
        color: AMBER_DARK,
    },
    planPeriod: {
        fontSize: 14,
        fontFamily: FontFamily.semibold,
        color: MUTED,
        marginLeft: 2,
    },

    // ── SAVINGS (yearly) / SPACER (monthly) ──
    savingsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 22,
        marginBottom: 10,
    },
    savingsRowSpacer: {
        height: 22,
        marginBottom: 10,
    },
    savingsStrike: {
        fontSize: 14,
        fontFamily: FontFamily.medium,
        color: '#C4C4C4',
        textDecorationLine: 'line-through',
    },
    savingsBadge: {
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    savingsBadgeText: {
        fontSize: 11,
        fontFamily: FontFamily.heavy,
        color: '#16A34A',
        letterSpacing: 0.3,
    },

    // ── SHARED TRIAL PILL ──
    trialPill: {
        backgroundColor: 'rgba(0,0,0,0.05)',
        paddingHorizontal: 14,
        paddingVertical: 5,
        borderRadius: 20,
        marginBottom: 8,
    },
    trialPillSel: {
        backgroundColor: AMBER,
    },
    trialPillText: {
        fontSize: 11,
        fontFamily: FontFamily.semibold,
        color: SECONDARY,
    },
    trialPillTextSel: {
        color: '#FFFFFF',
        fontFamily: FontFamily.bold,
    },

    // ── SHARED NOTE ──
    planNote: {
        fontSize: 11,
        fontFamily: FontFamily.regular,
        color: MUTED,
        textAlign: 'center',
        lineHeight: 16,
    },

    // ── RADIO INDICATOR ──
    planRadio: {
        position: 'absolute',
        top: 10,
        right: 10,
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

    // ── LEGAL ──
    legal: {
        fontSize: 12,
        fontFamily: FontFamily.regular,
        color: MUTED,
        textAlign: 'center',
        marginTop: 12,
        paddingHorizontal: 40,
        lineHeight: 18,
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
        shadowRadius: 16,
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
        color: MUTED,
    },
    ctaDot: {
        width: 3, height: 3, borderRadius: 1.5,
        backgroundColor: '#D1D5DB',
    },
});
