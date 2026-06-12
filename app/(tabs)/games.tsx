import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Dimensions, Modal } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowUpRight, BarChart3 } from 'lucide-react-native';
import { hapticLight } from '../../src/utils/haptics';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { useStore } from '../../src/store/useStore';
import { FontFamily, FontSize, Spacing, GameAccents } from '../../src/constants/theme';
import { Eyebrow, SectionHeading, MutedText, Pill } from '../../src/components/ui/anvil';
import {
  ShapeRecallIll, WordMemoryIll, QuickMathIll, FocusFlashIll, NumberSequenceIll,
  ColorRecallIll, BlockTappingIll, SequenceMemoryIll,
  MemoryMatchIll,
  ChimpTestIll, CupShuffleIll, SchulteIll,
  GeneralKnowledgeIll, FlagsIll,
  ReactionTestIll, RapidNumbersIll, TimeRecallIll,
} from '../../src/components/games/GameIllustrations';
import type { GameType, Difficulty } from '../../src/constants/games';

// Difficulty options shown when starting a practice run. Mirrors the unlock
// picker but framed by skill percentile (no unlock minutes — this is practice).
const DIFFICULTY_OPTIONS: { id: Difficulty; label: string; note: string }[] = [
  { id: 'easy', label: 'Easy', note: 'Warm up' },
  { id: 'medium', label: 'Medium', note: 'Step it up' },
  { id: 'hard', label: 'Hard', note: 'Toughest' },
];

// Tile sizing - Unrot-style taller cards (1 : 1.18 aspect) with the
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
  // Benchmark tests - the clip-friendly hero row. Reaction leads: it's the
  // most viral format and the strongest "test yourself" pull.
  { key: 'reaction',    title: 'Reaction Test',  blurb: 'Tap when it turns green', hue: GameAccents.reaction.hue,     Ill: ReactionTestIll,   route: '/games/reaction',    statKey: 'reaction' as GameType },
  { key: 'digit-span',  title: 'Number Memory',  blurb: 'How many digits can you hold?', hue: GameAccents['digit-span'].hue, Ill: RapidNumbersIll, route: '/games/digit-span', statKey: 'digit-span' as GameType },
  { key: 'time-stop',   title: 'Perfect Timing', blurb: 'Stop at exactly 5.00s',  hue: GameAccents['time-stop'].hue,  Ill: TimeRecallIll,     route: '/games/time-stop',   statKey: 'time-stop' as GameType },
  // Hero marketing game.
  { key: 'tile-recall', title: 'Memory Tiles',  blurb: 'Remember. Tap. Repeat.', hue: GameAccents['tile-recall'].hue, Ill: ShapeRecallIll,    route: '/games/tile-recall', statKey: 'tile-recall' as GameType },
  // Live games - actually playable. statKey wires the tile to gameStats.
  { key: 'memory',      title: 'Memory Match',  blurb: 'Match the pairs',     hue: GameAccents.memory.hue,        Ill: MemoryMatchIll,    route: '/games/memory',      statKey: 'memory' as GameType },
  { key: 'word-recall', title: 'Word Memory',   blurb: 'Recall what you saw', hue: GameAccents['word-recall'].hue, Ill: WordMemoryIll,     route: '/games/word-recall', statKey: 'word-recall' as GameType },
  { key: 'math',        title: 'Quick Math',    blurb: 'Beat the clock',      hue: GameAccents.math.hue,          Ill: QuickMathIll,      route: '/games/math',        statKey: 'math' as GameType },
  { key: 'focus',       title: 'Focus Flash',   blurb: 'Tap the odd one',     hue: GameAccents.focus.hue,         Ill: FocusFlashIll,     route: '/games/focus',       statKey: 'focus' as GameType },
  // Day-1 launch batch - one new game per cognitive area.
  { key: 'sequence',    title: 'Tap Sequence',    blurb: 'Watch. Repeat.',          hue: GameAccents.sequence.hue,     Ill: SequenceMemoryIll,  route: '/games/sequence',    statKey: 'sequence' as GameType },
  { key: 'anagram',     title: 'Anagram',         blurb: 'Unscramble the word',     hue: GameAccents.anagram.hue,      Ill: WordMemoryIll,      route: '/games/anagram',     statKey: 'anagram' as GameType },
  { key: 'color-match', title: 'Color Match',     blurb: 'Tap the ink, not the word', hue: GameAccents['color-match'].hue, Ill: ColorRecallIll,  route: '/games/color-match', statKey: 'color-match' as GameType },
  { key: 'block-tap',   title: 'Quick Tap',       blurb: 'Hit the target fast',     hue: GameAccents['block-tap'].hue, Ill: BlockTappingIll,    route: '/games/block-tap',   statKey: 'block-tap' as GameType },
  { key: 'number-seq',  title: 'Number Sequence', blurb: 'Spot the pattern',        hue: GameAccents['number-seq'].hue, Ill: NumberSequenceIll, route: '/games/number-seq',  statKey: 'number-seq' as GameType },
  // Viral batch - sudden-death, escalating, built to be watched.
  { key: 'chimp',       title: 'Chimp Test',      blurb: 'Memorise. Tap in order.', hue: GameAccents.chimp.hue,        Ill: ChimpTestIll,  route: '/games/chimp',       statKey: 'chimp' as GameType },
  { key: 'cup-shuffle', title: 'Follow the Ball', blurb: 'Keep your eye on it',      hue: GameAccents['cup-shuffle'].hue, Ill: CupShuffleIll, route: '/games/cup-shuffle', statKey: 'cup-shuffle' as GameType },
  { key: 'schulte',     title: 'Beat the Grid',   blurb: 'Tap 1 to 25, fast',       hue: GameAccents.schulte.hue,      Ill: SchulteIll,    route: '/games/schulte',     statKey: 'schulte' as GameType },
  // Quiz challenges.
  { key: 'general-knowledge', title: 'General Knowledge', blurb: 'Trivia quiz',     hue: GameAccents['general-knowledge'].hue, Ill: GeneralKnowledgeIll, route: '/games/general-knowledge', statKey: 'general-knowledge' as GameType },
  { key: 'flags',       title: 'Flags',           blurb: 'Name the country',        hue: GameAccents.flags.hue,        Ill: FlagsIll,      route: '/games/flags',       statKey: 'flags' as GameType },
  // Calm - the breathing seed of the Gym.
  { key: 'breathe',     title: 'Box Breathing',   blurb: 'Reset your focus',        Ill: TimeRecallIll, route: '/games/breathe' },
];

