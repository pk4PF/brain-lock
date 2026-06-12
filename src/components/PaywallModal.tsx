import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Check, Brain, Zap, Shield, Lock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontSize, FontFamily, type ThemeColors } from '../constants/theme';
import { useThemeColors } from '../hooks/useThemeColors';
import { track, Events } from '../services/analytics';
import { usePaywallPurchase } from './paywall/usePaywallPurchase';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * In-app paywall modal. Currently effectively dead code: `setShowPaywall` in
 * the store is a no-op since the only paywall users ever hit is the onboarding
 * one. Kept here for future use (e.g. resubscribe flow after entitlement
 * lapse). Mirrors the two-plan structure of the onboarding paywall.
 */
export default function PaywallModal({ visible, onClose }: PaywallModalProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeColors();

  const {
    loading,
    purchasing,
    annualPrice,
    annualPerMonth,
    purchase,
    restore,
  } = usePaywallPurchase({ visible, source: 'modal' });

  const handlePurchase = () => purchase(onClose);
  const handleRestore = () => restore(onClose);
  const handleClose = () => {
    track(Events.PaywallDismissed, { source: 'modal' });
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
            <Text style={s.title}>Take back your focus</Text>
            <Text style={s.subtitle}>Pick a plan. Cancel anytime.</Text>
          </View>

          {/* Benefits */}
          <View style={s.benefits}>
            {[
              { icon: <Brain size={16} color={colors.accent} />, text: 'Unlimited brain games' },
              { icon: <Zap size={16} color={colors.accent} />, text: 'Unlimited app unlocks' },
              { icon: <Shield size={16} color={colors.accent} />, text: 'Full screen-time blocking' },
              { icon: <Check size={16} color={colors.accent} />, text: 'Cancel anytime' },
            ].map((b, i) => (
              <View key={i} style={s.benefitRow}>
                <View style={s.benefitIcon}>{b.icon}</View>
                <Text style={s.benefitText}>{b.text}</Text>
              </View>
            ))}
          </View>

          {/* Monthly plan */}
          {loading ? (
            <ActivityIndicator color={colors.accent} style={{ marginVertical: 24 }} />
          ) : (
            <View style={[s.planCard, { borderColor: colors.accent, backgroundColor: `${colors.accent}10` }]}>
              <View style={{ flex: 1 }}>
                <Text style={[s.planTitle, { color: colors.text }]}>Yearly</Text>
                <Text style={[s.planCaption, { color: colors.muted }]}>{annualPrice} billed yearly</Text>
              </View>
              <Text style={[s.planPrice, { color: colors.text }]}>{annualPerMonth}</Text>
            </View>
          )}

          {/* Subscribe button */}
          <TouchableOpacity activeOpacity={0.85} onPress={handlePurchase} disabled={purchasing}>
            <LinearGradient
              colors={['#E53935', '#F97316']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.subscribeBtn}
            >
              {purchasing ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={s.subscribeBtnText}>Continue for {annualPrice}/year</Text>
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
      marginBottom: 18,
    },
    title: {
      fontSize: 26,
      fontFamily: FontFamily.heavy,
      color: colors.text,
      textAlign: 'center',
      letterSpacing: -0.5,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: FontSize.sm,
      fontFamily: FontFamily.regular,
      color: colors.secondary,
      textAlign: 'center',
    },
    benefits: {
      marginBottom: 18,
    },
    benefitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 5,
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
    planCard: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderRadius: 14,
      borderWidth: 2,
      marginBottom: 16,
    },
    planTitle: {
      fontSize: 16,
      fontFamily: FontFamily.heavy,
    },
    planCaption: {
      fontSize: 11,
      fontFamily: FontFamily.regular,
      marginTop: 2,
    },
    planPrice: {
      fontSize: 18,
      fontFamily: FontFamily.heavy,
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
