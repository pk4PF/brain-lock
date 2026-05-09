/**
 * Unified game primitives - every live game uses these so the app feels
 * consistent and ships-ready instead of looking like five different demos
 * stitched together.
 *
 * Design rules:
 *   • Background = the app's normal background (warm cream / warm dark)
 *   • Each game gets ONE accent hue (from theme.GameAccents). That hue is
 *     used for the small chip in the header, the timer fill, the result
 *     stat number, and the focus ring on selected items. NEVER as a full
 *     gradient screen background.
 *   • Typography matches the rest of the app (Geist medium, tight tracking)
 *   • One pill button style for "Start" / "Done" - same shape as the home
 *     hero button, just sized up.
 *
 * Components:
 *   GameIntro   - title + blurb + bullet rules + start button
 *   GameHeader  - back button, optional pill chip (round/score)
 *   GameResult  - celebratory result screen with credits earned
 *   GameButton  - primary pill button used by all games
 */

import { ReactNode, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Zap } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../hooks/useThemeColors';
import { FontFamily, FontSize, Spacing, GameAccents, type GameAccentKey } from '../../constants/theme';
import { hapticLight, hapticMedium } from '../../utils/haptics';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

export function getGameAccent(gameKey: GameAccentKey | string): { hue: string; tint: string } {
  const entry = (GameAccents as Record<string, { hue: string; tintLight: string; tintDark: string }>)[gameKey];
  if (entry) return { hue: entry.hue, tint: entry.tintDark };
  return { hue: '#FF6A1A', tint: 'rgba(255,106,26,0.12)' };
}

// ─────────────────────────────────────────────────────────────
// GameButton - primary pill button. Filled in the game's accent for the
// active call to action; outline for secondary.
// ─────────────────────────────────────────────────────────────
export function GameButton({
  label,
  onPress,
  hue,
  variant = 'primary',
  disabled,
  fullWidth = true,
}: {
  label: string;
  onPress: () => void;
  hue: string;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  fullWidth?: boolean;
}) {
  const { colors } = useThemeColors();
  const isPrimary = variant === 'primary';

  const handlePress = () => {
    if (disabled) return;
    hapticMedium();
    onPress();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.btn,
        fullWidth && { alignSelf: 'stretch' },
        isPrimary
          ? {
              backgroundColor: hue,
              ...Platform.select({
                ios: {
                  shadowColor: hue,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.28,
                  shadowRadius: 12,
                },
                android: { elevation: 6 },
              }),
            }
          : {
              backgroundColor: 'transparent',
              borderWidth: 1.5,
              borderColor: colors.borderStrong,
            },
        disabled && { opacity: 0.4 },
      ]}
    >
      <Text
        style={[
          styles.btnText,
          { color: isPrimary ? '#FFFFFF' : colors.text },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────
// GameHeader - back chevron on the left, optional centred title or pill,
// and an optional right slot (eg. "3/10" round counter or score badge).
// Sits inside the safe area; pages should add their own paddingTop.
// ─────────────────────────────────────────────────────────────
export function GameHeader({
  title,
  hue,
  rightSlot,
  onClose,
}: {
  title?: string;
  hue?: string;
  rightSlot?: ReactNode;
  onClose?: () => void;
}) {
  const { colors } = useThemeColors();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.header,
        { paddingTop: insets.top + 6 },
      ]}
    >
      <TouchableOpacity
        onPress={onClose ?? (() => { hapticLight(); router.back(); })}
        activeOpacity={0.7}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={[styles.headerBack, { borderColor: colors.border, backgroundColor: colors.card }]}
      >
        <ChevronLeft size={20} color={colors.text} strokeWidth={2.2} />
      </TouchableOpacity>

      {title ? (
        <View style={styles.headerCenter}>
          <View style={[styles.headerChip, { backgroundColor: hue ? `${hue}1A` : colors.cardAlt, borderColor: hue ? `${hue}33` : colors.border }]}>
            <View style={[styles.headerDot, { backgroundColor: hue ?? colors.muted }]} />
            <Text style={[styles.headerChipText, { color: hue ?? colors.muted }]}>
              {title.toUpperCase()}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.headerCenter} />
      )}

      <View style={styles.headerRight}>{rightSlot}</View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// GameIntro - the screen players see before they start a game.
