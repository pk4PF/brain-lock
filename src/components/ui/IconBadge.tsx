import { YStack } from 'tamagui';
import type { ReactNode } from 'react';

interface IconBadgeProps {
  children: ReactNode;
  size?: number;
  color?: string;
  glow?: boolean;
}

const AMBER = '#E8850C';

export function IconBadge({
  children,
  size = 40,
  color = AMBER,
  glow = false,
}: IconBadgeProps) {
  return (
    <YStack
      width={size}
      height={size}
      borderRadius={size / 2.5}
      backgroundColor={`${color}15`}
      justifyContent="center"
      alignItems="center"
      {...(glow && {
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 4,
      })}
    >
      {children}
    </YStack>
  );
}
