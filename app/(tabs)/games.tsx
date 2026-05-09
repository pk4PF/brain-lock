import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowUpRight, Lock, BarChart3 } from 'lucide-react-native';
import { hapticLight } from '../../src/utils/haptics';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { useStore } from '../../src/store/useStore';
import { FontFamily, FontSize, Spacing, GameAccents } from '../../src/constants/theme';
import { Eyebrow, SectionHeading, MutedText, Pill } from '../../src/components/ui/anvil';
import {
  ShapeRecallIll, WordMemoryIll, QuickMathIll, FocusFlashIll, NumberSequenceIll,
  MazePathIll, SpotDifferenceIll, ColorRecallIll, BlockTappingIll, TimeRecallIll,
  CardMemoryIll, SequenceMemoryIll, RapidNumbersIll, DirectionMatchIll, GridExplorerIll,
  ChessPuzzlesIll, TowerBuilderIll, LogicCompareIll, ShapeSequenceIll, HiddenObjectIll,
  MemoryMatchIll, ReactionTestIll,
} from '../../src/components/games/GameIllustrations';
import type { GameType } from '../../src/constants/games';

// Tile sizing — Unrot-style taller cards (1 : 1.18 aspect) with the
// illustration occupying the top ~62% as a saturated pastel zone, then
// title + per-game progress strip beneath.
const { width: SW } = Dimensions.get('window');
const COLS = 2;
const GAP = 12;
const SIDE_PAD = Spacing.lg;
const TILE_W = Math.floor((SW - SIDE_PAD * 2 - GAP * (COLS - 1)) / COLS);
const TILE_H = Math.round(TILE_W * 1.18);
const ILL_ZONE_H = Math.round(TILE_H * 0.62);
const ILL_SIZE = Math.round(ILL_ZONE_H * 0.78);

interface Game {
  key: string;
  title: string;
  blurb?: string;
  hue?: string;
  Ill: React.ComponentType<{ size: number }>;
  route?: string;
  /** Used to read lifetime stats from the store. Only set on live games
   *  (we don't track stats for not-yet-built ones). */
  statKey?: GameType;
}

