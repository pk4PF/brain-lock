import { YStack } from 'tamagui';
import { useThemeColors } from '../../hooks/useThemeColors';

interface GlowCardProps {
  accent?: boolean;
  elevated?: boolean;
  subtle?: boolean;
  glass?: boolean;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
  [key: string]: any;
}

export function GlowCard({
  accent,
  elevated,
  subtle,
  glass,
  interactive,
  size = 'md',
  ...rest
}: GlowCardProps) {
  const { colors, isDark } = useThemeColors();

  const bgColor = subtle
    ? colors.cardAlt
    : glass
      ? (isDark ? 'rgba(20,20,32,0.95)' : 'rgba(255,255,255,0.92)')
      : colors.card;

  const isAccented = accent || elevated;

  const borderColor = isAccented
    ? (isDark ? `${colors.accent}30` : colors.accentGlow)
    : isDark
      ? colors.border
      : `rgba(0,0,0,0.04)`;

  const sizeStyles = size === 'sm'
    ? { padding: 14, borderRadius: 14 }
    : size === 'lg'
      ? { padding: 24, borderRadius: 24 }
      : { padding: 20, borderRadius: 20 };

  return (
    <YStack
      backgroundColor={bgColor}
      borderWidth={1}
      borderColor={borderColor}
      overflow="hidden"
      shadowColor={isDark ? (isAccented ? colors.accent : 'rgba(0,0,0,0.8)') : (isAccented ? '#C47A0A' : '#8B7355')}
      shadowOffset={{ width: 0, height: elevated ? 8 : 4 }}
      shadowOpacity={isDark ? (isAccented ? 0.12 : 0.3) : (isAccented ? (elevated ? 0.15 : 0.1) : 0.06)}
      shadowRadius={isAccented ? (elevated ? 24 : 16) : 10}
      elevation={isDark ? (isAccented ? 4 : 2) : (isAccented ? (elevated ? 8 : 3) : 2)}
      {...sizeStyles}
      {...(interactive ? { pressStyle: { scale: 0.98, opacity: 0.9 } } : {})}
      {...rest}
    />
  );
}

export function StatCard({ highlighted, ...rest }: { highlighted?: boolean; children?: React.ReactNode; [key: string]: any }) {
  const { colors, isDark } = useThemeColors();

  return (
    <YStack
      backgroundColor={colors.card}
      borderRadius={16}
      borderWidth={1}
      borderColor={highlighted ? (isDark ? `${colors.accent}30` : colors.accentGlow) : (isDark ? colors.border : `rgba(0,0,0,0.04)`)}
      padding={16}
      alignItems="center"
      gap={4}
      flex={1}
      shadowColor={isDark ? (highlighted ? colors.accent : 'rgba(0,0,0,0.6)') : (highlighted ? '#C47A0A' : '#8B7355')}
      shadowOffset={{ width: 0, height: highlighted ? 4 : 2 }}
      shadowOpacity={isDark ? (highlighted ? 0.1 : 0.2) : (highlighted ? 0.15 : 0.05)}
      shadowRadius={highlighted ? 14 : 8}
      elevation={isDark ? 2 : (highlighted ? 6 : 2)}
      {...rest}
    />
  );
}

export function ListCard({
  interactive,
  accent,
  noteStyle,
  ...rest
}: { interactive?: boolean; accent?: boolean; noteStyle?: boolean; children?: React.ReactNode; [key: string]: any }) {
  const { colors, isDark } = useThemeColors();

  return (
    <YStack
      backgroundColor={colors.card}
      borderRadius={16}
      borderWidth={1}
      borderColor={accent ? (isDark ? `${colors.accent}25` : colors.accentGlow) : (isDark ? colors.border : `rgba(0,0,0,0.04)`)}
      padding={16}
      marginBottom={8}
      shadowColor={isDark ? (accent ? colors.accent : 'rgba(0,0,0,0.5)') : (accent ? '#C47A0A' : '#8B7355')}
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={isDark ? (accent ? 0.08 : 0.15) : (accent ? 0.1 : 0.04)}
      shadowRadius={accent ? 12 : 6}
      elevation={isDark ? 2 : 2}
      {...(noteStyle ? { borderLeftWidth: 3, borderLeftColor: colors.accent } : {})}
      {...(interactive
        ? { pressStyle: { scale: 0.985, opacity: 0.85, backgroundColor: colors.cardAlt } }
        : {})}
      {...rest}
    />
  );
}