// Big icon, title, blurb, bullet rules, start button. Always centred.
// ─────────────────────────────────────────────────────────────
export function GameIntro({
  hue,
  Illustration,
  title,
  blurb,
  rules,
  startLabel = 'Start',
  onStart,
  isDemo,
}: {
  hue: string;
  Illustration?: ReactNode;
  title: string;
  blurb: string;
  rules: string[];
  startLabel?: string;
  onStart: () => void;
  isDemo?: boolean;
}) {
  const { colors } = useThemeColors();
  const insets = useSafeAreaInsets();

  // Subtle entrance - fade + 8px rise. Just enough to feel alive.
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(8)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: fade,
        transform: [{ translateY: rise }],
        paddingHorizontal: Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
      }}
    >
      <View style={styles.introTop}>
        {Illustration && <View style={{ marginBottom: 18 }}>{Illustration}</View>}
        <Text style={[styles.introTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.introBlurb, { color: colors.secondary }]}>{blurb}</Text>

        {rules.length > 0 && (
          <View style={styles.introRules}>
            {rules.map((r, i) => (
              <View key={i} style={[styles.introRule, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
                <View style={[styles.introRuleDot, { backgroundColor: hue }]} />
                <Text style={[styles.introRuleText, { color: colors.text }]}>{r}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={{ flex: 1 }} />

      <GameButton
        label={isDemo ? 'Try the demo' : startLabel}
        onPress={onStart}
        hue={hue}
      />
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// CreditsPill - animated +N brain cells badge. Spring-scales in, then
// the number nudges up briefly. No confetti, no orbs - just a small
// rewarding moment.
// ─────────────────────────────────────────────────────────────
export function CreditsPill({ credits, hue }: { credits: number; hue: string }) {
  const { colors } = useThemeColors();
  const scale = useRef(new Animated.Value(0.5)).current;
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(180),
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 140, useNativeDriver: true }),
      Animated.timing(pop, { toValue: 1, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const popY = pop.interpolate({ inputRange: [0, 1], outputRange: [0, -2] });

  return (
    <Animated.View
      style={[
        styles.creditsPill,
        {
          backgroundColor: `${hue}1F`,
          borderColor: `${hue}40`,
          transform: [{ scale }, { translateY: popY }],
        },
      ]}
    >
      <Zap size={14} color={hue} fill={hue} />
      <Text style={[styles.creditsPillText, { color: hue }]}>+{credits}</Text>
      <Text style={[styles.creditsPillSub, { color: colors.secondary }]}>brain cells</Text>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// GameResult - celebratory result screen used by games that don't have
// the GameComplete component (memory, focus, reaction).
// ─────────────────────────────────────────────────────────────
export function GameResult({
  hue,
  badgeIcon,
  title,
  bigStat,
  bigStatSuffix,
  subtitle,
  credits,
  isDemo,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: {
  hue: string;
  badgeIcon?: ReactNode;
  title: string;
  bigStat: string | number;
  bigStatSuffix?: string;
  subtitle?: string;
  credits?: number;
  isDemo?: boolean;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  const { colors } = useThemeColors();
  const insets = useSafeAreaInsets();

  // Spring-in for the big number with a small overshoot, fade for the
  // surrounding chrome. Tighter friction + higher tension than before
  // so the result feels deliberate, not soft.
  const numScale = useRef(new Animated.Value(0.6)).current;
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.sequence([
        Animated.spring(numScale, { toValue: 1.05, friction: 5, tension: 140, useNativeDriver: true }),
        Animated.spring(numScale, { toValue: 1.0,  friction: 7, tension: 120, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: fade,
        paddingHorizontal: Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
      }}
    >
      <View style={styles.introTop}>
        {badgeIcon && (
          <View
            style={[
              styles.resultBadge,
              { backgroundColor: `${hue}1F`, borderColor: `${hue}33` },
            ]}
          >
            {badgeIcon}
          </View>
        )}

        <Text style={[styles.resultEyebrow, { color: colors.muted }]}>RESULT</Text>
        <Text style={[styles.resultTitle, { color: colors.text }]}>{title}</Text>

        <View style={{ alignItems: 'center', marginTop: 18 }}>
          <Animated.View style={{ transform: [{ scale: numScale }], flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={[styles.resultBig, { color: hue }]}>{bigStat}</Text>
            {bigStatSuffix && (
              <Text style={[styles.resultBigSuffix, { color: hue }]}>{bigStatSuffix}</Text>
            )}
          </Animated.View>
          {subtitle && (
            <Text style={[styles.resultSubtitle, { color: colors.secondary }]}>{subtitle}</Text>
          )}
        </View>

        {!isDemo && credits !== undefined && credits > 0 && (
          <View style={{ marginTop: 22 }}>
            <CreditsPill credits={credits} hue={hue} />
          </View>
        )}
      </View>

      <View style={{ flex: 1 }} />

      <View style={{ gap: 12 }}>
        <GameButton label={primaryLabel} onPress={onPrimary} hue={hue} />
        {secondaryLabel && onSecondary && (
          <GameButton
            label={secondaryLabel}
            onPress={onSecondary}
            hue={hue}
            variant="secondary"
          />
        )}
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// TimerBar - single bar used for any game that needs a countdown.
// Fills with the game's hue. Goes red when low.
// ─────────────────────────────────────────────────────────────
export function TimerBar({ percent, low, hue }: { percent: number; low?: boolean; hue: string }) {
  const { colors } = useThemeColors();
  return (
    <View style={[styles.timerTrack, { backgroundColor: colors.cardAlt }]}>
      <View
        style={[
          styles.timerFill,
          {
            width: `${Math.max(0, Math.min(100, percent))}%`,
            backgroundColor: low ? '#EF4444' : hue,
          },
        ]}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: 8,
    gap: 10,
  },
  headerBack: {
    width: 36,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerRight: { minWidth: 36, alignItems: 'flex-end' },
  headerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  headerDot: { width: 5, height: 5, borderRadius: 3 },
  headerChipText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    letterSpacing: 1.2,
  },

  // Intro
  introTop: { alignItems: 'center', paddingTop: 12 },
  introTitle: {
    fontSize: 34,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.9,
    textAlign: 'center',
    marginBottom: 10,
  },
  introBlurb: {
    fontSize: 17,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    lineHeight: 25,
    paddingHorizontal: 24,
    maxWidth: 360,
  },
  introRules: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 22,
    paddingHorizontal: 8,
  },
  introRule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  introRuleDot: { width: 5, height: 5, borderRadius: 3 },
  introRuleText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    letterSpacing: 0.1,
  },

  // Button
  btn: {
    height: 56,
    borderRadius: 999,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 17,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.1,
  },

  // Result
  resultBadge: {
    width: 80,
    height: 80,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  resultEyebrow: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    letterSpacing: 1.6,
    marginBottom: 6,
  },
  resultTitle: {
    fontSize: 28,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.7,
    textAlign: 'center',
  },
  resultBig: {
    fontSize: 96,
    fontFamily: FontFamily.medium,
    letterSpacing: -3.2,
    lineHeight: 104,
    fontVariant: ['tabular-nums'],
  },
  resultBigSuffix: {
    fontSize: 34,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.6,
    marginLeft: 4,
  },
  resultSubtitle: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    marginTop: 6,
    textAlign: 'center',
  },

  // Credits pill
  creditsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
    borderWidth: 1,
  },
  creditsPillText: {
    fontSize: 17,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.2,
  },
  creditsPillSub: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
  },

  // Timer
  timerTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  timerFill: {
    height: '100%',
    borderRadius: 3,
  },
});
