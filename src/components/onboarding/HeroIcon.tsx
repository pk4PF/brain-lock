import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { ComponentType } from 'react';

interface PhosphorIconProps {
  size?: number;
  color?: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
  duotoneColor?: string;
  duotoneOpacity?: number;
}

interface Props {
  /**
   * A Phosphor icon component (e.g. `DeviceMobile`, `Hourglass`, `Brain`).
   * Imported from `phosphor-react-native`.
   */
  Icon: ComponentType<PhosphorIconProps>;
  /**
   * Tint colour for the icon and its surrounding plate. Pass `colors.accent`
   * for the brand red, or any of the per-game tile colours when used in the
   * games-style context. Defaults to brand accent.
   */
  color: string;
  /**
   * Outer plate size. The icon itself renders at ~55% of this. Defaults
   * to a "hero" size suitable for onboarding screens.
   */
  size?: number;
}

/**
 * A large, branded illustration plate for onboarding screens. Mirrors the
 * games-tile treatment (Phosphor duotone icon on a soft tinted plate with
 * a hairline accent border) so the visual language is unified between the
 * two surfaces.
 *
 * Use instead of the older small-Lucide-icon-in-72px-iconBox pattern.
 */
export default function HeroIcon({ Icon, color, size = 96 }: Props) {
  return (
    <View
      style={[
        styles.plate,
        {
          width: size,
          height: size,
          borderRadius: size * 0.28,
          backgroundColor: `${color}14`,    // ~8% tint
          borderColor: `${color}33`,        // ~20% border
        },
      ]}
    >
      <Icon
        size={Math.round(size * 0.55)}
        color={color}
        weight="duotone"
        duotoneColor={color}
        duotoneOpacity={0.25}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
