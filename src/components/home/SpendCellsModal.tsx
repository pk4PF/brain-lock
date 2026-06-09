import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Lock } from 'lucide-react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { FontFamily, Spacing } from '../../constants/theme';
import { hapticLight, hapticMedium } from '../../utils/haptics';
import { UNLOCK_TIERS } from '../../store/useStore';
import BrainCoinsIcon from '../BrainCoinsIcon';

/**
 * Visual coin size grows with the tier so the grid feels like a "more coins =
 * bigger pile" progression, mirroring competitor "buy screentime" sheets.
 * The actual asset is a single pile illustration; we scale it up for emphasis
 * on larger tiers.
 */
function getCoinSize(tier: number): number {
  // Tiers run 15 -> 30 minutes. Spread the visual coin pile across that
  // range so the grid still reads as a progression even with only 4 tiles.
  if (tier <= 15) return 52;
  if (tier <= 20) return 60;
  if (tier <= 25) return 68;
  return 76;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Current cell balance - used to disable tiers the user can't afford. */
  credits: number;
  /** Called with the chosen amount in cells/minutes. The store handles the
   *  actual spending + ScreenTime call. */
  onConfirm: (amount: number) => void;
}

/**
 * "Spend cells" sheet. Mirrors the competitor's how-long-are-we-scrolling
 * UX (3-col grid of duration tiles) but in Brainlock voice - hairline
 * borders, accent red, no coin-pile illustrations, no green CTA.
 *
 * Tiers come from UNLOCK_TIERS in the store (1, 2, 3, 5, 10, 15, 20, 25, 30).
 * Tiers the user can't afford are visually disabled with a lock icon. The
 * default selection is the largest tier the user can currently afford.
 */
export default function SpendCellsModal({ visible, onClose, credits, onConfirm }: Props) {
  const { colors } = useThemeColors();
  const insets = useSafeAreaInsets();

  const defaultPick = useMemo(() => {
    // Largest affordable tier, or the smallest tier if nothing fits.
    const affordable = UNLOCK_TIERS.filter((t) => t <= credits);
    return affordable.length > 0 ? affordable[affordable.length - 1] : UNLOCK_TIERS[0];
  }, [credits]);

  const [picked, setPicked] = useState<number>(defaultPick);

  useEffect(() => {
    if (visible) setPicked(defaultPick);
  }, [visible, defaultPick]);

  // Sheet slide-up animation.
  const slide = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 1 : 0,
      duration: visible ? 280 : 200,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const handleClose = () => {
    hapticLight();
    onClose();
  };

  const handleConfirm = () => {
    if (credits < picked) return;
    hapticMedium();
    onConfirm(picked);
  };

  const canAfford = credits >= picked;
  const remainAfter = credits - picked;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              paddingTop: Math.max(insets.top, 20) + 12,
              transform: [
                {
                  translateY: slide.interpolate({
                    inputRange: [0, 1],
                    outputRange: [40, 0],
                  }),
                },
              ],
              opacity: slide,
            },
          ]}
        >
          {/* Close - anchored to safe-area top so it never hides behind the
              status bar. Bigger hit target + visible chip background. */}
          <TouchableOpacity
            onPress={handleClose}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            style={[
              styles.closeBtn,
              {
                top: Math.max(insets.top, 20) + 4,
                backgroundColor: colors.cardAlt,
              },
            ]}
            activeOpacity={0.7}
          >
            <X size={20} color={colors.text} strokeWidth={2.4} />
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {/* Eyebrow + headline */}
            <Text style={[styles.eyebrow, { color: colors.muted }]}>
              SPEND CELLS
            </Text>
            <Text style={[styles.headline, { color: colors.text }]}>
              How long?
            </Text>
            <Text style={[styles.sub, { color: colors.muted }]}>
              1 cell = 1 minute. You have{' '}
              <Text style={{ color: colors.accent, fontFamily: FontFamily.semibold }}>
                {credits}
              </Text>
              .
            </Text>

            {/* Tier grid - 3 columns */}
            <View style={styles.grid}>
              {UNLOCK_TIERS.map((tier) => {
                const affordable = credits >= tier;
                const selected = picked === tier;
                return (
                  <TouchableOpacity
                    key={tier}
                    activeOpacity={0.8}
                    disabled={!affordable}
                    onPress={() => {
                      hapticLight();
                      setPicked(tier);
                    }}
                    style={[
                      styles.tile,
                      {
                        backgroundColor: selected ? `${colors.accent}10` : colors.card,
                        borderColor: selected ? colors.accent : colors.border,
                        borderWidth: selected ? 2 : 1,
                        opacity: affordable ? 1 : 0.45,
                      },
                    ]}
                  >
                    <View style={styles.tileCoinWrap}>
                      <BrainCoinsIcon size={getCoinSize(tier)} />
                    </View>
                    <Text
                      style={[
                        styles.tileLabel,
                        { color: selected ? colors.accent : colors.text },
                      ]}
                    >
                      {tier} min
                    </Text>
                    <View style={styles.tileCostRow}>
                      {!affordable ? (
                        <Lock size={11} color={colors.muted} strokeWidth={2.4} />
                      ) : (
                        <BrainCoinsIcon size={12} />
                      )}
                      <Text
                        style={[
                          styles.tileCost,
                          { color: selected ? colors.accent : colors.muted },
                        ]}
                      >
                        {tier}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Balance preview */}
            <Text style={[styles.preview, { color: colors.muted }]}>
              {canAfford
                ? `${remainAfter} cells left after.`
                : `Need ${picked - credits} more cell${picked - credits === 1 ? '' : 's'}.`}
            </Text>

            {/* CTA */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleConfirm}
              disabled={!canAfford}
              style={[
                styles.cta,
                {
                  backgroundColor: canAfford ? colors.accent : colors.cardAlt,
                  borderColor: canAfford ? colors.accent : colors.border,
                  borderWidth: 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.ctaLabel,
                  { color: canAfford ? '#FFFFFF' : colors.muted },
                ]}
              >
                {canAfford ? `Unlock ${picked} min` : 'Earn more cells'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  card: {
    flex: 1,
    width: '100%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: 24,
  },
  closeBtn: {
    position: 'absolute',
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    letterSpacing: 1.6,
    marginBottom: 6,
    marginTop: 6,
    paddingRight: 56, // leave room for the close button
  },
  headline: {
    fontSize: 28,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.6,
    marginBottom: 6,
    paddingRight: 56,
  },
  sub: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    lineHeight: 20,
    marginBottom: 22,
  },
  // 3-column grid using flex-basis math: 100% minus 2 gaps of 10, divided by 3.
  // We use width % so React Native lays it out correctly without an extra
  // container per row.
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  // 4 tiers -> 2x2 grid. Width ~48% so the gap fits exactly between the two
  // columns and rows stay tidy.
  tile: {
    width: '48%',
    aspectRatio: 0.95,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tileCoinWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
    marginTop: 4,
  },
  tileCostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  tileCost: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    letterSpacing: 0.1,
    fontVariant: ['tabular-nums'],
  },
  preview: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    marginTop: 18,
    marginBottom: 14,
  },
  cta: {
    width: '100%',
    height: 54,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: {
    fontSize: 17,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.2,
  },
});
