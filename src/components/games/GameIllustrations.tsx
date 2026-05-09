import React from 'react';
import { View } from 'react-native';
import {
  PuzzlePiece, TextAa, Calculator, Flashlight, Lightning,
  Shapes, ListNumbers, MapTrifold, Eye, Palette,
  ChartBar, Clock, Cards, DotsSix, Hash,
  ArrowsLeftRight, GridFour, Crown, Stack, Equals,
  Polygon, MagnifyingGlass,
} from 'phosphor-react-native';

interface Props { size: number; }

/**
 * Phosphor duotone icons used as the per-game illustration. We render a
 * larger filled "lozenge" plate behind the icon so each tile reads as a
 * distinct illustration - not just a small coloured glyph in a tile.
 *
 * The colour for each game is encoded here so callers (the games tab,
 * the per-game header) don't need to know the palette: just render
 * `<MemoryMatchIll size={…} />` and you get the right hue.
 */

// Render a Phosphor icon with duotone weight on a generous coloured plate.
// The plate is the visible "illustration" - soft tinted fill + thin halo +
// the duotone icon centred.
function PhIcon({
  Icon,
  color,
  size,
  duotoneOpacity = 0.32,
}: {
  Icon: React.ComponentType<any>;
  color: string;
  size: number;
  duotoneOpacity?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        backgroundColor: `${color}1F`,
        borderWidth: 1,
        borderColor: `${color}26`,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon
        size={size * 0.62}
        color={color}
        weight="duotone"
        duotoneColor={color}
        duotoneOpacity={duotoneOpacity}
      />
    </View>
  );
}

// ─── Live games ─────────────────────────────────────────────────
export const MemoryMatchIll  = ({ size }: Props) => <PhIcon Icon={PuzzlePiece}     color="#7C3AED" size={size} />;
export const WordMemoryIll   = ({ size }: Props) => <PhIcon Icon={TextAa}          color="#10B981" size={size} />;
export const QuickMathIll    = ({ size }: Props) => <PhIcon Icon={Calculator}      color="#F97316" size={size} />;
export const FocusFlashIll   = ({ size }: Props) => <PhIcon Icon={Flashlight}      color="#3B82F6" size={size} />;
export const ReactionTestIll = ({ size }: Props) => <PhIcon Icon={Lightning}       color="#E53935" size={size} />;

// ─── Coming-soon games ──────────────────────────────────────────
export const ShapeRecallIll     = ({ size }: Props) => <PhIcon Icon={Shapes}          color="#A855F7" size={size} />;
export const NumberSequenceIll  = ({ size }: Props) => <PhIcon Icon={ListNumbers}     color="#EF4444" size={size} />;
export const MazePathIll        = ({ size }: Props) => <PhIcon Icon={MapTrifold}      color="#2563EB" size={size} />;
export const SpotDifferenceIll  = ({ size }: Props) => <PhIcon Icon={Eye}             color="#8B5CF6" size={size} />;
export const ColorRecallIll    = ({ size }: Props) => <PhIcon Icon={Palette}         color="#16A34A" size={size} />;
export const BlockTappingIll    = ({ size }: Props) => <PhIcon Icon={ChartBar}        color="#0EA5E9" size={size} />;
export const TimeRecallIll      = ({ size }: Props) => <PhIcon Icon={Clock}           color="#9333EA" size={size} />;
export const CardMemoryIll      = ({ size }: Props) => <PhIcon Icon={Cards}           color="#F59E0B" size={size} />;
export const SequenceMemoryIll  = ({ size }: Props) => <PhIcon Icon={DotsSix}         color="#06B6D4" size={size} />;
export const RapidNumbersIll    = ({ size }: Props) => <PhIcon Icon={Hash}            color="#DC2626" size={size} />;
export const DirectionMatchIll  = ({ size }: Props) => <PhIcon Icon={ArrowsLeftRight} color="#22C55E" size={size} />;
export const GridExplorerIll    = ({ size }: Props) => <PhIcon Icon={GridFour}        color="#475569" size={size} />;
export const ChessPuzzlesIll    = ({ size }: Props) => <PhIcon Icon={Crown}           color="#15803D" size={size} />;
export const TowerBuilderIll    = ({ size }: Props) => <PhIcon Icon={Stack}           color="#1D4ED8" size={size} />;
export const LogicCompareIll    = ({ size }: Props) => <PhIcon Icon={Equals}          color="#A855F7" size={size} />;
export const ShapeSequenceIll   = ({ size }: Props) => <PhIcon Icon={Polygon}         color="#F97316" size={size} />;
export const HiddenObjectIll    = ({ size }: Props) => <PhIcon Icon={MagnifyingGlass} color="#0F766E" size={size} />;