const GAMES: Game[] = [
  // Hero marketing game. Lives at the top so it's the first tile in the grid.
  { key: 'tile-recall', title: 'Memory Tiles',  blurb: 'Remember. Tap. Repeat.', hue: GameAccents['tile-recall'].hue, Ill: ShapeRecallIll,    route: '/games/tile-recall', statKey: 'tile-recall' as GameType },
  // Live games - actually playable. statKey wires the tile to gameStats.
  { key: 'memory',      title: 'Memory Match',  blurb: 'Match the pairs',     hue: GameAccents.memory.hue,        Ill: MemoryMatchIll,    route: '/games/memory',      statKey: 'memory' as GameType },
  { key: 'word-recall', title: 'Word Memory',   blurb: 'Recall what you saw', hue: GameAccents['word-recall'].hue, Ill: WordMemoryIll,     route: '/games/word-recall', statKey: 'word-recall' as GameType },
  { key: 'math',        title: 'Quick Math',    blurb: 'Beat the clock',      hue: GameAccents.math.hue,          Ill: QuickMathIll,      route: '/games/math',        statKey: 'math' as GameType },
  { key: 'focus',       title: 'Focus Flash',   blurb: 'Tap the odd one',     hue: GameAccents.focus.hue,         Ill: FocusFlashIll,     route: '/games/focus',       statKey: 'focus' as GameType },
  { key: 'reaction',    title: 'Reaction Test', blurb: 'Tap on green',        hue: GameAccents.reaction.hue,      Ill: ReactionTestIll,   route: '/games/reaction',    statKey: 'reaction' as GameType },
  // Day-1 launch batch - one new game per cognitive area.
  { key: 'sequence',    title: 'Tap Sequence',    blurb: 'Watch. Repeat.',          hue: GameAccents.sequence.hue,     Ill: SequenceMemoryIll,  route: '/games/sequence',    statKey: 'sequence' as GameType },
  { key: 'anagram',     title: 'Anagram',         blurb: 'Unscramble the word',     hue: GameAccents.anagram.hue,      Ill: WordMemoryIll,      route: '/games/anagram',     statKey: 'anagram' as GameType },
  { key: 'color-match', title: 'Color Match',     blurb: 'Tap the ink, not the word', hue: GameAccents['color-match'].hue, Ill: ColorRecallIll,  route: '/games/color-match', statKey: 'color-match' as GameType },
  { key: 'block-tap',   title: 'Quick Tap',       blurb: 'Hit the target fast',     hue: GameAccents['block-tap'].hue, Ill: BlockTappingIll,    route: '/games/block-tap',   statKey: 'block-tap' as GameType },
  { key: 'number-seq',  title: 'Number Sequence', blurb: 'Spot the pattern',        hue: GameAccents['number-seq'].hue, Ill: NumberSequenceIll, route: '/games/number-seq',  statKey: 'number-seq' as GameType },

  // In development.
  { key: 'maze',          title: 'Maze Path',        Ill: MazePathIll },
  { key: 'spot-diff',     title: 'Spot Difference',  Ill: SpotDifferenceIll },
  { key: 'time-recall',   title: 'Time Recall',      Ill: TimeRecallIll },
  { key: 'card-memory',   title: 'Card Memory',      Ill: CardMemoryIll },
  { key: 'rapid-numbers', title: 'Rapid Numbers',    Ill: RapidNumbersIll },
  { key: 'direction',     title: 'Direction Match',  Ill: DirectionMatchIll },
  { key: 'grid-explorer', title: 'Grid Explorer',    Ill: GridExplorerIll },
  { key: 'chess',         title: 'Chess Puzzles',    Ill: ChessPuzzlesIll },
  { key: 'tower',         title: 'Tower Builder',    Ill: TowerBuilderIll },
  { key: 'logic',         title: 'Logic Compare',    Ill: LogicCompareIll },
  { key: 'shape-seq',     title: 'Shape Sequence',   Ill: ShapeSequenceIll },
  { key: 'hidden',        title: 'Hidden Object',    Ill: HiddenObjectIll },
];

const liveGames = GAMES.filter((g) => g.route);
const upcomingGames = GAMES.filter((g) => !g.route);

const UPCOMING_VISIBLE = 4;
const upcomingVisible = upcomingGames.slice(0, UPCOMING_VISIBLE);
const upcomingHidden = upcomingGames.slice(UPCOMING_VISIBLE);