const liveGames = GAMES.filter((g) => g.route);

// The Gym is organised into three kinds of "rep", each pulling the brain
// rot score down a different way. Category is derived so we don't have to
// tag all 18 games by hand.
type GymCat = 'test' | 'knowledge' | 'calm';
function categoryOf(g: Game): GymCat {
  if (g.key === 'breathe') return 'calm';
  if (g.key === 'general-knowledge' || g.key === 'flags') return 'knowledge';
  return 'test';
}
const SECTIONS: { cat: GymCat; label: string; blurb: string; pill: string }[] = [
  { cat: 'test',      label: 'Tests',     blurb: 'Train memory, focus, speed, reasoning.', pill: 'TEST' },
  { cat: 'knowledge', label: 'Knowledge', blurb: 'Sharpen what you already know.',         pill: 'QUIZ' },
  { cat: 'calm',      label: 'Calm',      blurb: 'Slow down and reset your attention.',    pill: 'CALM' },
];

export default function GamesScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeColors();
  const getGameStat = useStore((s) => s.getGameStat);
  const [pendingGame, setPendingGame] = useState<Game | null>(null);

  const handlePlay = (game: Game) => {
    hapticLight();
    // Calm (breathing) has no difficulty - go straight in.
    if (categoryOf(game) === 'calm' && game.route) {
      router.push(game.route as any);
      return;
    }
    // Practice run — pick a difficulty first (consistent with the unlock flow).
    setPendingGame(game);
  };

  const startChallenge = (difficulty: Difficulty) => {
    const game = pendingGame;
    setPendingGame(null);
    if (!game?.route) return;
    hapticLight();
    // Gym reps are pure training now - they raise your Brainpower Score, they don't
    // unlock anything. Unlocking is a separate, direct choice on Home.
    router.push(`${game.route}?difficulty=${difficulty}` as any);
  };

  const renderLiveTile = (game: Game) => {
    const Ill = game.Ill;
    const hue = game.hue ?? colors.accent;
    // Saturated illustration zone background - full colour at low opacity
    // (not a 12% hairline tint). Dark/light tokens are predefined per game
    // in GameAccents so the brand colour isn't picked twice.
    const accent = GameAccents[game.key as keyof typeof GameAccents];
    const zoneBg = accent ? (isDark ? accent.tintDark : accent.tintLight) : `${hue}1A`;
    const stats = game.statKey ? getGameStat(game.statKey) : null;
    const playedLabel = !stats || stats.played === 0
      ? 'Tap to start'
      : `${stats.played} played`;
    const pillLabel = SECTIONS.find((s) => s.cat === categoryOf(game))?.pill ?? 'TEST';
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
        {/* Illustration zone - saturated pastel, full bleed across the
            top of the card. The scene SVG is centred inside. */}
        <View style={[styles.illZone, { height: ILL_ZONE_H, backgroundColor: zoneBg }]}>
          <Ill size={ILL_SIZE} />
          <View style={styles.illPill}>
            <Pill tone="accent">{pillLabel}</Pill>
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

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.xl,
          paddingBottom: insets.bottom + 120,
          paddingHorizontal: SIDE_PAD,
        }}
      >
        {/* Header */}
        <Eyebrow>The Brain Gym</Eyebrow>
        <SectionHeading size="lg">Raise your Brainpower Score.</SectionHeading>
        <View style={{ height: 10 }} />
        <MutedText size="md">
          Every rep here pushes your score up. Tests, knowledge, and calm — your brain's workout.
        </MutedText>

        {/* Sections - Tests / Knowledge / Calm */}
        {SECTIONS.map((sec) => {
          const items = liveGames.filter((g) => categoryOf(g) === sec.cat);
          if (items.length === 0) return null;
          return (
            <View key={sec.cat}>
              <View style={styles.sectionLabelRow}>
                <Eyebrow style={{ marginBottom: 0 }}>{sec.label}</Eyebrow>
                <Text style={[styles.sectionCount, { color: colors.muted }]}>{items.length}</Text>
              </View>
              <Text style={[styles.sectionBlurb, { color: colors.muted }]}>{sec.blurb}</Text>
              <View style={styles.grid}>
                {items.map(renderLiveTile)}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Difficulty chooser - shown before a practice run, mirrors the unlock flow */}
      <Modal
        visible={pendingGame !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPendingGame(null)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setPendingGame(null)}
          style={styles.modalBackdrop}
        >
          <TouchableOpacity activeOpacity={1} style={[styles.sheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.sheetEyebrow, { color: colors.muted }]}>
              {pendingGame?.title?.toUpperCase()}
            </Text>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Choose difficulty</Text>
            <View style={{ height: 14 }} />
            {DIFFICULTY_OPTIONS.map((d) => (
              <TouchableOpacity
                key={d.id}
                activeOpacity={0.85}
                onPress={() => startChallenge(d.id)}
                style={[styles.sheetOption, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sheetOptionLabel, { color: colors.text }]}>
                    {d.label}
                  </Text>
                  <Text style={[styles.sheetOptionRank, { color: colors.muted }]}>{d.note}</Text>
                </View>
                <ArrowUpRight size={16} color={colors.muted} strokeWidth={2.2} />
              </TouchableOpacity>
            ))}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    gap: 0,
  },
  sheetEyebrow: { fontSize: 12, fontFamily: FontFamily.semibold, letterSpacing: 1.4, marginBottom: 6 },
  sheetTitle: { fontSize: 22, fontFamily: FontFamily.semibold, letterSpacing: -0.4 },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  sheetOptionLabel: { fontSize: FontSize.md, fontFamily: FontFamily.semibold, letterSpacing: -0.2 },
  sheetOptionRank: { fontSize: 13, fontFamily: FontFamily.regular, marginTop: 2 },
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
  sectionBlurb: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    letterSpacing: -0.1,
    marginBottom: 14,
    marginTop: -4,
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

  // Top illustration zone - full-bleed colour, scene centred.
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

  // Bottom body - title + per-game progress
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
});
