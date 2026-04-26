import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Check, Brain, Zap, Shield } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type PurchasesPackage } from 'react-native-purchases';
import { FontSize, FontFamily, type ThemeColors } from '../constants/theme';
import { useThemeColors } from '../hooks/useThemeColors';
import { useStore } from '../store/useStore';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  checkPremiumStatus,
  getCurrentCustomerInfo,
} from '../services/revenueCat';
import { track, Events } from '../services/analytics';

const MONTHLY_PRICE_FALLBACK = '£4.99';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PaywallModal({ visible, onClose }: PaywallModalProps) {
  const { setSubscription } = useStore();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeColors();

  const [monthlyPkg, setMonthlyPkg] = useState<PurchasesPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    track(Events.PaywallShown, { source: 'modal' });
    (async () => {
      try {
        const offering = await getOfferings();
        if (offering) {
          const pkg = offering.availablePackages.find(
            (p) => p.packageType === 'MONTHLY' || p.product.identifier.includes('monthly')
          ) ?? null;
          setMonthlyPkg(pkg);
        }
      } catch (err) {
        if (__DEV__) console.warn('Failed to load offerings:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [visible]);

  // Always show the intended price — product price syncs within 2 days
  const monthlyPrice = MONTHLY_PRICE_FALLBACK;

  const handlePurchase = async () => {
    track(Events.PurchaseStarted, { plan: 'monthly' });
    if (!monthlyPkg) {
      if (__DEV__) {
        setSubscription('monthly');
        track(Events.PurchaseCompleted, { plan: 'monthly', dev: true });
        onClose();
      } else {
        Alert.alert('Unable to load plan', 'Please check your connection and try again.');
      }
      return;
    }
    setPurchasing(true);
    try {
      let customerInfo = await purchasePackage(monthlyPkg);
      if (checkPremiumStatus(customerInfo)) {
        setSubscription('monthly');
        track(Events.PurchaseCompleted, { plan: 'monthly' });
        onClose();
        return;
      }
      await new Promise((r) => setTimeout(r, 2000));
      customerInfo = await getCurrentCustomerInfo();
      if (checkPremiumStatus(customerInfo)) {
        setSubscription('monthly');
        track(Events.PurchaseCompleted, { plan: 'monthly' });
        onClose();
      } else {
        setSubscription('monthly');
        track(Events.PurchaseCompleted, { plan: 'monthly', fallback: true });
        onClose();
      }
    } catch (err: any) {
      track(Events.PurchaseFailed, { plan: 'monthly', cancelled: !!err.userCancelled });
      if (!err.userCancelled) Alert.alert('Purchase failed', 'Please try again later.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    track(Events.RestoreAttempted);
    setPurchasing(true);
    try {
      const customerInfo = await restorePurchases();
      if (checkPremiumStatus(customerInfo)) {
        setSubscription('restored');
        Alert.alert('Restored!', 'Your premium access has been restored.');
        onClose();
      } else {
        Alert.alert('No purchases found', "We couldn't find any previous purchases on this account.");
      }
    } catch {
      Alert.alert('Restore failed', 'Please try again later.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleClose = () => {
    track(Events.PaywallDismissed);
    onClose();
  };

  const s = createStyles(colors, isDark);

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <View style={s.overlay}>
        <View style={[s.sheet, { paddingBottom: insets.bottom + 24 }]}>
          {/* Close button */}
          <TouchableOpacity
            style={s.closeBtn}
            onPress={handleClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X size={20} color={colors.muted} />
          </TouchableOpacity>

          {/* Header */}
          <View style={s.header}>
            <Text style={s.title}>Go Unlimited</Text>
            <Text style={s.subtitle}>
              Unlimited games. Unlimited unlocks.{'\n'}No daily limits, ever.
            </Text>
          </View>

          {/* Benefits */}
          <View style={s.benefits}>
            {[
              { icon: <Brain size={16} color={colors.accent} />, text: 'Unlimited brain games daily' },
              { icon: <Zap size={16} color={colors.accent} />, text: 'Unlimited app unlocks' },
              { icon: <Shield size={16} color={colors.accent} />, text: 'Full screen time blocking' },
              { icon: <Check size={16} color={colors.accent} />, text: 'Cancel anytime' },
            ].map((b, i) => (
              <View key={i} style={s.benefitRow}>
                <View style={s.benefitIcon}>{b.icon}</View>
                <Text style={s.benefitText}>{b.text}</Text>
              </View>
            ))}
          </View>

          {/* Price */}
          {loading ? (
            <ActivityIndicator color={colors.accent} style={{ marginVertical: 24 }} />
          ) : (
            <View style={s.priceRow}>
              <Text style={s.price}>{monthlyPrice}</Text>
              <Text style={s.pricePeriod}>per month</Text>
            </View>
          )}

          {/* Subscribe button */}
          <TouchableOpacity activeOpacity={0.8} onPress={handlePurchase} disabled={purchasing}>
            <LinearGradient
              colors={[colors.accent, colors.accentDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.subscribeBtn}
            >
              {purchasing ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={s.subscribeBtnText}>Subscribe for {monthlyPrice}/mo</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Restore */}
          <TouchableOpacity onPress={handleRestore} disabled={purchasing} style={s.restoreBtn}>
            <Text style={s.restoreText}>Restore Purchases</Text>
          </TouchableOpacity>

          {/* Legal links */}
          <View style={s.legalRow}>
            <TouchableOpacity onPress={() => Linking.openURL('https://plbtk.com#terms')}>
              <Text style={s.legalLink}>Terms of Use</Text>
            </TouchableOpacity>
            <Text style={s.legalDot}> · </Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://plbtk.com#privacy')}>
              <Text style={s.legalLink}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 24,
      paddingTop: 16,
      maxHeight: '88%',
    },
    closeBtn: {
      alignSelf: 'flex-end',
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 24,
    },
    title: {
      fontSize: 28,
      fontFamily: FontFamily.heavy,
      color: colors.text,
      textAlign: 'center',
      letterSpacing: -0.5,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: FontSize.sm,
      fontFamily: FontFamily.regular,
      color: colors.secondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    benefits: {
      marginBottom: 20,
    },
    benefitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 6,
    },
    benefitIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: `${colors.accent}14`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    benefitText: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.semibold,
      color: colors.text,
    },
    priceRow: {
      alignItems: 'center',
      marginBottom: 16,
    },
    price: {
      fontSize: 40,
      fontFamily: FontFamily.heavy,
      color: colors.text,
      letterSpacing: -1,
    },
    pricePeriod: {
      fontSize: FontSize.sm,
      fontFamily: FontFamily.regular,
      color: colors.muted,
      marginTop: 2,
    },
    subscribeBtn: {
      height: 52,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    subscribeBtnText: {
      color: '#FFF',
      fontSize: FontSize.lg,
      fontFamily: FontFamily.bold,
    },
    restoreBtn: {
      alignItems: 'center',
      marginTop: 14,
    },
    restoreText: {
      fontSize: FontSize.sm,
      fontFamily: FontFamily.regular,
      color: colors.muted,
    },
    legalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 12,
    },
    legalLink: {
      fontSize: 11,
      fontFamily: FontFamily.regular,
      color: colors.muted,
      textDecorationLine: 'underline',
    },
    legalDot: {
      fontSize: 11,
      color: colors.muted,
    },
  });
}