export default function GamesScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeColors();
  const getGameStat = useStore((s) => s.getGameStat);

  const handlePlay = (game: Game) => {
    hapticLight();
    if (!game.route) {
      Alert.alert('Coming soon', `${game.title} is in development.`, [{ text: 'OK' }]);
      return;
    }
    router.push(game.route as any);
  };

  const renderLiveTile = (game: Game) => {
    const Ill = game.Ill;
    const hue = game.hue ?? colors.accent;
    // Saturated illustration zone background — full colour at low opacity
    // (not a 12% hairline tint). Dark/light tokens are predefined per game
    // in GameAccents so the brand colour isn't picked twice.
    const accent = GameAccents[game.key as keyof typeof GameAccents];
    const zoneBg = accent ? (isDark ? accent.tintDark : accent.tintLight) : `${hue}1A`;
    const stats = game.statKey ? getGameStat(game.statKey) : null;
    const playedLabel = !stats || stats.played === 0
      ? 'Tap to start'
      : `${stats.played} played`;
    return (
      <TouchableOpacity
        key={game.key}
        activeOpacity={0.78}
        onPress={() => handlePlay(game)}
        style={[
          styles.tile,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {/* Illustration zone — saturated pastel, full bleed across the
            top of the card. The scene SVG is centred inside. */}
        <View style={[styles.illZone, { height: ILL_ZONE_H, backgroundColor: zoneBg }]}>
          <Ill size={ILL_SIZE} />
          <View style={styles.illPill}>
            <Pill tone="accent">PLAY</Pill>
          </View>
        </View>

        {/* Title + per-game progress */}
        <View style={styles.tileBody}>
          <View style={styles.titleRow}>
            <Text
              style={[styles.tileTitle, { color: colors.text }]}
              numberOfLines={1}
            >
              {game.title}
            </Text>
            <ArrowUpRight size={15} color={hue} strokeWidth={2.4} />
          </View>
          <View style={styles.progressRow}>
            <BarChart3 size={11} color={colors.muted} strokeWidth={2.2} />
            <Text style={[styles.progressText, { color: colors.muted }]} numberOfLines={1}>
              {playedLabel}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderUpcomingTile = (game: Game) => {
    const Ill = game.Ill;
    return (
      <TouchableOpacity
        key={game.key}
        activeOpacity={0.78}
        onPress={() => handlePlay(game)}
        style={[
          styles.tile,
          { backgroundColor: colors.card, borderColor: colors.border, opacity: 0.92 },
        ]}
      >
        <View style={[styles.illZone, { height: ILL_ZONE_H, backgroundColor: colors.cardAlt }]}>
          <View style={{ opacity: 0.55 }}>
            <Ill size={ILL_SIZE} />
          </View>
          <View style={styles.illPill}>
            <Pill tone="neutral">SOON</Pill>
          </View>
        </View>
        <View style={styles.tileBody}>
          <View style={styles.titleRow}>
            <Text style={[styles.tileTitle, { color: colors.muted }]} numberOfLines={1}>
              {game.title}
            </Text>
            <Lock size={13} color={colors.muted} strokeWidth={2} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xxxl,
          paddingHorizontal: SIDE_PAD,
        }}
      >
        {/* Header */}
        <Eyebrow>Train the brain</Eyebrow>
        <SectionHeading size="lg">Put your brain back in charge.</SectionHeading>
        <View style={{ height: 10 }} />
        <MutedText size="md">
          60 seconds per game. Each one trains a real cognitive skill - memory, focus, speed, reasoning. Win cells, earn back the apps.
        </MutedText>

        {/* Available */}
        <View style={styles.sectionLabelRow}>
          <Eyebrow style={{ marginBottom: 0 }}>Available</Eyebrow>
          <Text style={[styles.sectionCount, { color: colors.muted }]}>
            {liveGames.length}
          </Text>
        </View>
        <View style={styles.grid}>
          {liveGames.map(renderLiveTile)}
        </View>

        {/* Coming soon */}
        <View style={styles.sectionLabelRow}>
          <Eyebrow style={{ marginBottom: 0 }}>Coming soon</Eyebrow>
          <Text style={[styles.sectionCount, { color: colors.muted }]}>
            {upcomingGames.length}
          </Text>
        </View>
        <View style={styles.grid}>
          {upcomingVisible.map(renderUpcomingTile)}
        </View>
        {upcomingHidden.length > 0 && (
          <Text style={[styles.upcomingMore, { color: colors.muted }]}>
            + {upcomingHidden.length} more in development
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xxl,
    marginBottom: Spacing.md,
  },
  sectionCount: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    letterSpacing: 1.6,
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  tile: {
    width: TILE_W,
    height: TILE_H,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },

  // Top illustration zone — full-bleed colour, scene centred.
  illZone: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  illPill: {
    position: 'absolute',
    top: 10,
    right: 10,
  },

  // Bottom body — title + per-game progress
  tileBody: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  tileTitle: {
    flex: 1,
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.2,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  progressText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    letterSpacing: 0.2,
  },

  upcomingMore: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    marginTop: Spacing.md,
    paddingHorizontal: 4,
  },
});
