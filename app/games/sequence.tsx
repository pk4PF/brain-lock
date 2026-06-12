import { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Brain } from 'phosphor-react-native';
import { useStore } from '../../src/store/useStore';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { hapticLight, hapticMedium } from '../../src/utils/haptics';
import { soundTap, soundCorrect, soundWrong, soundComplete, soundFail, soundRound } from '../../src/utils/sounds';
import { track, Events } from '../../src/services/analytics';
import { FontFamily, Spacing, GameAccents } from '../../src/constants/theme';
import { GameHeader, GameIntro, GameResult } from '../../src/components/games/GameLayout';
import { SequenceMemoryIll } from '../../src/components/games/GameIllustrations';
import { pickResultMessage, type ResultMessage } from '../../src/constants/testMessages';
import { useChallengeUnlock } from '../../src/hooks/useChallengeUnlock';
import { advanceBenchmark } from '../../src/utils/benchmark';
import { SEQUENCE_LEVEL } from '../../src/constants/gameDifficulty';

const HUE = GameAccents.sequence.hue;
const PADS = 4;             // 2x2 grid
const FLASH_MS = 480;       // each pad flash duration during playback
const GAP_MS = 200;          // gap between flashes
const START_LENGTH = 3;     // first round length
const MAX_LENGTH = 12;      // hard cap (round 10 = length 12)

const PAD_COLORS = ['#A855F7', '#EC4899', '#22C55E', '#F59E0B'];
/** Per-pad emoji glyph. Each colour gets a thematic "object" so the user
 *  can remember the sequence by symbol *or* colour, not just position -
 *  and the grid pops in screenshots/demos. */
const PAD_EMOJI = ['💎', '🌸', '🍀', '⭐'];

type Phase = 'intro' | 'show' | 'input' | 'result';

function creditsForLength(maxLen: number): number {
  // maxLen is the longest sequence the user successfully repeated. Tier:
  //   3-4 → 2,  5-6 → 3,  7-8 → 4,  9+ → 5.
  if (maxLen >= 9) return 5;
  if (maxLen >= 7) return 4;
  if (maxLen >= 5) return 3;
  return 2;
}

/**
 * Tap Sequence (Simon-style). Each round: the app flashes a sequence of
 * 4 coloured pads. User repeats the sequence by tapping pads in order.
 * Length grows by 1 each successful round. Game ends on first mistake.
 *
 * Tests sequential / working memory - distinct from Memory Match (pair
 * matching, spatial) and Word Recall (verbal cued recall).
 */
