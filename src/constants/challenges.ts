import type { ComponentType } from 'react';
import type { GameType } from './games';
import { GameAccents } from './theme';
import {
  ShapeRecallIll, MemoryMatchIll, WordMemoryIll, QuickMathIll, FocusFlashIll,
  SequenceMemoryIll, ColorRecallIll, BlockTappingIll,
  NumberSequenceIll, ChimpTestIll, CupShuffleIll, SchulteIll,
} from '../components/games/GameIllustrations';

/**
 * Canonical list of playable brain-game challenges. Used by the unlock picker
 * (and available to the Tests tab). Each launches at `/games/<key>` and accepts
 * `?unlock=1&difficulty=<easy|medium|hard>` when used to unlock apps.
 */
export interface ChallengeGame {
  key: GameType;
  title: string;
  route: string;
  hue: string;
  Ill: ComponentType<{ size: number }>;
}

export const BRAIN_GAMES: ChallengeGame[] = [
  { key: 'tile-recall', title: 'Memory Tiles',  route: '/games/tile-recall', hue: GameAccents['tile-recall'].hue, Ill: ShapeRecallIll },
  { key: 'memory',      title: 'Memory Match',  route: '/games/memory',      hue: GameAccents.memory.hue,         Ill: MemoryMatchIll },
  { key: 'word-recall', title: 'Word Memory',   route: '/games/word-recall', hue: GameAccents['word-recall'].hue, Ill: WordMemoryIll },
  { key: 'math',        title: 'Quick Math',    route: '/games/math',        hue: GameAccents.math.hue,           Ill: QuickMathIll },
  { key: 'focus',       title: 'Focus Flash',   route: '/games/focus',       hue: GameAccents.focus.hue,          Ill: FocusFlashIll },
  { key: 'sequence',    title: 'Tap Sequence',  route: '/games/sequence',    hue: GameAccents.sequence.hue,       Ill: SequenceMemoryIll },
  { key: 'anagram',     title: 'Anagram',       route: '/games/anagram',     hue: GameAccents.anagram.hue,        Ill: WordMemoryIll },
  { key: 'color-match', title: 'Color Match',   route: '/games/color-match', hue: GameAccents['color-match'].hue, Ill: ColorRecallIll },
  { key: 'block-tap',   title: 'Quick Tap',     route: '/games/block-tap',   hue: GameAccents['block-tap'].hue,   Ill: BlockTappingIll },
  { key: 'number-seq',  title: 'Number Seq',    route: '/games/number-seq',  hue: GameAccents['number-seq'].hue,  Ill: NumberSequenceIll },
  { key: 'chimp',       title: 'Chimp Test',    route: '/games/chimp',       hue: GameAccents.chimp.hue,          Ill: ChimpTestIll },
  { key: 'cup-shuffle', title: 'Follow the Ball', route: '/games/cup-shuffle', hue: GameAccents['cup-shuffle'].hue, Ill: CupShuffleIll },
  { key: 'schulte',     title: 'Beat the Grid', route: '/games/schulte',     hue: GameAccents.schulte.hue,        Ill: SchulteIll },
];
