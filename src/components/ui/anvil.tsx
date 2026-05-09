/**
 * Anvil-inspired design primitives.
 *
 * Core principles distilled from the Anvil reference:
 *   1. Geist font, weights capped at medium (500) for headlines.
 *      Bold is reserved for emphasis, never for default headings.
 *   2. Tight letter spacing on big headlines (-0.5 to -1.0).
 *   3. Eyebrow + headline + muted description stacking for every section.
 *   4. Pill buttons (rounded-full, h-44, generous horizontal padding).
 *   5. Cards: rounded-2xl, hairline gray border, generous padding,
 *      no heavy shadow - borders do the work.
 *   6. One accent colour (the brand red), used only for big stats and
 *      primary CTAs. Everything else is monochrome.
 *   7. Subtle 40px grid background for hero areas.
 *   8. Italic word in headlines for emphasis.
 *
 * Use these primitives across the app instead of re-implementing the
 * pattern. They take theme colours from useThemeColors so dark mode
 * still works.
 */

import { ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  StyleProp,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontFamily, FontSize } from '../../constants/theme';
import { useThemeColors } from '../../hooks/useThemeColors';

// ─────────────────────────────────────────────────────────────
// Eyebrow - the small uppercase label that sits above a section heading.
// Anvil pattern: tracking 1.6, font-medium, muted-foreground, tiny.
// ─────────────────────────────────────────────────────────────
export function Eyebrow({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const { colors } = useThemeColors();
  return (
    <Text style={[styles.eyebrow, { color: colors.muted }, style]}>
      {String(children).toUpperCase()}
    </Text>
  );
}

// ─────────────────────────────────────────────────────────────
// SectionHeading - big medium-weight headline with tight tracking.
// Optional `italic` segment renders inline for the "and / or" emphasis trick.
// ─────────────────────────────────────────────────────────────
export function SectionHeading({
  children,
  size = 'lg',
  align = 'left',
  style,
}: {
  children: ReactNode;
  size?: 'md' | 'lg' | 'xl';
  align?: 'left' | 'center';
  style?: StyleProp<TextStyle>;
}) {
  const { colors } = useThemeColors();
  const fontSize = size === 'xl' ? 40 : size === 'lg' ? 32 : 25;
  const letterSpacing = size === 'xl' ? -1.1 : size === 'lg' ? -0.8 : -0.5;
  return (
    <Text
      style={[
        styles.heading,
        { color: colors.text, fontSize, letterSpacing, textAlign: align },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

// Inline italic emphasis - `<Italic>and</Italic>` inside a SectionHeading.
export function Italic({ children, color }: { children: ReactNode; color?: string }) {
  const { colors } = useThemeColors();
  return (
    <Text style={[styles.italic, { color: color ?? colors.secondary }]}>
      {children}
    </Text>
  );
}

// ─────────────────────────────────────────────────────────────
// MutedText - body description text under a heading.
// ─────────────────────────────────────────────────────────────
export function MutedText({
  children,
  size = 'md',
  align = 'left',
  style,
}: {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  align?: 'left' | 'center';
  style?: StyleProp<TextStyle>;
}) {
  const { colors } = useThemeColors();
  const fontSize = size === 'lg' ? 18 : size === 'md' ? 16 : 14;
  return (
    <Text
      style={[
        { color: colors.muted, fontSize, fontFamily: FontFamily.regular, textAlign: align, lineHeight: fontSize * 1.5 },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

// ─────────────────────────────────────────────────────────────
// Stat - big accent-coloured number with label and description below.
// Used for "brain cells", "streak", etc. Anvil's headline orange stats.
// ─────────────────────────────────────────────────────────────
export function Stat({
  value,
  label,
  description,
  color,
}: {
  value: string | number;
  label: string;
  description?: string;
  color?: string;
}) {
  const { colors } = useThemeColors();
  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.statValue, { color: color ?? colors.accent }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.text }]}>{label}</Text>
      {description && (
        <Text style={[styles.statDesc, { color: colors.muted }]}>{description}</Text>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// AnvilCard - white surface with hairline border, rounded-2xl,
// generous padding. Use this for almost everything that's not a button.
// ─────────────────────────────────────────────────────────────
export function AnvilCard({
  children,
  highlighted,
  padding = 'lg',
  style,
  onPress,
}: {
  children: ReactNode;
  highlighted?: boolean;
  padding?: 'md' | 'lg' | 'xl';
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const { colors } = useThemeColors();
  const padValue = padding === 'xl' ? 28 : padding === 'lg' ? 22 : 16;

  const content = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: highlighted ? colors.accent : colors.border,
          borderWidth: highlighted ? 2 : 1,
          padding: padValue,
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

// ─────────────────────────────────────────────────────────────
// PillButton - rounded-full, h-44, font-medium.
// Variants: primary (filled accent gradient - the dopamine hit),
// secondary (outline), monochrome (the old text-on-text variant).
// ─────────────────────────────────────────────────────────────
export function PillButton({
  label,
  onPress,
  variant = 'primary',
  fullWidth,
  disabled,
  rightIcon,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'monochrome';
  fullWidth?: boolean;
  disabled?: boolean;
  rightIcon?: ReactNode;
}) {
  const { colors } = useThemeColors();

  if (variant === 'primary') {
    // Soft warm-orange gradient - small dopamine pop without being loud.
    return (
      <TouchableOpacity
        activeOpacity={0.88}
        disabled={disabled}
        onPress={onPress}
        style={[
          { borderRadius: 999, opacity: disabled ? 0.4 : 1 },
          fullWidth && { alignSelf: 'stretch' },
          Platform.select({
            ios: {
              shadowColor: colors.accent,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.22,
              shadowRadius: 10,
            },
            android: { elevation: 3 },
          }),
        ]}
      >
        <LinearGradient
          colors={[colors.accent, colors.accentDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.pill, { borderWidth: 0 }]}
        >
          <Text style={[styles.pillText, { color: '#FFFFFF' }]}>{label}</Text>
          {rightIcon && <View style={{ marginLeft: 8 }}>{rightIcon}</View>}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // secondary (outline) / monochrome (old behaviour, kept for places that
  // still want the high-contrast text-on-text look).
  const isMono = variant === 'monochrome';
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.pill,
        {
          backgroundColor: isMono ? colors.text : 'transparent',
          borderColor: isMono ? colors.text : colors.border,
          borderWidth: isMono ? 0 : 1,
          opacity: disabled ? 0.4 : 1,
        },
        fullWidth && { alignSelf: 'stretch' },
      ]}
    >
      <Text
        style={[
          styles.pillText,
          { color: isMono ? colors.background : colors.text },
        ]}
      >
        {label}
      </Text>
      {rightIcon && <View style={{ marginLeft: 8 }}>{rightIcon}</View>}
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────
// Pill - small rounded-full label badge. Great for "NEW", "LIVE", etc.
// ─────────────────────────────────────────────────────────────
export function Pill({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'accent' | 'success';
}) {
  const { colors } = useThemeColors();
  const palette = {
    neutral: { bg: colors.cardAlt, fg: colors.secondary, dot: colors.muted },
    accent:  { bg: colors.accentLight, fg: colors.accent, dot: colors.accent },
    success: { bg: 'rgba(34,197,94,0.10)', fg: '#16A34A', dot: '#16A34A' },
  }[tone];
  return (
    <View style={[styles.pillBadge, { backgroundColor: palette.bg }]}>
      <View style={[styles.pillDot, { backgroundColor: palette.dot }]} />
      <Text style={[styles.pillBadgeText, { color: palette.fg }]}>{children}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// GridBackground - subtle 40px grid pattern. Sits behind hero content.
// Anvil uses a 3% opacity gray; this helper does the same.
// ─────────────────────────────────────────────────────────────
export function GridBackground() {
  const { colors, isDark } = useThemeColors();
  const lineColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.035)';
  // Pure RN can't use background-image gradients the way CSS can, so we draw
  // the grid as a tiled overlay using a row/col of thin views. To keep this
  // cheap, we render a 6x12 grid (40px each) which covers most phone widths.
  const cell = 40;
  const cols = 12;
  const rows = 22;
  const lines = [];
  for (let i = 1; i < cols; i++) {
    lines.push(
      <View
        key={`v-${i}`}
        style={{
          position: 'absolute',
          left: i * cell,
          top: 0,
          bottom: 0,
          width: 1,
          backgroundColor: lineColor,
        }}
      />,
    );
  }
  for (let i = 1; i < rows; i++) {
    lines.push(
      <View
        key={`h-${i}`}
        style={{
          position: 'absolute',
          top: i * cell,
          left: 0,
          right: 0,
          height: 1,
          backgroundColor: lineColor,
        }}
      />,
    );
  }
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.background,
      }}
    >
      {lines}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Eyebrow - slightly bigger so the labels actually read
  eyebrow: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    letterSpacing: 1.6,
    marginBottom: 10,
  },
  // Heading
  heading: {
    fontFamily: FontFamily.medium, // <- the Anvil restraint: 500, not 700+
    lineHeight: undefined,         // let the font breathe
  },
  italic: {
    fontFamily: FontFamily.regular,
    fontStyle: 'italic',
  },
  // Stat
  statValue: {
    fontSize: 36,
    fontFamily: FontFamily.medium,
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
  },
  statDesc: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    lineHeight: 19,
  },
  // Card
  card: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  // Pill button
  pill: {
    height: 44,
    borderRadius: 999,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
    }),
  },
  pillText: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.1,
  },
  // Pill badge
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  pillDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  pillBadgeText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    letterSpacing: 0.4,
  },
});