export default function SequenceScreen() {
  const { colors } = useThemeColors();
  const { isUnlock, difficulty, unlockMinutes, doUnlock } = useChallengeUnlock();
  const params = useLocalSearchParams<{ benchmark?: string; bm?: string }>();
  const isBenchmark = params.benchmark === '1';
  const bmIndex = Number(params.bm ?? 0);
  const { completeDailyGame, recordGame, recordCognitiveScore, canEarnToday, setShowPaywall, setBenchmarkScore } = useStore();

  const [phase, setPhase] = useState<Phase>('intro');
  const [sequence, setSequence] = useState<number[]>([]);
  const [userIdx, setUserIdx] = useState(0);
  const [flashing, setFlashing] = useState<number | null>(null);
  const [maxLength, setMaxLength] = useState(0);
  const [earnedCredits, setEarnedCredits] = useState(0);
  const [resultMsg, setResultMsg] = useState<ResultMessage>(() => pickResultMessage(true));

  const startTime = useRef(0);
  const playbackRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const startGame = () => {
    track(Events.GameStarted, { game: 'sequence' });
    setMaxLength(0);
    startTime.current = Date.now();
    beginRound(START_LENGTH);
  };

  const beginRound = (length: number) => {
    const seq: number[] = [];
    for (let i = 0; i < length; i++) seq.push(Math.floor(Math.random() * PADS));
    setSequence(seq);
    setUserIdx(0);
    setPhase('show');
    playSequence(seq);
  };

  const playSequence = (seq: number[]) => {
    // Clear any in-flight playback timers first.
    playbackRef.current.forEach((t) => clearTimeout(t));
    playbackRef.current = [];

    const startDelay = 600;
    seq.forEach((pad, i) => {
      const onAt = startDelay + i * (FLASH_MS + GAP_MS);
      const offAt = onAt + FLASH_MS;
      playbackRef.current.push(setTimeout(() => { setFlashing(pad); soundTap(); }, onAt));
      playbackRef.current.push(setTimeout(() => setFlashing(null), offAt));
    });

    // After all flashes, hand control to user.
    const totalMs = startDelay + seq.length * (FLASH_MS + GAP_MS) + 200;
    playbackRef.current.push(setTimeout(() => setPhase('input'), totalMs));
  };

  useEffect(() => () => {
    playbackRef.current.forEach((t) => clearTimeout(t));
  }, []);

  const handlePadPress = (pad: number) => {
    if (phase !== 'input') return;
    hapticLight();
    soundTap();
    setFlashing(pad);
    setTimeout(() => setFlashing(null), 180);

    const expected = sequence[userIdx];
    if (pad !== expected) {
      // Wrong - end the game with current maxLength.
      hapticMedium();
      soundWrong();
      finishGame(maxLength);
      return;
    }

    const next = userIdx + 1;
    if (next >= sequence.length) {
      // Round complete.
      soundCorrect();
      const newMax = Math.max(maxLength, sequence.length);
      setMaxLength(newMax);
      if (sequence.length >= MAX_LENGTH) {
        finishGame(newMax);
      } else {
        // Brief pause before next round to acknowledge success.
        soundRound();
        setTimeout(() => beginRound(sequence.length + 1), 600);
      }
    } else {
      setUserIdx(next);
    }
  };

  const finishGame = (finalMax: number) => {
    playbackRef.current.forEach((t) => clearTimeout(t));
    const timeTaken = (Date.now() - startTime.current) / 1000;
    const credits = creditsForLength(finalMax);
    const passed = finalMax >= SEQUENCE_LEVEL[difficulty];
    if (passed) soundComplete(); else soundFail();
    recordGame('sequence', passed, timeTaken);
    if (passed) doUnlock(); // pass → unlock apps (no-op in practice)
    setResultMsg(pickResultMessage(passed));
    // Memory map: each pad in the longest sequence = ~10 points. 10 pads = 100.
    const memoryScore = Math.min(100, finalMax * 10);
    recordCognitiveScore('memory', memoryScore);
    if (isBenchmark) { setBenchmarkScore(String(bmIndex), memoryScore); advanceBenchmark(bmIndex); return; }
    setEarnedCredits(credits);
    track(Events.GameCompleted, { game: 'sequence', max_length: finalMax, passed, credits: passed ? credits : 0 });
    setPhase('result');
  };

  const goHome = () => router.replace('/(tabs)');

  // ── INTRO ──
  if (phase === 'intro') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GameHeader title="Tap Sequence" hue={HUE} />
        <GameIntro
          hue={HUE}
          Illustration={<SequenceMemoryIll size={88} />}
          title="Tap Sequence"
          blurb="Watch the pads flash. Repeat the order. Each round adds one."
          rules={['🧠 Sequential memory', `▶️ Starts at ${START_LENGTH}`, '❌ One mistake ends it']}
          startLabel="Start"
          onStart={startGame}
        />
      </View>
    );
  }

  // ── RESULT ──
  if (phase === 'result') {
    const passed = maxLength >= SEQUENCE_LEVEL[difficulty];
    const resultHue = passed ? HUE : '#EF4444';
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GameHeader title="Tap Sequence" hue={HUE} />
        <GameResult
          hue={HUE}
          badgeIcon={<Brain size={36} color={resultHue} weight="duotone" duotoneColor={resultHue} duotoneOpacity={0.32} />}
          passed={passed}
          bigStat={maxLength}
          bigStatSuffix=" pads"
          subtitle="Longest sequence you nailed"
          unlockMinutes={isUnlock && passed ? unlockMinutes : undefined}
          primaryLabel={passed ? 'Play again' : 'Try again'}
          onPrimary={startGame}
          secondaryLabel="Back to home"
          onSecondary={goHome}
        />
      </View>
    );
  }

  // ── SHOW / INPUT ──
  const headerLabel = phase === 'show' ? 'Watch' : 'Repeat';
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GameHeader
        title={headerLabel}
        hue={HUE}
        rightSlot={
          <Text style={{ color: colors.muted, fontFamily: FontFamily.medium, fontSize: 13 }}>
            Length {sequence.length}
          </Text>
        }
      />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl }}>
        <View style={styles.padGrid}>
          {Array.from({ length: PADS }).map((_, i) => {
            const isOn = flashing === i;
            return (
              <TouchableOpacity
                key={i}
                activeOpacity={0.8}
                disabled={phase !== 'input'}
                onPress={() => handlePadPress(i)}
                style={[
                  styles.pad,
                  {
                    backgroundColor: isOn ? PAD_COLORS[i] : `${PAD_COLORS[i]}30`,
                    borderColor: PAD_COLORS[i],
                    opacity: phase === 'show' && !isOn ? 0.55 : 1,
                  },
                ]}
              >
                <Text style={styles.padEmoji}>{PAD_EMOJI[i]}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {phase === 'input' && (
          <Text style={[styles.hint, { color: colors.muted }]}>
            {userIdx} / {sequence.length}
          </Text>
        )}
      </View>
    </View>
  );
}

const PAD_SIZE = 130;
const PAD_GAP = 12;

const styles = StyleSheet.create({
  padGrid: {
    width: PAD_SIZE * 2 + PAD_GAP,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: PAD_GAP,
    justifyContent: 'center',
  },
  pad: {
    width: PAD_SIZE,
    height: PAD_SIZE,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  padEmoji: {
    fontSize: 56,
    lineHeight: 66,
  },
  hint: {
    marginTop: 36,
    fontSize: 14,
    fontFamily: FontFamily.medium,
    letterSpacing: 0.4,
    fontVariant: ['tabular-nums'],
  },
});
