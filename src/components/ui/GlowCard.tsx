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
      ? (isDark ? 'rgba(30,30,40,0.92)' : 'rgba(255,255,255,0.92)')
      : colors.card;

  const isAccented = accent || elevated;

  const borderColor = isAccented
    ? colors.accentGlow
    : `rgba(0,0,0,${isDark ? '0.15' : '0.06'})`;

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
      shadowColor={isDark ? 'transparent' : (isAccented ? '#F5A623' : '#000000')}
      shadowOffset={{ width: 0, height: elevated ? 6 : 3 }}
      shadowOpacity={isDark ? 0 : (isAccented ? (elevated ? 0.25 : 0.15) : 0.06)}
      shadowRadius={isAccented ? (elevated ? 24 : 16) : 10}
      elevation={isDark ? 0 : (isAccented ? (elevated ? 8 : 3) : 2)}
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
      borderColor={highlighted ? colors.accentGlow : `rgba(0,0,0,${isDark ? '0.15' : '0.06'})`}
      padding={16}
      alignItems="center"
      gap={4}
      flex={1}
      shadowColor={isDark ? 'transparent' : (highlighted ? '#F5A623' : '#000000')}
      shadowOffset={{ width: 0, height: highlighted ? 4 : 2 }}
      shadowOpacity={isDark ? 0 : (highlighted ? 0.2 : 0.05)}
      shadowRadius={highlighted ? 16 : 8}
      elevation={isDark ? 0 : (highlighted ? 6 : 2)}
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
      borderColor={accent ? colors.accentGlow : `rgba(0,0,0,${isDark ? '0.13' : '0.06'})`}
      padding={16}
      marginBottom={8}
      shadowColor={isDark ? 'transparent' : (accent ? '#F5A623' : '#000000')}
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={isDark ? 0 : (accent ? 0.1 : 0.04)}
      shadowRadius={accent ? 10 : 6}
      elevation={isDark ? 0 : 2}
      {...(noteStyle ? { borderLeftWidth: 3, borderLeftColor: '#F5A623' } : {})}
      {...(interactive
        ? { pressStyle: { scale: 0.985, opacity: 0.85, backgroundColor: colors.cardAlt } }
        : {})}
      {...rest}
    />
  );
}
